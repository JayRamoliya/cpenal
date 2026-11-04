import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, HardDrive, Globe, KeyRound } from 'lucide-react';
import { HostingPackage, WHMTab } from '../../types/cpanel';
import { api } from '../../services/api';

interface WhmCreateAccountProps {
  onNavigate: (tab: WHMTab) => void;
  onAccountCreated?: (username: string, accountId: string) => void;
}

export const WhmCreateAccount: React.FC<WhmCreateAccountProps> = ({
  onNavigate,
  onAccountCreated,
}) => {
  const [domain, setDomain] = useState('example.com');
  const [username, setUsername] = useState('example');
  const [password, setPassword] = useState('cpanel123');
  const [email, setEmail] = useState('admin@example.com');
  const [packageId, setPackageId] = useState('');
  const [packages, setPackages] = useState<HostingPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await api.getWhmPackages();
      setPackages(res.packages || []);
      if (res.packages && res.packages.length > 0) {
        setPackageId(res.packages[1]?.id || res.packages[0].id);
      }
    } catch {
      // ignore
    }
  };

  const handleDomainChange = (val: string) => {
    setDomain(val);
    const clean = val.split('.')[0].replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8);
    if (clean) {
      setUsername(clean);
      setEmail(`admin@${val.toLowerCase()}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !username) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await api.createWhmAccount({
        domain: domain.trim(),
        username: username.trim(),
        email: email.trim(),
        packageId,
      });

      setStatus({
        message: `Account "${domain}" provisioned successfully with isolated directory /home/${username}/public_html!`,
        isError: false,
      });

      if (onAccountCreated && res.account) {
        onAccountCreated(res.account.username, res.account.id);
      }

      setTimeout(() => {
        onNavigate('whm_accounts');
      }, 1500);
    } catch (err: any) {
      setStatus({
        message: err.message || 'Failed to provision hosting account',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              WHM Account Functions
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">Create a New Account</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Provision New Hosting Account</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Initializes an isolated filesystem directory, assigns packages, creates DNS zones, and generates cPanel credentials.
          </p>
        </div>

        <button
          onClick={() => onNavigate('whm_accounts')}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to List Accounts</span>
        </button>
      </div>

      {status && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            status.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          {status.isError ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <div>
            <span className="font-semibold block">{status.isError ? 'Provisioning Failed' : 'Account Created!'}</span>
            <span>{status.message}</span>
          </div>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
        {/* Section 1: Domain Information */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-600" />
            1. Domain &amp; Customer Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                Primary Domain *
              </label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="e.g. example.com or clientsite.org"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Domain without www or https://</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                cPanel Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="e.g. example"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Isolated directory: /home/{username || 'USER'}/public_html</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                Initial Account Password *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Default: cpanel123</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                Customer Contact Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">For quota alerts and password resets</span>
            </div>
          </div>
        </div>

        {/* Section 2: Hosting Package Selection */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-600" />
            2. Package &amp; Resource Allocation
          </h3>

          <div className="mt-4">
            <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
              Choose Hosting Package *
            </label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — Quota: {pkg.diskLimitMB}MB Disk / {pkg.bandwidthLimitMB}MB Bandwidth (Max Domains: {pkg.maxDomains})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Automatic Provisioning Toggles */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Automated Provisioning Checklist on Account Creation:</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
            <li>✓ Isolated sandbox /home/{username || 'user'}/public_html</li>
            <li>✓ AutoSSL Let's Encrypt certificate registration</li>
            <li>✓ Default BIND DNS Zone with A, CNAME, MX records</li>
            <li>✓ MariaDB MySQL tenant account separation</li>
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('whm_accounts')}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !domain || !username}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>{loading ? 'Provisioning Account...' : 'Create Account'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
