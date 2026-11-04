import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import { resolveSafePath, logActivity, USER_HOME_DIR } from '../storage.js';

const router = Router();

// Helper to determine unix-style permissions string (e.g. 0755, 0644)
function getFormattedPermissions(mode: number, isDir: boolean): string {
  const octal = (mode & 0o777).toString(8);
  if (octal.length < 3) {
    return isDir ? '0755' : '0644';
  }
  return '0' + octal;
}

// Helper to determine file category
function getFileTypeCategory(ext: string): 'image' | 'code' | 'archive' | 'text' | 'document' | 'other' {
  const cleanExt = ext.toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp'].includes(cleanExt)) {
    return 'image';
  }
  if (['.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.php', '.json', '.xml', '.sql', '.sh', '.py'].includes(cleanExt)) {
    return 'code';
  }
  if (['.zip', '.tar', '.gz', '.rar', '.7z', '.bz2'].includes(cleanExt)) {
    return 'archive';
  }
  if (['.txt', '.md', '.log', '.env', '.htaccess', '.conf', '.ini'].includes(cleanExt)) {
    return 'text';
  }
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(cleanExt)) {
    return 'document';
  }
  return 'other';
}

// Configure Multer storage
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawDir = (req.query.dir as string) || (req.body && req.body.dir) || '/public_html';
    const { safePath, isAllowed } = resolveSafePath(rawDir);

    if (!isAllowed) {
      return cb(new Error('Access Denied: Path traversal detected'), '');
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
    // Sanitize filename to prevent directory traversal
    const sanitized = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, sanitized);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per file
    files: 20, // max 20 files
  },
  fileFilter: (req, file, cb) => {
    // Block executable server binaries (like .exe, .bin, .dll)
    const dangerousExts = ['.exe', '.bat', '.cmd', '.com', '.vbs', '.dll', '.so'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (dangerousExts.includes(ext)) {
      return cb(new Error(`File type ${ext} is restricted for security reasons.`));
    }
    cb(null, true);
  },
});

// 1. GET /api/files - List directory items
router.get('/', (req: Request, res: Response) => {
  try {
    const requestedPath = (req.query.path as string) || '/public_html';
    const { safePath, displayPath, isAllowed } = resolveSafePath(requestedPath);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Access denied outside sandbox' });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'Directory does not exist' });
    }

    const stat = fs.statSync(safePath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Requested path is not a directory' });
    }

    // Determine parent path
    let parentPath: string | null = null;
    if (safePath !== USER_HOME_DIR) {
      const parentDir = path.dirname(safePath);
      const relativeFromHome = path.relative(USER_HOME_DIR, parentDir).replace(/\\/g, '/');
      parentPath = '/home/demo' + (relativeFromHome ? '/' + relativeFromHome : '');
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
        // Fallback default
      }

      const relativeItem = path.relative(USER_HOME_DIR, entryFullPath).replace(/\\/g, '/');
      const itemDisplayPath = '/home/demo/' + relativeItem;

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

    // Sort folders first, then files alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return res.json({
      currentPath: displayPath,
      parentPath,
      totalItems: items.length,
      items,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to list directory' });
  }
});

