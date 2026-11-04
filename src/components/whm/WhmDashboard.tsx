import React from 'react';
import { 
  Server, 
  Users, 
  HardDrive, 
  Globe, 
  Layers, 
  Cpu, 
  Activity, 
  UserPlus, 
  ShieldCheck, 
  ArrowUpRight, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { WHMStats, WHMTab } from '../../types/cpanel';

interface WhmDashboardProps {
  stats: WHMStats | null;
  onNavigate: (tab: WHMTab) => void;
  onImpersonate: (username: string, accountId: string) => void;
  onRefresh: () => void;
}

export const WhmDashboard: React.FC<WhmDashboardProps> = ({
  stats,
  onNavigate,
  onImpersonate,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Server Status Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded font-bold">
              WHM Master Node 01
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All 8 Core Services Running
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 tracking-tight">
            Web Host Manager (WHM) Super Administration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Linux Kernel 6.8.0-31-generic · Apache 2.4.58 · MariaDB 10.11 · cPanel &amp; WHM v118.0.12
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('whm_create_account')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>Create New Account</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
            title="Refresh Server Stats"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Key Server Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 font-mono uppercase block">Total Accounts</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">
            {stats?.totalAccounts ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            {stats?.activeAccounts ?? 0} active · {stats?.suspendedAccounts ?? 0} suspended
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 font-mono uppercase block">Total Domains</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">
            {stats?.totalDomains ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Primary + Addon + Sub</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 font-mono uppercase block">Hosting Packages</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">
            {stats?.totalPackages ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Assigned quotas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 font-mono uppercase block">Disk Storage</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">
            {stats?.diskUsageFormatted || '0 MB'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">of 250 GB pool</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 font-mono uppercase block">CPU Utilization</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono mt-1 block">
            {stats?.serverResources.cpuUsage ?? 12}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Load: {stats?.serverResources.loadAverage.join(', ')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 font-mono uppercase block">Memory (RAM)</span>
          <span className="text-2xl font-bold text-sky-600 font-mono mt-1 block">
            {stats?.serverResources.ramPercentage ?? 24}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            {(stats?.serverResources.ramUsageMB || 3840) / 1024} GB / 16 GB
          </span>
        </div>
      </div>

      {/* Main Grid: Server Services Status & Recently Created Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recently Provisioned Accounts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recently Created Hosting Accounts</h3>
              <p className="text-xs text-slate-500">Live tenant isolation status with instant cPanel access</p>
            </div>
            <button
              onClick={() => onNavigate('whm_accounts')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Accounts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Domain</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Package</th>
                  <th className="py-2.5 px-3">Disk</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Direct Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.recentAccounts || []).map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {acc.domain}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {acc.username}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {acc.packageName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {acc.diskUsedMB} MB / {acc.diskLimitMB} MB
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        acc.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onImpersonate(acc.username, acc.id)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Seamlessly switch context into this customer's cPanel"
                      >
                        <span>Login to cPanel</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Core Server Daemon Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
              Server Services Status
            </h3>
            <span className="text-[11px] text-emerald-600 font-mono font-medium">All Online</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {(stats?.serverResources.activeServices || []).map((svc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-800">{svc.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-400">:{svc.port}</span>
                  <span className="text-emerald-700 font-semibold uppercase">UP</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Server Uptime:</span>
            <span className="text-slate-700 font-medium">{stats?.serverResources.uptime || '28 days'}</span>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
              Live WHM &amp; cPanel Cluster Activity Stream
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Audit Trail</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {(stats?.recentActivities || []).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 font-mono">
              <div className="flex items-center gap-3 truncate">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  log.panel === 'whm' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                }`}>
                  {log.panel}
                </span>
                <span className="font-semibold text-slate-800">{log.action}</span>
                <span className="text-slate-500 truncate">{log.target}</span>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
