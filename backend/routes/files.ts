import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
const AdmZip = require('adm-zip');

import { resolveAccountSafePath, HOME_DIR } from '../storage.js';
import { addActivityLog, getDatabase } from '../db/database.js';

const router = Router();

// Helper to extract active cPanel user from token or headers
function getActiveUser(req: Request): string {
  const customUser = req.headers['x-cpanel-user'] as string;
  if (customUser && customUser.trim()) {
    return customUser.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }
  const queryUser = (req.query.user as string) || (req.body && req.body.user);
  if (queryUser && queryUser.trim()) {
    return queryUser.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }
  return 'demo';
}

function getFormattedPermissions(mode: number, isDir: boolean): string {
  const octal = (mode & 0o777).toString(8);
  if (octal.length < 3) return isDir ? '0755' : '0644';
  return '0' + octal;
}

function getFileTypeCategory(ext: string): 'image' | 'code' | 'archive' | 'text' | 'document' | 'other' {
  const cleanExt = ext.toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp'].includes(cleanExt)) return 'image';
  if (['.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.php', '.json', '.xml', '.sql', '.sh', '.py'].includes(cleanExt)) return 'code';
  if (['.zip', '.tar', '.gz', '.rar', '.7z', '.bz2'].includes(cleanExt)) return 'archive';
  if (['.txt', '.md', '.log', '.env', '.htaccess', '.conf', '.ini'].includes(cleanExt)) return 'text';
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(cleanExt)) return 'document';
  return 'other';
}

// Multer storage with tenant-isolated destination
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const user = getActiveUser(req);
    const rawDir = (req.query.dir as string) || (req.body && req.body.dir) || '/public_html';
    const { safePath, isAllowed } = resolveAccountSafePath(user, rawDir);

    if (!isAllowed) {
      return cb(new Error('Access Denied: Path traversal detected outside account root'), '');
    }

    if (!fs.existsSync(safePath)) {
      try {
        fs.mkdirSync(safePath, { recursive: true });
      } catch (err) {
        return cb(err as Error, '');
      }
    }

    cb(null, safePath);
  },
  filename: (req, file, cb) => {
    const sanitized = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, sanitized);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 25,
  },
  fileFilter: (req, file, cb) => {
    const dangerousExts = ['.exe', '.bat', '.cmd', '.com', '.vbs', '.dll', '.so'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (dangerousExts.includes(ext)) {
      return cb(new Error(`File type ${ext} is restricted for security.`));
    }
    cb(null, true);
  },
});

// 1. GET /api/files - List files in user's isolated directory
router.get('/', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const requestedPath = (req.query.path as string) || '/public_html';
    const { safePath, displayPath, isAllowed } = resolveAccountSafePath(user, requestedPath);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Access denied outside your account root' });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'Directory does not exist' });
    }

    const userHome = path.join(HOME_DIR, user);
    let parentPath: string | null = null;
    if (safePath !== userHome) {
      const parentDir = path.dirname(safePath);
      const relativeFromHome = path.relative(userHome, parentDir).replace(/\\/g, '/');
      parentPath = `/home/${user}` + (relativeFromHome ? '/' + relativeFromHome : '');
    }

    const dirEntries = fs.readdirSync(safePath, { withFileTypes: true });

    const items = dirEntries.map((entry) => {
      const entryFullPath = path.join(safePath, entry.name);
      let size = 0;
      let mtime = new Date().toISOString();
      let permissions = entry.isDirectory() ? '0755' : '0644';
      const ext = entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase();

      try {
        const itemStat = fs.statSync(entryFullPath);
        size = itemStat.size;
        mtime = itemStat.mtime.toISOString();
        permissions = getFormattedPermissions(itemStat.mode, entry.isDirectory());
      } catch {
        // ignore
      }

      const relativeItem = path.relative(userHome, entryFullPath).replace(/\\/g, '/');
      const itemDisplayPath = `/home/${user}/` + relativeItem;

      return {
        name: entry.name,
        displayPath: itemDisplayPath,
        isDirectory: entry.isDirectory(),
        size,
        mtime,
        permissions,
        extension: ext,
        category: entry.isDirectory() ? 'folder' : getFileTypeCategory(ext),
      };
    });

    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return res.json({
      user,
      currentPath: displayPath,
      parentPath,
      totalItems: items.length,
      items,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list directory' });
  }
});

