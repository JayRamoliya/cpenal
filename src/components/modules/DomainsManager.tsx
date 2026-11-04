import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, Folder, ShieldCheck } from 'lucide-react';
import { DomainItem } from '../../types/cpanel';
import { api } from '../../services/api';

export const DomainsManager: React.FC = () => {
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [domainName, setDomainName] = useState('');
  const [domainType, setDomainType] = useState<'addon' | 'subdomain' | 'alias'>('addon');
  const [subfolder, setSubfolder] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const res = await api.getCpanelDomains();
      setDomains(res.domains || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.createCpanelDomain(domainName.trim(), domainType, subfolder.trim() || undefined);
      setMessage({ text: `Domain "${domainName}" configured with dedicated document root.`, isError: false });
      setDomainName('');
      setSubfolder('');
      setIsAddOpen(false);
      loadDomains();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add domain', isError: true });
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
              cPanel Domains
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">Domain Management</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Domains, Subdomains &amp; Aliases</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure addon domains, subdomains, and redirects with separate document root directories.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create a New Domain</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          {message.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Domains Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Domain</th>
              <th className="py-2.5 px-3">Document Root</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">SSL Status</th>
              <th className="py-2.5 px-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{d.domain}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 flex items-center gap-1.5">
                  <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate max-w-xs">{d.documentRoot}</span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                    {d.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AutoSSL Active</span>
                </td>
                <td className="py-2.5 px-3 text-slate-400 text-[11px]">{d.createdAt.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Domain Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100">
              Create a Domain / Subdomain
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Domain Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. blog.mydomain.com or newsite.org"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Domain Classification
                </label>
                <select
                  value={domainType}
                  onChange={(e) => setDomainType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                >
                  <option value="addon">Addon Domain (Independent Website)</option>
                  <option value="subdomain">Subdomain (sub.yourdomain.com)</option>
                  <option value="alias">Domain Alias (Parks on primary domain)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Document Root Subfolder (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. blog or store"
                  value={subfolder}
                  onChange={(e) => setSubfolder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Path inside public_html where website files will be located
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !domainName.trim()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Submit Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
