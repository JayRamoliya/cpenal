export interface User {
  id: string;
  username: string;
  email: string;
  primaryDomain: string;
  serverIp: string;
  homeDir: string;
  cpanelVersion: string;
  role: string;
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
  totalQuotaBytes: number;
  totalQuotaFormatted: string;
  usedBytes: number;
  usedFormatted: string;
  availableBytes: number;
  availableFormatted: string;
  percentageUsed: number;
  totalFiles: number;
  totalFolders: number;
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

export interface ActivityItem {
  id: string;
  type: 'upload' | 'create_file' | 'create_folder' | 'rename' | 'delete' | 'edit';
  target: string;
  timestamp: string;
  details?: string;
}

export interface FtpAccount {
  id: string;
  username: string;
  domain: string;
  directory: string;
  quotaMB: number;
  created: string;
}

export interface ProtectedDirectory {
  id: string;
  directory: string;
  realmName: string;
  isProtected: boolean;
  authorizedUsers: string[];
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

export type ActiveTab = 
  | 'dashboard'
  | 'filemanager'
  | 'images'
  | 'diskusage'
  | 'ftp'
  | 'privacy'
  | 'backup'
  | 'settings';
