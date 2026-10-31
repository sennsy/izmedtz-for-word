import { create } from 'zustand';
import {
  createBlankPage,
  createFlowBlock,
  createNewProject,
  uid,
} from '../document/factories';
import {
  FlowBlock,
  FlowBlockType,
  FreeformObject,
  IzmPage,
  IzmProject,
  PAGE_PRESETS_MM,
  PageOrientation,
  PageSizePreset,
} from '../document/types';
import {
  saveProjectToDb,
  writeRecoverySnapshot,
} from '../../storage/db/dexieDb';

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'recovery';

export type LeftToolId =
  | 'select'
  | 'text'
  | 'media'
  | 'elements'
  | 'table'
  | 'chart'
  | 'embed'
  | 'pages'
  | 'templates'
  | 'layers';

interface HistoryTransaction {
  id: string;
  key: string;
  timestamp: number;
  label: string;
  beforePages: IzmPage[];
  afterPages: IzmPage[];
  beforeMeta?: Partial<IzmProject>;
  afterMeta?: Partial<IzmProject>;
}

const MAX_HISTORY_STEPS = 160;
const COALESCE_WINDOW_MS = 500;

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let recoveryTimer: ReturnType<typeof setTimeout> | null = null;

function clonePages(pages: IzmPage[]): IzmPage[] {
  return JSON.parse(JSON.stringify(pages));
}

export interface SearchMatch {
  pageIndex: number;
  pageName: string;
  targetType: 'flow' | 'freeform';
  targetId: string;
  preview: string;
}

interface StudioState {
  // Navigation & Theme
  view: 'home' | 'editor';
  darkMode: boolean;
  activeLeftTool: LeftToolId;
  leftDrawerOpen: boolean;

  // Project & Selection
  project: IzmProject;
  activePageIndex: number;
  selectedFlowBlockId: string | null;
  selectedObjectIds: string[];
  clipboardObjects: FreeformObject[];

  // Canvas & Smart Design Tools
  zoom: number;
  panX: number;
  panY: number;
  showRulers: boolean;
  showGrid: boolean;
  gridSizePx: number;
  snapEnabled: boolean;
  snapToGrid: boolean;
  showMargins: boolean;
  showBleed: boolean;

  // Modals
  showSearchModal: boolean;
  showPrintModal: boolean;
  showStorageModal: boolean;
  showExportModal: boolean;
  showShortcutsModal: boolean;

  // Persistence & Undo/Redo
  saveStatus: SaveStatus;
  undoStack: HistoryTransaction[];
  redoStack: HistoryTransaction[];
  toastMessage: string | null;

  // Actions
  setView: (view: 'home' | 'editor') => void;
  toggleDarkMode: () => void;
  setActiveLeftTool: (tool: LeftToolId, openDrawer?: boolean) => void;
  setLeftDrawerOpen: (open: boolean) => void;
  setToast: (msg: string | null) => void;

  // Project lifecycle
  loadProject: (project: IzmProject) => void;
  createAndOpenProject: (opts?: {
    title?: string;
    preset?: PageSizePreset;
    orientation?: PageOrientation;
    customDimensionsMm?: { width: number; height: number };
    category?: 'document' | 'creative' | 'presentation';
  }) => void;
  saveNow: () => Promise<void>;
  duplicateCurrentProjectAsNew: (newTitle: string) => Promise<void>;

  // Mutators with transaction history
  commitMutation: (
    label: string,
    coalesceKey: string,
    mutator: (draft: IzmProject) => void
  ) => void;
  undo: () => void;
  redo: () => void;

  // Page management
  setActivePageIndex: (index: number) => void;
  addPage: () => void;
  duplicatePage: (index: number) => void;
  deletePage: (index: number) => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  updatePageSettings: (patch: Partial<IzmProject>) => void;

  // Flow Block management
  selectFlowBlock: (blockId: string | null) => void;
  addFlowBlock: (type: FlowBlockType, afterBlockId?: string) => void;
  updateFlowBlock: (blockId: string, patch: Partial<FlowBlock>) => void;
  deleteFlowBlock: (blockId: string) => void;
  moveFlowBlock: (blockId: string, direction: 'up' | 'down') => void;

