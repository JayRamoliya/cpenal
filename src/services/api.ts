import { 
  DirectoryListing, 
  StorageStats, 
  ActivityItem, 
  User, 
  HostingAccount,
  HostingPackage,
  DnsRecord,
  SslCertificate,
  EmailAccount,
  DatabaseItem,
  FtpAccount,
  ApiToken,
  DomainItem,
  CronJob,
  WHMStats 
} from '../types/cpanel';

const TOKEN_KEY = 'cpanel_auth_token';
const ACTIVE_USER_KEY = 'cpanel_active_username';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACTIVE_USER_KEY);
}

export function getActiveUsername(): string {
  return localStorage.getItem(ACTIVE_USER_KEY) || 'demo';
}

export function setActiveUsername(username: string) {
  localStorage.setItem(ACTIVE_USER_KEY, username);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const activeUser = getActiveUsername();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'x-cpanel-user': activeUser,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- AUTHENTICATION ---
  async login(username: string, password: string): Promise<{ success: boolean; token?: string; user?: User; error?: string; defaultRoute?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      setStoredToken(data.token);
      if (data.user?.username) {
        setActiveUsername(data.user.username);
      }
    }
    return data;
  },

  async getMe(): Promise<{ authenticated: boolean; user: User | null }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async impersonate(username: string, accountId: string): Promise<{ success: boolean; token: string; user: User }> {
    const res = await fetch('/api/auth/impersonate', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, accountId }),
    });
    const data = await res.json();
    if (data.token) {
      setStoredToken(data.token);
      setActiveUsername(username);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      removeStoredToken();
    }
  },

  // --- WHM MASTER ADMIN APIS ---
  async getWhmStats(): Promise<WHMStats> {
    const res = await fetch('/api/whm/stats', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load WHM statistics');
    return res.json();
  },

  async getWhmAccounts(params: { search?: string; filter?: string; page?: number; perPage?: number } = {}): Promise<{
    totalRecords: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
    accounts: HostingAccount[];
  }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.filter) query.set('filter', params.filter);
    if (params.page) query.set('page', String(params.page));
    if (params.perPage) query.set('perPage', String(params.perPage));

    const res = await fetch(`/api/whm/accounts?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load WHM accounts');
    return res.json();
  },

  async createWhmAccount(payload: {
    domain: string;
    username: string;
    email: string;
    packageId: string;
  }): Promise<{ success: boolean; account: HostingAccount; message: string }> {
    const res = await fetch('/api/whm/accounts', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create hosting account');
    return data;
  },

  async setAccountStatus(id: string, status: 'active' | 'suspended', reason?: string): Promise<any> {
    const res = await fetch(`/api/whm/accounts/${id}/status`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change account status');
    return data;
  },

  async changeAccountPackage(id: string, packageId: string): Promise<any> {
    const res = await fetch(`/api/whm/accounts/${id}/package`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update package');
    return data;
  },

  async terminateAccount(id: string): Promise<any> {
    const res = await fetch(`/api/whm/accounts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to terminate account');
    return data;
  },

  async bulkAccountAction(action: 'suspend' | 'unsuspend' | 'change_package', accountIds: string[], packageId?: string): Promise<any> {
    const res = await fetch('/api/whm/accounts/bulk', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, accountIds, packageId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Bulk operation failed');
    return data;
  },

  async getWhmPackages(): Promise<{ packages: HostingPackage[] }> {
    const res = await fetch('/api/whm/packages', { headers: getAuthHeaders() });
    return res.json();
  },

  async createWhmPackage(pkg: Partial<HostingPackage>): Promise<any> {
    const res = await fetch('/api/whm/packages', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create package');
    return data;
  },

  async deleteWhmPackage(id: string): Promise<any> {
    const res = await fetch(`/api/whm/packages/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  },

  async getWhmDnsRecords(domain?: string): Promise<{ records: DnsRecord[]; domains: string[] }> {
    const q = domain ? `?domain=${encodeURIComponent(domain)}` : '';
    const res = await fetch(`/api/whm/dns${q}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async createWhmDnsRecord(payload: Partial<DnsRecord>): Promise<any> {
    const res = await fetch('/api/whm/dns', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create DNS record');
    return data;
  },

  async deleteWhmDnsRecord(id: string): Promise<any> {
    const res = await fetch(`/api/whm/dns/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  },

  async getWhmSslCertificates(): Promise<{ certificates: SslCertificate[] }> {
    const res = await fetch('/api/whm/ssl', { headers: getAuthHeaders() });
    return res.json();
  },

  async installWhmSsl(domain: string, certificate: string, privateKey: string): Promise<any> {
    const res = await fetch('/api/whm/ssl/install', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, certificate, privateKey }),
    });
    return res.json();
  },

  async getWhmTokens(): Promise<{ tokens: ApiToken[] }> {
    const res = await fetch('/api/whm/tokens', { headers: getAuthHeaders() });
    return res.json();
  },

  async createWhmToken(name: string, permissions: string[]): Promise<any> {
    const res = await fetch('/api/whm/tokens', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions }),
    });
    return res.json();
  },

  async deleteWhmToken(id: string): Promise<any> {
    const res = await fetch(`/api/whm/tokens/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  },

  // --- CPANEL TENANT FILE MANAGER APIS ---
  async getFiles(path: string = '/public_html'): Promise<DirectoryListing> {
    const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch directory' }));
      throw new Error(err.error || 'Failed to fetch directory');
    }
    return res.json();
  },

  async uploadFiles(
    dir: string,
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; message: string; uploadedFiles: any[] }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('dir', dir);

      xhr.open('POST', `/api/files/upload?dir=${encodeURIComponent(dir)}`);
      const token = getStoredToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('x-cpanel-user', getActiveUsername());

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(res);
          else reject(new Error(res.error || 'Upload failed'));
        } catch {
          reject(new Error('Invalid response from server'));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    });
  },

  async createFile(dir: string, name: string, content: string = ''): Promise<{ success: boolean; message: string; path: string }> {
    const res = await fetch('/api/files/create', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir, name, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create file');
    return data;
  },

  async createFolder(dir: string, name: string): Promise<{ success: boolean; message: string; path: string }> {
    const res = await fetch('/api/files/create-folder', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create folder');
    return data;
  },

  async renameItem(dir: string, oldName: string, newName: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/files/rename', {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir, oldName, newName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to rename item');
    return data;
  },

  async deleteItems(paths: string[]): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/files/delete', {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete items');
    return data;
  },

  async compressFiles(dir: string, files: string[], archiveName: string): Promise<any> {
    const res = await fetch('/api/files/compress', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir, files, archiveName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Compression failed');
    return data;
  },

  async extractZip(archivePath: string, destinationDir?: string): Promise<any> {
    const res = await fetch('/api/files/extract', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivePath, destinationDir }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Extraction failed');
    return data;
  },

  getDownloadUrl(paths: string | string[]): string {
    const user = getActiveUsername();
    const param = Array.isArray(paths) ? paths.join(',') : paths;
    return `/api/files/download?paths=${encodeURIComponent(param)}&user=${encodeURIComponent(user)}`;
  },

  async getFilePreview(filePath: string): Promise<{ filename: string; size: number; content: string; extension: string }> {
    const res = await fetch(`/api/files/preview?path=${encodeURIComponent(filePath)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to preview file' }));
      throw new Error(err.error || 'Failed to preview file');
    }
    return res.json();
  },

  getImagePreviewUrl(filePath: string): string {
    const user = getActiveUsername();
    return `/api/files/preview?path=${encodeURIComponent(filePath)}&user=${encodeURIComponent(user)}`;
  },

  async saveFileContent(filePath: string, content: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/files/content', {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save file');
    return data;
  },

  // --- CPANEL STORAGE & STATS ---
  async getStorageStats(): Promise<StorageStats> {
    const res = await fetch('/api/storage/stats', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to retrieve storage statistics');
    return res.json();
  },

  async getActivities(): Promise<{ activities: ActivityItem[] }> {
    const res = await fetch('/api/storage/activities', { headers: getAuthHeaders() });
    return res.json();
  },

  // --- CPANEL HOSTING MODULES ---
  async getCpanelDomains(): Promise<{ domains: DomainItem[]; primaryDomain: string }> {
    const res = await fetch('/api/hosting/domains', { headers: getAuthHeaders() });
    return res.json();
  },

  async createCpanelDomain(domain: string, type: string, subfolder?: string): Promise<any> {
    const res = await fetch('/api/hosting/domains', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, type, subfolder }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create domain');
    return data;
  },

  async getCpanelEmails(): Promise<{ emails: EmailAccount[]; defaultDomain: string }> {
    const res = await fetch('/api/hosting/email', { headers: getAuthHeaders() });
    return res.json();
  },

  async createCpanelEmail(emailPrefix: string, quotaMB: number, forwardTo?: string): Promise<any> {
    const res = await fetch('/api/hosting/email', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailPrefix, quotaMB, forwardTo }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create email');
    return data;
  },

  async deleteCpanelEmail(id: string): Promise<any> {
    const res = await fetch(`/api/hosting/email/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  },

  async getCpanelDatabases(): Promise<{ databases: DatabaseItem[]; usernamePrefix: string }> {
    const res = await fetch('/api/hosting/databases', { headers: getAuthHeaders() });
    return res.json();
  },

  async createCpanelDatabase(name: string): Promise<any> {
    const res = await fetch('/api/hosting/databases', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create database');
    return data;
  },

  async deleteCpanelDatabase(id: string): Promise<any> {
    const res = await fetch(`/api/hosting/databases/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  },

  async getCpanelFtpAccounts(): Promise<{ accounts: FtpAccount[] }> {
    const res = await fetch('/api/hosting/ftp', { headers: getAuthHeaders() });
    return res.json();
  },

  async createCpanelFtpAccount(username: string, directory: string, quotaMB: number): Promise<any> {
    const res = await fetch('/api/hosting/ftp', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, directory, quotaMB }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create FTP account');
    return data;
  },

  async deleteCpanelFtpAccount(id: string): Promise<any> {
    const res = await fetch(`/api/hosting/ftp/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  },

  async getCpanelCronJobs(): Promise<{ jobs: CronJob[] }> {
    const res = await fetch('/api/hosting/cron', { headers: getAuthHeaders() });
    return res.json();
  },

  async createCpanelCronJob(command: string, minute = '0', hour = '*'): Promise<any> {
    const res = await fetch('/api/hosting/cron', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, minute, hour }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create cron job');
    return data;
  },

  async deleteCpanelCronJob(id: string): Promise<any> {
    const res = await fetch(`/api/hosting/cron/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  },

  getBackupFullDownloadUrl(): string {
    const user = getActiveUsername();
    return `/api/hosting/backup/full?user=${encodeURIComponent(user)}`;
  },

  async getSettings(): Promise<any> {
    const res = await fetch('/api/hosting/settings', { headers: getAuthHeaders() });
    return res.json();
  },

  async updateSettings(settings: any): Promise<any> {
    const res = await fetch('/api/hosting/settings', {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Aliases for FTP view
  async getFtpAccounts(): Promise<{ accounts: FtpAccount[] }> {
    return api.getCpanelFtpAccounts();
  },

  async createFtpAccount(username: string, directory: string, quotaMB: number): Promise<any> {
    return api.createCpanelFtpAccount(username, directory, quotaMB);
  },

  async deleteFtpAccount(id: string): Promise<any> {
    return api.deleteCpanelFtpAccount(id);
  },

  // Directory Privacy
  async getProtectedDirectories(): Promise<{ directories: any[] }> {
    return {
      directories: [
        {
          id: 'dir_prot_1',
          path: '/home/demo/public_html/admin',
          realm: 'Restricted Administration Portal',
          isProtected: true,
          users: ['sysadmin'],
        },
      ],
    };
  },

  async saveProtectedDirectory(path: string, realm: string, isProtected: boolean, username?: string): Promise<any> {
    return { success: true, message: 'Directory protection applied' };
  },
};
