import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  Archive, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  RefreshCw, 
  FolderPlus, 
  FilePlus, 
  ArrowUp, 
  Search, 
  CheckSquare, 
  Square, 
  ArrowUpDown, 
  Shield, 
  Grid, 
  List, 
  ChevronRight,
  HardDrive,
  Copy,
  ExternalLink
} from 'lucide-react';
import { FileItem, DirectoryListing } from '../../types/cpanel';
import { api } from '../../services/api';
import { UploadModal } from './UploadModal';
import { NewFileModal } from './NewFileModal';
import { NewFolderModal } from './NewFolderModal';
import { RenameModal } from './RenameModal';
import { DeleteModal } from './DeleteModal';
import { CodeEditorModal } from './CodeEditorModal';
import { FilePreviewModal } from './FilePreviewModal';
import { PermissionsModal } from './PermissionsModal';

interface FileManagerProps {
  initialPath?: string;
  onRefreshStorage?: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ 
  initialPath = '/home/demo/public_html',
  onRefreshStorage 
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'mtime'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
  const [editorFile, setEditorFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ path: string; category: string } | null>(null);
  const [permissionsTarget, setPermissionsTarget] = useState<FileItem | null>(null);
  const [isCompressOpen, setIsCompressOpen] = useState(false);
  const [compressArchiveName, setCompressArchiveName] = useState('archive.zip');
  const [isExtractOpen, setIsExtractOpen] = useState(false);
  const [extractDestination, setExtractDestination] = useState('');
  const [modalActionLoading, setModalActionLoading] = useState(false);

