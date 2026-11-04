import React from 'react';
import { 
  Server, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Layers, 
  Globe, 
  Lock, 
  KeyRound, 
  LogOut, 
  Search, 
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  HardDrive,
  Cpu
} from 'lucide-react';
import { User, WHMStats, WHMTab } from '../../types/cpanel';

interface WhmLayoutProps {
  user: User | null;
  stats: WHMStats | null;
  activeTab: WHMTab;
  onTabChange: (tab: WHMTab) => void;
  onLogout: () => void;
  onOpenCpanel: () => void;
  children: React.ReactNode;
}

export const WhmLayout: React.FC<WhmLayoutProps> = ({
  user,
  stats,
  activeTab,
  onTabChange,
  onLogout,
  onOpenCpanel,
  children,
}) => {
  const navSections = [
    {
      title: 'SERVER OVERVIEW',
      items: [
        { id: 'whm_dashboard' as WHMTab, label: 'WHM Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'ACCOUNT FUNCTIONS',
      items: [
        { id: 'whm_accounts' as WHMTab, label: 'List Accounts', icon: Users, badge: stats?.totalAccounts },
        { id: 'whm_create_account' as WHMTab, label: 'Create New Account', icon: UserPlus },
      ],
    },
    {
      title: 'PACKAGES & QUOTAS',
      items: [
        { id: 'whm_packages' as WHMTab, label: 'Packages Manager', icon: Layers, badge: stats?.totalPackages },
      ],
    },
    {
      title: 'DNS & DOMAINS',
      items: [
        { id: 'whm_dns' as WHMTab, label: 'DNS Zone Manager', icon: Globe, badge: stats?.totalDomains },
      ],
    },
    {
      title: 'SECURITY & SSL',
      items: [
        { id: 'whm_ssl' as WHMTab, label: 'Manage SSL Hosts', icon: Lock },
      ],
    },
    {
      title: 'INTEGRATIONS',
      items: [
        { id: 'whm_tokens' as WHMTab, label: 'Manage API Tokens', icon: KeyRound },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* WHM Dark Navy & Gold Sidebar */}
      <aside className="w-64 bg-[#091122] border-r border-slate-800 flex flex-col shrink-0 min-h-screen select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              WHM
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                WebHost Manager
              </h1>
              <p className="text-[10px] text-amber-400 font-mono mt-0.5 font-bold uppercase">
                Master Node v118
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined ? (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-amber-600 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Server Hardware Load Meter Box */}
        <div className="p-3 m-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" />
              CPU Load:
            </span>
            <span className="text-emerald-400 font-bold">{stats?.serverResources.cpuUsage ?? 12}%</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-sky-400" />
              RAM Usage:
            </span>
            <span className="text-sky-400 font-bold">{stats?.serverResources.ramPercentage ?? 24}%</span>
          </div>
        </div>

        {/* Direct cPanel Launcher for Admin */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={onOpenCpanel}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-sky-400 bg-sky-950/40 border border-sky-800/50 hover:bg-sky-900/40 rounded-lg transition-colors cursor-pointer"
          >
            <span>Switch to cPanel View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Root Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-[#f8fafc] text-slate-900">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
              <Server className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-800">Master Server Node</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">IP: 192.168.1.100</span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                WHM Daemon Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCpanel}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
            >
              <span>Customer cPanel</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold font-mono">
                RT
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">Super Administrator</span>
                <span className="text-[10px] text-slate-500 font-mono">root@hostmaster.cloud</span>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
