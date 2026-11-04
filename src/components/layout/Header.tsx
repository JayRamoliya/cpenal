import React from 'react';
import { 
  Server, 
  ShieldCheck, 
  LogOut, 
  Search, 
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { User, StorageStats } from '../../types/cpanel';

interface HeaderProps {
  user: User | null;
  storageStats: StorageStats | null;
  onLogout: () => void;
  onNavigateTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  storageStats, 
  onLogout,
  onNavigateTab 
}) => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between gap-6 sticky top-0 z-30 shadow-xs">
      {/* Left: Brand Identity & Current Host Domain */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
            cP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">cPanel</span>
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">v118</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs text-slate-600">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-800">{user?.primaryDomain || 'demo-site.com'}</span>
          <span className="text-slate-300">·</span>
          <span className="font-mono text-slate-500">{user?.serverIp || '192.168.1.104'}</span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            AutoSSL Active
          </span>
        </div>
      </div>

      {/* Middle: Search bar for cPanel tools */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search tools, files, settings (e.g. File Manager, FTP, SSL)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = e.currentTarget.value.toLowerCase();
                if (q.includes('file')) onNavigateTab('filemanager');
                else if (q.includes('image')) onNavigateTab('images');
                else if (q.includes('disk') || q.includes('storage')) onNavigateTab('diskusage');
                else if (q.includes('ftp')) onNavigateTab('ftp');
                else if (q.includes('backup')) onNavigateTab('backup');
                else if (q.includes('privacy') || q.includes('protect')) onNavigateTab('privacy');
                else if (q.includes('setting') || q.includes('php')) onNavigateTab('settings');
              }
            }}
          />
        </div>
      </div>

      {/* Right: Quick storage info & User Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {storageStats && (
          <div 
            onClick={() => onNavigateTab('diskusage')}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 cursor-pointer transition-colors text-xs text-slate-600"
            title="Click to view full Disk Usage breakdown"
          >
            <HardDrive className="w-3.5 h-3.5 text-sky-600" />
            <div className="flex flex-col">
              <span className="font-mono font-medium text-slate-800 tabular-nums">
                {storageStats.usedFormatted} / {storageStats.totalQuotaFormatted}
              </span>
            </div>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${storageStats.percentageUsed > 85 ? 'bg-rose-500' : 'bg-sky-500'}`} 
                style={{ width: `${Math.max(4, storageStats.percentageUsed)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold uppercase">
              {user?.username ? user.username.slice(0, 2) : 'DM'}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.username || 'demo'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {user?.role || 'Account Owner'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log Out of cPanel"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 flex items-center gap-1 text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
