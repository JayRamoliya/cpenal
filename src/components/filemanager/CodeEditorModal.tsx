import React, { useState, useEffect } from 'react';
import { Code, Save, X, Check, AlertCircle, FileCode } from 'lucide-react';
import { api } from '../../services/api';

interface CodeEditorModalProps {
  filePath: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
  filePath,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (isOpen && filePath) {
      loadFile();
    }
  }, [isOpen, filePath]);

  const loadFile = async () => {
    if (!filePath) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await api.getFilePreview(filePath);
      setContent(res.content || '');
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load file', isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !filePath) return null;

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      await api.saveFileContent(filePath, content);
      setStatusMessage({ text: 'File changes saved successfully!', isError: false });
      onSuccess();
      setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save changes', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const lines = content.split('\n');
  const lineCount = lines.length;
  const charCount = content.length;
  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-[#1e293b] rounded-xl shadow-2xl border border-slate-700 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-slate-100">
        {/* Editor Top Bar */}
        <div className="bg-[#0f172a] px-5 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-sky-600/30 text-sky-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white font-mono">{fileName}</span>
                <span className="text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                  UTF-8
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">{filePath}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {statusMessage && (
              <span
                className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 ${
                  statusMessage.isError
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                }`}
              >
                {statusMessage.isError ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{statusMessage.text}</span>
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content Area */}
        <div className="flex-1 flex overflow-hidden bg-[#0b1324] relative font-mono text-xs">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="animate-spin mr-2">◌</div>
              <span>Loading file contents from server...</span>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Line Numbers Column */}
              <div className="w-12 bg-[#080d19] py-3 text-slate-600 text-right pr-3 select-none border-r border-slate-800/80 font-mono text-xs leading-5">
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea Code Editor */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-transparent p-3 text-slate-200 outline-none resize-none overflow-auto font-mono text-xs leading-5 focus:ring-0 border-0"
              />
            </div>
          )}
        </div>

        {/* Editor Bottom Status Bar */}
        <div className="bg-[#0f172a] px-5 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
          <div className="flex items-center gap-4">
            <span>Lines: {lineCount}</span>
            <span>·</span>
            <span>Characters: {charCount}</span>
            <span>·</span>
            <span>Syntax: Code/Plaintext</span>
          </div>

          <div className="flex items-center gap-2">
            <span>cPanel Live File Editor</span>
          </div>
        </div>
      </div>
    </div>
  );
};
