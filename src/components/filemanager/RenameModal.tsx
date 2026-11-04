import React, { useState, useEffect } from 'react';
import { Edit2, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface RenameModalProps {
  currentPath: string;
  item: { name: string; isDirectory: boolean } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  currentPath,
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setNewName(item.name);
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === item.name) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.renameItem(currentPath, item.name, newName.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm">
              Rename {item.isDirectory ? 'Folder' : 'File'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase tracking-wide">
              Current Name: <span className="font-normal text-slate-500">{item.name}</span>
            </label>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase tracking-wide mt-3">
              New Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim() || newName === item.name}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
