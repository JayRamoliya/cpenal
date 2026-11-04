import React from 'react';
import { HardDrive, Folder, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { StorageStats, ActiveTab } from '../../types/cpanel';

interface DiskUsageViewProps {
  storageStats: StorageStats | null;
  onRefresh: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const DiskUsageView: React.FC<DiskUsageViewProps> = ({
  storageStats,
  onRefresh,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-semibold">
              Disk Management
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">cPanel Disk Usage</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Disk Usage &amp; Quota Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyze disk space consumed by files, mailboxes, and server logs across your home directory.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Usage</span>
        </button>
      </div>

      {/* Main Quota Gauge Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono mb-4 pb-2 border-b border-slate-100">
          Account Disk Space Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block">Current Space Used</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {storageStats?.usedFormatted || '0 B'}
            </span>
            <span className="text-xs text-slate-400 block mt-1 font-mono">
              {storageStats?.percentageUsed || 0}% of total capacity
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block">Available Free Space</span>
            <span className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
              {storageStats?.availableFormatted || '5.00 GB'}
            </span>
            <span className="text-xs text-slate-400 block mt-1 font-mono">
              Ready for uploads &amp; database growth
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block">Total Account Quota</span>
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {storageStats?.totalQuotaFormatted || '5.00 GB'}
            </span>
            <span className="text-xs text-slate-400 block mt-1 font-mono">
              Hard limit assigned by host
            </span>
          </div>
        </div>

        {/* Global Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Overall Storage Consumption</span>
            <span className="font-mono text-sky-600">{storageStats?.percentageUsed || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (storageStats?.percentageUsed || 0) > 85 ? 'bg-rose-500' : 'bg-sky-500'
              }`}
              style={{ width: `${Math.max(2, storageStats?.percentageUsed || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Breakdown by Directory */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
              Directory Size Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Disk usage grouped by major cPanel filesystem root directories
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('filemanager')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Open in File Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {(storageStats?.breakdown || []).map((b) => (
            <div key={b.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Folder className="w-5 h-5 fill-amber-500/20" />
                </div>
                <div>
                  <span className="font-semibold text-slate-800 font-mono text-sm block">
                    /{b.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {b.files} files · {b.folders} subdirectories
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800 font-mono tabular-nums block">
                    {b.formatted}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {storageStats?.usedBytes ? ((b.bytes / (storageStats.usedBytes || 1)) * 100).toFixed(1) : 0}% of used
                  </span>
                </div>

                <button
                  onClick={() => onNavigateTab('filemanager')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