// 2. POST /api/files/upload - Handle file upload
router.post('/upload', (req: Request, res: Response) => {
  upload.array('files', 25)(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.message || 'File upload failed' });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const user = getActiveUser(req);
    const rawDir = (req.query.dir as string) || req.body.dir || '/public_html';
    const { displayPath } = resolveAccountSafePath(user, rawDir);

    const uploadedDetails = files.map((f) => {
      addActivityLog(user, 'cpanel', 'FILE_UPLOAD', `${displayPath}/${f.filename}`, req.ip, undefined, `${(f.size / 1024).toFixed(1)} KB`);
      return {
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        path: `${displayPath}/${f.filename}`,
      };
    });

    return res.json({
      success: true,
      message: `Successfully uploaded ${files.length} file(s).`,
      uploadedFiles: uploadedDetails,
    });
  });
});

// 3. POST /api/files/create - Create New File
router.post('/create', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { dir = '/public_html', name, content = '' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'File name is required' });

    const sanitizedName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const { safePath, isAllowed } = resolveAccountSafePath(user, dir);

    if (!isAllowed) return res.status(403).json({ error: 'Forbidden: Access denied outside account root' });

    const fullFilePath = path.join(safePath, sanitizedName);
    const { safePath: validatedPath, isAllowed: isTargetAllowed } = resolveAccountSafePath(user, path.relative(path.join(HOME_DIR, user), fullFilePath));

    if (!isTargetAllowed) return res.status(403).json({ error: 'Forbidden file destination' });
    if (fs.existsSync(validatedPath)) return res.status(409).json({ error: `File "${sanitizedName}" already exists` });

    fs.writeFileSync(validatedPath, content, 'utf-8');
    const relative = path.relative(path.join(HOME_DIR, user), validatedPath).replace(/\\/g, '/');
    const displayPath = `/home/${user}/${relative}`;

    addActivityLog(user, 'cpanel', 'CREATE_FILE', displayPath, req.ip);

    return res.json({
      success: true,
      message: `File "${sanitizedName}" created successfully.`,
      path: displayPath,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create file' });
  }
});

