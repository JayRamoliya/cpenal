import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { USER_HOME_DIR, calculateDirectoryStats, getActivities } from '../storage.js';

const router = Router();

// 5.0 GB default simulated quota for this cPanel account
const TOTAL_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

router.get('/stats', (req: Request, res: Response) => {
  try {
    const overallStats = calculateDirectoryStats(USER_HOME_DIR);
    
    // Calculate folder-by-folder breakdown for cPanel disk usage analysis
    const foldersToInspect = ['public_html', 'mail', 'logs', 'ssl'];
    const breakdown = foldersToInspect.map((folderName) => {
      const folderPath = path.join(USER_HOME_DIR, folderName);
      if (fs.existsSync(folderPath)) {
        const stats = calculateDirectoryStats(folderPath);
        return {
          name: folderName,
          path: `/home/demo/${folderName}`,
          bytes: stats.totalBytes,
          formatted: formatBytes(stats.totalBytes),
          files: stats.fileCount,
          folders: stats.folderCount,
        };
      }
      return {
        name: folderName,
        path: `/home/demo/${folderName}`,
        bytes: 0,
        formatted: '0 B',
        files: 0,
        folders: 0,
      };
    });

    const usedBytes = overallStats.totalBytes;
    const availableBytes = Math.max(0, TOTAL_QUOTA_BYTES - usedBytes);
    const percentageUsed = Math.min(100, parseFloat(((usedBytes / TOTAL_QUOTA_BYTES) * 100).toFixed(2)));

    return res.json({
      totalQuotaBytes: TOTAL_QUOTA_BYTES,
      totalQuotaFormatted: '5.00 GB',
      usedBytes,
      usedFormatted: formatBytes(usedBytes),
      availableBytes,
      availableFormatted: formatBytes(availableBytes),
      percentageUsed,
      totalFiles: overallStats.fileCount,
      totalFolders: overallStats.folderCount,
      breakdown,
      serverDetails: {
        domain: 'demo-site.com',
        ip: '192.168.1.104',
        cpanelVersion: '118.0.12',
        phpVersion: '8.3.6',
        webServer: 'Apache/2.4.58 (cPanel)',
        sslStatus: 'Active - Let\'s Encrypt AutoSSL',
        dbEngine: 'MySQL 8.0.36',
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
    const list = getActivities();
    return res.json({ activities: list });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch activities' });
  }
});

export default router;
