import React, { useState, useEffect } from 'react';
import { Shield, X, Check } from 'lucide-react';

interface PermissionsModalProps {
  item: { name: string; permissions: string; isDirectory: boolean } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPermissions: string) => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [userR, setUserR] = useState(true);
  const [userW, setUserW] = useState(true);
  const [userX, setUserX] = useState(false);

  const [groupR, setGroupR] = useState(true);
  const [groupW, setGroupW] = useState(false);
  const [groupX, setGroupX] = useState(false);

  const [worldR, setWorldR] = useState(true);
  const [worldW, setWorldW] = useState(false);
  const [worldX, setWorldX] = useState(false);

  useEffect(() => {
    if (item) {
      const isDir = item.isDirectory;
      if (item.permissions === '0755' || isDir) {
        setUserR(true); setUserW(true); setUserX(true);
        setGroupR(true); setGroupW(false); setGroupX(true);
        setWorldR(true); setWorldW(false); setWorldX(true);
      } else {
        setUserR(true); setUserW(true); setUserX(false);
        setGroupR(true); setGroupW(false); setGroupX(false);
        setWorldR(true); setWorldW(false); setWorldX(false);
      }
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const calculateOctal = (): string => {
    const u = (userR ? 4 : 0) + (userW ? 2 : 0) + (userX ? 1 : 0);
    const g = (groupR ? 4 : 0) + (groupW ? 2 : 0) + (groupX ? 1 : 0);
    const w = (worldR ? 4 : 0) + (worldW ? 2 : 0) + (worldX ? 1 : 0);
    return `0${u}${g}${w}`;
  };

  const handleSave = () => {
    onSuccess(calculateOctal());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm">Change Permissions</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Selected Item:</span>
            <span className="font-semibold text-slate-800 font-mono text-sm">{item.name}</span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="p-2.5">Scope</th>
                  <th className="p-2.5 text-center">Read</th>
                  <th className="p-2.5 text-center">Write</th>
                  <th className="p-2.5 text-center">Execute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-medium text-slate-800">User / Owner</td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={userR} onChange={(e) => setUserR(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={userW} onChange={(e) => setUserW(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={userX} onChange={(e) => setUserX(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                </tr>

                <tr>
                  <td className="p-2.5 font-medium text-slate-800">Group</td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={groupR} onChange={(e) => setGroupR(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={groupW} onChange={(e) => setGroupW(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={groupX} onChange={(e) => setGroupX(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                </tr>

                <tr>
                  <td className="p-2.5 font-medium text-slate-800">World / Public</td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={worldR} onChange={(e) => setWorldR(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={worldW} onChange={(e) => setWorldW(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" checked={worldX} onChange={(e) => setWorldX(e.target.checked)} className="rounded text-sky-600" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Calculated Permission Mode:</span>
            <span className="font-mono font-bold text-sky-700 text-sm bg-white px-2.5 py-1 rounded border border-slate-200">
              {calculateOctal()}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Change Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
