import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  Moon,
  Printer,
  Redo2,
  Search,
  Sun,
  Undo2,
  WifiOff,
} from 'lucide-react';
import {
  createFreeformChart,
  createFreeformEmbed,
  createFreeformShape,
  createFreeformTable,
  createFreeformTextbox,
} from '../../../core/document/factories';
import { useStudioStore } from '../../../core/history/studioStore';
import { PWAInstallButton } from '../../../pwa/PWAInstallButton';
import { useOnlineStatus } from '../../../pwa/usePWAInstall';
import { unpackIzmFile } from '../../../storage/db/dexieDb';

type MenuName = 'file' | 'edit' | 'view' | 'insert' | 'format' | 'page' | 'help' | null;

export const TopMenuBar: React.FC = () => {
  const {
    project,
    activePageIndex,
    selectedFlowBlockId,
    selectedObjectIds,
    undoStack,
    redoStack,
    saveStatus,
    darkMode,
    zoom,
    showRulers,
    showGrid,
    snapEnabled,
    showMargins,
    showBleed,
    setView,
    toggleDarkMode,
    undo,
    redo,
    saveNow,
    duplicateCurrentProjectAsNew,
    loadProject,
    createAndOpenProject,
    addPage,
    duplicatePage,
    deletePage,
    updatePageSettings,
    addFlowBlock,
    updateFlowBlock,
    addFreeformObject,
    copySelected,
    cutSelected,
    pasteClipboard,
    duplicateSelectedObjects,
    deleteSelectedObjects,
    selectAllObjects,
    setZoom,
    resetView,
    toggleCanvasOption,
    setModal,
    setToast,
  } = useStudioStore();

  const isOnline = useOnlineStatus();
  const [openMenu, setOpenMenu] = useState<MenuName>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(project.title);
  }, [project.title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleOpenFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const unpacked = await unpackIzmFile(file);
      loadProject(unpacked);
      setToast(`Opened "${unpacked.title}" from ${file.name}`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to open .izm file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveAs = () => {
    const nextTitle = `${project.title} (Edition 2)`;
    duplicateCurrentProjectAsNew(nextTitle);
    setOpenMenu(null);
  };

  const activePage = project.pages[activePageIndex];
  const activeFlowBlock = activePage?.flowBlocks.find((b) => b.id === selectedFlowBlockId);

  const toggleFlowStyle = (key: 'fontWeight' | 'fontStyle' | 'textDecoration', val: string, fallback: string) => {
    if (activeFlowBlock) {
      const current = activeFlowBlock.style[key];
      updateFlowBlock(activeFlowBlock.id, {
        style: { [key]: current === val ? fallback : val },
      });
    } else if (selectedObjectIds.length > 0) {
      useStudioStore.getState().updateSelectedObjects({ [key]: val });
    }
    setOpenMenu(null);
  };

  const clearFormatting = () => {
    if (activeFlowBlock) {
      updateFlowBlock(activeFlowBlock.id, {
        style: {
          fontWeight: '400',
          fontStyle: 'normal',
          textDecoration: 'none',
          backgroundColor: undefined,
          color: '#050505',
        },
      });
    }
    setOpenMenu(null);
  };

  return (
    <header className="h-12 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-3 flex items-center justify-between gap-2 select-none z-30 shrink-0">
      {/* Left: Brand Wordmark + Back to Home + Menu Bar */}
      <div className="flex items-center gap-3 min-w-0" ref={menuContainerRef}>
        <button
          onClick={() => setView('home')}
          title="Return to Studio Home"
          className="flex items-center gap-2 pr-2 border-r border-zinc-200 dark:border-zinc-800 hover:text-[#002FA7] transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="font-extrabold tracking-tighter text-sm text-zinc-950 dark:text-white">
            izmedtzz
          </span>
        </button>

        {/* Editable Project Title */}
        {editingTitle ? (
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              setEditingTitle(false);
              if (titleDraft.trim()) {
                updatePageSettings({ title: titleDraft.trim() });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditingTitle(false);
                if (titleDraft.trim()) {
                  updatePageSettings({ title: titleDraft.trim() });
                }
              }
            }}
            autoFocus
            className="px-2 py-0.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 border border-[#002FA7] text-zinc-900 dark:text-white focus:outline-none w-44"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            title="Click to rename project"
            className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-[#002FA7] truncate max-w-[160px] cursor-pointer"
          >
            {project.title}
          </button>
        )}

        {/* Desktop Application Menus */}
        <nav className="hidden lg:flex items-center gap-0.5 text-xs text-zinc-700 dark:text-zinc-300 relative">
          {(
            [
              ['file', 'File'],
              ['edit', 'Edit'],
              ['view', 'View'],
              ['insert', 'Insert'],
              ['format', 'Format'],
              ['page', 'Page'],
              ['help', 'Help'],
            ] as const
          ).map(([id, label]) => (
            <div key={id} className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === id ? null : id)}
                className={`px-2.5 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer ${
                  openMenu === id ? 'bg-zinc-100 dark:bg-zinc-900 text-[#002FA7] font-semibold' : ''
                }`}
              >
                {label}
              </button>

              {openMenu === id && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 text-xs">
                  {id === 'file' && (
                    <>
                      <MenuButton
                        label="New Blank A4 Project"
                        onClick={() => {
                          createAndOpenProject({ preset: 'A4', orientation: 'portrait' });
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="New F4 Folio Project"
                        onClick={() => {
                          createAndOpenProject({ preset: 'F4', orientation: 'portrait' });
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label="Open / Import .izm Archive..."
                        onClick={() => {
                          fileInputRef.current?.click();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Save Now (IndexedDB)"
                        shortcut="Ctrl+S"
                        onClick={() => {
                          saveNow();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton label="Save As Copy" onClick={handleSaveAs} />
                      <MenuDivider />
                      <MenuButton
                        label="Export (.izm, PDF, DOCX, PPTX...)"
                        onClick={() => {
                          setModal('export', true);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Print & Calibrate..."
                        onClick={() => {
                          setModal('print', true);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label="Local Storage Vault..."
                        onClick={() => {
                          setModal('storage', true);
                          setOpenMenu(null);
                        }}
                      />
                    </>
                  )}

                  {id === 'edit' && (
                    <>
                      <MenuButton
                        label="Undo"
                        shortcut="Ctrl+Z"
                        onClick={() => {
                          undo();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Redo"
                        shortcut="Ctrl+Shift+Z"
                        onClick={() => {
                          redo();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label="Cut Object"
                        shortcut="Ctrl+X"
                        onClick={() => {
                          cutSelected();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Copy Object"
                        shortcut="Ctrl+C"
                        onClick={() => {
                          copySelected();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Paste Object"
                        shortcut="Ctrl+V"
                        onClick={() => {
                          pasteClipboard();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Duplicate Selected"
                        shortcut="Ctrl+D"
                        onClick={() => {
                          duplicateSelectedObjects();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Select All Freeform"
                        shortcut="Ctrl+A"
                        onClick={() => {
                          selectAllObjects();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Delete Selected"
                        shortcut="Del"
                        onClick={() => {
                          deleteSelectedObjects();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label="Find & Replace..."
                        shortcut="Ctrl+F"
                        onClick={() => {
                          setModal('search', true);
                          setOpenMenu(null);
                        }}
                      />
                    </>
                  )}

                  {id === 'view' && (
                    <>
                      <MenuButton
                        label={`Rulers (${showRulers ? 'On' : 'Off'})`}
                        onClick={() => {
                          toggleCanvasOption('showRulers');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label={`Canvas Grid (${showGrid ? 'On' : 'Off'})`}
                        onClick={() => {
                          toggleCanvasOption('showGrid');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label={`Smart Snapping (${snapEnabled ? 'On' : 'Off'})`}
                        onClick={() => {
                          toggleCanvasOption('snapEnabled');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label={`Margins Guide (${showMargins ? 'On' : 'Off'})`}
                        onClick={() => {
                          toggleCanvasOption('showMargins');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label={`Print Bleed Guide (${showBleed ? 'On' : 'Off'})`}
                        onClick={() => {
                          toggleCanvasOption('showBleed');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label="Zoom In (+15%)"
                        onClick={() => {
                          setZoom(zoom + 0.15);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Zoom Out (-15%)"
                        onClick={() => {
                          setZoom(zoom - 0.15);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Fit to Screen (85%)"
                        onClick={() => {
                          resetView();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label={darkMode ? 'Switch to Light Studio' : 'Switch to Dark Studio'}
                        onClick={() => {
                          toggleDarkMode();
                          setOpenMenu(null);
                        }}
                      />
                    </>
                  )}

                  {id === 'insert' && (
                    <>
                      <MenuButton
                        label="Flow Heading 1"
                        onClick={() => {
                          addFlowBlock('h1');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Flow Paragraph"
                        onClick={() => {
                          addFlowBlock('paragraph');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Flow Checklist"
                        onClick={() => {
                          addFlowBlock('checklist');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Flow Table (3×3)"
                        onClick={() => {
                          addFlowBlock('table');
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label="Freeform Text Box"
                        onClick={() => {
                          addFreeformObject(createFreeformTextbox());
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Freeform Shape (Rectangle)"
                        onClick={() => {
                          addFreeformObject(createFreeformShape('rectangle'));
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Freeform Table"
                        onClick={() => {
                          addFreeformObject(createFreeformTable(3, 3));
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Freeform Bar Chart"
                        onClick={() => {
                          addFreeformObject(createFreeformChart('bar'));
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Embed Reference Link"
                        onClick={() => {
                          addFreeformObject(createFreeformEmbed());
                          setOpenMenu(null);
                        }}
                      />
                    </>
                  )}

                  {id === 'format' && (
                    <>
                      <MenuButton
                        label="Bold"
                        onClick={() => toggleFlowStyle('fontWeight', '700', '400')}
                      />
                      <MenuButton
                        label="Italic"
                        onClick={() => toggleFlowStyle('fontStyle', 'italic', 'normal')}
                      />
                      <MenuButton
                        label="Underline"
                        onClick={() =>
                          toggleFlowStyle('textDecoration', 'underline', 'none')
                        }
                      />
                      <MenuButton
                        label="Strikethrough"
                        onClick={() =>
                          toggleFlowStyle('textDecoration', 'line-through', 'none')
                        }
                      />
                      <MenuDivider />
                      <MenuButton label="Clear Formatting" onClick={clearFormatting} />
                    </>
                  )}

                  {id === 'page' && (
                    <>
                      <MenuButton
                        label="Add New Page"
                        onClick={() => {
                          addPage();
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Duplicate Active Page"
                        onClick={() => {
                          duplicatePage(activePageIndex);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Delete Active Page"
                        onClick={() => {
                          deletePage(activePageIndex);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuDivider />
                      <MenuButton
                        label={`Switch to ${
                          project.orientation === 'portrait' ? 'Landscape' : 'Portrait'
                        }`}
                        onClick={() => {
                          updatePageSettings({
                            orientation:
                              project.orientation === 'portrait' ? 'landscape' : 'portrait',
                          });
                          setOpenMenu(null);
                        }}
                      />
                    </>
                  )}

                  {id === 'help' && (
                    <>
                      <MenuButton
                        label="Keyboard Shortcuts"
                        onClick={() => {
                          setModal('shortcuts', true);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuButton
                        label="Local Storage Vault"
                        onClick={() => {
                          setModal('storage', true);
                          setOpenMenu(null);
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <input
          ref={fileInputRef}
          type="file"
          accept=".izm,.gabung,.zip"
          onChange={handleOpenFileChange}
          className="hidden"
        />
      </div>

      {/* Right: Undo/Redo, Save Status, Search, Print, Theme, PWA Install, Export */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          title={`Undo (${undoStack.length} steps available)`}
          className="p-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-30 cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          title={`Redo (${redoStack.length} steps available)`}
          className="p-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-30 cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Persistence / Offline Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-zinc-500 border-l border-r border-zinc-200 dark:border-zinc-800">
          {!isOnline || saveStatus === 'offline' ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-600">Offline · Local</span>
            </>
          ) : saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#002FA7]" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved</span>
            </>
          )}
        </div>

        <button
          onClick={() => setModal('search', true)}
          title="Search & Replace (Ctrl+F)"
          className="p-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={() => setModal('print', true)}
          title="Print Preview & Calibration"
          className="hidden sm:inline-flex p-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
        </button>

        <button
          onClick={toggleDarkMode}
          title="Toggle Studio Theme"
          className="p-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="hidden md:inline-flex p-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        <div className="hidden xl:block">
          <PWAInstallButton compact />
        </div>

        <button
          onClick={() => setModal('export', true)}
          className="px-3.5 py-1.5 bg-[#002FA7] hover:bg-[#00227A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

const MenuButton: React.FC<{
  label: string;
  shortcut?: string;
  onClick: () => void;
}> = ({ label, shortcut, onClick }) => (
  <button
    onClick={onClick}
    className="w-full px-3.5 py-1.5 text-left flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 cursor-pointer"
  >
    <span>{label}</span>
    {shortcut && <span className="text-[10px] font-mono text-zinc-400">{shortcut}</span>}
  </button>
);

const MenuDivider: React.FC = () => (
  <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
);
