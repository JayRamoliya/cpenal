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
  Globe,
  Mail,
  Database,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { CPanelTab, User } from '../../types/cpanel';

interface SidebarProps {
  user?: User | null;
  activeTab: CPanelTab;
  onTabChange: (tab: CPanelTab) => void;
  onLogout: () => void;
  onReturnToWhm?: () => void;
  fileCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  user,
  activeTab, 
  onTabChange, 
  onLogout,
  onReturnToWhm,
  fileCount = 0 
}) => {
  const isSuperAdminOrImpersonating = user?.role === 'superadmin' || Boolean(onReturnToWhm);

  const menuSections = [
    {
      title: 'FILES & DIRECTORIES',
      items: [
        {
          id: 'dashboard' as CPanelTab,
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'filemanager' as CPanelTab,
          label: 'File Manager',
          icon: FolderTree,
          badge: fileCount > 0 ? `${fileCount}` : null,
          highlight: true,
        },
        {
          id: 'images' as CPanelTab,
          label: 'Images & Media',
          icon: ImageIcon,
          badge: null,
        },
        {
          id: 'diskusage' as CPanelTab,
          label: 'Disk Usage',
          icon: HardDrive,
          badge: null,
        },
        {
          id: 'ftp' as CPanelTab,
          label: 'FTP Accounts',
          icon: Server,
          badge: null,
        },
      ],
    },
    {
      title: 'DOMAINS & WEB',
      items: [
        {
          id: 'domains' as CPanelTab,
          label: 'Domains & Addons',
          icon: Globe,
          badge: null,
        },
      ],
    },
    {
      title: 'DATABASES & EMAIL',
      items: [
        {
          id: 'databases' as CPanelTab,
          label: 'MySQL Databases',
          icon: Database,
          badge: null,
        },
        {
          id: 'email' as CPanelTab,
          label: 'Email Accounts',
          icon: Mail,
          badge: null,
        },
      ],
    },
    {
      title: 'SECURITY & RECOVERY',
      items: [
        {
          id: 'backup' as CPanelTab,
          label: 'Backup Wizard',
          icon: Archive,
          badge: null,
        },
        {
          id: 'settings' as CPanelTab,
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
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
              cP
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                cPanel Jupiter
              </h1>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                User: {user?.username || 'demo'}
              </p>
            </div>
          </div>
        </div>

        {/* If Super Admin is viewing customer cPanel, show return button */}
        {onReturnToWhm && (
          <button
            onClick={onReturnToWhm}
            className="w-full mt-2 py-1.5 px-2 bg-amber-950/60 border border-amber-800/80 text-amber-300 hover:bg-amber-900/60 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to WHM Master</span>
          </button>
        )}
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer group ${
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
          <span>Web Server:</span>
          <span className="text-slate-200">Apache 2.4.58</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between mt-1">
          <span>Database:</span>
          <span className="text-slate-200">MariaDB 10.11</span>
        </div>
      </div>

      {/* Logout button at bottom */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit cPanel Session</span>
        </button>
      </div>
    </aside>
  );
};