// 2. POST /api/files/upload - Handle file upload with Multer
router.post('/upload', (req: Request, res: Response) => {
  upload.array('files', 20)(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for upload' });
    }

    const rawDir = (req.query.dir as string) || req.body.dir || '/public_html';
    const { displayPath } = resolveSafePath(rawDir);

    const uploadedDetails = files.map((f) => {
      logActivity('upload', `${displayPath}/${f.filename}`, `${(f.size / 1024).toFixed(1)} KB`);
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

// 3. POST /api/files/create - Create new file
router.post('/create', (req: Request, res: Response) => {
  try {
    const { dir, name, content = '' } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Valid file name is required' });
    }

    const sanitizedName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetDir = dir || '/public_html';
    const { safePath, isAllowed } = resolveSafePath(targetDir);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Invalid directory' });
    }

    const fullFilePath = path.join(safePath, sanitizedName);
    const { safePath: validatedFile, isAllowed: isFileAllowed } = resolveSafePath(
      path.relative(USER_HOME_DIR, fullFilePath)
    );

    if (!isFileAllowed) {
      return res.status(403).json({ error: 'Forbidden path destination' });
    }

    if (fs.existsSync(validatedFile)) {
      return res.status(409).json({ error: `File "${sanitizedName}" already exists` });
    }

    fs.writeFileSync(validatedFile, content, 'utf-8');
    const relativeFromHome = path.relative(USER_HOME_DIR, validatedFile).replace(/\\/g, '/');
    const displayPath = '/home/demo/' + relativeFromHome;

    logActivity('create_file', displayPath);

    return res.json({
      success: true,
      message: `File "${sanitizedName}" created successfully.`,
      path: displayPath,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create file' });
  }
});

// 4. POST /api/folders/create - Create new directory
router.post('/create-folder', (req: Request, res: Response) => {
  try {
    const { dir, name } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const sanitizedName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetDir = dir || '/public_html';
    const { safePath, isAllowed } = resolveSafePath(targetDir);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Invalid directory' });
    }

    const fullDirPath = path.join(safePath, sanitizedName);
    const { safePath: validatedDir, isAllowed: isDirAllowed } = resolveSafePath(
      path.relative(USER_HOME_DIR, fullDirPath)
    );

    if (!isDirAllowed) {
      return res.status(403).json({ error: 'Forbidden destination directory' });
    }

    if (fs.existsSync(validatedDir)) {
      return res.status(409).json({ error: `Folder "${sanitizedName}" already exists` });
    }

    fs.mkdirSync(validatedDir, { recursive: true });
    const relativeFromHome = path.relative(USER_HOME_DIR, validatedDir).replace(/\\/g, '/');
    const displayPath = '/home/demo/' + relativeFromHome;

    logActivity('create_folder', displayPath);

    return res.json({
      success: true,
      message: `Folder "${sanitizedName}" created successfully.`,
      path: displayPath,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create folder' });
  }
});

// 5. PUT /api/files/rename - Rename file or folder
router.put('/rename', (req: Request, res: Response) => {
  try {
    const { dir, oldName, newName } = req.body || {};
    if (!oldName || !newName) {
      return res.status(400).json({ error: 'Old name and new name are required' });
    }

    const targetDir = dir || '/public_html';
    const { safePath: dirSafePath, isAllowed } = resolveSafePath(targetDir);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const sanitizedOld = path.basename(oldName);
    const sanitizedNew = path.basename(newName).replace(/[^a-zA-Z0-9._-]/g, '_');

    const sourcePath = path.join(dirSafePath, sanitizedOld);
    const destPath = path.join(dirSafePath, sanitizedNew);

    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: `Item "${sanitizedOld}" not found` });
    }

    if (fs.existsSync(destPath)) {
      return res.status(409).json({ error: `Item "${sanitizedNew}" already exists` });
    }

    fs.renameSync(sourcePath, destPath);

    const relativeOld = path.relative(USER_HOME_DIR, sourcePath).replace(/\\/g, '/');
    const relativeNew = path.relative(USER_HOME_DIR, destPath).replace(/\\/g, '/');

    logActivity('rename', `/home/demo/${relativeNew}`, `Renamed from ${relativeOld}`);

    return res.json({
      success: true,
      message: `Renamed to "${sanitizedNew}" successfully.`,
      newPath: `/home/demo/${relativeNew}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to rename item' });
  }
});

// 6. DELETE /api/files/delete - Delete multiple items
router.delete('/delete', (req: Request, res: Response) => {
  try {
    const { paths } = req.body || {};
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'Paths array is required' });
    }

    const deleted: string[] = [];
    const errors: string[] = [];

    for (const itemPath of paths) {
      const { safePath, displayPath, isAllowed } = resolveSafePath(itemPath);

      if (!isAllowed || safePath === USER_HOME_DIR) {
        errors.push(`Cannot delete protected root folder: ${itemPath}`);
        continue;
      }

      if (fs.existsSync(safePath)) {
        try {
          fs.rmSync(safePath, { recursive: true, force: true });
          deleted.push(displayPath);
          logActivity('delete', displayPath);
        } catch (delErr: any) {
          errors.push(`Failed to delete ${displayPath}: ${delErr.message}`);
        }
      }
    }

    return res.json({
      success: true,
      message: `Deleted ${deleted.length} item(s).`,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete items' });
  }
});

// 7. GET /api/files/download - Download single file or zip multiple items
router.get('/download', (req: Request, res: Response) => {
  try {
    const rawPaths = req.query.paths || req.query.path;
    if (!rawPaths) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const pathList = Array.isArray(rawPaths)
      ? (rawPaths as string[])
      : String(rawPaths).split(',').map((p) => p.trim()).filter(Boolean);

    if (pathList.length === 0) {
      return res.status(400).json({ error: 'No valid paths provided' });
    }

    // Single file download
    if (pathList.length === 1) {
      const { safePath, isAllowed } = resolveSafePath(pathList[0]);
      if (!isAllowed || !fs.existsSync(safePath)) {
        return res.status(404).json({ error: 'File not found or access denied' });
      }

      const stat = fs.statSync(safePath);
      if (stat.isFile()) {
        const filename = path.basename(safePath);
        return res.download(safePath, filename);
      }
    }

    // Multi-file or directory download: create zip archive stream
    res.attachment(`cpanel-archive-${Date.now()}.zip`);
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', (err: any) => {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    for (const p of pathList) {
      const { safePath, isAllowed } = resolveSafePath(p);
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

// 8. GET /api/files/preview - Preview content (stream image or return text)
router.get('/preview', (req: Request, res: Response) => {
  try {
    const targetPath = (req.query.path as string) || '';
    const { safePath, isAllowed } = resolveSafePath(targetPath);

    if (!isAllowed || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Cannot preview directory' });
    }

    const ext = path.extname(safePath).toLowerCase();
    const filename = path.basename(safePath);

    // Image preview: stream directly
    const imageMimes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
    };

    if (imageMimes[ext]) {
      res.setHeader('Content-Type', imageMimes[ext]);
      return fs.createReadStream(safePath).pipe(res);
    }

    // Text / Code preview: return content (limited to 5MB)
    if (stat.size > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large to preview (> 5MB)' });
    }

    const content = fs.readFileSync(safePath, 'utf-8');
    return res.json({
      filename,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      extension: ext,
      content,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Preview failed' });
  }
});

// 9. PUT /api/files/content - Save file editor changes
router.put('/content', (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body || {};
    if (!filePath || typeof content !== 'string') {
      return res.status(400).json({ error: 'File path and string content are required' });
    }

    const { safePath, displayPath, isAllowed } = resolveSafePath(filePath);

    if (!isAllowed || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found or permission denied' });
    }

    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Target is a directory, not a file' });
    }

    fs.writeFileSync(safePath, content, 'utf-8');
    logActivity('edit', displayPath, `${content.length} characters`);

    return res.json({
      success: true,
      message: `File "${path.basename(safePath)}" saved successfully.`,
      displayPath,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to save file' });
  }
});

export default router;
