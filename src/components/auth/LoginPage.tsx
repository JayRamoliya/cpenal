import React, { useState } from 'react';
import { Lock, User, Server, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('cpanel123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ok = await onLogin(username, password);
      if (!ok) {
        setError('Invalid username or password. Please use demo / cpanel123');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername('demo');
    setPassword('cpanel123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070e1c] via-[#0b162c] to-[#0f1f3d] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative subtle background grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xl shadow-orange-900/30 mb-4 font-black text-2xl tracking-tighter">
            cP
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">cPanel WebHost Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to manage your domains, databases, and website files
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
                Username or Domain Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. demo or demo@cpanel.local"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Demo: cpanel123</span>
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
                <span>Remember session for 30 days</span>
              </label>
              <span className="text-sky-600 font-medium">SSL 256-bit</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin mr-2">◌</span>
              ) : null}
              <span>{loading ? 'Authenticating...' : 'Log In to cPanel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  Default Demo Credentials
                </span>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 cursor-pointer"
                >
                  Quick Fill
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600">
                <div className="bg-white px-2 py-1.5 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">USER:</span>
                  <span className="font-semibold text-slate-800">demo</span>
                </div>
                <div className="bg-white px-2 py-1.5 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">PASS:</span>
                  <span className="font-semibold text-slate-800">cpanel123</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            TLS Encrypted
          </span>
          <span className="text-slate-600">·</span>
          <span>cPanel &amp; WHM Version 118</span>
          <span className="text-slate-600">·</span>
          <span>Linux Kernel 6.8</span>
        </div>
      </div>
    </div>
  );
};
