import React, { useState, useEffect } from 'react';
import { KeyRound, Plus, Trash2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { ApiToken } from '../../types/cpanel';
import { api } from '../../services/api';

export const WhmApiTokens: React.FC = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const res = await api.getWhmTokens();
      setTokens(res.tokens || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.createWhmToken(name.trim(), ['create_account', 'suspend_account', 'modify_package']);
      setMessage({ text: `API token created for "${name}".`, isError: false });
      setName('');
      setIsAddOpen(false);
      loadTokens();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create token', isError: true });
    }
  };

  const handleDeleteToken = async (id: string) => {
    try {
      await api.deleteWhmToken(id);
      loadTokens();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to revoke token', isError: true });
    }
  };

  const copyToken = (str: string) => {
    navigator.clipboard.writeText(str);
    setCopiedToken(str);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              WHM Development
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">Manage API Tokens</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">WHM API Tokens &amp; Remote Access</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and revoke API keys for external billing platforms (WHMCS, Blesta) and remote deployment scripts.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Generate API Token</span>
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

      {/* Tokens List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-[#0b1426] text-slate-300 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Token Name</th>
              <th className="py-2.5 px-3">Secret Key Hash</th>
              <th className="py-2.5 px-3">Permissions Scope</th>
              <th className="py-2.5 px-3">Last Used</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tokens.map((tok) => (
              <tr key={tok.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-900">{tok.name}</td>
                <td className="py-2.5 px-3 text-slate-600 flex items-center gap-2">
                  <span className="truncate max-w-xs">{tok.token}</span>
                  <button
                    onClick={() => copyToken(tok.token)}
                    className="p-1 hover:text-amber-600 transition-colors"
                    title="Copy Token"
                  >
                    {copiedToken === tok.token ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  {tok.permissions.join(', ')}
                </td>
                <td className="py-2.5 px-3 text-slate-400">{tok.lastUsed}</td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => handleDeleteToken(tok.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Revoke Token"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100">
              Generate New WHM API Token
            </h3>

            <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Token Identifier / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WHMCS Provisioning Integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                />
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
                  disabled={!name.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded cursor-pointer"
                >
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
