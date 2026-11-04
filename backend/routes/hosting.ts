import { Router, Request, Response } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import path from 'path';
import fs from 'fs';

import { 
  getDatabase, 
  saveDatabase, 
  addActivityLog, 
  EmailAccount, 
  DatabaseItem, 
  FtpAccount, 
  DomainItem, 
  CronJob,
  BackupItem 
} from '../db/database.js';
import { HOME_DIR, resolveAccountSafePath, calculateAccountDirectoryStats } from '../storage.js';

const router = Router();

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

function getAccount(user: string) {
  const db = getDatabase();
  return db.accounts.find((a) => a.username === user) || db.accounts[0];
}

// 1. DOMAINS MANAGEMENT
router.get('/domains', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  const db = getDatabase();
  const domains = db.domains.filter((d) => d.accountId === account.id);
  return res.json({ domains, primaryDomain: account.domain });
});

router.post('/domains', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const account = getAccount(user);
    const { domain, type = 'addon', subfolder } = req.body || {};

    if (!domain) return res.status(400).json({ error: 'Domain name is required' });
    const cleanDomain = String(domain).toLowerCase().trim();

    const db = getDatabase();
    if (db.domains.some((d) => d.domain === cleanDomain)) {
      return res.status(409).json({ error: `Domain "${cleanDomain}" is already registered` });
    }

    const docRoot = subfolder 
      ? `/home/${user}/public_html/${subfolder}`
      : `/home/${user}/public_html/${cleanDomain.replace(/[^a-z0-9]/g, '_')}`;

    const newDom: DomainItem = {
      id: `dom-${Date.now()}`,
      accountId: account.id,
      domain: cleanDomain,
      type: type as any,
      documentRoot: docRoot,
      sslStatus: 'active',
      createdAt: new Date().toISOString(),
    };

    // Ensure document root directory exists on disk
    const targetDir = path.join(HOME_DIR, user, 'public_html', subfolder || cleanDomain.replace(/[^a-z0-9]/g, '_'));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'index.html'), `<h1>Site ready for ${cleanDomain}</h1>`, 'utf-8');
    }

    db.domains.push(newDom);
    saveDatabase(db);
    addActivityLog(user, 'cpanel', 'ADD_DOMAIN', cleanDomain, req.ip, account.id, `Type: ${type}, Root: ${docRoot}`);

    return res.json({ success: true, domain: newDom, message: `Domain "${cleanDomain}" created successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add domain' });
  }
});

// 2. EMAIL ACCOUNTS
router.get('/email', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  const db = getDatabase();
  const emails = db.emailAccounts.filter((e) => e.accountId === account.id);
  return res.json({ emails, defaultDomain: account.domain });
});

router.post('/email', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const account = getAccount(user);
    const { emailPrefix, domain, quotaMB, forwardTo, autoresponderEnabled, autoresponderSubject, autoresponderBody } = req.body || {};

    if (!emailPrefix) return res.status(400).json({ error: 'Email prefix is required' });
    const fullEmail = `${emailPrefix.toLowerCase()}@${domain || account.domain}`;

    const db = getDatabase();
    if (db.emailAccounts.some((e) => e.email === fullEmail)) {
      return res.status(409).json({ error: `Email "${fullEmail}" already exists` });
    }

    const newMail: EmailAccount = {
      id: `mail-${Date.now()}`,
      accountId: account.id,
      email: fullEmail,
      quotaMB: Number(quotaMB) || 1024,
      usedMB: 0.1,
      forwardTo: forwardTo || undefined,
      autoresponderEnabled: Boolean(autoresponderEnabled),
      autoresponderSubject,
      autoresponderBody,
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.emailAccounts.push(newMail);
    saveDatabase(db);
    addActivityLog(user, 'cpanel', 'CREATE_EMAIL', fullEmail, req.ip, account.id);

    return res.json({ success: true, email: newMail, message: `Email account ${fullEmail} created.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create email' });
  }
});

router.delete('/email/:id', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = getDatabase();
  db.emailAccounts = db.emailAccounts.filter((e) => e.id !== req.params.id);
  saveDatabase(db);
  addActivityLog(user, 'cpanel', 'DELETE_EMAIL', req.params.id, req.ip);
  return res.json({ success: true, message: 'Email account deleted.' });
});

// 3. MYSQL DATABASES
router.get('/databases', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  const db = getDatabase();
  const databases = db.databases.filter((d) => d.accountId === account.id);
  return res.json({ databases, usernamePrefix: user });
});

