import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  Sliders, 
  UserPlus, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';
import { HostingAccount, HostingPackage, WHMTab } from '../../types/cpanel';
import { api } from '../../services/api';

interface WhmListAccountsProps {
  onNavigate: (tab: WHMTab) => void;
  onImpersonate: (username: string, accountId: string) => void;
}

export const WhmListAccounts: React.FC<WhmListAccountsProps> = ({
  onNavigate,
  onImpersonate,
}) => {
  const [accounts, setAccounts] = useState<HostingAccount[]>([]);
  const [packages, setPackages] = useState<HostingPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action Modals
  const [packageModalTarget, setPackageModalTarget] = useState<HostingAccount | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [terminateTarget, setTerminateTarget] = useState<HostingAccount | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<{ account: HostingAccount; action: 'suspend' | 'unsuspend' } | null>(null);
  const [suspendReason, setSuspendReason] = useState('Payment Overdue / Admin Discretion');

  const [notification, setNotification] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchPackages();
  }, [search, filter, page, perPage]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.getWhmAccounts({ search, filter, page, perPage });
      setAccounts(res.accounts || []);
      setTotalRecords(res.totalRecords || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setNotification({ text: err.message || 'Failed to load accounts', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await api.getWhmPackages();
      setPackages(res.packages || []);
      if (res.packages && res.packages.length > 0) {
        setSelectedPackageId(res.packages[0].id);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map((a) => a.id));
    }
  };

  // Single Account Actions
  const handleConfirmStatusChange = async () => {
    if (!statusModalTarget) return;
    try {
      await api.setAccountStatus(
        statusModalTarget.account.id,
        statusModalTarget.action === 'suspend' ? 'suspended' : 'active',
        suspendReason
      );
      setNotification({
        text: `Account "${statusModalTarget.account.domain}" status updated to ${statusModalTarget.action}ed.`,
        isError: false,
      });
      setStatusModalTarget(null);
      fetchAccounts();
    } catch (err: any) {
      setNotification({ text: err.message || 'Status update failed', isError: true });
    }
  };

  const handleConfirmPackageChange = async () => {
    if (!packageModalTarget || !selectedPackageId) return;
    try {
      await api.changeAccountPackage(packageModalTarget.id, selectedPackageId);
      setNotification({
        text: `Account "${packageModalTarget.domain}" package updated successfully.`,
        isError: false,
      });
      setPackageModalTarget(null);
      fetchAccounts();
    } catch (err: any) {
      setNotification({ text: err.message || 'Package update failed', isError: true });
    }
  };

  const handleConfirmTerminate = async () => {
    if (!terminateTarget) return;
    try {
      await api.terminateAccount(terminateTarget.id);
      setNotification({
        text: `Account "${terminateTarget.domain}" terminated and filesystem wiped.`,
        isError: false,
      });
      setTerminateTarget(null);
      fetchAccounts();
    } catch (err: any) {
      setNotification({ text: err.message || 'Termination failed', isError: true });
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: 'suspend' | 'unsuspend' | 'change_package') => {
    if (selectedIds.length === 0) return;
    try {
      await api.bulkAccountAction(action, selectedIds, selectedPackageId);
      setNotification({
        text: `Bulk ${action} executed across ${selectedIds.length} accounts.`,
        isError: false,
      });
      setSelectedIds([]);
      fetchAccounts();
    } catch (err: any) {
      setNotification({ text: err.message || 'Bulk action failed', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              WHM Account Management
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">List Accounts</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Hosting Accounts Information</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, modify, suspend, upgrade, or directly access any hosted customer's cPanel.
          </p>
        </div>

        <button
          onClick={() => onNavigate('whm_create_account')}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 text-slate-950" />
          <span>Create a New Account</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            notification.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-700'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by domain, user, package, IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Accounts ({totalRecords})
          </button>
          <button
            onClick={() => {
              setFilter('active');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'active' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => {
              setFilter('suspended');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'suspended' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suspended
          </button>
        </div>

        {/* Per page selector */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
          <span>Show:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar (Appears when items are checked) */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-amber-900 font-mono">
            {selectedIds.length} account(s) selected
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('suspend')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Suspend Selected</span>
            </button>
            <button
              onClick={() => handleBulkAction('unsuspend')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Unsuspend Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Accounts Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-[#0b1426] text-slate-300 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-white cursor-pointer">
                    {selectedIds.length > 0 && selectedIds.length === accounts.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Domain</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3">Package</th>
                <th className="py-3 px-3">IP Address</th>
                <th className="py-3 px-3">Disk Usage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="animate-spin inline-block mr-2">◌</div>
                    <span>Querying account records...</span>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No hosting accounts match your query filter.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const isSelected = selectedIds.includes(acc.id);
                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(acc.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {acc.domain}
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        {acc.username}
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {acc.owner}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {acc.packageName}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {acc.ip}
                      </td>

                      <td className="py-3 px-3 text-slate-700 tabular-nums">
                        {acc.diskUsedMB} MB / {acc.diskLimitMB} MB
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          acc.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {acc.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Login to cPanel */}
                          <button
                            onClick={() => onImpersonate(acc.username, acc.id)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Directly launch this customer's cPanel session"
                          >
                            <span>cPanel</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          {/* Change Plan / Package */}
                          <button
                            onClick={() => {
                              setPackageModalTarget(acc);
                              setSelectedPackageId(acc.packageId);
                            }}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                            title="Change Plan / Package"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Unsuspend */}
                          {acc.status === 'active' ? (
                            <button
                              onClick={() => setStatusModalTarget({ account: acc, action: 'suspend' })}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Suspend Account"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatusModalTarget({ account: acc, action: 'unsuspend' })}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Unsuspend Account"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Terminate Account */}
                          <button
                            onClick={() => setTerminateTarget(acc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Terminate Account Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
          <div>
            Showing {accounts.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
            {Math.min(page * perPage, totalRecords)} of {totalRecords} accounts
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-800">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Suspend / Unsuspend Confirmation */}
      {statusModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {statusModalTarget.action === 'suspend' ? 'Suspend Account' : 'Unsuspend Account'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{statusModalTarget.account.domain}</p>
              </div>
            </div>

            {statusModalTarget.action === 'suspend' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                  Suspension Reason:
                </label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800"
                />
              </div>
            )}

            <p className="text-xs text-slate-600">
              {statusModalTarget.action === 'suspend'
                ? 'The customer will immediately lose cPanel access and public visitors will see a 403 Suspended page.'
                : 'Account services, web hosting directory, and cPanel login will be reactivated.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setStatusModalTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Confirm {statusModalTarget.action === 'suspend' ? 'Suspension' : 'Unsuspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Change Package / Upgrade / Downgrade */}
      {packageModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upgrade / Change Hosting Package</h3>
                <p className="text-xs text-slate-500 font-mono">{packageModalTarget.domain}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase">
                Select New Package:
              </label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-800"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.diskLimitMB}MB Disk / {pkg.bandwidthLimitMB}MB Bandwidth
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPackageModalTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPackageChange}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Apply Package Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Destructive Account Termination */}
      {terminateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-rose-300 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Terminate Account Permanently</h3>
                <p className="text-xs text-slate-500 font-mono">{terminateTarget.domain}</p>
              </div>
            </div>

            <p className="text-xs text-rose-700 leading-relaxed bg-rose-50 p-3 rounded border border-rose-200">
              WARNING: This will permanently delete user <code className="font-bold">{terminateTarget.username}</code>, remove their DNS zones, wipe their MySQL databases, and purge their entire <code className="font-bold">/home/{terminateTarget.username}</code> directory from disk. This cannot be undone!
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setTerminateTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTerminate}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Terminate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
