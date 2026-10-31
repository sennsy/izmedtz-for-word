import React, { useEffect, useRef, useState } from 'react';
import { Archive, Database, HardDrive, Trash2, Upload, X } from 'lucide-react';
import { IzmProject } from '../../core/document/types';
import { useStudioStore } from '../../core/history/studioStore';
import {
  cleanUnusedAssets,
  deleteProjectFromDb,
  exportFullBackupBlob,
  getStorageStats,
  listProjectsFromDb,
  restoreBackupFile,
  StorageStats,
} from '../../storage/db/dexieDb';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const StorageManagerModal: React.FC<{ onProjectsChanged?: () => void }> = ({
  onProjectsChanged,
}) => {
  const { showStorageModal, setModal, project, loadProject, setToast } = useStudioStore();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [projects, setProjects] = useState<IzmProject[]>([]);
  const [busy, setBusy] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const [st, projs] = await Promise.all([getStorageStats(), listProjectsFromDb()]);
    setStats(st);
    setProjects(projs);
  };

  useEffect(() => {
    if (showStorageModal) {
      refresh();
    }
  }, [showStorageModal]);

  if (!showStorageModal) return null;

  const handleCleanAssets = async () => {
    setBusy(true);
    try {
      const removed = await cleanUnusedAssets();
      await refresh();
      setToast(
        removed > 0
          ? `Cleaned ${removed} unused binary asset(s).`
          : 'No unused assets found — storage is clean.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    await deleteProjectFromDb(id);
    await refresh();
    onProjectsChanged?.();
    setToast(`Deleted "${title}" from IndexedDB.`);
  };

  const handleExportAll = async () => {
    setBusy(true);
    try {
      const blob = await exportFullBackupBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `izmedtzz-vault-backup-${new Date().toISOString().slice(0, 10)}.izm-backup.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast('Exported complete local vault backup.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await restoreBackupFile(file);
      await refresh();
      onProjectsChanged?.();
      setToast(`Restored ${res.projectsRestored} project(s) and ${res.assetsRestored} asset(s).`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to restore backup file.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const usagePercent = stats
    ? Math.min(100, Math.max(1, (stats.usedBytes / Math.max(1, stats.quotaBytes)) * 100))
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#002FA7]" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
              Local Storage Manager (IndexedDB + Dexie Vault)
            </h2>
          </div>
          <button
            onClick={() => setModal('storage', false)}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Metrics Strip */}
          <div className="grid grid-cols-3 gap-4 border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
            <div>
              <div className="text-[11px] font-mono text-zinc-500">USED STORAGE</div>
              <div className="text-lg font-bold font-mono tabular-nums text-zinc-950 dark:text-white mt-0.5">
                {stats ? formatBytes(stats.usedBytes) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-500">LOCAL PROJECTS</div>
              <div className="text-lg font-bold font-mono tabular-nums text-zinc-950 dark:text-white mt-0.5">
                {stats ? stats.projectCount : 0}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-500">BINARY ASSETS</div>
              <div className="text-lg font-bold font-mono tabular-nums text-zinc-950 dark:text-white mt-0.5">
                {stats ? stats.assetCount : 0}
              </div>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono tabular-nums text-zinc-500 mb-1.5">
              <span>IndexedDB Browser Quota Allocation</span>
              <span>
                {stats ? `${formatBytes(stats.usedBytes)} / ${formatBytes(stats.quotaBytes)}` : ''}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-[#002FA7] transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Vault Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCleanAssets}
              disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              Clear Unused Assets
            </button>
            <button
              onClick={handleExportAll}
              disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#050505] dark:bg-white text-white dark:text-[#050505] hover:bg-[#002FA7] dark:hover:bg-[#002FA7] dark:hover:text-white cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              Backup All Projects
            </button>
            <button
              onClick={() => restoreInputRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Restore Backup
            </button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".zip,.izm,.gabung"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </div>

          {/* Stored Projects List */}
          <div>
            <h3 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
              Stored Projects in IndexedDB ({projects.length})
            </h3>
            <div className="max-h-56 overflow-y-auto border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              {projects.length === 0 ? (
                <div className="p-4 text-xs text-zinc-500 text-center">
                  No saved projects in local database yet.
                </div>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {p.title}{' '}
                        {p.id === project.id && (
                          <span className="font-mono text-[10px] text-[#002FA7] ml-1">
                            · ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        {p.pages.length} page(s) · {p.pageSizePreset} · Updated{' '}
                        {new Date(p.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          loadProject(p);
                          setModal('storage', false);
                        }}
                        className="px-2.5 py-1 text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteProject(p.id, p.title)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 cursor-pointer"
                        title="Delete project from IndexedDB"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
