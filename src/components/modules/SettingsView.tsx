import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle, Server, Clock, Mail } from 'lucide-react';
import { HostingSettings } from '../../types/cpanel';
import { api } from '../../services/api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<HostingSettings>({
    phpVersion: '8.3.6',
    displayErrors: false,
    uploadMaxFilesize: '25M',
    maxExecutionTime: '300',
    memoryLimit: '512M',
    timezone: 'America/Los_Angeles',
    contactEmail: 'admin@demo-site.com',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.settings) setSettings(res.settings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.updateSettings(settings);
      setSettings(res.settings);
      setMessage({ text: 'Hosting configuration updated successfully!', isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update settings', isError: true });
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
            <span className="text-xs font-mono uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-semibold">
              Server &amp; PHP Ini
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">cPanel MultiPHP Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Hosting Preferences &amp; PHP Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure PHP runtime version, maximum execution timeouts, and account contact email.
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

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 font-mono uppercase">
              PHP Version Handler
            </label>
            <select
              value={settings.phpVersion}
              onChange={(e) => setSettings({ ...settings, phpVersion: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
            >
              <option value="8.3.6">PHP 8.3.6 (Recommended - Latest FastCGI)</option>
              <option value="8.2.18">PHP 8.2.18 (Legacy Support)</option>
              <option value="8.1.27">PHP 8.1.27 (Security Updates)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 font-mono uppercase">
                Upload Max Filesize
              </label>
              <input
                type="text"
                value={settings.uploadMaxFilesize}
                onChange={(e) => setSettings({ ...settings, uploadMaxFilesize: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 font-mono uppercase">
                Memory Limit
              </label>
              <input
                type="text"
                value={settings.memoryLimit}
                onChange={(e) => setSettings({ ...settings, memoryLimit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 font-mono uppercase">
              Server Timezone
            </label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 font-mono uppercase">
              Primary Administrator Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used for cPanel disk quota alerts and SSL expiration notices
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Preferences...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
