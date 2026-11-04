import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { DnsRecord } from '../../types/cpanel';
import { api } from '../../services/api';

export const WhmDnsManager: React.FC = () => {
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [name, setName] = useState('@');
  const [type, setType] = useState<'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'CAA'>('A');
  const [recordVal, setRecordVal] = useState('192.168.1.104');
  const [ttl, setTtl] = useState(14400);
  const [priority, setPriority] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadDns();
  }, [selectedDomain]);

  const loadDns = async () => {
    setLoading(true);
    try {
      const res = await api.getWhmDnsRecords(selectedDomain || undefined);
      setRecords(res.records || []);
      setDomains(res.domains || []);
      if (!selectedDomain && res.domains && res.domains.length > 0) {
        setSelectedDomain(res.domains[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !name || !recordVal) return;

    setSaving(true);
    setMessage(null);

    try {
      await api.createWhmDnsRecord({
        domain: selectedDomain,
        name: name.trim(),
        type,
        record: recordVal.trim(),
        ttl,
        priority: type === 'MX' ? priority || 10 : undefined,
      });

      setMessage({ text: `DNS record created for ${selectedDomain}`, isError: false });
      setIsAddOpen(false);
      setName('@');
      loadDns();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add DNS record', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await api.deleteWhmDnsRecord(id);
      loadDns();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to remove DNS record', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              WHM DNS Functions
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">BIND DNS Zone Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">DNS Zone &amp; Record Editor</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authoritative nameserver records: A, AAAA, CNAME, MX, TXT, NS, SRV, CAA across hosted domains.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Add DNS Record</span>
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

      {/* Domain selector bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-slate-700 font-mono uppercase">Select DNS Zone:</span>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800 font-semibold"
          >
            {domains.map((dom) => (
              <option key={dom} value={dom}>
                {dom}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadDns}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
          title="Reload DNS"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* DNS Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-[#0b1426] text-slate-300 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Name / Hostname</th>
              <th className="py-2.5 px-3">TTL</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Record / Destination</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-slate-800">
                  {rec.name}.{rec.domain}
                </td>
                <td className="py-2.5 px-3 text-slate-500">{rec.ttl}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rec.type === 'A' ? 'bg-sky-100 text-sky-800' :
                    rec.type === 'CNAME' ? 'bg-purple-100 text-purple-800' :
                    rec.type === 'MX' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {rec.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-700 truncate max-w-md">{rec.record}</td>
                <td className="py-2.5 px-3 text-slate-500">{rec.priority ?? '—'}</td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add DNS Record Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100">
              Add DNS Record to {selectedDomain}
            </h3>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Hostname / Name *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. sub, www, or @"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-l font-mono text-slate-800"
                  />
                  <span className="inline-flex items-center px-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r text-[11px] font-mono text-slate-500">
                    .{selectedDomain}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                    Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                  >
                    <option value="A">A (IPv4)</option>
                    <option value="AAAA">AAAA (IPv6)</option>
                    <option value="CNAME">CNAME (Alias)</option>
                    <option value="MX">MX (Mail Exchange)</option>
                    <option value="TXT">TXT (Text / SPF)</option>
                    <option value="NS">NS (Nameserver)</option>
                    <option value="SRV">SRV</option>
                    <option value="CAA">CAA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                    TTL (Seconds)
                  </label>
                  <input
                    type="number"
                    value={ttl}
                    onChange={(e) => setTtl(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                  Record Destination / Value *
                </label>
                <input
                  type="text"
                  required
                  value={recordVal}
                  onChange={(e) => setRecordVal(e.target.value)}
                  placeholder="e.g. 192.168.1.104 or target.domain.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                />
              </div>

              {type === 'MX' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono">
                    Priority (MX)
                  </label>
                  <input
                    type="number"
                    value={priority ?? 10}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-slate-800"
                  />
                </div>
              )}

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
                  disabled={saving || !recordVal.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
