import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Files,
  Group,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Link2,
  Lock,
  MousePointer,
  Shapes,
  Trash2,
  Type,
  Ungroup,
  Unlock,
  Upload,
  X,
} from 'lucide-react';
import {
  createFreeformChart,
  createFreeformEmbed,
  createFreeformImage,
  createFreeformShape,
  createFreeformTable,
  createFreeformTextbox,
  uid,
} from '../../../core/document/factories';
import {
  ChartKind,
  FlowBlockType,
  PAGE_PRESETS_MM,
  PageSizePreset,
  ShapeKind,
} from '../../../core/document/types';
import { LeftToolId, useStudioStore } from '../../../core/history/studioStore';
import { BUILTIN_TEMPLATES } from '../../../core/templates/builtinTemplates';
import { saveAssetToDb } from '../../../storage/db/dexieDb';

const RAIL_ITEMS: { id: LeftToolId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'select', label: 'Select', icon: MousePointer },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'table', label: 'Table', icon: FileSpreadsheet },
  { id: 'chart', label: 'Chart', icon: BarChart3 },
  { id: 'embed', label: 'Embed', icon: Link2 },
  { id: 'pages', label: 'Pages', icon: Files },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'layers', label: 'Layers', icon: Layers },
];

const SHAPE_LIST: { kind: ShapeKind; label: string }[] = [
  { kind: 'rectangle', label: 'Rectangle' },
  { kind: 'rounded-rectangle', label: 'Rounded Rect' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'ellipse', label: 'Ellipse' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'polygon', label: 'Polygon' },
  { kind: 'star', label: 'Star' },
  { kind: 'arrow', label: 'Arrow' },
  { kind: 'line', label: 'Line' },
  { kind: 'divider', label: 'Divider' },
  { kind: 'speech-bubble', label: 'Speech Bubble' },
  { kind: 'badge', label: 'Badge' },
  { kind: 'callout', label: 'Callout' },
  { kind: 'custom-svg', label: 'Custom SVG' },
];

