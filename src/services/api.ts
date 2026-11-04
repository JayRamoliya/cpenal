import { 
  DirectoryListing, 
  StorageStats, 
  ActivityItem, 
  User, 
  FtpAccount, 
  ProtectedDirectory, 
  HostingSettings 
} from '../types/cpanel';

const TOKEN_KEY = 'cpanel_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(username: string, password: string):Promise<{ success: boolean; token?: string; user?: User; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.token) {
      setStoredToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<{ authenticated: boolean; user: User | null }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    return res.json();
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

  // Files
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

      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('dir', dir);

      xhr.open('POST', `/api/files/upload?dir=${encodeURIComponent(dir)}`);

      const token = getStoredToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res);
          } else {
            reject(new Error(res.error || 'Upload failed'));
          }
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

  getDownloadUrl(paths: string | string[]): string {
    const param = Array.isArray(paths) ? paths.join(',') : paths;
    return `/api/files/download?paths=${encodeURIComponent(param)}`;
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
    return `/api/files/preview?path=${encodeURIComponent(filePath)}`;
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

  // Storage & Stats
  async getStorageStats(): Promise<StorageStats> {
    const res = await fetch('/api/storage/stats', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retrieve storage statistics');
    return res.json();
  },

  async getActivities(): Promise<{ activities: ActivityItem[] }> {
    const res = await fetch('/api/storage/activities', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load recent activities');
    return res.json();
  },

  // Hosting Modules
  async getFtpAccounts(): Promise<{ accounts: FtpAccount[] }> {
    const res = await fetch('/api/hosting/ftp', { headers: getAuthHeaders() });
    return res.json();
  },

  async createFtpAccount(username: string, directory: string, quotaMB: number): Promise<{ success: boolean; account: FtpAccount }> {
    const res = await fetch('/api/hosting/ftp', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, directory, quotaMB }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create FTP account');
    return data;
  },

  async deleteFtpAccount(id: string): Promise<void> {
    const res = await fetch(`/api/hosting/ftp/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove FTP account');
  },

  async getProtectedDirectories(): Promise<{ directories: ProtectedDirectory[] }> {
    const res = await fetch('/api/hosting/privacy', { headers: getAuthHeaders() });
    return res.json();
  },

  async saveProtectedDirectory(directory: string, realmName: string, isProtected: boolean, user?: string): Promise<any> {
    const res = await fetch('/api/hosting/privacy', {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ directory, realmName, isProtected, user }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update directory protection');
    return data;
  },

  getBackupFullDownloadUrl(): string {
    return '/api/hosting/backup/full';
  },

  async getSettings(): Promise<{ settings: HostingSettings }> {
    const res = await fetch('/api/hosting/settings', { headers: getAuthHeaders() });
    return res.json();
  },

  async updateSettings(settings: Partial<HostingSettings>): Promise<{ success: boolean; settings: HostingSettings }> {
    const res = await fetch('/api/hosting/settings', {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    return data;
  },
};
