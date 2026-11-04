import { Router, Request, Response } from 'express';
import { 
  getDatabase, 
  saveDatabase, 
  addActivityLog, 
  HostingAccount, 
  HostingPackage, 
  DnsRecord, 
  SslCertificate, 
  ApiToken 
} from '../db/database.js';
import { provisionAccountDirectory, deleteAccountDirectory, calculateAccountDirectoryStats, HOME_DIR } from '../storage.js';
import path from 'path';

const router = Router();

// 1. GET /api/whm/stats - Master Server Dashboard KPIs
router.get('/stats', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const totalAccounts = db.accounts.length;
    const activeAccounts = db.accounts.filter((a) => a.status === 'active').length;
    const suspendedAccounts = db.accounts.filter((a) => a.status === 'suspended').length;
    const totalPackages = db.packages.length;
    const totalDomains = db.domains.length;

    // Calculate total disk usage
    let totalDiskBytes = 0;
    for (const acc of db.accounts) {
      const stats = calculateAccountDirectoryStats(path.join(HOME_DIR, acc.username));
      totalDiskBytes += stats.totalBytes;
    }
    const totalDiskMB = parseFloat((totalDiskBytes / (1024 * 1024)).toFixed(1));

    return res.json({
      totalAccounts,
      activeAccounts,
      suspendedAccounts,
      totalResellers: 1,
      totalPackages,
      totalDomains,
      diskUsageMB: totalDiskMB,
      diskUsageFormatted: `${totalDiskMB} MB`,
      totalDiskAllocatedMB: 250000,
      serverResources: {
        cpuUsage: 14.2, // simulated dynamic realistic load
        ramUsageMB: 3840,
        ramTotalMB: 16384,
        ramPercentage: 23.4,
        loadAverage: [0.18, 0.22, 0.15],
        uptime: '28 days, 14 hours, 32 mins',
        activeServices: [
          { name: 'cPanel Daemon (cpsrvd)', status: 'up', port: 2083 },
          { name: 'WHM Server (whostmgrd)', status: 'up', port: 2087 },
          { name: 'Apache HTTP Server (httpd)', status: 'up', port: 80 },
          { name: 'MariaDB MySQL Server', status: 'up', port: 3306 },
          { name: 'Exim Mail Transfer Agent', status: 'up', port: 25 },
          { name: 'Dovecot POP3/IMAP Server', status: 'up', port: 993 },
          { name: 'BIND DNS Server (named)', status: 'up', port: 53 },
          { name: 'Pure-FTPd FTP Daemon', status: 'up', port: 21 },
        ],
      },
      recentAccounts: db.accounts.slice(-5).reverse(),
      recentActivities: db.activityLogs.slice(0, 8),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch WHM stats' });
  }
});

