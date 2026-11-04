import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface DeleteModalProps {
  items: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  items,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || items.length === 0) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.deleteItems(items);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-rose-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-rose-900">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-sm">
              Confirm Delete ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-700 font-medium">
                Are you sure you want to permanently delete these items from the server? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto font-mono text-xs text-slate-700 space-y-1">
            {items.map((item, i) => (
              <div key={i} className="truncate">
                • {item}
              </div>
            ))}
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
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Deleting...' : 'Delete Permanently'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
