import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Download, Eye, Maximize2, RefreshCw } from 'lucide-react';
import { FileItem } from '../../types/cpanel';
import { api } from '../../services/api';

export const ImagesManager: React.FC = () => {
  const [images, setImages] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<FileItem | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      // Look inside /public_html/images first, and also scan /public_html
      const dirImages = await api.getFiles('/public_html/images').catch(() => null);
      const rootFiles = await api.getFiles('/public_html').catch(() => null);

      const found: FileItem[] = [];
      if (dirImages?.items) {
        found.push(...dirImages.items.filter((i) => i.category === 'image'));
      }
      if (rootFiles?.items) {
        found.push(...rootFiles.items.filter((i) => i.category === 'image'));
      }

      setImages(found);
      if (found.length > 0 && !selectedImage) {
        setSelectedImage(found[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-semibold">
              Media &amp; Assets
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-mono">cPanel Images Manager</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Images &amp; Web Graphics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View, inspect dimensions, and manage image assets hosted on your website.
          </p>
        </div>

        <button
          onClick={loadImages}
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Gallery</span>
        </button>
      </div>

      {/* Main Grid: Images Grid + Preview Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Gallery Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
              Website Image Assets ({images.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">PNG, SVG, JPG, WebP</span>
          </div>

          {images.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2 stroke-1" />
              <p>No image files detected in /public_html or /public_html/images.</p>
              <p className="mt-1">Upload images via the File Manager.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => {
                const isSelected = selectedImage?.name === img.name;
                return (
                  <div
                    key={img.name}
                    onClick={() => setSelectedImage(img)}
                    className={`rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-full h-28 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-2 mb-2">
                      <img
                        src={api.getImagePreviewUrl(img.displayPath)}
                        alt={img.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-800 font-mono truncate w-full text-center">
                      {img.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatSize(img.size)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Inspector */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono mb-4 pb-2 border-b border-slate-100">
            Image Details
          </h3>

          {selectedImage ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center min-h-48">
                <img
                  src={api.getImagePreviewUrl(selectedImage.displayPath)}
                  alt={selectedImage.name}
                  className="max-h-44 max-w-full object-contain drop-shadow-sm"
                />
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Filename</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedImage.name}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Server Location</span>
                  <span className="font-mono text-slate-600 break-all">{selectedImage.displayPath}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">File Size</span>
                    <span className="font-mono text-slate-700 font-semibold">{formatSize(selectedImage.size)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Permissions</span>
                    <span className="font-mono text-slate-700 font-semibold">{selectedImage.permissions}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={api.getDownloadUrl(selectedImage.displayPath)}
                  download
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select an image from the gallery to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
