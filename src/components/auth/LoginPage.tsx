import React, { useState } from 'react';
import { Lock, User, Server, AlertCircle, ArrowRight, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [activeMode, setActiveMode] = useState<'cpanel' | 'whm'>('whm');
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('whm123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSwitch = (mode: 'cpanel' | 'whm') => {
    setActiveMode(mode);
    setError(null);
    if (mode === 'whm') {
      setUsername('root');
      setPassword('whm123');
    } else {
      setUsername('demo');
      setPassword('cpanel123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ok = await onLogin(username, password);
      if (!ok) {
        if (activeMode === 'whm') {
          setError('Invalid WHM Super Admin credentials. Use root / whm123');
        } else {
          setError('Invalid cPanel credentials. Use demo / cpanel123 or acme / acme123');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u: string, p: string, mode: 'cpanel' | 'whm') => {
    setActiveMode(mode);
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060c18] via-[#091326] to-[#0e1d3b] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform ${
              activeMode === 'whm' ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-900/40' : 'bg-gradient-to-tr from-orange-600 to-amber-500 shadow-orange-900/40'
            }`}>
              {activeMode === 'whm' ? 'WHM' : 'cP'}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {activeMode === 'whm' ? 'WebHost Manager (WHM) Super Admin' : 'cPanel Jupiter Control Panel'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeMode === 'whm'
              ? 'Master Cluster Infrastructure, Tenant Provisioning & DNS Management'
              : 'Website File Management, MySQL Databases, Addon Domains & Email Portals'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleModeSwitch('whm')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'whm'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>WHM Master Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('cpanel')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'cpanel'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="font-mono text-xs">cP</span>
            <span>Customer cPanel</span>
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-7 border border-white/20">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
                {activeMode === 'whm' ? 'Root Username' : 'cPanel Username or Domain'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeMode === 'whm' ? 'root' : 'demo or acme'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeMode === 'whm' ? 'Root Password' : 'User Password'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                <span>Remember session</span>
              </label>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                TLS 1.3 / AES-256
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 text-sm font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer ${
                activeMode === 'whm'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
              }`}
            >
              {loading && <span className="inline-block animate-spin mr-2">◌</span>}
              <span>{loading ? 'Authenticating...' : activeMode === 'whm' ? 'Log In to WHM Master Node' : 'Log In to cPanel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  Instant Test Accounts (1-Click Fill)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                {/* WHM Root */}
                <button
                  type="button"
                  onClick={() => setPreset('root', 'whm123', 'whm')}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    activeMode === 'whm' && username === 'root'
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-amber-600 block text-[10px] font-bold">SUPER ADMIN</span>
                  <div className="truncate font-semibold">root / whm123</div>
                  <div className="text-[10px] text-slate-400">/whm Master</div>
                </button>

                {/* cPanel Demo */}
                <button
                  type="button"
                  onClick={() => setPreset('demo', 'cpanel123', 'cpanel')}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    activeMode === 'cpanel' && username === 'demo'
                      ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sky-600 block text-[10px] font-bold">CUSTOMER 1</span>
                  <div className="truncate font-semibold">demo / cpanel123</div>
                  <div className="text-[10px] text-slate-400">demo-site.com</div>
                </button>

                {/* cPanel Acme */}
                <button
                  type="button"
                  onClick={() => setPreset('acme', 'acme123', 'cpanel')}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    activeMode === 'cpanel' && username === 'acme'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-indigo-600 block text-[10px] font-bold">CUSTOMER 2</span>
                  <div className="truncate font-semibold">acme / acme123</div>
                  <div className="text-[10px] text-slate-400">acmecorp.net</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Active Session Security
          </span>
          <span className="text-slate-600">·</span>
          <span>cPanel &amp; WHM v118.0.12</span>
          <span className="text-slate-600">·</span>
          <span>Dual Multi-Tenant Architecture</span>
        </div>
      </div>
    </div>
  );
};

