import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, CheckCircle2, AlertCircle, ExternalLink, Download, Users } from 'lucide-react';
import { DatabaseItem } from '../../types/cpanel';
import { api } from '../../services/api';

export const DatabasesManager: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [prefix, setPrefix] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [dbName, setDbName] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPhpMyAdminOpen, setIsPhpMyAdminOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const res = await api.getCpanelDatabases();
      setDatabases(res.databases || []);
      setPrefix(res.usernamePrefix || 'demo');
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim()) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.createCpanelDatabase(dbName.trim());
      setMessage({ text: `Database "${prefix}_${dbName.trim()}" created successfully.`, isError: false });
      setDbName('');
      setIsAddOpen(false);
      loadDatabases();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create database', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCpanelDatabase(id);
      loadDatabases();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to delete database', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
              cPanel Databases
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">MariaDB / MySQL 8.0</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">MySQL Databases &amp; Users</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create databases, configure database privileges, and launch phpMyAdmin web console.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhpMyAdminOpen(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>phpMyAdmin Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Database</span>
          </button>
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
          {message.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Databases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Database Name</th>
              <th className="py-2.5 px-3">Storage Size</th>
              <th className="py-2.5 px-3">Tables</th>
              <th className="py-2.5 px-3">Privileged Users</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {databases.map((db) => (
              <tr key={db.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{db.name}</span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 tabular-nums">{db.sizeMB} MB</td>
                <td className="py-2.5 px-3 text-slate-500">{db.tablesCount} tables</td>
                <td className="py-2.5 px-3 text-slate-700">
                  {db.users.map((u) => u.username).join(', ') || 'No assigned users'}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => handleDelete(db.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Drop Database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Database Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100">
              Create New MySQL Database
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Database Suffix *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l font-mono text-slate-600 font-bold">
                    {prefix}_
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. store or wordpress"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-r font-mono text-slate-800"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                  Full database identifier: {prefix}_{dbName || 'name'}
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
                  disabled={saving || !dbName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* phpMyAdmin Web Console Simulator */}
      {isPhpMyAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl h-[75vh] flex flex-col overflow-hidden">
            <div className="bg-[#1e293b] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm font-mono">phpMyAdmin 5.2.1 Web Console ({prefix}_localhost)</span>
              </div>
              <button
                onClick={() => setIsPhpMyAdminOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 p-6 bg-slate-50 overflow-auto font-mono text-xs">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected to MariaDB 10.11 Server as user: {prefix}_admin</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Server: Localhost via UNIX socket · Protocol version: 10 · Server charset: UTF-8 Unicode (utf8mb4)
                </p>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2">Database</th>
                        <th className="p-2">Collation</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {databases.map((db) => (
                        <tr key={db.id}>
                          <td className="p-2 font-bold text-slate-800">{db.name}</td>
                          <td className="p-2 text-slate-500">{db.charset}</td>
                          <td className="p-2 text-sky-600 font-semibold cursor-pointer">Browse / SQL Console</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