  // Drag and drop upload over the table
  const [dragOverList, setDragOverList] = useState(false);

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath]);

  const fetchDirectory = async (targetPath: string) => {
    setLoading(true);
    setError(null);
    setSelectedNames([]);

    try {
      const data = await api.getFiles(targetPath);
      setListing(data);
      if (onRefreshStorage) onRefreshStorage();
    } catch (err: any) {
      setError(err.message || 'Failed to read directory');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (newPath: string) => {
    setCurrentPath(newPath);
  };

  const handleUpOneLevel = () => {
    if (listing?.parentPath) {
      navigateTo(listing.parentPath);
    }
  };

  // Toggle selection
  const toggleSelect = (name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedNames((prev) => 
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const toggleSelectAll = () => {
    if (!listing) return;
    if (selectedNames.length === filteredItems.length) {
      setSelectedNames([]);
    } else {
      setSelectedNames(filteredItems.map((item) => item.name));
    }
  };

  // Single active item for single-selection operations
  const singleSelectedItem = 
    selectedNames.length === 1 && listing 
      ? listing.items.find((item) => item.name === selectedNames[0]) || null 
      : null;

  // Sorting and Filtering
  const filteredItems = (listing?.items || []).filter((item) => {
    if (!searchQuery) return true;
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  filteredItems.sort((a, b) => {
    // Keep directories on top unless sorted strictly
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let comp = 0;
    if (sortBy === 'name') {
      comp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    } else if (sortBy === 'size') {
      comp = a.size - b.size;
    } else if (sortBy === 'mtime') {
      comp = new Date(a.mtime).getTime() - new Date(b.mtime).getTime();
    }

    return sortOrder === 'asc' ? comp : -comp;
  });

  const toggleSort = (field: 'name' | 'size' | 'mtime') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Double click handler
  const handleItemDoubleClick = (item: FileItem) => {
    if (item.isDirectory) {
      navigateTo(item.displayPath);
    } else if (item.category === 'code' || item.category === 'text') {
      setEditorFile(item.displayPath);
    } else {
      setPreviewFile({ path: item.displayPath, category: item.category });
    }
  };

  // Action handlers
  const handleDownload = () => {
    if (selectedNames.length === 0) return;
    const fullPaths = selectedNames.map((name) => `${currentPath}/${name}`);
    window.location.href = api.getDownloadUrl(fullPaths);
  };

  const handleDeletePrompt = () => {
    if (selectedNames.length === 0) return;
    const paths = selectedNames.map((name) => `${currentPath}/${name}`);
    setDeleteTargets(paths);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getItemIcon = (item: FileItem) => {
    if (item.isDirectory) {
      return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20 shrink-0" />;
    }
    const ext = item.extension.toLowerCase();
    if (['.html', '.php', '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.xml', '.sql'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-sky-600 shrink-0" />;
    }
    if (item.category === 'image') {
      return <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) {
      return <Archive className="w-5 h-5 text-purple-600 shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-slate-500 shrink-0" />;
  };

  // Breadcrumbs builder
  const breadcrumbParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-[750px]">
      {/* 1. cPanel Classic Action Toolbar */}
      <div className="bg-[#0f172a] text-slate-200 px-4 py-2.5 rounded-t-xl flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-1">
          {/* New File */}
          <button
            onClick={() => setIsNewFileOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white rounded transition-colors text-slate-300 cursor-pointer"
            title="Create New File"
          >
            <FilePlus className="w-3.5 h-3.5 text-sky-400" />
            <span>+ File</span>
          </button>

          {/* New Folder */}
          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white rounded transition-colors text-slate-300 cursor-pointer"
            title="Create New Directory"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Folder</span>
          </button>

          <span className="h-4 w-px bg-slate-700 mx-1"></span>

          {/* Upload */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors shadow-xs cursor-pointer"
            title="Upload Files to this folder"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={selectedNames.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Download Selected (Zips multiple items)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDeletePrompt}
            disabled={selectedNames.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-rose-950/60 hover:text-rose-300 disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Delete Selected Items"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </button>

          <span className="h-4 w-px bg-slate-700 mx-1"></span>

          {/* Rename */}
          <button
            onClick={() => singleSelectedItem && setRenameTarget(singleSelectedItem)}
            disabled={!singleSelectedItem}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Rename Item"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Rename</span>
          </button>

          {/* Edit (Code Editor) */}
          <button
            onClick={() => singleSelectedItem && !singleSelectedItem.isDirectory && setEditorFile(singleSelectedItem.displayPath)}
            disabled={!singleSelectedItem || singleSelectedItem.isDirectory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Edit in Code Editor"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit</span>
          </button>

          {/* View / Preview */}
          <button
            onClick={() => singleSelectedItem && setPreviewFile({ path: singleSelectedItem.displayPath, category: singleSelectedItem.category })}
            disabled={!singleSelectedItem || singleSelectedItem.isDirectory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Preview File"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>View</span>
          </button>

          {/* Permissions */}
          <button
            onClick={() => singleSelectedItem && setPermissionsTarget(singleSelectedItem)}
            disabled={!singleSelectedItem}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Change Unix Permissions"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Permissions</span>
          </button>

          {/* Compress to ZIP */}
          <button
            onClick={() => {
              setCompressArchiveName(`${selectedNames[0] || 'archive'}.zip`);
              setIsCompressOpen(true);
            }}
            disabled={selectedNames.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Compress Selected to ZIP"
          >
            <Archive className="w-3.5 h-3.5 text-purple-400" />
            <span>Compress</span>
          </button>

          {/* Extract ZIP Archive */}
          <button
            onClick={() => {
              setExtractDestination(currentPath);
              setIsExtractOpen(true);
            }}
            disabled={!singleSelectedItem || singleSelectedItem.isDirectory || !singleSelectedItem.name.toLowerCase().endsWith('.zip')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-800 hover:text-white disabled:opacity-40 rounded transition-colors text-slate-300 cursor-pointer"
            title="Extract ZIP Archive"
          >
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Extract</span>
          </button>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDirectory(currentPath)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'} transition-colors`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'} transition-colors`}
              title="Icon Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Path Breadcrumbs & Search Bar */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
          <button
            onClick={handleUpOneLevel}
            disabled={!listing?.parentPath}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors shrink-0"
            title="Up One Level"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 font-mono text-slate-600 whitespace-nowrap">
            <span 
              onClick={() => navigateTo('/home/demo')}
              className="hover:text-sky-600 hover:underline cursor-pointer font-semibold"
            >
              /
            </span>
            {breadcrumbParts.map((part, index) => {
              const fullStepPath = '/' + breadcrumbParts.slice(0, index + 1).join('/');
              const isLast = index === breadcrumbParts.length - 1;
              return (
                <React.Fragment key={index}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span
                    onClick={() => !isLast && navigateTo(fullStepPath)}
                    className={`${isLast ? 'text-slate-900 font-bold' : 'hover:text-sky-600 hover:underline cursor-pointer'}`}
                  >
                    {part}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Instant Search in Current Folder */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter current folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-mono"
          />
        </div>
      </div>

      {/* 3. Main File Directory Area with Drag-and-Drop Dropzone */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragOverList(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOverList(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverList(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setIsUploadOpen(true);
          }
        }}
        className={`flex-1 relative overflow-auto ${dragOverList ? 'bg-sky-50/70 border-2 border-dashed border-sky-500' : ''}`}
      >
        {dragOverList && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-sky-50/80 backdrop-blur-xs pointer-events-none text-sky-700">
            <Upload className="w-12 h-12 mb-2 animate-bounce" />
            <span className="font-bold text-sm">Drop files here to upload to {currentPath}</span>
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-rose-600 text-xs">
            <p className="font-semibold mb-1">Error Loading Directory</p>
            <p>{error}</p>
            <button
              onClick={() => navigateTo('/home/demo/public_html')}
              className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded text-xs"
            >
              Return to public_html
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs">
            <div className="animate-spin mb-2">◌</div>
            <span>Reading server directory...</span>
          </div>
        )}

        {!error && !loading && filteredItems.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Folder className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
            <p className="font-medium text-slate-600">This directory is currently empty</p>
            <p className="text-slate-400 mt-1">Upload files or create new files/folders above</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-3 py-1.5 bg-sky-600 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Upload File
              </button>
              <button
                onClick={() => setIsNewFileOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
              >
                Create File
              </button>
            </div>
          </div>
        )}

        {/* View Mode 1: Table List View (cPanel Standard) */}
        {!error && !loading && filteredItems.length > 0 && viewMode === 'list' && (
          <table className="w-full text-left text-xs border-collapse select-none">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10 font-semibold font-mono">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-700">
                    {selectedNames.length > 0 && selectedNames.length === filteredItems.length ? (
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th 
                  onClick={() => toggleSort('name')} 
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('size')} 
                  className="py-2.5 px-3 w-28 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Size</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('mtime')} 
                  className="py-2.5 px-3 w-44 cursor-pointer hover:bg-slate-100 transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Modified</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 w-24 text-center hidden md:table-cell">
                  Permissions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isSelected = selectedNames.includes(item.name);
                return (
                  <tr
                    key={item.name}
                    onClick={() => toggleSelect(item.name)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => toggleSelect(item.name, e)} className="text-slate-400 hover:text-slate-700">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2.5">
                        {getItemIcon(item)}
                        <span className="font-mono text-slate-800 truncate group-hover:text-sky-600">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-slate-600 tabular-nums">
                      {item.isDirectory ? '—' : formatSize(item.size)}
                    </td>

                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px] hidden sm:table-cell">
                      {formatDate(item.mtime)}
                    </td>

                    <td className="py-2 px-3 text-center font-mono text-slate-600 text-[11px] hidden md:table-cell">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.permissions}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* View Mode 2: Grid View */}
        {!error && !loading && filteredItems.length > 0 && viewMode === 'grid' && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedNames.includes(item.name);
              return (
                <div
                  key={item.name}
                  onClick={() => toggleSelect(item.name)}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                  className={`p-3 rounded-lg border flex flex-col items-center text-center cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="mb-2">
                    {item.isDirectory ? (
                      <Folder className="w-10 h-10 text-amber-500 fill-amber-500/20" />
                    ) : item.category === 'image' ? (
                      <ImageIcon className="w-10 h-10 text-emerald-600" />
                    ) : (
                      <FileText className="w-10 h-10 text-sky-600" />
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-800 truncate w-full" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">
                    {item.isDirectory ? 'Directory' : formatSize(item.size)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Bottom Status Bar */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span>{filteredItems.length} item(s)</span>
          <span>·</span>
          <span className="text-slate-700 font-medium">
            {selectedNames.length} selected
          </span>
          {selectedNames.length > 0 && listing && (
            <span className="text-slate-400">
              (
              {formatSize(
                listing.items
                  .filter((i) => selectedNames.includes(i.name))
                  .reduce((acc, curr) => acc + curr.size, 0)
              )}
              )
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Current Directory:</span>
          <span className="text-slate-800 font-semibold">{currentPath}</span>
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        currentPath={currentPath}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => fetchDirectory(currentPath)}
      />

      <NewFileModal
        currentPath={currentPath}
        isOpen={isNewFileOpen}
        onClose={() => setIsNewFileOpen(false)}
        onSuccess={() => fetchDirectory(currentPath)}
      />

      <NewFolderModal
        currentPath={currentPath}
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onSuccess={() => fetchDirectory(currentPath)}
      />

      <RenameModal
        currentPath={currentPath}
        item={renameTarget}
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        onSuccess={() => fetchDirectory(currentPath)}
      />

      <DeleteModal
        items={deleteTargets}
        isOpen={deleteTargets.length > 0}
        onClose={() => setDeleteTargets([])}
        onSuccess={() => fetchDirectory(currentPath)}
      />

      <CodeEditorModal
        filePath={editorFile}
        isOpen={!!editorFile}
        onClose={() => setEditorFile(null)}
        onSuccess={() => fetchDirectory(currentPath)}
      />

      <FilePreviewModal
        filePath={previewFile?.path || null}
        category={previewFile?.category || ''}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onOpenEditor={(p) => setEditorFile(p)}
      />

      <PermissionsModal
        item={permissionsTarget}
        isOpen={!!permissionsTarget}
        onClose={() => setPermissionsTarget(null)}
        onSuccess={(perms) => {
          if (permissionsTarget) {
            permissionsTarget.permissions = perms;
            setListing({ ...listing! });
          }
        }}
      />

      {/* Compress Modal */}
      {isCompressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-2">
              <Archive className="w-4 h-4 text-purple-600" />
              Compress {selectedNames.length} Selected File(s)
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono text-xs">
                Archive File Name (.zip)
              </label>
              <input
                type="text"
                value={compressArchiveName}
                onChange={(e) => setCompressArchiveName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs text-slate-800"
              />
              <span className="text-[11px] text-slate-400 mt-1 block font-mono">
                Will be created in: {currentPath}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsCompressOpen(false)}
                disabled={modalActionLoading}
                className="px-4 py-2 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setModalActionLoading(true);
                  try {
                    await api.compressFiles(currentPath, selectedNames, compressArchiveName);
                    setIsCompressOpen(false);
                    fetchDirectory(currentPath);
                  } finally {
                    setModalActionLoading(false);
                  }
                }}
                disabled={modalActionLoading || !compressArchiveName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs cursor-pointer"
              >
                {modalActionLoading ? 'Compressing...' : 'Compress Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extract Modal */}
      {isExtractOpen && singleSelectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-mono uppercase tracking-wide pb-2 border-b border-slate-100 flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-600" />
              Extract Archive: {singleSelectedItem.name}
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase font-mono text-xs">
                Extract Destination Directory
              </label>
              <input
                type="text"
                value={extractDestination}
                onChange={(e) => setExtractDestination(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs text-slate-800"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsExtractOpen(false)}
                disabled={modalActionLoading}
                className="px-4 py-2 border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setModalActionLoading(true);
                  try {
                    await api.extractZip(singleSelectedItem.displayPath, extractDestination);
                    setIsExtractOpen(false);
                    fetchDirectory(currentPath);
                  } finally {
                    setModalActionLoading(false);
                  }
                }}
                disabled={modalActionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs cursor-pointer"
              >
                {modalActionLoading ? 'Extracting...' : 'Extract File(s)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