// 2. GET /api/whm/accounts - List Accounts with Search, Filter & Pagination
router.get('/accounts', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { search = '', filter = 'all', page = '1', perPage = '10' } = req.query;

    let list = [...db.accounts];

    // Status filter
    if (filter === 'suspended') {
      list = list.filter((a) => a.status === 'suspended');
    } else if (filter === 'active') {
      list = list.filter((a) => a.status === 'active');
    }

    // Query search (domain, username, package, ip, owner)
    const q = String(search).toLowerCase().trim();
    if (q) {
      list = list.filter(
        (a) =>
          a.domain.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.packageName.toLowerCase().includes(q) ||
          a.ip.includes(q) ||
          a.owner.toLowerCase().includes(q)
      );
    }

    const totalRecords = list.length;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limit = Math.max(1, parseInt(String(perPage), 10) || 10);
    const startIndex = (pageNum - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    // Compute live disk stats for displayed accounts
    const withLiveStats = paginated.map((acc) => {
      const stats = calculateAccountDirectoryStats(path.join(HOME_DIR, acc.username));
      const usedMB = parseFloat((stats.totalBytes / (1024 * 1024)).toFixed(2));
      return {
        ...acc,
        diskUsedMB: Math.max(acc.diskUsedMB, usedMB),
      };
    });

    return res.json({
      totalRecords,
      currentPage: pageNum,
      perPage: limit,
      totalPages: Math.ceil(totalRecords / limit),
      accounts: withLiveStats,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list accounts' });
  }
});

// 3. POST /api/whm/accounts - Create a New Hosting Account
router.post('/accounts', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { domain, username, email, packageId } = req.body || {};

    if (!domain || !username) {
      return res.status(400).json({ error: 'Domain and Username are required' });
    }

    const cleanUser = String(username).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanDomain = String(domain).toLowerCase().trim();

    // Check duplicate username or domain
    if (db.accounts.some((a) => a.username === cleanUser)) {
      return res.status(409).json({ error: `Username "${cleanUser}" already exists` });
    }
    if (db.accounts.some((a) => a.domain === cleanDomain)) {
      return res.status(409).json({ error: `Domain "${cleanDomain}" is already hosted on this server` });
    }

    // Resolve package
    const pkg = db.packages.find((p) => p.id === packageId) || db.packages[0];

    // Assign IP
    const ipSuffix = 110 + (db.accounts.length % 50);
    const assignedIp = `192.168.1.${ipSuffix}`;

    const newAccount: HostingAccount = {
      id: `acc-${cleanUser}-${Date.now().toString(36)}`,
      domain: cleanDomain,
      username: cleanUser,
      email: email || `webmaster@${cleanDomain}`,
      packageId: pkg.id,
      packageName: pkg.name,
      owner: 'root',
      ip: assignedIp,
      status: 'active',
      diskLimitMB: pkg.diskLimitMB,
      diskUsedMB: 0.1,
      bandwidthLimitMB: pkg.bandwidthLimitMB,
      bandwidthUsedMB: 0,
      phpVersion: '8.3.6',
      createdAt: new Date().toISOString(),
    };

    db.accounts.push(newAccount);

    // Register Primary Domain
    db.domains.push({
      id: `dom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      accountId: newAccount.id,
      domain: cleanDomain,
      type: 'primary',
      documentRoot: `/home/${cleanUser}/public_html`,
      sslStatus: 'active',
      createdAt: new Date().toISOString(),
    });

    // Register Default DNS Zone Records
    db.dnsRecords.push(
      { id: `dns-${Date.now()}-1`, domain: cleanDomain, name: '@', type: 'A', record: assignedIp, ttl: 14400 },
      { id: `dns-${Date.now()}-2`, domain: cleanDomain, name: 'www', type: 'CNAME', record: cleanDomain, ttl: 14400 },
      { id: `dns-${Date.now()}-3`, domain: cleanDomain, name: 'mail', type: 'A', record: assignedIp, ttl: 14400 },
      { id: `dns-${Date.now()}-4`, domain: cleanDomain, name: '@', type: 'MX', record: `mail.${cleanDomain}`, ttl: 14400, priority: 10 }
    );

    // Register AutoSSL
    db.sslCertificates.push({
      id: `ssl-${Date.now()}`,
      domain: cleanDomain,
      accountId: newAccount.id,
      issuer: "cPanel AutoSSL (Let's Encrypt)",
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'valid',
      autoRenew: true,
      keyType: 'RSA 2048-bit',
    });

    // Provision filesystem sandbox directory
    provisionAccountDirectory(cleanUser, cleanDomain);

    saveDatabase(db);
    addActivityLog('root', 'whm', 'CREATE_ACCOUNT', cleanDomain, req.ip, newAccount.id, `Created for user ${cleanUser} with ${pkg.name}`);

    return res.json({
      success: true,
      message: `Hosting account for ${cleanDomain} (user: ${cleanUser}) created and provisioned successfully!`,
      account: newAccount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create account' });
  }
});

// 4. PUT /api/whm/accounts/:id/status - Suspend / Unsuspend Account
router.put('/accounts/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};
    const db = getDatabase();

    const account = db.accounts.find((a) => a.id === id || a.username === id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    account.status = status === 'suspended' ? 'suspended' : 'active';
    account.suspendReason = status === 'suspended' ? reason || 'Administrative suspension' : undefined;

    saveDatabase(db);
    addActivityLog('root', 'whm', status === 'suspended' ? 'SUSPEND_ACCOUNT' : 'UNSUSPEND_ACCOUNT', account.domain, req.ip, account.id, reason);

    return res.json({
      success: true,
      message: `Account "${account.domain}" is now ${account.status}.`,
      account,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to change account status' });
  }
});

// 5. PUT /api/whm/accounts/:id/package - Change Account Package / Plan
router.put('/accounts/:id/package', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { packageId } = req.body || {};
    const db = getDatabase();

    const account = db.accounts.find((a) => a.id === id || a.username === id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const pkg = db.packages.find((p) => p.id === packageId);
    if (!pkg) return res.status(404).json({ error: 'Hosting package not found' });

    const oldPackage = account.packageName;
    account.packageId = pkg.id;
    account.packageName = pkg.name;
    account.diskLimitMB = pkg.diskLimitMB;
    account.bandwidthLimitMB = pkg.bandwidthLimitMB;

    saveDatabase(db);
    addActivityLog('root', 'whm', 'UPGRADE_PACKAGE', account.domain, req.ip, account.id, `Changed package from ${oldPackage} to ${pkg.name}`);

    return res.json({
      success: true,
      message: `Account "${account.domain}" upgraded/downgraded to ${pkg.name}.`,
      account,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to modify account package' });
  }
});

// 6. DELETE /api/whm/accounts/:id - Terminate Account
router.delete('/accounts/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const index = db.accounts.findIndex((a) => a.id === id || a.username === id);
    if (index === -1) return res.status(404).json({ error: 'Account not found' });

    const [account] = db.accounts.splice(index, 1);

    // Remove domains, emails, databases, dns records linked to this account
    db.domains = db.domains.filter((d) => d.accountId !== account.id);
    db.dnsRecords = db.dnsRecords.filter((d) => d.domain !== account.domain);
    db.sslCertificates = db.sslCertificates.filter((s) => s.accountId !== account.id);
    db.emailAccounts = db.emailAccounts.filter((e) => e.accountId !== account.id);
    db.databases = db.databases.filter((d) => d.accountId !== account.id);
    db.ftpAccounts = db.ftpAccounts.filter((f) => f.accountId !== account.id);

    // Remove filesystem files
    deleteAccountDirectory(account.username);

    saveDatabase(db);
    addActivityLog('root', 'whm', 'TERMINATE_ACCOUNT', account.domain, req.ip, undefined, `Terminated user ${account.username} and wiped filesystem sandbox`);

    return res.json({
      success: true,
      message: `Account "${account.domain}" (${account.username}) was terminated permanently.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to terminate account' });
  }
});

// 7. POST /api/whm/accounts/bulk - Multi-Account Actions
router.post('/accounts/bulk', (req: Request, res: Response) => {
  try {
    const { action, accountIds, packageId, reason } = req.body || {};
    if (!action || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ error: 'Action and accountIds array required' });
    }

    const db = getDatabase();
    let count = 0;

    for (const acc of db.accounts) {
      if (accountIds.includes(acc.id)) {
        if (action === 'suspend') {
          acc.status = 'suspended';
          acc.suspendReason = reason || 'Bulk administrative suspension';
          count++;
        } else if (action === 'unsuspend') {
          acc.status = 'active';
          acc.suspendReason = undefined;
          count++;
        } else if (action === 'change_package' && packageId) {
          const pkg = db.packages.find((p) => p.id === packageId);
          if (pkg) {
            acc.packageId = pkg.id;
            acc.packageName = pkg.name;
            acc.diskLimitMB = pkg.diskLimitMB;
            acc.bandwidthLimitMB = pkg.bandwidthLimitMB;
            count++;
          }
        }
      }
    }

    saveDatabase(db);
    addActivityLog('root', 'whm', 'BULK_ACTION', `${action} on ${count} accounts`, req.ip);

    return res.json({
      success: true,
      message: `Successfully executed ${action} across ${count} account(s).`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Bulk action failed' });
  }
});

// 8. PACKAGES CRUD
router.get('/packages', (req: Request, res: Response) => {
  const db = getDatabase();
  return res.json({ packages: db.packages });
});

router.post('/packages', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { name, diskLimitMB, bandwidthLimitMB, maxDomains, maxEmails, maxDatabases } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Package name is required' });

    const newPkg: HostingPackage = {
      id: `pkg-${Date.now()}`,
      name: String(name),
      diskLimitMB: Number(diskLimitMB) || 5120,
      bandwidthLimitMB: Number(bandwidthLimitMB) || 51200,
      maxDomains: Number(maxDomains) || 1,
      maxSubdomains: 10,
      maxEmails: Number(maxEmails) || 10,
      maxDatabases: Number(maxDatabases) || 5,
      maxFtpAccounts: 5,
      sslAvailable: true,
      backupAvailable: true,
      sshAccess: false,
      dedicatedIp: false,
      features: ['File Manager', 'AutoSSL', 'Email', 'MySQL'],
    };

    db.packages.push(newPkg);
    saveDatabase(db);
    addActivityLog('root', 'whm', 'CREATE_PACKAGE', newPkg.name, req.ip);

    return res.json({ success: true, package: newPkg });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create package' });
  }
});

