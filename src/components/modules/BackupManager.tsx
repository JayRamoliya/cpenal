import React, { useState } from 'react';
import { Archive, Download, CheckCircle2, ShieldCheck, Database, HardDrive, FileArchive } from 'lucide-react';
import { api } from '../../services/api';

export const BackupManager: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadFullBackup = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = api.getBackupFullDownloadUrl();
    link.setAttribute('download', `cpanel-backup-${Date.now()}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-semibold">
              Disaster Recovery &amp; Archives
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">cPanel Backup Wizard</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Backup Wizard &amp; Restore</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and download an uncompressed or zipped archive of your entire website, email accounts, and configuration.
          </p>
        </div>
      </div>

      {/* Backup Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Full Account Backup */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Archive className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Full Home Directory Backup</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Downloads a compressed ZIP archive containing your complete <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">/home/demo</code> directory including all website files in public_html, ssl certificates, and server logs.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-teal-50/50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
              <span>Full archive generated on-the-fly directly from server filesystem.</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadFullBackup}
              disabled={downloading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing Archive...' : 'Download Full Home Backup (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Partial Backups */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Partial Backups &amp; Database Dumps</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export specific components of your hosting account individually for faster transfers or local staging tests.
            </p>

            <div className="mt-4 space-y-2">
              <a
                href={api.getDownloadUrl('/public_html')}
                className="p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <FileArchive className="w-4 h-4 text-sky-600" />
                  <span className="font-medium text-slate-800">Download public_html Web Assets Only</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
              </a>

              <a
                href={api.getDownloadUrl('/logs')}
                className="p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <FileArchive className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-800">Download Server Access &amp; Error Logs</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
            Automated backups schedule: Nightly at 03:00 UTC
          </div>
        </div>
      </div>
    </div>
  );
};
