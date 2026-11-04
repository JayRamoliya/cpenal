import fs from 'fs';
import path from 'path';

export const SYSTEM_DIR = path.resolve(process.cwd(), 'cpanel_storage', 'system');
export const DB_FILE = path.join(SYSTEM_DIR, 'database.json');

export interface HostingPackage {
  id: string;
  name: string;
  diskLimitMB: number;
  bandwidthLimitMB: number;
  maxDomains: number;
  maxSubdomains: number;
  maxEmails: number;
  maxDatabases: number;
  maxFtpAccounts: number;
  sslAvailable: boolean;
  backupAvailable: boolean;
  sshAccess: boolean;
  dedicatedIp: boolean;
  features: string[];
}

export interface HostingAccount {
  id: string;
  domain: string;
  username: string;
  email: string;
  packageId: string;
  packageName: string;
  owner: string;
  ip: string;
  status: 'active' | 'suspended';
  suspendReason?: string;
  diskLimitMB: number;
  diskUsedMB: number;
  bandwidthLimitMB: number;
  bandwidthUsedMB: number;
  phpVersion: string;
  createdAt: string;
}

export interface DomainItem {
  id: string;
  accountId: string;
  domain: string;
  type: 'primary' | 'addon' | 'subdomain' | 'alias';
  documentRoot: string;
  sslStatus: 'active' | 'pending' | 'expired';
  createdAt: string;
}

export interface DnsRecord {
  id: string;
  domain: string;
  name: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA';
  record: string;
  ttl: number;
  priority?: number;
}

export interface SslCertificate {
  id: string;
  domain: string;
  accountId: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  status: 'valid' | 'expiring' | 'expired';
  autoRenew: boolean;
  keyType: string;
}

export interface EmailAccount {
  id: string;
  accountId: string;
  email: string;
  quotaMB: number;
  usedMB: number;
  forwardTo?: string;
  autoresponderEnabled: boolean;
  autoresponderSubject?: string;
  autoresponderBody?: string;
  createdAt: string;
}

export interface DatabaseItem {
  id: string;
  accountId: string;
  name: string;
  sizeMB: number;
  charset: string;
  tablesCount: number;
  users: { username: string; privileges: string[] }[];
}

export interface FtpAccount {
  id: string;
  accountId: string;
  username: string;
  directory: string;
  quotaMB: number;
  createdAt: string;
}

export interface BackupItem {
  id: string;
  accountId: string;
  domain: string;
  filename: string;
  sizeMB: number;
  type: 'full' | 'homedir' | 'database' | 'email';
  createdAt: string;
}

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  lastUsed: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  accountId?: string;
  user: string;
  panel: 'whm' | 'cpanel';
  action: string;
  target: string;
  ip: string;
  timestamp: string;
  details?: string;
}

export interface CronJob {
  id: string;
  accountId: string;
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
  command: string;
}

export interface SystemDatabase {
  packages: HostingPackage[];
  accounts: HostingAccount[];
  domains: DomainItem[];
  dnsRecords: DnsRecord[];
  sslCertificates: SslCertificate[];
  emailAccounts: EmailAccount[];
  databases: DatabaseItem[];
  ftpAccounts: FtpAccount[];
  backups: BackupItem[];
  apiTokens: ApiToken[];
  activityLogs: ActivityLog[];
  cronJobs: CronJob[];
}

