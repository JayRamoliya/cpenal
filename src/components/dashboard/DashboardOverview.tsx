import React from 'react';
import { 
  FolderTree, 
  HardDrive, 
  FileText, 
  Folder, 
  Server, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Upload, 
  Plus, 
  Archive, 
  KeyRound, 
  Lock, 
  Database,
  Globe,
  Clock,
  Layers,
  Sparkles,
  Mail
} from 'lucide-react';
import { StorageStats, ActivityItem, User, ActiveTab } from '../../types/cpanel';

interface DashboardOverviewProps {
  user: User | null;
  storageStats: StorageStats | null;
  activities: ActivityItem[];
  onNavigateTab: (tab: ActiveTab) => void;
  onRefresh: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  storageStats,
  activities,
  onNavigateTab,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-semibold">
              cPanel Hosting Management
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Services Operational
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Welcome to cPanel, {user?.username || 'demo'}!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your domain files, uploads, storage quotas, and web application configs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('filemanager')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sky-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FolderTree className="w-4 h-4" />
            <span>Launch File Manager</span>
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* 4 Storage & Quota KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Storage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Storage Quota
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {storageStats?.totalQuotaFormatted || '5.00 GB'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Allocated SSD High-Speed Tier
            </p>
          </div>
        </div>

        {/* Card 2: Used Storage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Used Storage
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {storageStats?.usedFormatted || '0 B'}
            </div>
            <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  (storageStats?.percentageUsed || 0) > 85 ? 'bg-rose-500' : 'bg-sky-500'
                }`}
                style={{ width: `${Math.max(3, storageStats?.percentageUsed || 0)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 font-mono tabular-nums">
              {storageStats?.percentageUsed || 0}% of quota used
            </p>
          </div>
        </div>

        {/* Card 3: Total Files */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Files
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {storageStats?.totalFiles ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active web assets &amp; documents
            </p>
          </div>
        </div>

        {/* Card 4: Total Folders */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Directories
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {storageStats?.totalFolders ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Includes public_html, mail, logs
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: General Information & Core cPanel Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Applications Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Applications Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Popular Tools &amp; Web Hosting Modules
                </h3>
                <p className="text-xs text-slate-500">
                  Manage website assets, user permissions, and directory structures
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Tool 1: File Manager */}
              <button
                onClick={() => onNavigateTab('filemanager')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-sky-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  File Manager
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Browse, upload &amp; edit website files
                </div>
              </button>

              {/* Tool 2: Disk Usage */}
              <button
                onClick={() => onNavigateTab('diskusage')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  Disk Usage
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Folder breakdown &amp; quota graphs
                </div>
              </button>

              {/* Tool 3: Domains & Addons */}
              <button
                onClick={() => onNavigateTab('domains')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  Domains &amp; Addons
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Subdomains, aliases &amp; document roots
                </div>
              </button>

              {/* Tool 4: MySQL Databases */}
              <button
                onClick={() => onNavigateTab('databases')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  MySQL Databases
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  phpMyAdmin console &amp; schemas
                </div>
              </button>

              {/* Tool 5: Email Accounts */}
              <button
                onClick={() => onNavigateTab('email')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  Email Accounts
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Roundcube webmail &amp; forwarders
                </div>
              </button>

              {/* Tool 6: Images & Media */}
              <button
                onClick={() => onNavigateTab('images')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  Images
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Web media gallery &amp; asset scaler
                </div>
              </button>

              {/* Tool 7: FTP Accounts */}
              <button
                onClick={() => onNavigateTab('ftp')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Server className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  FTP Accounts
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Secure upload credentials &amp; paths
                </div>
              </button>

              {/* Tool 8: Backup Wizard */}
              <button
                onClick={() => onNavigateTab('backup')}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Archive className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-900 group-hover:text-sky-700">
                  Backup Wizard
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Download full home archive .zip
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent File Operations</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Live Audit Log</span>
            </div>

            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent operations recorded yet. Upload or create files in File Manager.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        (act.type || act.action).toLowerCase().includes('upload') ? 'bg-emerald-50 text-emerald-700' :
                        (act.type || act.action).toLowerCase().includes('create') ? 'bg-sky-50 text-sky-700' :
                        (act.type || act.action).toLowerCase().includes('rename') ? 'bg-amber-50 text-amber-700' :
                        (act.type || act.action).toLowerCase().includes('edit') ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {act.type ? act.type.replace('_', ' ') : act.action}
                      </span>
                      <span className="font-mono text-slate-800 truncate max-w-xs md:max-w-md">
                        {act.target}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono shrink-0">
                      {act.details && <span className="hidden sm:inline text-slate-500">{act.details}</span>}
                      <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account Overview Sidebar (Classic cPanel Right Rail) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-4 pb-2 border-b border-slate-100">
              General Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Current User</span>
                <span className="font-semibold text-slate-800 font-mono">{user?.username || 'demo'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Primary Domain</span>
                <a 
                  href="#preview" 
                  onClick={(e) => { e.preventDefault(); onNavigateTab('filemanager'); }}
                  className="font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 font-mono"
                >
                  {user?.primaryDomain || 'demo-site.com'}
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Shared IP Address</span>
                <span className="font-mono text-slate-700">{user?.serverIp || '192.168.1.104'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Home Directory</span>
                <span className="font-mono text-slate-700">{user?.homeDir || '/home/demo'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">cPanel &amp; WHM Version</span>
                <span className="font-mono text-slate-700">{user?.cpanelVersion || '118.0.12'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">PHP Version</span>
                <span className="font-mono text-slate-700">{storageStats?.serverDetails.phpVersion || '8.3.6'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Web Server</span>
                <span className="font-mono text-slate-700">{storageStats?.serverDetails.webServer || 'Apache/2.4.58'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">SSL Status</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AutoSSL Valid &amp; Active
                </span>
              </div>
            </div>
          </div>

          {/* Inodes & Resource Stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-4 pb-2 border-b border-slate-100">
              Account Statistics
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Disk Usage</span>
                  <span className="font-mono tabular-nums">{storageStats?.usedFormatted || '0 B'} / 5.0 GB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-sky-600 h-full rounded-full"
                    style={{ width: `${Math.max(4, storageStats?.percentageUsed || 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>File Count (Inodes)</span>
                  <span className="font-mono tabular-nums">
                    {(storageStats?.totalFiles ?? 0) + (storageStats?.totalFolders ?? 0)} / 250,000
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>MySQL Databases</span>
                  <span className="font-mono tabular-nums">1 / 10</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
