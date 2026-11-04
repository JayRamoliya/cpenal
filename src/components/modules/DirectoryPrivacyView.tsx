import React, { useState, useEffect } from 'react';
import { Lock, Shield, Plus, CheckCircle2, AlertCircle, Folder } from 'lucide-react';
import { ProtectedDirectory } from '../../types/cpanel';
import { api } from '../../services/api';

export const DirectoryPrivacyView: React.FC = () => {
  const [dirs, setDirs] = useState<ProtectedDirectory[]>([]);
  const [loading, setLoading] = useState(false);
  const [directoryPath, setDirectoryPath] = useState('/home/demo/public_html/admin');
  const [realmName, setRealmName] = useState('Restricted Administration Portal');
  const [user, setUser] = useState('sysadmin');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadProtectedDirs();
  }, []);

  const loadProtectedDirs = async () => {
    setLoading(true);
    try {
      const res = await api.getProtectedDirectories();
      setDirs(res.directories || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleProtect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directoryPath.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.saveProtectedDirectory(directoryPath.trim(), realmName, true, user.trim());
      setMessage({ text: `Protected directory "${directoryPath}" configured with .htpasswd authentication.`, isError: false });
      loadProtectedDirs();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update directory protection', isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold">
              Security &amp; Permissions
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">cPanel Directory Privacy</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Directory Privacy &amp; Passwords</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Password-protect sensitive directories on your server via HTTP Basic Auth (.htpasswd).
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          {message.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configure Protection Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600" />
            Protect a Directory
          </h3>

          <form onSubmit={handleProtect} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                Directory to Protect
              </label>
              <input
                type="text"
                required
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Target path relative to server root
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                Name Protected Directory (Realm)
              </label>
              <input
                type="text"
                required
                value={realmName}
                onChange={(e) => setRealmName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Shown to visitors when prompted for credentials
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                Authorized User Login
              </label>
              <input
                type="text"
                required
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !directoryPath.trim()}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{saving ? 'Applying Protection...' : 'Enable Password Protection'}</span>
            </button>
          </form>
        </div>

        {/* Right: List of Protected Directories */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono mb-4 pb-2 border-b border-slate-100">
            Protected Directories ({dirs.length})
          </h3>

          <div className="space-y-3">
            {dirs.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 font-mono text-sm block">
                      {d.directory}
                    </span>
                    <span className="text-slate-500 mt-0.5 block">
                      Realm: <span className="font-medium text-slate-700">{d.realmName}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      Authorized Users: {d.authorizedUsers.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Locked with Auth
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