router.delete('/packages/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  const initial = db.packages.length;
  db.packages = db.packages.filter((p) => p.id !== req.params.id);
  if (db.packages.length === initial) return res.status(404).json({ error: 'Package not found' });
  saveDatabase(db);
  return res.json({ success: true, message: 'Package deleted' });
});

// 9. DNS ZONES & RECORDS
router.get('/dns', (req: Request, res: Response) => {
  const db = getDatabase();
  const { domain } = req.query;
  let records = db.dnsRecords;
  if (domain) {
    records = records.filter((r) => r.domain === domain);
  }
  return res.json({ records, domains: db.domains.map((d) => d.domain) });
});

router.post('/dns', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { domain, name, type, record, ttl = 14400, priority } = req.body || {};
    if (!domain || !name || !type || !record) {
      return res.status(400).json({ error: 'Missing required DNS record parameters' });
    }

    const newRecord: DnsRecord = {
      id: `dns-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      domain,
      name,
      type,
      record,
      ttl: Number(ttl) || 14400,
      priority: priority ? Number(priority) : undefined,
    };

    db.dnsRecords.push(newRecord);
    saveDatabase(db);
    addActivityLog('root', 'whm', 'ADD_DNS_RECORD', `${name}.${domain} (${type})`, req.ip);

    return res.json({ success: true, record: newRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create DNS record' });
  }
});

router.delete('/dns/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  db.dnsRecords = db.dnsRecords.filter((r) => r.id !== req.params.id);
  saveDatabase(db);
  return res.json({ success: true, message: 'DNS record removed' });
});

// 10. SSL/TLS CERTIFICATES
router.get('/ssl', (req: Request, res: Response) => {
  const db = getDatabase();
  return res.json({ certificates: db.sslCertificates });
});

router.post('/ssl/install', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { domain, certificate, privateKey } = req.body || {};
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const existing = db.sslCertificates.find((s) => s.domain === domain);
    if (existing) {
      existing.status = 'valid';
      existing.validTo = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
      existing.issuer = 'Custom Installed Certificate';
    } else {
      db.sslCertificates.push({
        id: `ssl-${Date.now()}`,
        domain,
        accountId: 'acc-custom',
        issuer: 'Custom Certificate',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        status: 'valid',
        autoRenew: false,
        keyType: 'RSA 2048-bit',
      });
    }

    saveDatabase(db);
    addActivityLog('root', 'whm', 'INSTALL_SSL', domain, req.ip);
    return res.json({ success: true, message: `SSL certificate installed for ${domain}.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to install SSL' });
  }
});

// 11. API TOKENS
router.get('/tokens', (req: Request, res: Response) => {
  const db = getDatabase();
  return res.json({ tokens: db.apiTokens });
});

router.post('/tokens', (req: Request, res: Response) => {
  const db = getDatabase();
  const { name, permissions } = req.body || {};
  const tokenStr = `whm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const newToken: ApiToken = {
    id: `tok-${Date.now()}`,
    name: name || 'API Client',
    token: tokenStr,
    permissions: permissions || ['read_accounts', 'create_account'],
    lastUsed: 'Never',
    createdAt: new Date().toISOString(),
  };
  db.apiTokens.push(newToken);
  saveDatabase(db);
  return res.json({ success: true, token: newToken });
});

router.delete('/tokens/:id', (req: Request, res: Response) => {
  const db = getDatabase();
  db.apiTokens = db.apiTokens.filter((t) => t.id !== req.params.id);
  saveDatabase(db);
  return res.json({ success: true, message: 'Token revoked' });
});

export default router;
