export type UserRole = 'superadmin' | 'reseller' | 'customer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  primaryDomain: string;
  serverIp: string;
  homeDir: string;
  cpanelVersion: string;
  packageId?: string;
  packageName?: string;
  accountId?: string;
  status?: string;
}

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

export interface CronJob {
  id: string;
  accountId: string;
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
  command: string;
  createdAt: string;
}

export interface FileItem {
  name: string;
  displayPath: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
  permissions: string;
  extension: string;
  category: 'folder' | 'image' | 'code' | 'archive' | 'text' | 'document' | 'other';
}

export interface DirectoryListing {
  user: string;
  currentPath: string;
  parentPath: string | null;
  totalItems: number;
  items: FileItem[];
}

export interface StorageBreakdownItem {
  name: string;
  path: string;
  bytes: number;
  formatted: string;
  files: number;
  folders: number;
}

export interface StorageStats {
  username: string;
  totalQuotaBytes: number;
  totalQuotaFormatted: string;
  usedBytes: number;
  usedFormatted: string;
  availableBytes: number;
  availableFormatted: string;
  percentageUsed: number;
  totalFiles: number;
  totalFolders: number;
  dbCount: number;
  emailCount: number;
  ftpCount: number;
  domainCount: number;
  bandwidthUsedFormatted: string;
  bandwidthLimitFormatted: string;
  breakdown: StorageBreakdownItem[];
  serverDetails: {
    domain: string;
    ip: string;
    cpanelVersion: string;
    phpVersion: string;
    webServer: string;
    sslStatus: string;
    dbEngine: string;
    inodesUsed: number;
    inodesTotal: number;
  };
}

export interface HostingSettings {
  phpVersion: string;
  displayErrors: boolean;
  uploadMaxFilesize: string;
  maxExecutionTime: string;
  memoryLimit: string;
  timezone: string;
  contactEmail: string;
}

export interface ProtectedDirectory {
  id: string;
  path?: string;
  directory?: string;
  realm?: string;
  realmName?: string;
  isProtected?: boolean;
  users?: string[];
  authorizedUsers?: string[];
}

export interface ActivityItem {
  id: string;
  user: string;
  panel: 'whm' | 'cpanel';
  action: string;
  type?: string;
  target: string;
  ip: string;
  timestamp: string;
  details?: string;
}

export interface WHMStats {
  totalAccounts: number;
  activeAccounts: number;
  suspendedAccounts: number;
  totalResellers: number;
  totalPackages: number;
  totalDomains: number;
  diskUsageMB: number;
  diskUsageFormatted: string;
  totalDiskAllocatedMB: number;
  serverResources: {
    cpuUsage: number;
    ramUsageMB: number;
    ramTotalMB: number;
    ramPercentage: number;
    loadAverage: number[];
    uptime: string;
    activeServices: { name: string; status: string; port: number }[];
  };
  recentAccounts: HostingAccount[];
  recentActivities: ActivityItem[];
}

export type WHMTab =
  | 'whm_dashboard'
  | 'whm_accounts'
  | 'whm_create_account'
  | 'whm_packages'
  | 'whm_bulk'
  | 'whm_dns'
  | 'whm_ssl'
  | 'whm_email'
  | 'whm_backups'
  | 'whm_tokens'
  | 'whm_server';

export type CPanelTab =
  | 'dashboard'
  | 'filemanager'
  | 'images'
  | 'domains'
  | 'email'
  | 'databases'
  | 'ssl'
  | 'ftp'
  | 'diskusage'
  | 'backup'
  | 'settings';

export type ActiveTab = CPanelTab | WHMTab;

