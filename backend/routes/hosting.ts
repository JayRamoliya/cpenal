import { Router, Request, Response } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import { USER_HOME_DIR, resolveSafePath, logActivity } from '../storage.js';

const router = Router();

// In-memory FTP accounts state
interface FtpAccount {
  id: string;
  username: string;
  domain: string;
  directory: string;
  quotaMB: number; // 0 for unlimited
  created: string;
}

let ftpAccounts: FtpAccount[] = [
  {
    id: 'ftp-1',
    username: 'deploy',
    domain: 'demo-site.com',
    directory: '/home/demo/public_html',
    quotaMB: 2048,
    created: '2026-10-15',
  },
  {
    id: 'ftp-2',
    username: 'media_uploader',
    domain: 'demo-site.com',
    directory: '/home/demo/public_html/images',
    quotaMB: 500,
    created: '2026-10-28',
  },
];

// Directory privacy protections
interface ProtectedDir {
  id: string;
  directory: string;
  realmName: string;
  isProtected: boolean;
  authorizedUsers: string[];
}

let protectedDirs: ProtectedDir[] = [
  {
    id: 'pd-1',
    directory: '/home/demo/public_html/admin',
    realmName: 'Restricted Administration Area',
    isProtected: true,
    authorizedUsers: ['admin', 'sysmanager'],
  },
];

// In-memory server settings
let hostingSettings = {
  phpVersion: '8.3.6',
  displayErrors: false,
  uploadMaxFilesize: '25M',
  maxExecutionTime: '300',
  memoryLimit: '512M',
  timezone: 'America/Los_Angeles',
  contactEmail: 'admin@demo-site.com',
};

// --- FTP ACCOUNTS ---
router.get('/ftp', (req: Request, res: Response) => {
  return res.json({ accounts: ftpAccounts });
});

router.post('/ftp', (req: Request, res: Response) => {
  const { username, directory, quotaMB } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cleanUser = String(username).toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (ftpAccounts.some((a) => a.username === cleanUser)) {
    return res.status(409).json({ error: `FTP account "${cleanUser}" already exists` });
  }

  const newAcc: FtpAccount = {
    id: `ftp-${Date.now()}`,
    username: cleanUser,
    domain: 'demo-site.com',
    directory: directory || '/home/demo/public_html',
    quotaMB: Number(quotaMB) || 1024,
    created: new Date().toISOString().split('T')[0],
  };

  ftpAccounts.push(newAcc);
  logActivity('create_file', `FTP Account: ${cleanUser}@demo-site.com`, `Directory: ${newAcc.directory}`);

  return res.json({ success: true, account: newAcc, message: `FTP Account "${cleanUser}" created successfully.` });
});

router.delete('/ftp/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = ftpAccounts.length;
  ftpAccounts = ftpAccounts.filter((a) => a.id !== id);

  if (ftpAccounts.length === initialLength) {
    return res.status(404).json({ error: 'FTP account not found' });
  }

  return res.json({ success: true, message: 'FTP account removed.' });
});

// --- DIRECTORY PRIVACY ---
router.get('/privacy', (req: Request, res: Response) => {
  return res.json({ directories: protectedDirs });
});

router.post('/privacy', (req: Request, res: Response) => {
  const { directory, realmName, isProtected, user } = req.body || {};
  if (!directory) {
    return res.status(400).json({ error: 'Directory path is required' });
  }

  const existing = protectedDirs.find((d) => d.directory === directory);
  if (existing) {
    existing.isProtected = isProtected ?? existing.isProtected;
    existing.realmName = realmName || existing.realmName;
    if (user && !existing.authorizedUsers.includes(user)) {
      existing.authorizedUsers.push(user);
    }
    return res.json({ success: true, directory: existing, message: 'Directory privacy updated.' });
  }

  const newEntry: ProtectedDir = {
    id: `pd-${Date.now()}`,
    directory,
    realmName: realmName || 'Protected Directory',
    isProtected: isProtected ?? true,
    authorizedUsers: user ? [user] : ['admin'],
  };

  protectedDirs.push(newEntry);
  logActivity('create_file', `Directory Privacy: ${directory}`, `Protected with Auth Realm: ${newEntry.realmName}`);

  return res.json({ success: true, directory: newEntry, message: 'Directory password protection enabled.' });
});

// --- FULL BACKUP ARCHIVE GENERATION ---
router.get('/backup/full', (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `backup-demo-site-${timestamp}.zip`;

    res.attachment(filename);
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', (err: any) => {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    // Archive the full /home/demo directory structure
    archive.directory(USER_HOME_DIR, 'home/demo');
    logActivity('create_file', `/backup/${filename}`, 'Full cPanel Home Directory Archive Generated');

    archive.finalize();
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Backup generation failed' });
  }
});

// --- SETTINGS ---
router.get('/settings', (req: Request, res: Response) => {
  return res.json({ settings: hostingSettings });
});

router.put('/settings', (req: Request, res: Response) => {
  const updates = req.body || {};
  hostingSettings = { ...hostingSettings, ...updates };
  return res.json({ success: true, settings: hostingSettings, message: 'Configuration saved successfully.' });
});

export default router;