export const LeftToolRail: React.FC = () => {
  const {
    project,
    activePageIndex,
    activeLeftTool,
    leftDrawerOpen,
    selectedObjectIds,
    setActiveLeftTool,
    setLeftDrawerOpen,
    addFlowBlock,
    addFreeformObject,
    updateFreeformObject,
    selectObject,
    deleteSelectedObjects,
    duplicateSelectedObjects,
    reorderLayer,
    groupSelected,
    ungroupSelected,
    addPage,
    duplicatePage,
    deletePage,
    setActivePageIndex,
    updatePageSettings,
    loadProject,
    setToast,
  } = useStudioStore();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [embedUrl, setEmbedUrl] = useState('https://www.noth.in/');
  const [embedTitle, setEmbedTitle] = useState('Editorial Art Direction Reference');
  const [customSvgInput, setCustomSvgInput] = useState(
    'M12 2L19 21L12 17L5 21L12 2Z'
  );

  const activePage = project.pages[activePageIndex];

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const assetId = uid('asset');
      await saveAssetToDb({
        id: assetId,
        name: file.name,
        mimeType: file.type || 'image/png',
        sizeBytes: file.size,
        dataUrl,
        createdAt: Date.now(),
      });
      const imgObj = createFreeformImage(dataUrl, file.name, assetId);
      addFreeformObject(imgObj);
      setToast(`Added media "${file.name}" to page & local IndexedDB vault.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="hidden md:flex h-full shrink-0 select-none z-20">
      {/* Vertical Icon Rail */}
      <aside className="w-16 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-2 gap-1">
        {RAIL_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeLeftTool === id && (id === 'select' || leftDrawerOpen);
          return (
            <button
              key={id}
              onClick={() => setActiveLeftTool(id)}
              className={`w-13 py-2 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#002FA7] text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium tracking-tight">{label}</span>
            </button>
          );
        })}
      </aside>

      {/* Expandable Tool Drawer */}
      {leftDrawerOpen && activeLeftTool !== 'select' && (
        <div className="w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              {activeLeftTool}
            </span>
            <button
              onClick={() => setLeftDrawerOpen(false)}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* TEXT DRAWER */}
            {activeLeftTool === 'text' && (
              <>
                <div>
                  <div className="text-[11px] font-mono text-zinc-500 mb-2">
                    FREEFORM SPATIAL TEXT
                  </div>
                  <button
                    onClick={() => addFreeformObject(createFreeformTextbox())}
                    className="w-full py-2.5 px-3 bg-[#050505] dark:bg-white text-white dark:text-[#050505] text-xs font-semibold hover:bg-[#002FA7] dark:hover:bg-[#002FA7] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    + Add Freeform Text Box
                  </button>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-zinc-500 mb-2">
                    FLOW DOCUMENT BLOCKS
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ['h1', 'Heading 1'],
                        ['h2', 'Heading 2'],
                        ['h3', 'Heading 3'],
                        ['paragraph', 'Paragraph'],
                        ['quote', 'Block Quote'],
                        ['bullet-list', 'Bullet List'],
                        ['numbered-list', 'Numbered List'],
                        ['checklist', 'Checklist'],
                        ['caption', 'Caption'],
                        ['footnote', 'Footnote'],
                        ['code', 'Code Block'],
                      ] as [FlowBlockType, string][]
                    ).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => addFlowBlock(type)}
                        className="px-2.5 py-2 text-left text-xs border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] text-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-zinc-500 mb-2">
                    REUSABLE TEXT STYLES
                  </div>
                  <div className="space-y-2">
                    {project.textStyles.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          addFlowBlock(st.blockType);
                        }}
                        className="w-full text-left p-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] cursor-pointer"
                      >
                        <div
                          className="text-zinc-900 dark:text-white truncate"
                          style={{
                            fontFamily: st.style.fontFamily,
                            fontWeight: st.style.fontWeight,
                            fontSize: `${Math.min(18, st.style.fontSize || 14)}px`,
                          }}
                        >
                          {st.name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {st.style.fontFamily} · {st.style.fontSize}px
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* MEDIA DRAWER */}
            {activeLeftTool === 'media' && (
              <div className="space-y-4">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full py-6 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] flex flex-col items-center justify-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-[#002FA7]" />
                  <span className="font-semibold">Upload Image / SVG / GIF</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    PNG, JPG, WEBP, SVG, GIF
                  </span>
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  onChange={handleUploadImage}
                  className="hidden"
                />

                <div className="text-[11px] text-zinc-500 leading-relaxed">
                  You can also <strong>Drag & Drop</strong> image files directly onto the canvas or <strong>Paste (Ctrl+V)</strong> images from your clipboard.
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                  <div className="text-[11px] font-mono text-zinc-500 mb-2">
                    STUDIO EDITORIAL PLATES
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        name: 'Monochrome Architectural Grid',
                        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#050505"/><line x1="0" y1="200" x2="600" y2="200" stroke="#27272A" stroke-width="2"/><line x1="300" y1="0" x2="300" y2="400" stroke="#27272A" stroke-width="2"/><circle cx="300" cy="200" r="110" fill="none" stroke="#FAFAFA" stroke-width="3"/><rect x="40" y="40" width="90" height="36" fill="#002FA7"/><text x="54" y="63" fill="#FFFFFF" font-family="monospace" font-size="14">FIG 01</text></svg>`,
                      },
                      {
                        name: 'International Klein Blue Study',
                        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#FAFAFA"/><rect x="60" y="50" width="480" height="300" fill="#002FA7"/><text x="90" y="310" fill="#FFFFFF" font-family="sans-serif" font-weight="800" font-size="42">IKB 1960</text></svg>`,
                      },
                    ].map((sample) => (
                      <button
                        key={sample.name}
                        onClick={() => {
                          const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
                            sample.svg
                          )}`;
                          addFreeformObject(createFreeformImage(dataUrl, sample.name));
                        }}
                        className="p-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] text-left text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        + {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ELEMENTS / SHAPES DRAWER */}
            {activeLeftTool === 'elements' && (
              <div className="space-y-4">
                <div className="text-[11px] font-mono text-zinc-500">
                  14 VECTOR SHAPES & CALLOUTS
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SHAPE_LIST.map((s) => (
                    <button
                      key={s.kind}
                      onClick={() => addFreeformObject(createFreeformShape(s.kind))}
                      className="px-2.5 py-2 text-left text-xs border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] text-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-2">
                  <div className="text-[11px] font-mono text-zinc-500">
                    CUSTOM SVG PATH (24×24 VIEWBOX)
                  </div>
                  <input
                    type="text"
                    value={customSvgInput}
                    onChange={(e) => setCustomSvgInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                  <button
                    onClick={() => {
                      const sh = createFreeformShape('custom-svg');
                      sh.customSvgPath = customSvgInput;
                      addFreeformObject(sh);
                    }}
                    className="w-full py-2 bg-[#050505] dark:bg-white text-white dark:text-[#050505] text-xs font-semibold hover:bg-[#002FA7] cursor-pointer"
                  >
                    Insert Custom SVG Path
                  </button>
                </div>
              </div>
            )}

            {/* TABLE DRAWER */}
            {activeLeftTool === 'table' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                      ROWS
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tableRows}
                      onChange={(e) => setTableRows(Number(e.target.value) || 3)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                      COLUMNS
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={tableCols}
                      onChange={(e) => setTableCols(Number(e.target.value) || 3)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <button
                  onClick={() => addFlowBlock('table')}
                  className="w-full py-2.5 bg-[#050505] dark:bg-white text-white dark:text-[#050505] text-xs font-semibold hover:bg-[#002FA7] cursor-pointer"
                >
                  + Insert Flow Document Table
                </button>

                <button
                  onClick={() => addFreeformObject(createFreeformTable(tableRows, tableCols))}
                  className="w-full py-2.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] text-xs font-semibold text-zinc-900 dark:text-white cursor-pointer"
                >
                  + Insert Freeform Canvas Table ({tableRows}×{tableCols})
                </button>
              </div>
            )}

            {/* CHART DRAWER */}
            {activeLeftTool === 'chart' && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-mono text-zinc-500">
                  INSERT LIVE DATA CHART
                </div>
                {(
                  [
                    ['bar', 'Vertical Bar Chart'],
                    ['line', 'Line Trend Chart'],
                    ['area', 'Filled Area Chart'],
                    ['pie', 'Proportional Pie Chart'],
                    ['doughnut', 'Editorial Doughnut Chart'],
                  ] as [ChartKind, string][]
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    onClick={() => addFreeformObject(createFreeformChart(kind))}
                    className="w-full p-3 text-left text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] flex items-center justify-between cursor-pointer"
                  >
                    <span>{label}</span>
                    <span className="text-[10px] font-mono uppercase text-[#002FA7]">
                      + Add
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* EMBED / LINK DRAWER */}
            {activeLeftTool === 'embed' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    CARD TITLE
                  </label>
                  <input
                    type="text"
                    value={embedTitle}
                    onChange={(e) => setEmbedTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    TARGET URL
                  </label>
                  <input
                    type="url"
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <button
                  onClick={() =>
                    addFreeformObject(
                      createFreeformEmbed(embedUrl, embedTitle, 'Interactive Reference Card')
                    )
                  }
                  className="w-full py-2.5 bg-[#002FA7] text-white text-xs font-semibold hover:bg-[#00227A] cursor-pointer"
                >
                  Insert Embed Card
                </button>
              </div>
            )}

            {/* PAGES DRAWER */}
            {activeLeftTool === 'pages' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    PAGE FORMAT PRESET
                  </label>
                  <select
                    value={project.pageSizePreset}
                    onChange={(e) =>
                      updatePageSettings({ pageSizePreset: e.target.value as PageSizePreset })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="A5">A5 (148 × 210 mm)</option>
                    <option value="Letter">Letter (215.9 × 279.4 mm)</option>
                    <option value="Legal">Legal (215.9 × 355.6 mm)</option>
                    <option value="F4">F4 (215 × 330 mm)</option>
                    <option value="Custom">Custom Dimensions</option>
                  </select>
                </div>

                {project.pageSizePreset === 'Custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500">
                        WIDTH (MM)
                      </label>
                      <input
                        type="number"
                        value={project.dimensionsMm.width}
                        onChange={(e) =>
                          updatePageSettings({
                            dimensionsMm: {
                              ...project.dimensionsMm,
                              width: Number(e.target.value) || 210,
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-xs font-mono border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500">
                        HEIGHT (MM)
                      </label>
                      <input
                        type="number"
                        value={project.dimensionsMm.height}
                        onChange={(e) =>
                          updatePageSettings({
                            dimensionsMm: {
                              ...project.dimensionsMm,
                              height: Number(e.target.value) || 297,
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-xs font-mono border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={addPage}
                  className="w-full py-2 bg-[#050505] dark:bg-white text-white dark:text-[#050505] text-xs font-semibold cursor-pointer"
                >
                  + Add New Page
                </button>

                <div className="space-y-1.5">
                  {project.pages.map((pg, idx) => (
                    <div
                      key={pg.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`p-2.5 border flex items-center justify-between cursor-pointer ${
                        idx === activePageIndex
                          ? 'border-[#002FA7] bg-[#002FA7]/5'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {idx + 1}. {pg.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicatePage(idx);
                          }}
                          className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                          title="Duplicate page"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(idx);
                          }}
                          className="p-1 text-zinc-500 hover:text-red-600"
                          title="Delete page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEMPLATES DRAWER */}
            {activeLeftTool === 'templates' && (
              <div className="space-y-4">
                {(['document', 'creative', 'presentation'] as const).map((cat) => (
                  <div key={cat}>
                    <div className="text-[11px] font-mono uppercase text-zinc-500 mb-2">
                      {cat} TEMPLATES
                    </div>
                    <div className="space-y-1.5">
                      {BUILTIN_TEMPLATES.filter((t) => t.category === cat).map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => {
                            loadProject(tpl.build());
                            setToast(`Loaded template "${tpl.name}"`);
                          }}
                          className="w-full text-left p-2.5 border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                            {tpl.name}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {tpl.subcategory} · {tpl.preset} ({tpl.orientation})
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LAYERS TREE DRAWER */}
            {activeLeftTool === 'layers' && activePage && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={groupSelected}
                    className="flex-1 py-1.5 px-2 text-[11px] font-medium border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Group className="w-3.5 h-3.5" /> Group
                  </button>
                  <button
                    onClick={ungroupSelected}
                    className="flex-1 py-1.5 px-2 text-[11px] font-medium border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Ungroup className="w-3.5 h-3.5" /> Ungroup
                  </button>
                </div>

                <div className="text-[11px] font-mono text-zinc-500">
                  FREEFORM SCENE GRAPH ({activePage.freeformObjects.length})
                </div>

                {activePage.freeformObjects.length === 0 ? (
                  <div className="text-xs text-zinc-500 py-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                    No freeform layers on this page yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {[...activePage.freeformObjects]
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((obj) => {
                        const isSelected = selectedObjectIds.includes(obj.id);
                        return (
                          <div
                            key={obj.id}
                            onClick={(e) => selectObject(obj.id, e.shiftKey)}
                            className={`p-2 border text-xs flex flex-col gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'border-[#002FA7] bg-[#002FA7]/5'
                                : 'border-zinc-200 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <input
                                type="text"
                                value={obj.name}
                                onChange={(e) =>
                                  updateFreeformObject(obj.id, { name: e.target.value })
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-medium bg-transparent border-b border-transparent focus:border-[#002FA7] focus:outline-none text-zinc-900 dark:text-zinc-100 w-32 truncate"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderLayer(obj.id, 'forward');
                                  }}
                                  title="Bring Forward"
                                  className="p-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderLayer(obj.id, 'backward');
                                  }}
                                  title="Send Backward"
                                  className="p-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateFreeformObject(obj.id, { visible: !obj.visible });
                                  }}
                                  title={obj.visible ? 'Hide Layer' : 'Show Layer'}
                                  className="p-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                  {obj.visible ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateFreeformObject(obj.id, { locked: !obj.locked });
                                  }}
                                  title={obj.locked ? 'Unlock Layer' : 'Lock Layer'}
                                  className="p-0.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                  {obj.locked ? (
                                    <Lock className="w-3.5 h-3.5 text-[#002FA7]" />
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                              <span>
                                z:{obj.zIndex} · {obj.type}
                                {obj.groupId ? ' · grouped' : ''}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderLayer(obj.id, 'front');
                                  }}
                                  className="hover:text-[#002FA7]"
                                >
                                  Top
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    reorderLayer(obj.id, 'back');
                                  }}
                                  className="hover:text-[#002FA7]"
                                >
                                  Bottom
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {selectedObjectIds.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={duplicateSelectedObjects}
                      className="flex-1 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    <button
                      onClick={deleteSelectedObjects}
                      className="flex-1 py-1.5 text-xs border border-red-300 text-red-600 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
