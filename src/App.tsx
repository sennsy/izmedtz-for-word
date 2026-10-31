/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ExportModal } from './components/dialogs/ExportModal';
import { PrintPreviewModal } from './components/dialogs/PrintPreviewModal';
import { SearchReplaceModal } from './components/dialogs/SearchReplaceModal';
import { ShortcutsModal } from './components/dialogs/ShortcutsModal';
import { StorageManagerModal } from './components/dialogs/StorageManagerModal';
import { HybridCanvasWorkspace } from './components/editor/canvas/HybridCanvasWorkspace';
import { BottomPageNavigator } from './components/editor/pages/BottomPageNavigator';
import { RightInspectorPanel } from './components/editor/panels/RightInspectorPanel';
import { LeftToolRail } from './components/editor/toolbar/LeftToolRail';
import { MobileEditorBar } from './components/editor/toolbar/MobileEditorBar';
import { TopMenuBar } from './components/editor/toolbar/TopMenuBar';
import { StudioHomeView } from './components/home/StudioHomeView';
import { useStudioStore } from './core/history/studioStore';

export default function App() {
  const {
    view,
    toastMessage,
    selectedObjectIds,
    undo,
    redo,
    saveNow,
    copySelected,
    cutSelected,
    pasteClipboard,
    duplicateSelectedObjects,
    deleteSelectedObjects,
    selectAllObjects,
    groupSelected,
    ungroupSelected,
    nudgeSelected,
    reorderLayer,
    setModal,
  } = useStudioStore();

  // Global Studio Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // Save: Ctrl+S
      if (ctrlOrMeta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNow();
        return;
      }

      // Find / Replace: Ctrl+F or Ctrl+H
      if (
        ctrlOrMeta &&
        (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'h')
      ) {
        e.preventDefault();
        setModal('search', true);
        return;
      }

      // Undo / Redo: Ctrl+Z / Ctrl+Shift+Z
      if (ctrlOrMeta && e.key.toLowerCase() === 'z') {
        if (!isEditingInput) {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
          return;
        }
      }

      if (isEditingInput) return;

      // Duplicate: Ctrl+D
      if (ctrlOrMeta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedObjects();
        return;
      }

      // Select All Freeform Objects: Ctrl+A
      if (ctrlOrMeta && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAllObjects();
        return;
      }

      // Group / Ungroup: Ctrl+G / Ctrl+Shift+G
      if (ctrlOrMeta && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) ungroupSelected();
        else groupSelected();
        return;
      }

      // Copy / Cut / Paste
      if (ctrlOrMeta && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }
      if (ctrlOrMeta && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutSelected();
        return;
      }
      if (ctrlOrMeta && e.key.toLowerCase() === 'v') {
        if (selectedObjectIds.length > 0) {
          pasteClipboard();
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectIds.length > 0) {
          e.preventDefault();
          deleteSelectedObjects();
          return;
        }
      }

      // Layer ordering shortcuts: ] and [
      if (e.key === ']' && selectedObjectIds.length > 0) {
        e.preventDefault();
        reorderLayer(selectedObjectIds[0], e.shiftKey ? 'front' : 'forward');
        return;
      }
      if (e.key === '[' && selectedObjectIds.length > 0) {
        e.preventDefault();
        reorderLayer(selectedObjectIds[0], e.shiftKey ? 'back' : 'backward');
        return;
      }

      // Arrow key nudging (1px or 10px with Shift)
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft' && selectedObjectIds.length > 0) {
        e.preventDefault();
        nudgeSelected(-step, 0);
      } else if (e.key === 'ArrowRight' && selectedObjectIds.length > 0) {
        e.preventDefault();
        nudgeSelected(step, 0);
      } else if (e.key === 'ArrowUp' && selectedObjectIds.length > 0) {
        e.preventDefault();
        nudgeSelected(0, -step);
      } else if (e.key === 'ArrowDown' && selectedObjectIds.length > 0) {
        e.preventDefault();
        nudgeSelected(0, step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedObjectIds,
    undo,
    redo,
    saveNow,
    copySelected,
    cutSelected,
    pasteClipboard,
    duplicateSelectedObjects,
    deleteSelectedObjects,
    selectAllObjects,
    groupSelected,
    ungroupSelected,
    nudgeSelected,
    reorderLayer,
    setModal,
  ]);

  return (
    <div className="min-h-screen w-full flex flex-col">
      {view === 'home' ? (
        <StudioHomeView />
      ) : (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#FAFAFA] dark:bg-[#050505]">
          <TopMenuBar />
          <div className="flex-1 flex overflow-hidden relative">
            <LeftToolRail />
            <HybridCanvasWorkspace />
            <RightInspectorPanel />
          </div>
          <BottomPageNavigator />
          <MobileEditorBar />
        </div>
      )}

      {/* Global Studio Modals */}
      <SearchReplaceModal />
      <PrintPreviewModal />
      <StorageManagerModal />
      <ExportModal />
      <ShortcutsModal />

      {/* Non-intrusive Studio Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-14 right-5 z-50 bg-[#050505] dark:bg-white text-white dark:text-[#050505] border border-zinc-800 px-4 py-2.5 text-xs font-medium shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
