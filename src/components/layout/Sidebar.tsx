import React from 'react';
import { 
  LayoutDashboard, 
  FolderTree, 
  Image as ImageIcon, 
  Lock, 
  HardDrive, 
  Server, 
  Archive, 
  Sliders, 
  LogOut,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ActiveTab } from '../../types/cpanel';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  fileCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onLogout,
  fileCount = 0 
}) => {
  const menuSections = [
    {
      title: 'CORE TOOLS',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'filemanager' as ActiveTab,
          label: 'File Manager',
          icon: FolderTree,
          badge: fileCount > 0 ? `${fileCount}` : null,
          highlight: true,
        },
      ],
    },
    {
      title: 'FILES & ASSETS',
      items: [
        {
          id: 'images' as ActiveTab,
          label: 'Images & Media',
          icon: ImageIcon,
          badge: null,
        },
        {
          id: 'diskusage' as ActiveTab,
          label: 'Disk Usage',
          icon: HardDrive,
          badge: null,
        },
        {
          id: 'ftp' as ActiveTab,
          label: 'FTP Accounts',
          icon: Server,
          badge: null,
        },
      ],
    },
    {
      title: 'SECURITY & BACKUPS',
      items: [
        {
          id: 'privacy' as ActiveTab,
          label: 'Directory Privacy',
          icon: Lock,
          badge: null,
        },
        {
          id: 'backup' as ActiveTab,
          label: 'Backup Wizard',
          icon: Archive,
          badge: null,
        },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        {
          id: 'settings' as ActiveTab,
          label: 'Server Settings',
          icon: Sliders,
          badge: null,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0b1426] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none">
      {/* Brand Top Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            cP
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">
              Control Panel
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Jupiter Theme
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'} transition-colors`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-sky-700 text-sky-100' : 'bg-slate-800 text-slate-300'
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

      {/* Server Status Footer Box */}
      <div className="p-3 m-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1.5">
          <span className="font-mono">Server Status</span>
          <span className="text-emerald-400 font-medium">99.98% Uptime</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>Load Average:</span>
          <span className="text-slate-200">0.12, 0.08, 0.05</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between mt-1">
          <span>Web Server:</span>
          <span className="text-slate-200">Apache / PHP 8.3</span>
        </div>
      </div>

      {/* Logout button at bottom */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit cPanel Session</span>
        </button>
      </div>
    </aside>
  );
};