// Default seed data
const initialDb: SystemDatabase = {
  packages: [
    {
      id: 'pkg-startup',
      name: 'Startup Tier',
      diskLimitMB: 2048,
      bandwidthLimitMB: 25600,
      maxDomains: 1,
      maxSubdomains: 3,
      maxEmails: 5,
      maxDatabases: 2,
      maxFtpAccounts: 2,
      sslAvailable: true,
      backupAvailable: true,
      sshAccess: false,
      dedicatedIp: false,
      features: ['File Manager', 'AutoSSL', 'Email Webmail', 'MySQL MariaDB'],
    },
    {
      id: 'pkg-pro',
      name: 'Professional Pro',
      diskLimitMB: 10240,
      bandwidthLimitMB: 102400,
      maxDomains: 5,
      maxSubdomains: 15,
      maxEmails: 25,
      maxDatabases: 10,
      maxFtpAccounts: 10,
      sslAvailable: true,
      backupAvailable: true,
      sshAccess: true,
      dedicatedIp: false,
      features: ['File Manager', 'AutoSSL', 'Git Control', 'Cron Jobs', 'MultiPHP', 'phpMyAdmin'],
    },
    {
      id: 'pkg-enterprise',
      name: 'Enterprise Cloud',
      diskLimitMB: 51200,
      bandwidthLimitMB: 512000,
      maxDomains: 25,
      maxSubdomains: 100,
      maxEmails: 100,
      maxDatabases: 50,
      maxFtpAccounts: 50,
      sslAvailable: true,
      backupAvailable: true,
      sshAccess: true,
      dedicatedIp: true,
      features: ['All Features', 'Dedicated IP', 'Priority IOPS', 'Hourly Backups', 'Terminal Access'],
    },
  ],
  accounts: [
    {
      id: 'acc-demo',
      domain: 'demo-site.com',
      username: 'demo',
      email: 'webmaster@demo-site.com',
      packageId: 'pkg-pro',
      packageName: 'Professional Pro',
      owner: 'root',
      ip: '192.168.1.104',
      status: 'active',
      diskLimitMB: 10240,
      diskUsedMB: 18.5,
      bandwidthLimitMB: 102400,
      bandwidthUsedMB: 420.8,
      phpVersion: '8.3.6',
      createdAt: '2026-10-15T12:00:00Z',
    },
    {
      id: 'acc-acme',
      domain: 'acmecorp.net',
      username: 'acme',
      email: 'admin@acmecorp.net',
      packageId: 'pkg-enterprise',
      packageName: 'Enterprise Cloud',
      owner: 'root',
      ip: '192.168.1.108',
      status: 'active',
      diskLimitMB: 51200,
      diskUsedMB: 45.2,
      bandwidthLimitMB: 512000,
      bandwidthUsedMB: 1250.0,
      phpVersion: '8.3.6',
      createdAt: '2026-10-20T08:30:00Z',
    },
  ],
  domains: [
    {
      id: 'dom-1',
      accountId: 'acc-demo',
      domain: 'demo-site.com',
      type: 'primary',
      documentRoot: '/home/demo/public_html',
      sslStatus: 'active',
      createdAt: '2026-10-15T12:00:00Z',
    },
    {
      id: 'dom-2',
      accountId: 'acc-demo',
      domain: 'api.demo-site.com',
      type: 'subdomain',
      documentRoot: '/home/demo/public_html/api',
      sslStatus: 'active',
      createdAt: '2026-10-18T14:20:00Z',
    },
    {
      id: 'dom-3',
      accountId: 'acc-acme',
      domain: 'acmecorp.net',
      type: 'primary',
      documentRoot: '/home/acme/public_html',
      sslStatus: 'active',
      createdAt: '2026-10-20T08:30:00Z',
    },
  ],
  dnsRecords: [
    { id: 'dns-1', domain: 'demo-site.com', name: '@', type: 'A', record: '192.168.1.104', ttl: 14400 },
    { id: 'dns-2', domain: 'demo-site.com', name: 'www', type: 'CNAME', record: 'demo-site.com', ttl: 14400 },
    { id: 'dns-3', domain: 'demo-site.com', name: 'mail', type: 'A', record: '192.168.1.104', ttl: 14400 },
    { id: 'dns-4', domain: 'demo-site.com', name: '@', type: 'MX', record: 'mail.demo-site.com', ttl: 14400, priority: 10 },
    { id: 'dns-5', domain: 'demo-site.com', name: '@', type: 'TXT', record: 'v=spf1 +a +mx ~all', ttl: 14400 },
    { id: 'dns-6', domain: 'acmecorp.net', name: '@', type: 'A', record: '192.168.1.108', ttl: 14400 },
    { id: 'dns-7', domain: 'acmecorp.net', name: 'www', type: 'CNAME', record: 'acmecorp.net', ttl: 14400 },
  ],
  sslCertificates: [
    {
      id: 'ssl-1',
      domain: 'demo-site.com',
      accountId: 'acc-demo',
      issuer: "cPanel AutoSSL (Let's Encrypt)",
      validFrom: '2026-10-01',
      validTo: '2027-01-01',
      status: 'valid',
      autoRenew: true,
      keyType: 'RSA 2048-bit',
    },
    {
      id: 'ssl-2',
      domain: 'api.demo-site.com',
      accountId: 'acc-demo',
      issuer: "cPanel AutoSSL (Let's Encrypt)",
      validFrom: '2026-10-18',
      validTo: '2027-01-18',
      status: 'valid',
      autoRenew: true,
      keyType: 'ECDSA 256-bit',
    },
    {
      id: 'ssl-3',
      domain: 'acmecorp.net',
      accountId: 'acc-acme',
      issuer: "Sectigo Commercial PositiveSSL",
      validFrom: '2026-10-20',
      validTo: '2027-10-20',
      status: 'valid',
      autoRenew: true,
      keyType: 'RSA 4096-bit',
    },
  ],
  emailAccounts: [
    {
      id: 'mail-1',
      accountId: 'acc-demo',
      email: 'admin@demo-site.com',
      quotaMB: 1024,
      usedMB: 48.2,
      autoresponderEnabled: false,
      createdAt: '2026-10-15',
    },
    {
      id: 'mail-2',
      accountId: 'acc-demo',
      email: 'support@demo-site.com',
      quotaMB: 2048,
      usedMB: 112.5,
      forwardTo: 'helpdesk@demo-site.com',
      autoresponderEnabled: true,
      autoresponderSubject: 'Thank you for contacting Demo Site Support',
      autoresponderBody: 'We have received your ticket and our engineering team will respond within 2 business hours.',
      createdAt: '2026-10-16',
    },
    {
      id: 'mail-3',
      accountId: 'acc-acme',
      email: 'contact@acmecorp.net',
      quotaMB: 5120,
      usedMB: 280.0,
      autoresponderEnabled: false,
      createdAt: '2026-10-20',
    },
  ],
  databases: [
    {
      id: 'db-1',
      accountId: 'acc-demo',
      name: 'demo_store',
      sizeMB: 12.4,
      charset: 'utf8mb4_unicode_ci',
      tablesCount: 18,
      users: [{ username: 'demo_app', privileges: ['ALL PRIVILEGES'] }],
    },
    {
      id: 'db-2',
      accountId: 'acc-demo',
      name: 'demo_analytics',
      sizeMB: 6.1,
      charset: 'utf8mb4_unicode_ci',
      tablesCount: 8,
      users: [{ username: 'demo_ro', privileges: ['SELECT', 'SHOW VIEW'] }],
    },
    {
      id: 'db-3',
      accountId: 'acc-acme',
      name: 'acme_portal',
      sizeMB: 34.8,
      charset: 'utf8mb4_unicode_ci',
      tablesCount: 42,
      users: [{ username: 'acme_master', privileges: ['ALL PRIVILEGES'] }],
    },
  ],
  ftpAccounts: [
    {
      id: 'ftp-1',
      accountId: 'acc-demo',
      username: 'deploy',
      directory: '/home/demo/public_html',
      quotaMB: 2048,
      createdAt: '2026-10-15',
    },
    {
      id: 'ftp-2',
      accountId: 'acc-acme',
      username: 'ci_runner',
      directory: '/home/acme/public_html',
      quotaMB: 10240,
      createdAt: '2026-10-20',
    },
  ],
  backups: [
    {
      id: 'bk-1',
      accountId: 'acc-demo',
      domain: 'demo-site.com',
      filename: 'backup-demo-site-2026-11-01.zip',
      sizeMB: 24.2,
      type: 'full',
      createdAt: '2026-11-01T03:00:00Z',
    },
  ],
  apiTokens: [
    {
      id: 'tok-1',
      name: 'WHMCS Automation Billing',
      token: 'whm_token_live_99a8b7c6d5e4f3a2b1',
      permissions: ['create_account', 'suspend_account', 'terminate_account', 'modify_package'],
      lastUsed: '2026-11-03T18:45:00Z',
      createdAt: '2026-10-01T00:00:00Z',
    },
  ],
  activityLogs: [
    {
      id: 'log-1',
      user: 'root',
      panel: 'whm',
      action: 'SYSTEM_BOOT',
      target: 'WHM & cPanel Multi-Tenant Service',
      ip: '127.0.0.1',
      timestamp: '2026-11-03T20:00:00Z',
      details: 'All hosting services, Apache HTTP, and MariaDB operational',
    },
    {
      id: 'log-2',
      accountId: 'acc-demo',
      user: 'root',
      panel: 'whm',
      action: 'ACCOUNT_PROVISION',
      target: 'demo-site.com',
      ip: '192.168.1.104',
      timestamp: '2026-11-03T20:30:00Z',
      details: 'AutoSSL provisioned, initial public_html sandbox created',
    },
  ],
  cronJobs: [
    {
      id: 'cron-1',
      accountId: 'acc-demo',
      minute: '0',
      hour: '3',
      day: '*',
      month: '*',
      weekday: '*',
      command: '/usr/local/bin/php /home/demo/public_html/cron.php > /dev/null 2>&1',
    },
  ],
};

let inMemoryDb: SystemDatabase | null = null;

export function getDatabase(): SystemDatabase {
  if (inMemoryDb) return inMemoryDb;

  if (!fs.existsSync(SYSTEM_DIR)) {
    fs.mkdirSync(SYSTEM_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(data);
      return inMemoryDb!;
    } catch {
      // fallback to seed
    }
  }

  inMemoryDb = JSON.parse(JSON.stringify(initialDb));
  saveDatabase(inMemoryDb!);
  return inMemoryDb!;
}

export function saveDatabase(db: SystemDatabase) {
  inMemoryDb = db;
  if (!fs.existsSync(SYSTEM_DIR)) {
    fs.mkdirSync(SYSTEM_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function addActivityLog(
  user: string,
  panel: 'whm' | 'cpanel',
  action: string,
  target: string,
  ip: string = '127.0.0.1',
  accountId?: string,
  details?: string
) {
  const db = getDatabase();
  const item: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user,
    panel,
    action,
    target,
    ip,
    accountId,
    timestamp: new Date().toISOString(),
    details,
  };
  db.activityLogs.unshift(item);
  if (db.activityLogs.length > 200) db.activityLogs.pop();
  saveDatabase(db);
}
