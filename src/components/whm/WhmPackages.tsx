import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, CheckCircle2, AlertCircle, HardDrive, Globe, Mail, Database } from 'lucide-react';
import { HostingPackage } from '../../types/cpanel';
import { api } from '../../services/api';

export const WhmPackages: React.FC = () => {
  const [packages, setPackages] = useState<HostingPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [diskLimitMB, setDiskLimitMB] = useState(5120);
  const [bandwidthLimitMB, setBandwidthLimitMB] = useState(51200);
  const [maxDomains, setMaxDomains] = useState(1);
  const [maxEmails, setMaxEmails] = useState(10);
  const [maxDatabases, setMaxDatabases] = useState(5);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await api.getWhmPackages();
      setPackages(res.packages || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.createWhmPackage({
        name: name.trim(),
        diskLimitMB,
        bandwidthLimitMB,
        maxDomains,
        maxEmails,
        maxDatabases,
      });

      setMessage({ text: `Package "${name}" created successfully.`, isError: false });
      setName('');
      setIsAddOpen(false);
      loadPackages();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create package', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWhmPackage(id);
      loadPackages();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to delete package', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              WHM Packages
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">Package Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Hosting Packages &amp; Quotas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define resource limits, bandwidth quotas, and domain capabilities for customer tiers.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Add a Package</span>
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
          {message.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs font-mono">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{pkg.name}</h3>
                </div>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete package"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mt-4 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                    Disk Space Quota:
                  </span>
                  <span className="font-bold text-slate-900">{pkg.diskLimitMB} MB</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    Monthly Bandwidth:
                  </span>
                  <span className="font-bold text-slate-900">{pkg.bandwidthLimitMB} MB</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    Max Email Inboxes:
                  </span>
                  <span className="font-bold text-slate-900">{pkg.maxEmails}</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Database className="w-3.5 h-3.5 text-purple-600" />
                    Max Databases:
                  </span>
                  <span className="font-bold text-slate-900">{pkg.maxDatabases}</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">Max Hosted Domains:</span>
                  <span className="font-bold text-slate-900">{pkg.maxDomains}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                {(pkg.features || []).map((feat, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Package Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100">
              Create New Hosting Package
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Business Gold Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                    Disk Limit (MB)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={diskLimitMB}
                    onChange={(e) => setDiskLimitMB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                    Bandwidth (MB)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    value={bandwidthLimitMB}
                    onChange={(e) => setBandwidthLimitMB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                    Max Domains
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxDomains}
                    onChange={(e) => setMaxDomains(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                    Max Databases
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxDatabases}
                    onChange={(e) => setMaxDatabases(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>
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
                  disabled={saving || !name.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Add Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