  // Freeform Object management
  selectObject: (id: string | null, multi?: boolean) => void;
  selectAllObjects: () => void;
  addFreeformObject: (obj: FreeformObject) => void;
  updateFreeformObject: (id: string, patch: Partial<FreeformObject>, coalesceKey?: string) => void;
  updateSelectedObjects: (patch: Partial<FreeformObject>, coalesceKey?: string) => void;
  deleteSelectedObjects: () => void;
  duplicateSelectedObjects: () => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteClipboard: () => void;
  nudgeSelected: (dx: number, dy: number) => void;

  // Layer ordering & grouping
  reorderLayer: (id: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  groupSelected: () => void;
  ungroupSelected: () => void;

  // Alignment & Distribution
  alignSelected: (
    mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;

  // Viewport & Canvas controls
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  resetView: () => void;
  toggleCanvasOption: (
    opt: 'showRulers' | 'showGrid' | 'snapEnabled' | 'snapToGrid' | 'showMargins' | 'showBleed'
  ) => void;
  setGridSizePx: (size: number) => void;

  // Modals
  setModal: (
    modal: 'search' | 'print' | 'storage' | 'export' | 'shortcuts',
    open: boolean
  ) => void;

  // Search & Replace
  searchProject: (query: string) => SearchMatch[];
  replaceInProject: (query: string, replacement: string, replaceAll: boolean) => number;
}

function schedulePersistence(
  project: IzmProject,
  setStatus: (s: SaveStatus) => void
) {
  setStatus(navigator.onLine ? 'saving' : 'offline');

  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryTimer = setTimeout(() => {
    writeRecoverySnapshot(project).catch(() => {});
  }, 250);

  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    try {
      await saveProjectToDb(project);
      setStatus(navigator.onLine ? 'saved' : 'offline');
    } catch {
      setStatus('recovery');
    }
  }, 850);
}

