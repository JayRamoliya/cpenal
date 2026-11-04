import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Plus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { SslCertificate } from '../../types/cpanel';
import { api } from '../../services/api';

export const WhmSslManager: React.FC = () => {
  const [certs, setCerts] = useState<SslCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [certificate, setCertificate] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadSsl();
  }, []);

  const loadSsl = async () => {
    setLoading(true);
    try {
      const res = await api.getWhmSslCertificates();
      setCerts(res.certificates || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.installWhmSsl(domain.trim(), certificate, privateKey);
      setMessage({ text: `SSL Certificate installed and bound to ${domain}.`, isError: false });
      setIsInstallOpen(false);
      loadSsl();
    } catch (err: any) {
      setMessage({ text: err.message || 'SSL installation failed', isError: true });
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
            <span className="text-xs font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              WHM Security &amp; SSL
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">Manage SSL Hosts</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">SSL/TLS Certificates &amp; AutoSSL</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor certificates, view expiration dates, configure automated AutoSSL renewals, or install custom keys.
          </p>
        </div>

        <button
          onClick={() => setIsInstallOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Lock className="w-4 h-4 text-slate-950" />
          <span>Install SSL Certificate</span>
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

      {/* SSL Certificates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-[#0b1426] text-slate-300 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Protected Host Domain</th>
              <th className="py-2.5 px-3">Issuer Authority</th>
              <th className="py-2.5 px-3">Key Specification</th>
              <th className="py-2.5 px-3">Valid Until</th>
              <th className="py-2.5 px-3">Auto Renew</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {certs.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{c.domain}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{c.issuer}</td>
                <td className="py-2.5 px-3 text-slate-500">{c.keyType}</td>
                <td className="py-2.5 px-3 text-slate-700 font-bold">{c.validTo}</td>
                <td className="py-2.5 px-3 text-slate-600">{c.autoRenew ? 'Enabled (AutoSSL)' : 'Manual'}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase text-[10px]">
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Install Certificate Modal */}
      {isInstallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100">
              Install Custom SSL Certificate on Host
            </h3>

            <form onSubmit={handleInstall} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Domain Host *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. secure.domain.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Certificate: (CRT)
                </label>
                <textarea
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-[11px] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Private Key: (KEY)
                </label>
                <textarea
                  rows={3}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-[11px] text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInstallOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !domain.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded cursor-pointer"
                >
                  {saving ? 'Installing...' : 'Install Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