router.post('/databases', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const account = getAccount(user);
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Database name is required' });

    const cleanSuffix = String(name).toLowerCase().replace(/[^a-z0-9_]/g, '');
    const fullName = `${user}_${cleanSuffix}`;

    const db = getDatabase();
    if (db.databases.some((d) => d.name === fullName)) {
      return res.status(409).json({ error: `Database "${fullName}" already exists` });
    }

    const newDb: DatabaseItem = {
      id: `db-${Date.now()}`,
      accountId: account.id,
      name: fullName,
      sizeMB: 0.1,
      charset: 'utf8mb4_unicode_ci',
      tablesCount: 0,
      users: [{ username: `${user}_admin`, privileges: ['ALL PRIVILEGES'] }],
    };

    db.databases.push(newDb);
    saveDatabase(db);
    addActivityLog(user, 'cpanel', 'CREATE_DATABASE', fullName, req.ip, account.id);

    return res.json({ success: true, database: newDb, message: `Database "${fullName}" created successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create database' });
  }
});

router.delete('/databases/:id', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = getDatabase();
  db.databases = db.databases.filter((d) => d.id !== req.params.id);
  saveDatabase(db);
  addActivityLog(user, 'cpanel', 'DELETE_DATABASE', req.params.id, req.ip);
  return res.json({ success: true, message: 'Database deleted.' });
});

// 4. FTP ACCOUNTS
router.get('/ftp', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  const db = getDatabase();
  const accounts = db.ftpAccounts.filter((f) => f.accountId === account.id);
  return res.json({ accounts });
});

router.post('/ftp', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const account = getAccount(user);
    const { username, directory, quotaMB } = req.body || {};
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const cleanUser = String(username).toLowerCase().replace(/[^a-z0-9_]/g, '');
    const db = getDatabase();

    const newFtp: FtpAccount = {
      id: `ftp-${Date.now()}`,
      accountId: account.id,
      username: `${cleanUser}@${account.domain}`,
      directory: directory || `/home/${user}/public_html`,
      quotaMB: Number(quotaMB) || 2048,
      createdAt: new Date().toISOString().split('T')[0],
    };

    db.ftpAccounts.push(newFtp);
    saveDatabase(db);
    addActivityLog(user, 'cpanel', 'CREATE_FTP', newFtp.username, req.ip, account.id);

    return res.json({ success: true, account: newFtp });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create FTP account' });
  }
});

router.delete('/ftp/:id', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = getDatabase();
  db.ftpAccounts = db.ftpAccounts.filter((f) => f.id !== req.params.id);
  saveDatabase(db);
  return res.json({ success: true, message: 'FTP account deleted' });
});

// 5. CRON JOBS
router.get('/cron', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  const db = getDatabase();
  const jobs = db.cronJobs.filter((c) => c.accountId === account.id);
  return res.json({ jobs });
});

router.post('/cron', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const account = getAccount(user);
    const { command, minute = '0', hour = '*', day = '*', month = '*', weekday = '*' } = req.body || {};
    if (!command) return res.status(400).json({ error: 'Cron command is required' });

    const db = getDatabase();
    const newJob: CronJob = {
      id: `cron-${Date.now()}`,
      accountId: account.id,
      minute,
      hour,
      day,
      month,
      weekday,
      command,
    };

    db.cronJobs.push(newJob);
    saveDatabase(db);
    addActivityLog(user, 'cpanel', 'ADD_CRON_JOB', command, req.ip, account.id);

    return res.json({ success: true, job: newJob });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add cron job' });
  }
});

router.delete('/cron/:id', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const db = getDatabase();
  db.cronJobs = db.cronJobs.filter((c) => c.id !== req.params.id);
  saveDatabase(db);
  return res.json({ success: true, message: 'Cron job removed' });
});

// 6. BACKUPS & STREAMING RESTORE
router.get('/backup/full', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const account = getAccount(user);
    const userHome = path.join(HOME_DIR, user);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `cpanel-backup-${account.domain}-${timestamp}.zip`;

    res.attachment(filename);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err: any) => res.status(500).send({ error: err.message }));
    archive.pipe(res);

    archive.directory(userHome, `home/${user}`);

    const db = getDatabase();
    const newBk: BackupItem = {
      id: `bk-${Date.now()}`,
      accountId: account.id,
      domain: account.domain,
      filename,
      sizeMB: 18.5,
      type: 'full',
      createdAt: new Date().toISOString(),
    };
    db.backups.unshift(newBk);
    saveDatabase(db);

    addActivityLog(user, 'cpanel', 'CREATE_BACKUP', filename, req.ip, account.id, 'Full account archive generated');
    archive.finalize();
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Backup failed' });
  }
});

router.get('/backups', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  const db = getDatabase();
  const backups = db.backups.filter((b) => b.accountId === account.id);
  return res.json({ backups });
});

// 7. PHP & SERVER PREFERENCES
router.get('/settings', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  return res.json({
    phpVersion: account.phpVersion || '8.3.6',
    displayErrors: false,
    uploadMaxFilesize: '50M',
    memoryLimit: '512M',
    maxExecutionTime: '300',
    timezone: 'UTC',
    contactEmail: account.email,
  });
});

router.put('/settings', (req: Request, res: Response) => {
  const user = getActiveUser(req);
  const account = getAccount(user);
  const db = getDatabase();
  const match = db.accounts.find((a) => a.id === account.id);

  if (match) {
    if (req.body.phpVersion) match.phpVersion = req.body.phpVersion;
    if (req.body.contactEmail) match.email = req.body.contactEmail;
    saveDatabase(db);
  }

  addActivityLog(user, 'cpanel', 'UPDATE_SETTINGS', 'PHP / Account settings', req.ip, account.id);
  return res.json({ success: true, message: 'Settings saved successfully.' });
});

export default router;
