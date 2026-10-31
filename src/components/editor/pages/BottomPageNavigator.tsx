import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Maximize,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useStudioStore } from '../../../core/history/studioStore';

export const BottomPageNavigator: React.FC = () => {
  const {
    project,
    activePageIndex,
    zoom,
    setActivePageIndex,
    addPage,
    duplicatePage,
    deletePage,
    reorderPage,
    setZoom,
    resetView,
  } = useStudioStore();

  return (
    <footer className="hidden md:flex h-11 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-4 items-center justify-between gap-4 select-none z-20 shrink-0">
      {/* Left: Page Filmstrip Pills & Reorder Controls */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {project.pages.map((pg, idx) => {
          const isActive = idx === activePageIndex;
          return (
            <div
              key={pg.id}
              onClick={() => setActivePageIndex(idx)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'border-[#002FA7] bg-[#002FA7] text-white font-semibold'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              <span className="font-mono text-[11px] tabular-nums">{idx + 1}</span>
              <span className="truncate max-w-[90px]">{pg.name}</span>

              {isActive && (
                <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-white/30">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPage(idx, idx - 1);
                      }}
                      title="Move Page Left"
                      className="p-0.5 hover:bg-white/20"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {idx < project.pages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPage(idx, idx + 1);
                      }}
                      title="Move Page Right"
                      className="p-0.5 hover:bg-white/20"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicatePage(idx);
                    }}
                    title="Duplicate Page"
                    className="p-0.5 hover:bg-white/20"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {project.pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(idx);
                      }}
                      title="Delete Page"
                      className="p-0.5 hover:bg-white/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={addPage}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] text-zinc-700 dark:text-zinc-300 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Page</span>
        </button>
      </div>

      {/* Right: Page Dimensions & Zoom Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[11px] font-mono tabular-nums text-zinc-500">
          {project.pageSizePreset} · {project.dimensionsMm.width}×{project.dimensionsMm.height} mm ·{' '}
          {project.orientation}
        </span>

        <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-3">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={25}
            max={250}
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-24 accent-[#002FA7] cursor-pointer"
          />
          <span className="w-11 text-right text-xs font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="ml-1 px-2 py-1 text-[11px] font-mono border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] text-zinc-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
            title="Fit to screen"
          >
            <Maximize className="w-3 h-3" /> Fit
          </button>
        </div>
      </div>
    </footer>
  );
};
