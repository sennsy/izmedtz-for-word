import React, { useState } from 'react';
import {
  BarChart3,
  Files,
  Image as ImageIcon,
  Plus,
  Shapes,
  SlidersHorizontal,
  Type,
  X,
} from 'lucide-react';
import {
  createFreeformChart,
  createFreeformShape,
  createFreeformTextbox,
} from '../../../core/document/factories';
import { useStudioStore } from '../../../core/history/studioStore';
import { RightInspectorPanel } from '../panels/RightInspectorPanel';

export const MobileEditorBar: React.FC = () => {
  const {
    project,
    activePageIndex,
    setActivePageIndex,
    addPage,
    addFlowBlock,
    addFreeformObject,
  } = useStudioStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Compact Mobile Page Switcher Pill (above bottom bar) */}
      <div className="md:hidden fixed bottom-16 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 shadow-lg">
          <Files className="w-3.5 h-3.5 text-[#002FA7]" />
          <select
            value={activePageIndex}
            onChange={(e) => setActivePageIndex(Number(e.target.value))}
            className="text-xs font-mono bg-transparent text-zinc-900 dark:text-white focus:outline-none"
          >
            {project.pages.map((p, idx) => (
              <option key={p.id} value={idx}>
                Page {idx + 1}/{project.pages.length}: {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={addPage}
            className="ml-1 p-1 text-[#002FA7] font-bold"
            aria-label="Add Page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fixed Bottom Ergonomic Thumb Toolbar (< 15% viewport height) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-5 items-center z-30 select-none">
        <button
          onClick={() => addFlowBlock('paragraph')}
          className="min-h-[44px] flex flex-col items-center justify-center text-zinc-700 dark:text-zinc-300 active:text-[#002FA7]"
        >
          <Type className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">+ Flow</span>
        </button>

        <button
          onClick={() => addFreeformObject(createFreeformTextbox())}
          className="min-h-[44px] flex flex-col items-center justify-center text-zinc-700 dark:text-zinc-300 active:text-[#002FA7]"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Text Box</span>
        </button>

        <button
          onClick={() => addFreeformObject(createFreeformShape('rectangle'))}
          className="min-h-[44px] flex flex-col items-center justify-center text-zinc-700 dark:text-zinc-300 active:text-[#002FA7]"
        >
          <Shapes className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Shape</span>
        </button>

        <button
          onClick={() => addFreeformObject(createFreeformChart('bar'))}
          className="min-h-[44px] flex flex-col items-center justify-center text-zinc-700 dark:text-zinc-300 active:text-[#002FA7]"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[10px] font-medium mt-0.5">Chart</span>
        </button>

        <button
          onClick={() => setSheetOpen(true)}
          className="min-h-[44px] flex flex-col items-center justify-center text-[#002FA7] font-semibold"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Inspector</span>
        </button>
      </nav>

      {/* Slide-Up Contextual Bottom Sheet Inspector */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex flex-col justify-end">
          <div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 max-h-[76vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 mx-auto" />
              <button
                onClick={() => setSheetOpen(false)}
                className="p-1 text-zinc-500"
                aria-label="Close mobile inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RightInspectorPanel isMobileSheet />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