// 4. POST /api/files/create-folder - Create New Directory
router.post('/create-folder', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { dir = '/public_html', name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Folder name is required' });

    const sanitizedName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const { safePath, isAllowed } = resolveAccountSafePath(user, dir);

    if (!isAllowed) return res.status(403).json({ error: 'Forbidden: Access denied outside account root' });

    const fullDirPath = path.join(safePath, sanitizedName);
    const { safePath: validatedPath, isAllowed: isDirAllowed } = resolveAccountSafePath(user, path.relative(path.join(HOME_DIR, user), fullDirPath));

    if (!isDirAllowed) return res.status(403).json({ error: 'Forbidden destination directory' });
    if (fs.existsSync(validatedPath)) return res.status(409).json({ error: `Folder "${sanitizedName}" already exists` });

    fs.mkdirSync(validatedPath, { recursive: true });
    const relative = path.relative(path.join(HOME_DIR, user), validatedPath).replace(/\\/g, '/');
    const displayPath = `/home/${user}/${relative}`;

    addActivityLog(user, 'cpanel', 'CREATE_FOLDER', displayPath, req.ip);

    return res.json({
      success: true,
      message: `Folder "${sanitizedName}" created successfully.`,
      path: displayPath,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create folder' });
  }
});

// 5. PUT /api/files/rename - Rename File or Directory
router.put('/rename', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { dir = '/public_html', oldName, newName } = req.body || {};
    if (!oldName || !newName) return res.status(400).json({ error: 'Both old and new names required' });

    const { safePath: dirSafePath, isAllowed } = resolveAccountSafePath(user, dir);
    if (!isAllowed) return res.status(403).json({ error: 'Forbidden: Access denied' });

    const sanitizedOld = path.basename(oldName);
    const sanitizedNew = path.basename(newName).replace(/[^a-zA-Z0-9._-]/g, '_');

    const sourcePath = path.join(dirSafePath, sanitizedOld);
    const destPath = path.join(dirSafePath, sanitizedNew);

    if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: `Item "${sanitizedOld}" not found` });
    if (fs.existsSync(destPath)) return res.status(409).json({ error: `Item "${sanitizedNew}" already exists` });

    fs.renameSync(sourcePath, destPath);
    addActivityLog(user, 'cpanel', 'RENAME', `${dir}/${sanitizedNew}`, req.ip, undefined, `Renamed from ${sanitizedOld}`);

    return res.json({
      success: true,
      message: `Renamed to "${sanitizedNew}" successfully.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to rename item' });
  }
});

// 6. DELETE /api/files/delete - Delete Files/Folders
router.delete('/delete', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { paths } = req.body || {};
    if (!Array.isArray(paths) || paths.length === 0) return res.status(400).json({ error: 'Paths array required' });

    const userHome = path.join(HOME_DIR, user);
    const deleted: string[] = [];

    for (const itemPath of paths) {
      const { safePath, displayPath, isAllowed } = resolveAccountSafePath(user, itemPath);
      if (!isAllowed || safePath === userHome) continue;

      if (fs.existsSync(safePath)) {
        fs.rmSync(safePath, { recursive: true, force: true });
        deleted.push(displayPath);
        addActivityLog(user, 'cpanel', 'DELETE', displayPath, req.ip);
      }
    }

    return res.json({
      success: true,
      message: `Deleted ${deleted.length} item(s).`,
      deleted,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete items' });
  }
});

// 7. POST /api/files/copy & move
router.post('/copy-move', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { action = 'copy', sourcePaths, targetDir } = req.body || {};
    if (!Array.isArray(sourcePaths) || !targetDir) {
      return res.status(400).json({ error: 'sourcePaths array and targetDir required' });
    }

    const { safePath: targetSafe, isAllowed: targetAllowed } = resolveAccountSafePath(user, targetDir);
    if (!targetAllowed) return res.status(403).json({ error: 'Forbidden destination directory' });

    if (!fs.existsSync(targetSafe)) {
      fs.mkdirSync(targetSafe, { recursive: true });
    }

    for (const src of sourcePaths) {
      const { safePath: srcSafe, isAllowed: srcAllowed } = resolveAccountSafePath(user, src);
      if (!srcAllowed || !fs.existsSync(srcSafe)) continue;

      const baseName = path.basename(srcSafe);
      const dest = path.join(targetSafe, baseName);

      if (action === 'move') {
        fs.renameSync(srcSafe, dest);
      } else {
        fs.cpSync(srcSafe, dest, { recursive: true });
      }
    }

    addActivityLog(user, 'cpanel', action === 'move' ? 'MOVE_FILES' : 'COPY_FILES', `${sourcePaths.length} items to ${targetDir}`, req.ip);

    return res.json({ success: true, message: `Successfully ${action}d ${sourcePaths.length} item(s).` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Copy/Move operation failed' });
  }
});

// 8. POST /api/files/compress - Compress files to ZIP
router.post('/compress', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { dir, files, archiveName = 'archive.zip' } = req.body || {};
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Files array required' });
    }

    const { safePath: dirSafe, isAllowed } = resolveAccountSafePath(user, dir);
    if (!isAllowed) return res.status(403).json({ error: 'Forbidden directory' });

    const cleanArchiveName = archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`;
    const zipPath = path.join(dirSafe, cleanArchiveName);

    const zip = new AdmZip();
    for (const f of files) {
      const { safePath: itemSafe, isAllowed: itemAllowed } = resolveAccountSafePath(user, `${dir}/${f}`);
      if (!itemAllowed || !fs.existsSync(itemSafe)) continue;

      const stat = fs.statSync(itemSafe);
      if (stat.isDirectory()) {
        zip.addLocalFolder(itemSafe, f);
      } else {
        zip.addLocalFile(itemSafe);
      }
    }

    zip.writeZip(zipPath);
    addActivityLog(user, 'cpanel', 'COMPRESS_ZIP', `${dir}/${cleanArchiveName}`, req.ip);

    return res.json({ success: true, message: `Created archive "${cleanArchiveName}" successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Compression failed' });
  }
});

// 9. POST /api/files/extract - Extract ZIP archive
router.post('/extract', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { archivePath, destinationDir } = req.body || {};
    if (!archivePath) return res.status(400).json({ error: 'Archive path required' });

    const { safePath: zipSafe, isAllowed: zipAllowed } = resolveAccountSafePath(user, archivePath);
    if (!zipAllowed || !fs.existsSync(zipSafe)) {
      return res.status(404).json({ error: 'Archive file not found' });
    }

    const targetDir = destinationDir || path.dirname(zipSafe);
    const { safePath: destSafe, isAllowed: destAllowed } = resolveAccountSafePath(user, targetDir);
    if (!destAllowed) return res.status(403).json({ error: 'Forbidden destination directory' });

    if (!fs.existsSync(destSafe)) fs.mkdirSync(destSafe, { recursive: true });

    const zip = new AdmZip(zipSafe);
    zip.extractAllTo(destSafe, true);

    addActivityLog(user, 'cpanel', 'EXTRACT_ZIP', path.basename(zipSafe), req.ip, undefined, `Extracted to ${destinationDir}`);

    return res.json({ success: true, message: `Archive extracted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Extraction failed' });
  }
});

// 10. GET /api/files/download - Download single file or zip
router.get('/download', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const rawPaths = req.query.paths || req.query.path;
    if (!rawPaths) return res.status(400).json({ error: 'Path required' });

    const pathList = Array.isArray(rawPaths)
      ? (rawPaths as string[])
      : String(rawPaths).split(',').map((p) => p.trim()).filter(Boolean);

    if (pathList.length === 1) {
      const { safePath, isAllowed } = resolveAccountSafePath(user, pathList[0]);
      if (!isAllowed || !fs.existsSync(safePath)) return res.status(404).json({ error: 'File not found' });

      const stat = fs.statSync(safePath);
      if (stat.isFile()) {
        return res.download(safePath, path.basename(safePath));
      }
    }

    // Multiple files or folder -> streaming zip
    res.attachment(`cpanel-${user}-archive-${Date.now()}.zip`);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err: any) => res.status(500).send({ error: err.message }));
    archive.pipe(res);

    for (const p of pathList) {
      const { safePath, isAllowed } = resolveAccountSafePath(user, p);
      if (!isAllowed || !fs.existsSync(safePath)) continue;

      const stat = fs.statSync(safePath);
      const name = path.basename(safePath);
      if (stat.isDirectory()) {
        archive.directory(safePath, name);
      } else {
        archive.file(safePath, { name });
      }
    }

    archive.finalize();
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Download failed' });
  }
});

