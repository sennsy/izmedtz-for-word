import React, { useMemo, useState } from 'react';
import { ArrowRight, Replace, Search, X } from 'lucide-react';
import { useStudioStore } from '../../core/history/studioStore';

export const SearchReplaceModal: React.FC = () => {
  const {
    showSearchModal,
    setModal,
    project,
    searchProject,
    replaceInProject,
    setActivePageIndex,
    selectFlowBlock,
    selectObject,
    setToast,
  } = useStudioStore();

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');

  const results = useMemo(() => {
    if (!showSearchModal || !query.trim()) return [];
    return searchProject(query);
  }, [showSearchModal, query, project, searchProject]);

  const wordStats = useMemo(() => {
    let words = 0;
    let chars = 0;
    for (const page of project.pages) {
      for (const b of page.flowBlocks) {
        const text =
          b.type === 'checklist' && b.items
            ? b.items.map((i) => i.text).join(' ')
            : b.type === 'table' && b.table
            ? b.table.cells.flatMap((r) => r.map((c) => c.content)).join(' ')
            : b.content || '';
        chars += text.length;
        const w = text.trim().split(/\s+/).filter(Boolean);
        words += w.length;
      }
      for (const o of page.freeformObjects) {
        const text = o.text || o.chartTitle || '';
        chars += text.length;
        const w = text.trim().split(/\s+/).filter(Boolean);
        words += w.length;
      }
    }
    return { words, chars };
  }, [project]);

  if (!showSearchModal) return null;

  const handleJump = (r: (typeof results)[number]) => {
    setActivePageIndex(r.pageIndex);
    if (r.targetType === 'flow') {
      selectFlowBlock(r.targetId);
    } else {
      selectObject(r.targetId, false);
    }
  };

  const handleReplace = (all: boolean) => {
    const count = replaceInProject(query, replacement, all);
    setToast(
      count > 0
        ? `Replaced ${count} occurrence${count > 1 ? 's' : ''}.`
        : 'No matching occurrences found.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-16 p-4">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#002FA7]" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
              Project Search, Replace & Word Count
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono tabular-nums text-zinc-500">
              {wordStats.words} words · {wordStats.chars} chars
            </span>
            <button
              onClick={() => setModal('search', false)}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              aria-label="Close search dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Find across all pages
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search text, tables, or objects..."
                autoFocus
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#002FA7]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Replace with
              </label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Replacement text..."
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#002FA7]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
              {query.trim()
                ? `${results.length} result${results.length === 1 ? '' : 's'} found`
                : 'Enter a search term to scan all pages'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReplace(false)}
                disabled={!query.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-[#002FA7] disabled:opacity-40 cursor-pointer"
              >
                <Replace className="w-3.5 h-3.5" />
                Replace One
              </button>
              <button
                onClick={() => handleReplace(true)}
                disabled={!query.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#002FA7] text-white hover:bg-[#00227A] disabled:opacity-40 cursor-pointer"
              >
                Replace All
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border-t border-zinc-200 dark:border-zinc-800 pt-3 divide-y divide-zinc-100 dark:divide-zinc-900">
            {results.map((r, idx) => (
              <button
                key={`${r.targetId}_${idx}`}
                onClick={() => handleJump(r)}
                className="w-full text-left py-2.5 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-zinc-500">
                    {r.pageName} · {r.targetType === 'flow' ? 'Flow Document' : 'Freeform Object'}
                  </div>
                  <div className="text-xs text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                    {r.preview}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#002FA7] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
