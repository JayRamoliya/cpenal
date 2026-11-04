import React, { useState, useEffect } from 'react';
import { User, StorageStats, ActivityItem, ActiveTab } from './types/cpanel';
import { api, removeStoredToken } from './services/api';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { FileManager } from './components/filemanager/FileManager';
import { ImagesManager } from './components/modules/ImagesManager';
import { DiskUsageView } from './components/modules/DiskUsageView';
import { FtpAccountsView } from './components/modules/FtpAccountsView';
import { DirectoryPrivacyView } from './components/modules/DirectoryPrivacyView';
import { BackupManager } from './components/modules/BackupManager';
import { SettingsView } from './components/modules/SettingsView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await api.getMe();
      if (data.authenticated && data.user) {
        setUser(data.user);
        loadMetrics();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const [stats, acts] = await Promise.all([
        api.getStorageStats().catch(() => null),
        api.getActivities().catch(() => ({ activities: [] })),
      ]);
      if (stats) setStorageStats(stats);
      if (acts?.activities) setActivities(acts.activities);
    } catch {
      // silent fallback
    }
  };

  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    const res = await api.login(username, pass);
    if (res.success && res.user) {
      setUser(res.user);
      loadMetrics();
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070e1c] flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-orange-950/50">
          cP
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="animate-spin text-sky-400">◌</span>
          <span>Initializing cPanel Environment...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row antialiased">
      {/* Dark Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        fileCount={storageStats?.totalFiles || 0}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          user={user}
          storageStats={storageStats}
          onLogout={handleLogout}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              user={user}
              storageStats={storageStats}
              activities={activities}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefresh={loadMetrics}
            />
          )}

          {activeTab === 'filemanager' && (
            <FileManager
              initialPath="/home/demo/public_html"
              onRefreshStorage={loadMetrics}
            />
          )}

          {activeTab === 'images' && <ImagesManager />}

          {activeTab === 'diskusage' && (
            <DiskUsageView
              storageStats={storageStats}
              onRefresh={loadMetrics}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'ftp' && <FtpAccountsView />}

          {activeTab === 'privacy' && <DirectoryPrivacyView />}

          {activeTab === 'backup' && <BackupManager />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