// 11. GET /api/files/preview & content
router.get('/preview', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const targetPath = (req.query.path as string) || '';
    const { safePath, isAllowed } = resolveAccountSafePath(user, targetPath);

    if (!isAllowed || !fs.existsSync(safePath)) return res.status(404).json({ error: 'File not found' });
    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) return res.status(400).json({ error: 'Cannot preview directory' });

    const ext = path.extname(safePath).toLowerCase();
    const imageMimes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };

    if (imageMimes[ext]) {
      res.setHeader('Content-Type', imageMimes[ext]);
      return fs.createReadStream(safePath).pipe(res);
    }

    const content = fs.readFileSync(safePath, 'utf-8');
    return res.json({
      filename: path.basename(safePath),
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      extension: ext,
      content,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Preview failed' });
  }
});

// 12. PUT /api/files/content - Save File Content
router.put('/content', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const { path: filePath, content } = req.body || {};
    if (!filePath || typeof content !== 'string') {
      return res.status(400).json({ error: 'File path and content required' });
    }

    const { safePath, displayPath, isAllowed } = resolveAccountSafePath(user, filePath);
    if (!isAllowed || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found or permission denied' });
    }

    fs.writeFileSync(safePath, content, 'utf-8');
    addActivityLog(user, 'cpanel', 'EDIT_FILE', displayPath, req.ip, undefined, `${content.length} characters`);

    return res.json({
      success: true,
      message: `File saved successfully.`,
      displayPath,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to save file' });
  }
});

export default router;
