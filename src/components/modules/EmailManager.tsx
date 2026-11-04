import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, CheckCircle2, AlertCircle, ExternalLink, Inbox } from 'lucide-react';
import { EmailAccount } from '../../types/cpanel';
import { api } from '../../services/api';

export const EmailManager: React.FC = () => {
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [domain, setDomain] = useState('demo-site.com');
  const [loading, setLoading] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [quotaMB, setQuotaMB] = useState(1024);
  const [forwardTo, setForwardTo] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [webmailTarget, setWebmailTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const res = await api.getCpanelEmails();
      setEmails(res.emails || []);
      setDomain(res.defaultDomain || 'demo-site.com');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefix.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.createCpanelEmail(prefix.trim(), quotaMB, forwardTo.trim() || undefined);
      setMessage({ text: `Email account ${prefix.trim()}@${domain} created successfully.`, isError: false });
      setPrefix('');
      setForwardTo('');
      setIsAddOpen(false);
      loadEmails();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create email', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCpanelEmail(id);
      loadEmails();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to delete email', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
              cPanel Email
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">POP3 / IMAP / Webmail</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Email Inboxes, Forwarders &amp; Webmail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create domain mailboxes, configure autoresponders, set inbox storage quotas, and launch Roundcube webmail.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Email Account</span>
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

      {/* Email Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Email Address</th>
              <th className="py-2.5 px-3">Usage / Quota</th>
              <th className="py-2.5 px-3">Forwarders</th>
              <th className="py-2.5 px-3">Autoresponder</th>
              <th className="py-2.5 px-3 text-right">Webmail &amp; Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {emails.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{e.email}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-700 tabular-nums">
                  {e.usedMB} MB / {e.quotaMB} MB
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {e.forwardTo ? `Forwarding to ${e.forwardTo}` : 'None'}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    e.autoresponderEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {e.autoresponderEnabled ? 'Active' : 'Off'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setWebmailTarget(e.email)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Inbox className="w-3 h-3 text-amber-400" />
                      <span>Webmail</span>
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete inbox"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Email Account Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100">
              Create New Email Account
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Email Address *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    required
                    placeholder="e.g. sales, support, info"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-l font-mono text-slate-800"
                  />
                  <span className="inline-flex items-center px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r font-mono text-slate-600 font-bold">
                    @{domain}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Storage Quota (MB)
                </label>
                <input
                  type="number"
                  min="50"
                  value={quotaMB}
                  onChange={(e) => setQuotaMB(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Forward Incoming Mail To (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. personal@gmail.com"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
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
                  disabled={saving || !prefix.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Mailbox'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webmail Simulator Modal */}
      {webmailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl h-[75vh] flex flex-col overflow-hidden">
            <div className="bg-[#1e293b] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm font-mono">Roundcube Webmail 1.6 — {webmailTarget}</span>
              </div>
              <button onClick={() => setWebmailTarget(null)} className="text-slate-400 hover:text-white px-2 py-1">
                ✕ Close
              </button>
            </div>

            <div className="flex-1 p-6 bg-slate-50 font-mono text-xs flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
              <p className="font-bold text-slate-700">Inbox is empty for {webmailTarget}</p>
              <p className="text-[11px] text-slate-400 mt-1">IMAP Server: mail.{domain}:993 (SSL Encrypted)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
