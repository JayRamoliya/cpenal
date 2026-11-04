import React, { useState, useEffect } from 'react';
import { Eye, Download, X, Copy, Check, Edit3, Image as ImageIcon, FileText } from 'lucide-react';
import { api } from '../../services/api';

interface FilePreviewModalProps {
  filePath: string | null;
  category: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditor?: (filePath: string) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  filePath,
  category,
  isOpen,
  onClose,
  onOpenEditor,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ size?: number; mtime?: string }>({});

  const isImage = category === 'image';
  const fileName = filePath ? filePath.split('/').pop() || filePath : '';

  useEffect(() => {
    if (isOpen && filePath && !isImage) {
      loadFile();
    }
  }, [isOpen, filePath, isImage]);

  const loadFile = async () => {
    if (!filePath) return;
    setLoading(true);
    try {
      const res = await api.getFilePreview(filePath);
      setContent(res.content || '');
      setFileDetails({ size: res.size });
    } catch {
      setContent('Unable to display file preview.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !filePath) return null;

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {isImage ? (
              <ImageIcon className="w-4 h-4 text-emerald-400" />
            ) : (
              <FileText className="w-4 h-4 text-sky-400" />
            )}
            <div>
              <h3 className="font-semibold text-sm font-mono">{fileName}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{filePath}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isImage && onOpenEditor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditor(filePath);
                }}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit File</span>
              </button>
            )}

            {!isImage && content && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <a
              href={api.getDownloadUrl(filePath)}
              download
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center">
          {isImage ? (
            <div className="flex flex-col items-center justify-center p-4">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm max-w-full">
                <img
                  src={api.getImagePreviewUrl(filePath)}
                  alt={fileName}
                  className="max-h-[60vh] max-w-full object-contain rounded"
                />
              </div>
              <span className="mt-3 text-xs text-slate-500 font-mono">
                Asset Path: {filePath}
              </span>
            </div>
          ) : loading ? (
            <div className="text-slate-400 text-xs py-12 flex items-center gap-2">
              <span className="animate-spin">◌</span>
              <span>Loading preview...</span>
            </div>
          ) : (
            <div className="w-full h-full bg-[#0b1324] text-slate-200 p-4 rounded-lg font-mono text-xs overflow-auto border border-slate-800">
              <pre className="whitespace-pre-wrap">{content}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
