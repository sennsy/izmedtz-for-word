import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { useStudioStore } from '../../core/history/studioStore';

const SHORTCUTS = [
  { keys: 'Ctrl + Z', action: 'Undo last transaction' },
  { keys: 'Ctrl + Shift + Z', action: 'Redo transaction' },
  { keys: 'Ctrl + S', action: 'Force immediate save to IndexedDB' },
  { keys: 'Ctrl + F / Ctrl + H', action: 'Find & Replace across all pages' },
  { keys: 'Ctrl + C / Ctrl + X / Ctrl + V', action: 'Copy, Cut, and Paste selected objects' },
  { keys: 'Ctrl + D', action: 'Duplicate selected object(s)' },
  { keys: 'Ctrl + A', action: 'Select all unlocked freeform objects on page' },
  { keys: 'Ctrl + G / Ctrl + Shift + G', action: 'Group / Ungroup selected objects' },
  { keys: 'Delete / Backspace', action: 'Delete selected freeform object(s)' },
  { keys: 'Arrow Keys', action: 'Nudge selected object by 1px' },
  { keys: 'Shift + Arrow Keys', action: 'Nudge selected object by 10px' },
  { keys: 'Alt + Drag', action: 'Duplicate object while dragging on canvas' },
  { keys: '] / [', action: 'Bring forward / Send backward in layer tree' },
];

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, setModal } = useStudioStore();

  if (!showShortcutsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[#002FA7]" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
              Keyboard Shortcuts & Studio Controls
            </h2>
          </div>
          <button
            onClick={() => setModal('shortcuts', false)}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 divide-y divide-zinc-100 dark:divide-zinc-900 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">{s.action}</span>
              <kbd className="px-2 py-1 text-[11px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shrink-0">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
