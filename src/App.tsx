import React, { useState, useEffect } from 'react';
import { 
  User, 
  StorageStats, 
  ActivityItem, 
  CPanelTab, 
  WHMTab, 
  WHMStats 
} from './types/cpanel';
import { api, removeStoredToken, setStoredToken, setActiveUsername } from './services/api';
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
import { DomainsManager } from './components/modules/DomainsManager';
import { DatabasesManager } from './components/modules/DatabasesManager';
import { EmailManager } from './components/modules/EmailManager';

// WHM Components
import { WhmLayout } from './components/whm/WhmLayout';
import { WhmDashboard } from './components/whm/WhmDashboard';
import { WhmListAccounts } from './components/whm/WhmListAccounts';
import { WhmCreateAccount } from './components/whm/WhmCreateAccount';
import { WhmPackages } from './components/whm/WhmPackages';
import { WhmDnsManager } from './components/whm/WhmDnsManager';
import { WhmSslManager } from './components/whm/WhmSslManager';
import { WhmApiTokens } from './components/whm/WhmApiTokens';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [viewMode, setViewMode] = useState<'whm' | 'cpanel'>('cpanel');
  const [cpanelTab, setCpanelTab] = useState<CPanelTab>('dashboard');
  const [whmTab, setWhmTab] = useState<WHMTab>('whm_dashboard');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [whmStats, setWhmStats] = useState<WHMStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [rootSessionUser, setRootSessionUser] = useState<User | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await api.getMe();
      if (data.authenticated && data.user) {
        setUser(data.user);
        if (data.user.role === 'superadmin') {
          setViewMode('whm');
          setRootSessionUser(data.user);
          loadWhmMetrics();
        } else {
          setViewMode('cpanel');
          loadCpanelMetrics();
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const loadCpanelMetrics = async () => {
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

  const loadWhmMetrics = async () => {
    try {
      const stats = await api.getWhmStats();
      setWhmStats(stats);
    } catch {
      // silent fallback
    }
  };

  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login(username, pass);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.role === 'superadmin') {
          setViewMode('whm');
          setWhmTab('whm_dashboard');
          setRootSessionUser(res.user);
          loadWhmMetrics();
        } else {
          setViewMode('cpanel');
          setCpanelTab('dashboard');
          setRootSessionUser(null);
          loadCpanelMetrics();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setRootSessionUser(null);
    setViewMode('cpanel');
    setCpanelTab('dashboard');
    setWhmTab('whm_dashboard');
  };

  // WHM Admin impersonation into a customer's cPanel
  const handleImpersonate = async (targetUsername: string, accountId: string) => {
    try {
      if (user?.role === 'superadmin' && !rootSessionUser) {
        setRootSessionUser(user);
      }
      const res = await api.impersonate(targetUsername, accountId);
      if (res.success && res.user) {
        setUser(res.user);
        setViewMode('cpanel');
        setCpanelTab('dashboard');
        await loadCpanelMetrics();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to switch into customer cPanel');
    }
  };

  // Return to WHM Master Node from customer cPanel
  const handleReturnToWhm = async () => {
    try {
      // Log back in as root
      const res = await api.login('root', 'whm123');
      if (res.success && res.user) {
        setUser(res.user);
        setViewMode('whm');
        setWhmTab('whm_dashboard');
        await loadWhmMetrics();
      }
    } catch {
      // fallback
      if (rootSessionUser) {
        setUser(rootSessionUser);
        setViewMode('whm');
        setWhmTab('whm_dashboard');
        loadWhmMetrics();
      }
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070e1c] flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-orange-950/50">
          cP
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="animate-spin text-sky-400">◌</span>
          <span>Initializing cPanel &amp; WHM Infrastructure...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // =========================================================================
  // VIEW MODE: WHM SUPER ADMIN INTERFACE
  // =========================================================================
  if (viewMode === 'whm' && user.role === 'superadmin') {
    return (
      <WhmLayout
        user={user}
        stats={whmStats}
        activeTab={whmTab}
        onTabChange={(tab) => setWhmTab(tab)}
        onLogout={handleLogout}
        onOpenCpanel={() => handleImpersonate('demo', 'acc_demo_01')}
      >
        {whmTab === 'whm_dashboard' && (
          <WhmDashboard
            stats={whmStats}
            onNavigate={(tab) => setWhmTab(tab)}
            onImpersonate={handleImpersonate}
            onRefresh={loadWhmMetrics}
          />
        )}

        {whmTab === 'whm_accounts' && (
          <WhmListAccounts
            onNavigate={(tab) => setWhmTab(tab)}
            onImpersonate={handleImpersonate}
          />
        )}

        {whmTab === 'whm_create_account' && (
          <WhmCreateAccount
            onNavigate={(tab) => setWhmTab(tab)}
            onAccountCreated={() => {
              loadWhmMetrics();
              setWhmTab('whm_accounts');
            }}
          />
        )}

        {whmTab === 'whm_packages' && (
          <WhmPackages />
        )}

        {whmTab === 'whm_dns' && <WhmDnsManager />}

        {whmTab === 'whm_ssl' && <WhmSslManager />}

        {whmTab === 'whm_tokens' && <WhmApiTokens />}
      </WhmLayout>
    );
  }

  // =========================================================================
  // VIEW MODE: INDIVIDUAL CUSTOMER CPANEL INTERFACE
  // =========================================================================
  const canReturnToWhm = Boolean(rootSessionUser) || user.role === 'superadmin';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased">
      {/* Impersonation Alert Banner for Root Administrator */}
      {canReturnToWhm && (
        <div className="bg-amber-500 text-slate-950 px-6 py-2 flex items-center justify-between text-xs font-bold sticky top-0 z-40 shadow-sm font-mono">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950" />
            <span>
              SUPER ADMIN SIMULATING CPANEL SESSION FOR TENANT: <u>{user.username}</u> ({user.primaryDomain})
            </span>
          </div>
          <button
            onClick={handleReturnToWhm}
            className="px-3 py-1 bg-slate-950 text-amber-400 hover:bg-slate-900 rounded font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to WHM Master Node</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Dark Navy Sidebar */}
        <Sidebar
          user={user}
          activeTab={cpanelTab}
          onTabChange={(tab) => setCpanelTab(tab)}
          onLogout={handleLogout}
          onReturnToWhm={canReturnToWhm ? handleReturnToWhm : undefined}
          fileCount={storageStats?.totalFiles || 0}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
          {/* Top Header */}
          <Header
            user={user}
            storageStats={storageStats}
            onLogout={handleLogout}
            onNavigateTab={(tab) => setCpanelTab(tab)}
          />

          {/* Dynamic Module View */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            {cpanelTab === 'dashboard' && (
              <DashboardOverview
                user={user}
                storageStats={storageStats}
                activities={activities}
                onNavigateTab={(tab) => setCpanelTab(tab as CPanelTab)}
                onRefresh={loadCpanelMetrics}
              />
            )}

            {cpanelTab === 'filemanager' && (
              <FileManager
                initialPath={`/home/${user.username}/public_html`}
                onRefreshStorage={loadCpanelMetrics}
              />
            )}

            {cpanelTab === 'domains' && <DomainsManager />}

            {cpanelTab === 'databases' && <DatabasesManager />}

            {cpanelTab === 'email' && <EmailManager />}

            {cpanelTab === 'images' && <ImagesManager />}

            {cpanelTab === 'diskusage' && (
              <DiskUsageView
                storageStats={storageStats}
                onRefresh={loadCpanelMetrics}
                onNavigateTab={(tab) => setCpanelTab(tab as CPanelTab)}
              />
            )}

            {cpanelTab === 'ftp' && <FtpAccountsView />}

            {cpanelTab === 'backup' && <BackupManager />}

            {cpanelTab === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
    </div>
  );
}
