import React, { useState, useEffect } from 'react';
import { Server, Plus, Trash2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { FtpAccount } from '../../types/cpanel';
import { api } from '../../services/api';

export const FtpAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<FtpAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [directory, setDirectory] = useState('/home/demo/public_html');
  const [quotaMB, setQuotaMB] = useState(1024);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.getFtpAccounts();
      setAccounts(res.accounts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setCreating(true);
    setFeedback(null);

    try {
      const res = await api.createFtpAccount(username.trim(), directory, quotaMB);
      setFeedback({ text: res.account ? `FTP Account created for ${res.account.username}` : 'Created', isError: false });
      setUsername('');
      loadAccounts();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to create FTP account', isError: true });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteFtpAccount(id);
      loadAccounts();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to delete account', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-semibold">
              Files &amp; Access
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">cPanel FTP Accounts</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">FTP Accounts &amp; Access</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure secure FTP / SFTP users to upload files directly via FileZilla, Cyberduck, or WinSCP.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            feedback.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2-Column: Create FTP Account & Existing Accounts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Account Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-600" />
            Add New FTP Account
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                Login / Username
              </label>
              <div className="flex rounded-lg shadow-xs">
                <input
                  type="text"
                  required
                  placeholder="e.g. dev_user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-l-lg font-mono text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
                />
                <span className="inline-flex items-center px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-500 font-mono text-[11px]">
                  @demo-site.com
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                Directory Path
              </label>
              <input
                type="text"
                required
                value={directory}
                onChange={(e) => setDirectory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Directory the user will be locked into
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                Quota Limit (MB)
              </label>
              <input
                type="number"
                min="50"
                max="10000"
                value={quotaMB}
                onChange={(e) => setQuotaMB(parseInt(e.target.value, 10) || 500)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !username.trim()}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Creating Account...' : 'Create FTP Account'}</span>
            </button>
          </form>
        </div>

        {/* Right: Accounts Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono mb-4 pb-2 border-b border-slate-100">
            Active FTP Users ({accounts.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Login</th>
                  <th className="py-2.5 px-3">Locked Directory</th>
                  <th className="py-2.5 px-3">Quota</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 font-mono">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {acc.username}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] truncate max-w-xs">
                      {acc.directory}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {acc.quotaMB} MB
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete FTP user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
