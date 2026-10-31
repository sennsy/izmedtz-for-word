import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Database,
  Download,
  FilePlus2,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import {
  IzmProject,
  IzmRecoverySnapshot,
  PAGE_PRESETS_MM,
  PageOrientation,
  PageSizePreset,
} from '../../core/document/types';
import { exportProject } from '../../core/export/exportEngine';
import { useStudioStore } from '../../core/history/studioStore';
import { BUILTIN_TEMPLATES } from '../../core/templates/builtinTemplates';
import { PWAInstallButton } from '../../pwa/PWAInstallButton';
import {
  deleteProjectFromDb,
  discardRecoverySnapshot,
  getRecoverySnapshots,
  listProjectsFromDb,
  unpackIzmFile,
} from '../../storage/db/dexieDb';

export const StudioHomeView: React.FC = () => {
  const {
    createAndOpenProject,
    loadProject,
    setModal,
    setToast,
  } = useStudioStore();

  const [savedProjects, setSavedProjects] = useState<IzmProject[]>([]);
  const [recoveryList, setRecoveryList] = useState<IzmRecoverySnapshot[]>([]);
  const [templateFilter, setTemplateFilter] = useState<
    'all' | 'document' | 'creative' | 'presentation'
  >('all');
  const [selectedOrientation, setSelectedOrientation] =
    useState<PageOrientation>('portrait');
  const [customW, setCustomW] = useState(210);
  const [customH, setCustomH] = useState(297);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  const refreshLocalData = async () => {
    const [projs, recs] = await Promise.all([
      listProjectsFromDb(),
      getRecoverySnapshots(),
    ]);
    setSavedProjects(projs);
    setRecoveryList(recs);
  };

  useEffect(() => {
    refreshLocalData();
  }, []);

  const handleImportIzm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const unpacked = await unpackIzmFile(file);
      loadProject(unpacked);
      setToast(`Imported "${unpacked.title}" from ${file.name}`);
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : 'Invalid or corrupt .izm project archive.'
      );
    } finally {
      e.target.value = '';
    }
  };

  const filteredTemplates =
    templateFilter === 'all'
      ? BUILTIN_TEMPLATES
      : BUILTIN_TEMPLATES.filter((t) => t.category === templateFilter);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] text-[#050505] dark:text-[#FAFAFA] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 md:px-12 py-5 border-b border-zinc-200 dark:border-zinc-900">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-xl font-extrabold tracking-tighter text-[#050505] dark:text-white whitespace-nowrap shrink-0"
        >
          izmedtzz
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <a
            href="#presets"
            className="hover:text-[#050505] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Page Formats
          </a>
          <a
            href="#vault"
            className="hover:text-[#050505] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Local Vault
          </a>
          <a
            href="#templates"
            className="hover:text-[#050505] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Templates
          </a>
          <button
            onClick={() => setModal('storage', true)}
            className="hover:text-[#050505] dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Storage Quota
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() =>
              createAndOpenProject({ preset: 'A4', orientation: 'portrait' })
            }
            className="px-4 py-2 text-xs font-semibold text-white bg-[#002FA7] hover:bg-[#00227A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            New Studio Document
          </button>
        </div>
      </header>

      {/* Crash Recovery Alert Banner (if any uncommitted snapshot exists) */}
      {recoveryList.length > 0 && (
        <div className="px-6 md:px-12 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Crash Recovery Available:</strong> Unsaved studio session for{' '}
              “{recoveryList[0].projectTitle}” recorded at{' '}
              {new Date(recoveryList[0].timestamp).toLocaleTimeString()}.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadProject(recoveryList[0].projectData)}
              className="px-3 py-1 bg-[#002FA7] text-white text-xs font-semibold cursor-pointer"
            >
              Recover Session
            </button>
            <button
              onClick={async () => {
                await discardRecoverySnapshot(recoveryList[0].projectId);
                refreshLocalData();
              }}
              className="px-3 py-1 border border-amber-400 text-xs font-medium cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Editorial Hero Section */}
      <section className="px-6 md:px-12 py-14 md:py-20 border-b border-zinc-200 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-zinc-500 tracking-tight mb-4">
                LOCAL-FIRST VISUAL DOCUMENT CREATION STUDIO · .IZM ARCHIVE ENGINE
              </div>
              <h1
                style={{ textWrap: 'balance' }}
                className="text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.03] text-[#050505] dark:text-white"
              >
                Write like a document editor. Design like a visual studio.
              </h1>
              <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                One hybrid page engine uniting structured rich-text manuscripts, multi-cell tables, and freeform spatial graphics. Stored 100% locally in IndexedDB with zero accounts and canonical <code>.izm</code> project archives.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                onClick={() =>
                  createAndOpenProject({
                    preset: 'A4',
                    orientation: selectedOrientation,
                  })
                }
                className="px-6 py-3 bg-[#050505] dark:bg-white text-white dark:text-[#050505] hover:bg-[#002FA7] dark:hover:bg-[#002FA7] dark:hover:text-white text-xs font-semibold tracking-tight flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>Create Blank A4 Project</span>
              </button>

              <button
                onClick={() => importFileInputRef.current?.click()}
                className="px-5 py-3 border border-zinc-300 dark:border-zinc-800 hover:border-[#002FA7] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-[#002FA7]" />
                <span>Open .izm Archive</span>
              </button>

              <button
                onClick={() => setModal('storage', true)}
                className="px-4 py-3 border border-zinc-300 dark:border-zinc-800 hover:border-[#002FA7] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Local Storage Vault</span>
              </button>

              <PWAInstallButton />

              <input
                ref={importFileInputRef}
                type="file"
                accept=".izm,.gabung,.zip"
                onChange={handleImportIzm}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Editorial Interactive Specification Plate */}
          <div className="lg:col-span-4 border border-zinc-900 dark:border-zinc-700 bg-[#050505] text-white p-7 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>HYBRID ENGINE ARCHITECTURE</span>
              <span>IKB #002FA7</span>
            </div>

            <div className="my-8 space-y-4">
              <div className="border-t border-zinc-800 pt-3">
                <div className="text-xs font-mono text-zinc-400">01. FLOW OBJECTS</div>
                <div className="text-sm font-semibold mt-1">
                  H1–H6 · Prose · Quotes · Checklists · Footnotes · Tables
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <div className="text-xs font-mono text-zinc-400">02. FREEFORM OBJECTS</div>
                <div className="text-sm font-semibold mt-1">
                  Spatial Text · 14 Vector Shapes · Masks · Live Charts · SVG
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <div className="text-xs font-mono text-zinc-400">03. MULTI-FORMAT PIPELINE</div>
                <div className="text-sm font-semibold mt-1">
                  Canonical .izm · PDF · SVG · PNG/JPG/WEBP · DOCX · PPTX
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between pt-3 border-t border-zinc-800">
              <span>100% OFFLINE CAPABLE</span>
              <span>ZERO CLOUD LOCK-IN</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Page Format Presets & Custom Dimensions */}
      <section
        id="presets"
        className="px-6 md:px-12 py-12 border-b border-zinc-200 dark:border-zinc-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                01. Start from Calibrated Page Standard
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                ISO and North American print dimensions with full margin, bleed, and safe-area calibration.
              </p>
            </div>

            {/* Orientation Switcher */}
            <div className="flex items-center gap-1 p-1 bg-zinc-200/70 dark:bg-zinc-900">
              {(['portrait', 'landscape'] as PageOrientation[]).map((ori) => (
                <button
                  key={ori}
                  onClick={() => setSelectedOrientation(ori)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    selectedOrientation === ori
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {ori}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(
              [
                ['A4', 'Standard Document'],
                ['F4', 'Folio Legal Southeast Asia'],
                ['Letter', 'US Letter Standard'],
                ['Legal', 'US Legal Contract'],
                ['A5', 'Monograph Booklet'],
              ] as [Exclude<PageSizePreset, 'Custom'>, string][]
            ).map(([preset, desc]) => {
              const dims = PAGE_PRESETS_MM[preset];
              return (
                <button
                  key={preset}
                  onClick={() =>
                    createAndOpenProject({
                      title: `Untitled ${preset} Project`,
                      preset,
                      orientation: selectedOrientation,
                    })
                  }
                  className="group text-left p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] transition-colors flex flex-col justify-between h-40 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold tracking-tight">
                      {preset}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#002FA7] transition-colors" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {desc}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-zinc-500 mt-1">
                      {selectedOrientation === 'portrait'
                        ? `${dims.width} × ${dims.height} mm`
                        : `${dims.height} × ${dims.width} mm`}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Custom Size Launcher */}
            <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-40">
              <div className="text-xs font-bold tracking-tight">Custom Size (mm)</div>
              <div className="grid grid-cols-2 gap-1.5 my-1">
                <input
                  type="number"
                  value={customW}
                  onChange={(e) => setCustomW(Number(e.target.value) || 210)}
                  className="px-2 py-1 text-xs font-mono tabular-nums border border-zinc-300 dark:border-zinc-700 bg-transparent"
                  title="Custom Width (mm)"
                />
                <input
                  type="number"
                  value={customH}
                  onChange={(e) => setCustomH(Number(e.target.value) || 297)}
                  className="px-2 py-1 text-xs font-mono tabular-nums border border-zinc-300 dark:border-zinc-700 bg-transparent"
                  title="Custom Height (mm)"
                />
              </div>
              <button
                onClick={() =>
                  createAndOpenProject({
                    title: `Custom ${customW}×${customH}mm Project`,
                    preset: 'Custom',
                    orientation: selectedOrientation,
                    customDimensionsMm: { width: customW, height: customH },
                  })
                }
                className="w-full py-1.5 bg-[#002FA7] text-white text-xs font-semibold hover:bg-[#00227A] cursor-pointer"
              >
                Create Custom
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Recent Local Projects Vault */}
      <section
        id="vault"
        className="px-6 md:px-12 py-12 border-b border-zinc-200 dark:border-zinc-900"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                02. Local Project Vault ({savedProjects.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Persisted automatically in browser IndexedDB via Dexie. Export any project to <code>.izm</code> for permanent file archiving.
              </p>
            </div>
          </div>

          {savedProjects.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-300 dark:border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">
                Your local IndexedDB vault has no saved projects yet. Select any page preset above or template below to begin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => loadProject(proj)}
                  className="group p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] transition-colors flex flex-col justify-between h-40 cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white group-hover:text-[#002FA7] truncate">
                        {proj.title}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                        {proj.pageSizePreset}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      <span>{proj.pages.length} page(s)</span>
                      <span aria-hidden="true"> · </span>
                      <span className="capitalize">{proj.orientation}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {proj.pages.reduce((s, p) => s + p.flowBlocks.length, 0)} flow blocks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-900">
                    <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                      Edited {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportProject(proj, 'izm', 0);
                        }}
                        className="px-2 py-1 text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] flex items-center gap-1"
                        title="Download .izm archive"
                      >
                        <Download className="w-3 h-3" /> .izm
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteProjectFromDb(proj.id);
                          refreshLocalData();
                          setToast(`Deleted "${proj.title}"`);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-600"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Curated Local Studio Templates */}
      <section id="templates" className="px-6 md:px-12 py-12 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                03. Built-In Studio Templates ({BUILTIN_TEMPLATES.length})
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Zero-server local templates across Documents, Creative Prints, and Presentation Slides.
              </p>
            </div>

            {/* Interactive Category Filter Control */}
            <div className="flex items-center gap-1 p-1 bg-zinc-200/70 dark:bg-zinc-900">
              {(
                [
                  ['all', 'All (22)'],
                  ['document', 'Documents (8)'],
                  ['creative', 'Creative (6)'],
                  ['presentation', 'Presentation (8)'],
                ] as const
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  onClick={() => setTemplateFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    templateFilter === cat
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => loadProject(tpl.build())}
                className="group text-left p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] transition-colors flex flex-col justify-between h-44 cursor-pointer"
              >
                <div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    <span>{tpl.subcategory}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{tpl.preset}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="capitalize">{tpl.orientation}</span>
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white mt-1.5 group-hover:text-[#002FA7]">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="text-xs font-semibold text-[#002FA7] flex items-center gap-1 pt-2">
                  <span>Use Template</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div>
          <span>izmedtzz (izm) — Local-First Visual Document Creation Studio</span>
          <span aria-hidden="true"> · </span>
          <span>Canonical .izm Format</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setModal('shortcuts', true)}
            className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            Keyboard Shortcuts
          </button>
          <button
            onClick={() => setModal('storage', true)}
            className="hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            IndexedDB Vault
          </button>
        </div>
      </footer>
    </div>
  );
};