export const useStudioStore = create<StudioState>((set, get) => ({
  view: 'home',
  darkMode: false,
  activeLeftTool: 'select',
  leftDrawerOpen: false,

  project: createNewProject(),
  activePageIndex: 0,
  selectedFlowBlockId: null,
  selectedObjectIds: [],
  clipboardObjects: [],

  zoom: 0.85,
  panX: 0,
  panY: 0,
  showRulers: true,
  showGrid: false,
  gridSizePx: 20,
  snapEnabled: true,
  snapToGrid: false,
  showMargins: true,
  showBleed: false,

  showSearchModal: false,
  showPrintModal: false,
  showStorageModal: false,
  showExportModal: false,
  showShortcutsModal: false,

  saveStatus: 'saved',
  undoStack: [],
  redoStack: [],
  toastMessage: null,

  setView: (view) => set({ view }),

  toggleDarkMode: () => {
    const next = !get().darkMode;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
    }
    set({ darkMode: next });
  },

  setActiveLeftTool: (tool, openDrawer) => {
    const current = get().activeLeftTool;
    const isSame = current === tool;
    const hasDrawer = tool !== 'select';
    set({
      activeLeftTool: tool,
      leftDrawerOpen:
        openDrawer !== undefined
          ? openDrawer
          : hasDrawer
          ? isSame
            ? !get().leftDrawerOpen
            : true
          : false,
    });
  },

  setLeftDrawerOpen: (open) => set({ leftDrawerOpen: open }),

  setToast: (msg) => {
    set({ toastMessage: msg });
    if (msg) {
      setTimeout(() => {
        if (get().toastMessage === msg) {
          set({ toastMessage: null });
        }
      }, 3200);
    }
  },

  loadProject: (project) => {
    set({
      project,
      activePageIndex: 0,
      selectedFlowBlockId: null,
      selectedObjectIds: [],
      undoStack: [],
      redoStack: [],
      view: 'editor',
      saveStatus: 'saved',
    });
    saveProjectToDb(project).catch(() => {});
  },

  createAndOpenProject: (opts) => {
    const proj = createNewProject(opts);
    set({
      project: proj,
      activePageIndex: 0,
      selectedFlowBlockId: proj.pages[0]?.flowBlocks[0]?.id || null,
      selectedObjectIds: [],
      undoStack: [],
      redoStack: [],
      view: 'editor',
      saveStatus: 'saving',
    });
    saveProjectToDb(proj).then(() => set({ saveStatus: 'saved' }));
  },

  saveNow: async () => {
    const { project } = get();
    set({ saveStatus: 'saving' });
    await saveProjectToDb(project);
    set({ saveStatus: navigator.onLine ? 'saved' : 'offline' });
    get().setToast('Project saved to local IndexedDB vault.');
  },

  duplicateCurrentProjectAsNew: async (newTitle) => {
    const current = get().project;
    const copy: IzmProject = JSON.parse(JSON.stringify(current));
    copy.id = uid('proj');
    copy.title = newTitle || `${current.title} (Copy)`;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    await saveProjectToDb(copy);
    set({
      project: copy,
      undoStack: [],
      redoStack: [],
      saveStatus: 'saved',
    });
    get().setToast(`Saved as "${copy.title}"`);
  },

  commitMutation: (label, coalesceKey, mutator) => {
    const state = get();
    const beforePages = clonePages(state.project.pages);
    const beforeMeta: Partial<IzmProject> = {
      title: state.project.title,
      pageSizePreset: state.project.pageSizePreset,
      orientation: state.project.orientation,
      dimensionsMm: { ...state.project.dimensionsMm },
      marginsMm: { ...state.project.marginsMm },
      bleedMm: state.project.bleedMm,
      safeAreaMm: state.project.safeAreaMm,
      header: { ...state.project.header },
      footer: { ...state.project.footer },
      customField: state.project.customField,
    };

    const nextProject: IzmProject = {
      ...state.project,
      pages: clonePages(state.project.pages),
    };

    mutator(nextProject);
    nextProject.updatedAt = Date.now();

    const afterPages = clonePages(nextProject.pages);
    const afterMeta: Partial<IzmProject> = {
      title: nextProject.title,
      pageSizePreset: nextProject.pageSizePreset,
      orientation: nextProject.orientation,
      dimensionsMm: { ...nextProject.dimensionsMm },
      marginsMm: { ...nextProject.marginsMm },
      bleedMm: nextProject.bleedMm,
      safeAreaMm: nextProject.safeAreaMm,
      header: { ...nextProject.header },
      footer: { ...nextProject.footer },
      customField: nextProject.customField,
    };

    const now = Date.now();
    const prevUndo = state.undoStack[state.undoStack.length - 1];
    let nextUndoStack: HistoryTransaction[];

    if (
      prevUndo &&
      prevUndo.key === coalesceKey &&
      now - prevUndo.timestamp < COALESCE_WINDOW_MS
    ) {
      const updatedTop: HistoryTransaction = {
        ...prevUndo,
        timestamp: now,
        afterPages,
        afterMeta,
      };
      nextUndoStack = [...state.undoStack.slice(0, -1), updatedTop];
    } else {
      const tx: HistoryTransaction = {
        id: uid('tx'),
        key: coalesceKey,
        timestamp: now,
        label,
        beforePages,
        afterPages,
        beforeMeta,
        afterMeta,
      };
      nextUndoStack = [...state.undoStack, tx].slice(-MAX_HISTORY_STEPS);
    }

    set({
      project: nextProject,
      undoStack: nextUndoStack,
      redoStack: [],
    });

    schedulePersistence(nextProject, (s) => set({ saveStatus: s }));
  },

  undo: () => {
    const { undoStack, redoStack, project, activePageIndex } = get();
    if (undoStack.length === 0) return;

    const tx = undoStack[undoStack.length - 1];
    const restoredProject: IzmProject = {
      ...project,
      ...(tx.beforeMeta || {}),
      pages: clonePages(tx.beforePages),
      updatedAt: Date.now(),
    };

    const safePageIdx = Math.min(activePageIndex, restoredProject.pages.length - 1);
    set({
      project: restoredProject,
      activePageIndex: Math.max(0, safePageIdx),
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, tx],
    });
    schedulePersistence(restoredProject, (s) => set({ saveStatus: s }));
  },

  redo: () => {
    const { undoStack, redoStack, project, activePageIndex } = get();
    if (redoStack.length === 0) return;

    const tx = redoStack[redoStack.length - 1];
    const restoredProject: IzmProject = {
      ...project,
      ...(tx.afterMeta || {}),
      pages: clonePages(tx.afterPages),
      updatedAt: Date.now(),
    };

    const safePageIdx = Math.min(activePageIndex, restoredProject.pages.length - 1);
    set({
      project: restoredProject,
      activePageIndex: Math.max(0, safePageIdx),
      undoStack: [...undoStack, tx],
      redoStack: redoStack.slice(0, -1),
    });
    schedulePersistence(restoredProject, (s) => set({ saveStatus: s }));
  },

  setActivePageIndex: (index) => {
    const { project } = get();
    if (index < 0 || index >= project.pages.length) return;
    set({
      activePageIndex: index,
      selectedObjectIds: [],
      selectedFlowBlockId: project.pages[index]?.flowBlocks[0]?.id || null,
    });
  },

  addPage: () => {
    const { project } = get();
    const newIndex = project.pages.length + 1;
    get().commitMutation('Add Page', `add_page_${Date.now()}`, (draft) => {
      draft.pages.push(createBlankPage(newIndex));
    });
    set({ activePageIndex: newIndex - 1, selectedObjectIds: [] });
  },

  duplicatePage: (index) => {
    get().commitMutation('Duplicate Page', `dup_page_${Date.now()}`, (draft) => {
      const target = draft.pages[index];
      if (!target) return;
      const copy: IzmPage = JSON.parse(JSON.stringify(target));
      copy.id = uid('page');
      copy.name = `${target.name} Copy`;
      copy.flowBlocks.forEach((b) => (b.id = uid('flow')));
      copy.freeformObjects.forEach((o) => (o.id = uid('obj')));
      draft.pages.splice(index + 1, 0, copy);
    });
    set({ activePageIndex: index + 1 });
  },

  deletePage: (index) => {
    const { project, activePageIndex } = get();
    if (project.pages.length <= 1) {
      get().setToast('A document must contain at least one page.');
      return;
    }
    get().commitMutation('Delete Page', `del_page_${Date.now()}`, (draft) => {
      draft.pages.splice(index, 1);
    });
    set({
      activePageIndex: Math.max(0, Math.min(activePageIndex, project.pages.length - 2)),
      selectedObjectIds: [],
    });
  },

  reorderPage: (fromIndex, toIndex) => {
    const { project } = get();
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= project.pages.length ||
      toIndex >= project.pages.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    get().commitMutation('Reorder Pages', `reorder_page_${Date.now()}`, (draft) => {
      const [moved] = draft.pages.splice(fromIndex, 1);
      draft.pages.splice(toIndex, 0, moved);
    });
    set({ activePageIndex: toIndex });
  },

  updatePageSettings: (patch) => {
    get().commitMutation('Update Document Settings', 'doc_settings', (draft) => {
      if (patch.pageSizePreset && patch.pageSizePreset !== 'Custom') {
        draft.dimensionsMm = { ...PAGE_PRESETS_MM[patch.pageSizePreset] };
      }
      Object.assign(draft, patch);
    });
  },

  selectFlowBlock: (blockId) => {
    set({
      selectedFlowBlockId: blockId,
      selectedObjectIds: blockId ? [] : get().selectedObjectIds,
    });
  },

  addFlowBlock: (type, afterBlockId) => {
    const { activePageIndex, selectedFlowBlockId } = get();
    const newBlock = createFlowBlock(type);
    const anchorId = afterBlockId || selectedFlowBlockId;
    get().commitMutation(`Insert ${type}`, `add_flow_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      const idx = anchorId ? page.flowBlocks.findIndex((b) => b.id === anchorId) : -1;
      if (idx >= 0) {
        page.flowBlocks.splice(idx + 1, 0, newBlock);
      } else {
        page.flowBlocks.push(newBlock);
      }
    });
    set({ selectedFlowBlockId: newBlock.id, selectedObjectIds: [] });
  },

  updateFlowBlock: (blockId, patch) => {
    const { activePageIndex } = get();
    get().commitMutation('Edit Flow Block', `flow_edit_${blockId}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      const block = page.flowBlocks.find((b) => b.id === blockId);
      if (!block) return;
      if (patch.style) {
        block.style = { ...block.style, ...patch.style };
      }
      const { style, ...rest } = patch;
      Object.assign(block, rest);
    });
  },

  deleteFlowBlock: (blockId) => {
    const { activePageIndex } = get();
    get().commitMutation('Delete Flow Block', `del_flow_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      page.flowBlocks = page.flowBlocks.filter((b) => b.id !== blockId);
    });
    set({ selectedFlowBlockId: null });
  },

  moveFlowBlock: (blockId, direction) => {
    const { activePageIndex } = get();
    get().commitMutation('Move Flow Block', `move_flow_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      const idx = page.flowBlocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= page.flowBlocks.length) return;
      const [item] = page.flowBlocks.splice(idx, 1);
      page.flowBlocks.splice(targetIdx, 0, item);
    });
  },

  selectObject: (id, multi = false) => {
    if (!id) {
      set({ selectedObjectIds: [] });
      return;
    }
    const current = get().selectedObjectIds;
    if (multi) {
      const exists = current.includes(id);
      set({
        selectedObjectIds: exists ? current.filter((i) => i !== id) : [...current, id],
        selectedFlowBlockId: null,
      });
    } else {
      set({ selectedObjectIds: [id], selectedFlowBlockId: null });
    }
  },

  selectAllObjects: () => {
    const { project, activePageIndex } = get();
    const page = project.pages[activePageIndex];
    if (!page) return;
    set({
      selectedObjectIds: page.freeformObjects.filter((o) => !o.locked && o.visible).map((o) => o.id),
      selectedFlowBlockId: null,
    });
  },

  addFreeformObject: (obj) => {
    const { activePageIndex, project } = get();
    const page = project.pages[activePageIndex];
    const maxZ =
      page && page.freeformObjects.length > 0
        ? Math.max(...page.freeformObjects.map((o) => o.zIndex))
        : 0;
    obj.zIndex = maxZ + 1;

    get().commitMutation(`Add ${obj.name}`, `add_obj_${Date.now()}`, (draft) => {
      const p = draft.pages[activePageIndex];
      if (p) p.freeformObjects.push(obj);
    });
    set({ selectedObjectIds: [obj.id], selectedFlowBlockId: null });
  },

  updateFreeformObject: (id, patch, coalesceKey) => {
    const { activePageIndex } = get();
    get().commitMutation(
      'Transform Object',
      coalesceKey || `obj_edit_${id}`,
      (draft) => {
        const page = draft.pages[activePageIndex];
        if (!page) return;
        const target = page.freeformObjects.find((o) => o.id === id);
        if (!target) return;
        Object.assign(target, patch);
      }
    );
  },

  updateSelectedObjects: (patch, coalesceKey) => {
    const { activePageIndex, selectedObjectIds } = get();
    if (selectedObjectIds.length === 0) return;
    get().commitMutation(
      'Update Objects',
      coalesceKey || `multi_edit_${selectedObjectIds.join('_')}`,
      (draft) => {
        const page = draft.pages[activePageIndex];
        if (!page) return;
        for (const obj of page.freeformObjects) {
          if (selectedObjectIds.includes(obj.id)) {
            Object.assign(obj, patch);
          }
        }
      }
    );
  },

  deleteSelectedObjects: () => {
    const { activePageIndex, selectedObjectIds } = get();
    if (selectedObjectIds.length === 0) return;
    get().commitMutation('Delete Objects', `del_objs_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      page.freeformObjects = page.freeformObjects.filter(
        (o) => !selectedObjectIds.includes(o.id)
      );
    });
    set({ selectedObjectIds: [] });
  },

  duplicateSelectedObjects: () => {
    const { activePageIndex, selectedObjectIds, project } = get();
    if (selectedObjectIds.length === 0) return;
    const page = project.pages[activePageIndex];
    if (!page) return;

    const newIds: string[] = [];
    get().commitMutation('Duplicate Objects', `dup_objs_${Date.now()}`, (draft) => {
      const p = draft.pages[activePageIndex];
      if (!p) return;
      let maxZ = p.freeformObjects.reduce((m, o) => Math.max(m, o.zIndex), 0);
      for (const id of selectedObjectIds) {
        const orig = p.freeformObjects.find((o) => o.id === id);
        if (!orig) continue;
        const copy: FreeformObject = JSON.parse(JSON.stringify(orig));
        copy.id = uid('obj');
        copy.name = `${orig.name} Copy`;
        copy.x += 20;
        copy.y += 20;
        copy.zIndex = ++maxZ;
        newIds.push(copy.id);
        p.freeformObjects.push(copy);
      }
    });
    set({ selectedObjectIds: newIds });
  },

  copySelected: () => {
    const { project, activePageIndex, selectedObjectIds } = get();
    const page = project.pages[activePageIndex];
    if (!page || selectedObjectIds.length === 0) return;
    const copied = page.freeformObjects
      .filter((o) => selectedObjectIds.includes(o.id))
      .map((o) => JSON.parse(JSON.stringify(o)) as FreeformObject);
    set({ clipboardObjects: copied });
    get().setToast(`Copied ${copied.length} object(s)`);
  },

  cutSelected: () => {
    get().copySelected();
    get().deleteSelectedObjects();
  },

  pasteClipboard: () => {
    const { clipboardObjects, activePageIndex } = get();
    if (clipboardObjects.length === 0) return;
    const newIds: string[] = [];
    get().commitMutation('Paste Objects', `paste_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      let maxZ = page.freeformObjects.reduce((m, o) => Math.max(m, o.zIndex), 0);
      for (const item of clipboardObjects) {
        const copy: FreeformObject = JSON.parse(JSON.stringify(item));
        copy.id = uid('obj');
        copy.x += 24;
        copy.y += 24;
        copy.zIndex = ++maxZ;
        newIds.push(copy.id);
        page.freeformObjects.push(copy);
      }
    });
    set({ selectedObjectIds: newIds });
  },

  nudgeSelected: (dx, dy) => {
    const { selectedObjectIds, activePageIndex } = get();
    if (selectedObjectIds.length === 0) return;
    get().commitMutation('Nudge Objects', 'nudge_selected', (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      for (const obj of page.freeformObjects) {
        if (selectedObjectIds.includes(obj.id) && !obj.locked) {
          obj.x += dx;
          obj.y += dy;
        }
      }
    });
  },

  reorderLayer: (id, action) => {
    const { activePageIndex } = get();
    get().commitMutation('Reorder Layer', `layer_z_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      const sorted = [...page.freeformObjects].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx === -1) return;

      const [target] = sorted.splice(idx, 1);
      if (action === 'front') sorted.push(target);
      else if (action === 'back') sorted.unshift(target);
      else if (action === 'forward') sorted.splice(Math.min(sorted.length, idx + 1), 0, target);
      else if (action === 'backward') sorted.splice(Math.max(0, idx - 1), 0, target);

      sorted.forEach((o, i) => {
        o.zIndex = i + 1;
      });
    });
  },

  groupSelected: () => {
    const { selectedObjectIds, activePageIndex } = get();
    if (selectedObjectIds.length < 2) {
      get().setToast('Select 2 or more objects (Shift+Click) to group.');
      return;
    }
    const gid = uid('grp');
    get().commitMutation('Group Objects', `grp_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      for (const obj of page.freeformObjects) {
        if (selectedObjectIds.includes(obj.id)) {
          obj.groupId = gid;
        }
      }
    });
    get().setToast(`Grouped ${selectedObjectIds.length} objects.`);
  },

  ungroupSelected: () => {
    const { selectedObjectIds, activePageIndex } = get();
    if (selectedObjectIds.length === 0) return;
    get().commitMutation('Ungroup Objects', `ungrp_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      for (const obj of page.freeformObjects) {
        if (selectedObjectIds.includes(obj.id)) {
          delete obj.groupId;
        }
      }
    });
    get().setToast('Ungrouped selected objects.');
  },

  alignSelected: (mode) => {
    const { selectedObjectIds, activePageIndex, project } = get();
    if (selectedObjectIds.length === 0) return;

    const wMm =
      project.orientation === 'portrait'
        ? project.dimensionsMm.width
        : project.dimensionsMm.height;
    const hMm =
      project.orientation === 'portrait'
        ? project.dimensionsMm.height
        : project.dimensionsMm.width;
    const pageW = Math.round(wMm * 3.78);
    const pageH = Math.round(hMm * 3.78);

    get().commitMutation(`Align ${mode}`, `align_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      const targets = page.freeformObjects.filter((o) =>
        selectedObjectIds.includes(o.id)
      );
      if (targets.length === 0) return;

      if (targets.length === 1) {
        const t = targets[0];
        if (mode === 'left') t.x = Math.round(project.marginsMm.left * 3.78);
        if (mode === 'center') t.x = Math.round((pageW - t.width) / 2);
        if (mode === 'right')
          t.x = Math.round(pageW - project.marginsMm.right * 3.78 - t.width);
        if (mode === 'top') t.y = Math.round(project.marginsMm.top * 3.78);
        if (mode === 'middle') t.y = Math.round((pageH - t.height) / 2);
        if (mode === 'bottom')
          t.y = Math.round(pageH - project.marginsMm.bottom * 3.78 - t.height);
        return;
      }

      const minX = Math.min(...targets.map((t) => t.x));
      const maxX = Math.max(...targets.map((t) => t.x + t.width));
      const minY = Math.min(...targets.map((t) => t.y));
      const maxY = Math.max(...targets.map((t) => t.y + t.height));

      for (const t of targets) {
        if (mode === 'left') t.x = minX;
        if (mode === 'center') t.x = Math.round((minX + maxX) / 2 - t.width / 2);
        if (mode === 'right') t.x = maxX - t.width;
        if (mode === 'top') t.y = minY;
        if (mode === 'middle') t.y = Math.round((minY + maxY) / 2 - t.height / 2);
        if (mode === 'bottom') t.y = maxY - t.height;
      }
    });
  },

  distributeSelected: (axis) => {
    const { selectedObjectIds, activePageIndex } = get();
    if (selectedObjectIds.length < 3) {
      get().setToast('Select at least 3 objects to distribute evenly.');
      return;
    }
    get().commitMutation(`Distribute ${axis}`, `dist_${Date.now()}`, (draft) => {
      const page = draft.pages[activePageIndex];
      if (!page) return;
      const targets = page.freeformObjects.filter((o) =>
        selectedObjectIds.includes(o.id)
      );
      if (targets.length < 3) return;

      if (axis === 'horizontal') {
        targets.sort((a, b) => a.x - b.x);
        const first = targets[0].x;
        const last = targets[targets.length - 1].x;
        const step = (last - first) / (targets.length - 1);
        targets.forEach((t, i) => {
          t.x = Math.round(first + i * step);
        });
      } else {
        targets.sort((a, b) => a.y - b.y);
        const first = targets[0].y;
        const last = targets[targets.length - 1].y;
        const step = (last - first) / (targets.length - 1);
        targets.forEach((t, i) => {
          t.y = Math.round(first + i * step);
        });
      }
    });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3.5, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  resetView: () => set({ zoom: 0.85, panX: 0, panY: 0 }),

  toggleCanvasOption: (opt) => set((s) => ({ [opt]: !s[opt] })),
  setGridSizePx: (size) => set({ gridSizePx: Math.max(8, Math.min(120, size)) }),

  setModal: (modal, open) => {
    if (modal === 'search') set({ showSearchModal: open });
    if (modal === 'print') set({ showPrintModal: open });
    if (modal === 'storage') set({ showStorageModal: open });
    if (modal === 'export') set({ showExportModal: open });
    if (modal === 'shortcuts') set({ showShortcutsModal: open });
  },

  searchProject: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const { project } = get();
    const matches: SearchMatch[] = [];

    project.pages.forEach((page, pageIndex) => {
      for (const block of page.flowBlocks) {
        const hay =
          block.type === 'checklist' && block.items
            ? block.items.map((i) => i.text).join(' ')
            : block.type === 'table' && block.table
            ? block.table.cells.flatMap((r) => r.map((c) => c.content)).join(' ')
            : block.content;
        if (hay && hay.toLowerCase().includes(q)) {
          matches.push({
            pageIndex,
            pageName: page.name,
            targetType: 'flow',
            targetId: block.id,
            preview: hay.slice(0, 90),
          });
        }
      }
      for (const obj of page.freeformObjects) {
        const hay =
          obj.text ||
          obj.chartTitle ||
          obj.embedTitle ||
          (obj.tableData
            ? obj.tableData.cells.flatMap((r) => r.map((c) => c.content)).join(' ')
            : '');
        if (hay && hay.toLowerCase().includes(q)) {
          matches.push({
            pageIndex,
            pageName: page.name,
            targetType: 'freeform',
            targetId: obj.id,
            preview: hay.slice(0, 90),
          });
        }
      }
    });

    return matches;
  },

  replaceInProject: (query, replacement, replaceAll) => {
    const q = query.trim();
    if (!q) return 0;
    let count = 0;
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replaceAll ? 'gi' : 'i');

    get().commitMutation('Find & Replace', `replace_${Date.now()}`, (draft) => {
      for (const page of draft.pages) {
        for (const block of page.flowBlocks) {
          if (!replaceAll && count > 0) return;
          if (block.content && regex.test(block.content)) {
            block.content = block.content.replace(regex, () => {
              count++;
              return replacement;
            });
          }
        }
        for (const obj of page.freeformObjects) {
          if (!replaceAll && count > 0) return;
          if (obj.text && regex.test(obj.text)) {
            obj.text = obj.text.replace(regex, () => {
              count++;
              return replacement;
            });
          }
        }
      }
    });

    return count;
  },
}));
