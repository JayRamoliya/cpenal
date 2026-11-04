import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { HOME_DIR, calculateAccountDirectoryStats } from '../storage.js';
import { getDatabase } from '../db/database.js';

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

router.get('/stats', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const db = getDatabase();
    const account = db.accounts.find((a) => a.username === user) || db.accounts[0];

    const userHome = path.join(HOME_DIR, user);
    const overallStats = calculateAccountDirectoryStats(userHome);

    const totalQuotaBytes = (account.diskLimitMB || 5120) * 1024 * 1024;
    const foldersToInspect = ['public_html', 'mail', 'logs', 'ssl'];

    const breakdown = foldersToInspect.map((folderName) => {
      const folderPath = path.join(userHome, folderName);
      if (fs.existsSync(folderPath)) {
        const stats = calculateAccountDirectoryStats(folderPath);
        return {
          name: folderName,
          path: `/home/${user}/${folderName}`,
          bytes: stats.totalBytes,
          formatted: formatBytes(stats.totalBytes),
          files: stats.fileCount,
          folders: stats.folderCount,
        };
      }
      return {
        name: folderName,
        path: `/home/${user}/${folderName}`,
        bytes: 0,
        formatted: '0 B',
        files: 0,
        folders: 0,
      };
    });

    const usedBytes = overallStats.totalBytes;
    const availableBytes = Math.max(0, totalQuotaBytes - usedBytes);
    const percentageUsed = Math.min(100, parseFloat(((usedBytes / totalQuotaBytes) * 100).toFixed(2)));

    // Count databases and emails for this account
    const dbCount = db.databases.filter((d) => d.accountId === account.id).length;
    const emailCount = db.emailAccounts.filter((e) => e.accountId === account.id).length;
    const ftpCount = db.ftpAccounts.filter((f) => f.accountId === account.id).length;
    const domainCount = db.domains.filter((d) => d.accountId === account.id).length;

    return res.json({
      username: user,
      totalQuotaBytes,
      totalQuotaFormatted: `${(account.diskLimitMB / 1024).toFixed(2)} GB`,
      usedBytes,
      usedFormatted: formatBytes(usedBytes),
      availableBytes,
      availableFormatted: formatBytes(availableBytes),
      percentageUsed,
      totalFiles: overallStats.fileCount,
      totalFolders: overallStats.folderCount,
      dbCount,
      emailCount,
      ftpCount,
      domainCount,
      bandwidthUsedFormatted: `${account.bandwidthUsedMB} MB`,
      bandwidthLimitFormatted: `${(account.bandwidthLimitMB / 1024).toFixed(1)} GB`,
      breakdown,
      serverDetails: {
        domain: account.domain,
        ip: account.ip,
        cpanelVersion: '118.0.12',
        phpVersion: account.phpVersion || '8.3.6',
        webServer: 'Apache/2.4.58 (cPanel Enterprise)',
        sslStatus: 'Active - AutoSSL Valid',
        dbEngine: 'MariaDB 10.11 Enterprise',
        inodesUsed: overallStats.fileCount + overallStats.folderCount,
        inodesTotal: 250000,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to calculate storage stats' });
  }
});

router.get('/activities', (req: Request, res: Response) => {
  try {
    const user = getActiveUser(req);
    const db = getDatabase();
    const account = db.accounts.find((a) => a.username === user);

    const userLogs = db.activityLogs.filter(
      (l) => l.user === user || (account && l.accountId === account.id) || l.panel === 'cpanel'
    );

    return res.json({ activities: userLogs.slice(0, 30) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch activities' });
  }
});

export default router;
