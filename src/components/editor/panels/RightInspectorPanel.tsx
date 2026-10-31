import React, { useRef } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Eye,
  EyeOff,
  Italic,
  Lock,
  Plus,
  Strikethrough,
  Subscript,
  Superscript,
  Trash2,
  Underline,
  Unlock,
} from 'lucide-react';
import { createTableStructure, uid } from '../../../core/document/factories';
import {
  ChartKind,
  FlowBlockType,
  PAGE_PRESETS_MM,
  PageOrientation,
  PageSizePreset,
  ShapeKind,
  TableStructure,
} from '../../../core/document/types';
import { useStudioStore } from '../../../core/history/studioStore';

const FONT_FAMILIES = [
  'Plus Jakarta Sans',
  'Fraunces',
  'Cormorant Garamond',
  'IBM Plex Mono',
  'Georgia',
  'Arial',
];

export const RightInspectorPanel: React.FC<{ isMobileSheet?: boolean }> = ({
  isMobileSheet = false,
}) => {
  const {
    project,
    activePageIndex,
    selectedFlowBlockId,
    selectedObjectIds,
    showRulers,
    showGrid,
    snapEnabled,
    snapToGrid,
    gridSizePx,
    showMargins,
    showBleed,
    updatePageSettings,
    updateFlowBlock,
    deleteFlowBlock,
    moveFlowBlock,
    updateFreeformObject,
    deleteSelectedObjects,
    duplicateSelectedObjects,
    reorderLayer,
    alignSelected,
    distributeSelected,
    toggleCanvasOption,
    setGridSizePx,
    commitMutation,
    setToast,
  } = useStudioStore();

  const replaceImageInputRef = useRef<HTMLInputElement>(null);

  const activePage = project.pages[activePageIndex];
  const selectedFlowBlock = activePage?.flowBlocks.find(
    (b) => b.id === selectedFlowBlockId
  );
  const selectedObject =
    selectedObjectIds.length > 0
      ? activePage?.freeformObjects.find((o) => o.id === selectedObjectIds[0])
      : undefined;

  // Table mutation helper for either flow block table or freeform table
  const mutateTable = (updater: (tbl: TableStructure) => void) => {
    commitMutation('Update Table Structure', `tbl_struct_${Date.now()}`, (draft) => {
      const pg = draft.pages[activePageIndex];
      if (!pg) return;
      if (selectedFlowBlock && selectedFlowBlock.type === 'table') {
        const fb = pg.flowBlocks.find((b) => b.id === selectedFlowBlock.id);
        if (fb && fb.table) updater(fb.table);
      } else if (selectedObject && selectedObject.type === 'table') {
        const fo = pg.freeformObjects.find((o) => o.id === selectedObject.id);
        if (fo && fo.tableData) updater(fo.tableData);
      }
    });
  };

  const activeTable =
    selectedFlowBlock?.type === 'table'
      ? selectedFlowBlock.table
      : selectedObject?.type === 'table'
      ? selectedObject.tableData
      : undefined;

  return (
    <aside
      className={`${
        isMobileSheet
          ? 'w-full'
          : 'hidden lg:flex w-80 border-l border-zinc-200 dark:border-zinc-800 h-full'
      } bg-white dark:bg-zinc-950 flex-col select-none z-20 shrink-0 overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
          {selectedObject
            ? `Object · ${selectedObject.type}`
            : selectedFlowBlock
            ? `Flow · ${selectedFlowBlock.type}`
            : 'Page & Studio Inspector'}
        </span>
        <span className="text-[10px] font-mono text-zinc-400">
          {selectedObjectIds.length > 1 ? `${selectedObjectIds.length} selected` : 'Contextual'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* ================= 1. FREEFORM OBJECT INSPECTOR ================= */}
        {selectedObject && (
          <>
            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-1.5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() =>
                  updateFreeformObject(selectedObject.id, {
                    locked: !selectedObject.locked,
                  })
                }
                className="flex-1 py-1.5 px-2 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                {selectedObject.locked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-[#002FA7]" /> Locked
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Unlock
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  updateFreeformObject(selectedObject.id, {
                    visible: !selectedObject.visible,
                  })
                }
                className="flex-1 py-1.5 px-2 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                {selectedObject.visible ? (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Visible
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" /> Hidden
                  </>
                )}
              </button>
              <button
                onClick={duplicateSelectedObjects}
                className="p-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deleteSelectedObjects}
                className="p-1.5 border border-red-300 text-red-600 hover:bg-red-50 cursor-pointer"
                title="Delete (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignment & Distribution */}
            <div>
              <div className="text-[10px] font-mono text-zinc-500 mb-1.5">
                ALIGNMENT & DISTRIBUTION
              </div>
              <div className="grid grid-cols-6 gap-1">
                {(
                  [
                    ['left', 'L'],
                    ['center', 'C'],
                    ['right', 'R'],
                    ['top', 'T'],
                    ['middle', 'M'],
                    ['bottom', 'B'],
                  ] as const
                ).map(([m, lbl]) => (
                  <button
                    key={m}
                    onClick={() => alignSelected(m)}
                    className="py-1 font-mono text-[11px] border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] cursor-pointer"
                    title={`Align ${m}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                <button
                  onClick={() => distributeSelected('horizontal')}
                  className="py-1 text-[11px] border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] cursor-pointer"
                >
                  Distribute Horiz
                </button>
                <button
                  onClick={() => distributeSelected('vertical')}
                  className="py-1 text-[11px] border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] cursor-pointer"
                >
                  Distribute Vert
                </button>
              </div>
            </div>

            {/* Transform Geometry (X, Y, W, H, Rotation, Opacity) */}
            <div>
              <div className="text-[10px] font-mono text-zinc-500 mb-1.5">
                TRANSFORM GEOMETRY (PX / DEG)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="X"
                  value={Math.round(selectedObject.x)}
                  onChange={(v) => updateFreeformObject(selectedObject.id, { x: v })}
                />
                <NumberField
                  label="Y"
                  value={Math.round(selectedObject.y)}
                  onChange={(v) => updateFreeformObject(selectedObject.id, { y: v })}
                />
                <NumberField
                  label="W"
                  value={Math.round(selectedObject.width)}
                  onChange={(v) =>
                    updateFreeformObject(selectedObject.id, { width: Math.max(16, v) })
                  }
                />
                <NumberField
                  label="H"
                  value={Math.round(selectedObject.height)}
                  onChange={(v) =>
                    updateFreeformObject(selectedObject.id, { height: Math.max(16, v) })
                  }
                />
                <NumberField
                  label="ROT°"
                  value={Math.round(selectedObject.rotation)}
                  onChange={(v) =>
                    updateFreeformObject(selectedObject.id, { rotation: v })
                  }
                />
                <NumberField
                  label="OPACITY %"
                  value={Math.round(selectedObject.opacity * 100)}
                  onChange={(v) =>
                    updateFreeformObject(selectedObject.id, {
                      opacity: Math.max(0.05, Math.min(1, v / 100)),
                    })
                  }
                />
              </div>
            </div>

            {/* Layer Z-Order */}
            <div>
              <div className="text-[10px] font-mono text-zinc-500 mb-1.5">
                LAYER STACKING ORDER
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    ['front', 'Front'],
                    ['forward', '+1'],
                    ['backward', '-1'],
                    ['back', 'Back'],
                  ] as const
                ).map(([act, lbl]) => (
                  <button
                    key={act}
                    onClick={() => reorderLayer(selectedObject.id, act)}
                    className="py-1 text-[11px] border border-zinc-200 dark:border-zinc-800 hover:border-[#002FA7] cursor-pointer"
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Appearance (Fill, Stroke, Radius, Blur, Shadow) */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">
                SURFACE & APPEARANCE
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Fill Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={
                        selectedObject.fill.startsWith('#')
                          ? selectedObject.fill
                          : '#ffffff'
                      }
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, { fill: e.target.value })
                      }
                      className="w-7 h-7 border border-zinc-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedObject.fill}
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, { fill: e.target.value })
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono border border-zinc-300 dark:border-zinc-700 bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">
                    Stroke Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={
                        selectedObject.stroke.startsWith('#')
                          ? selectedObject.stroke
                          : '#050505'
                      }
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, {
                          stroke: e.target.value,
                        })
                      }
                      className="w-7 h-7 border border-zinc-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedObject.stroke}
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, {
                          stroke: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1 text-[11px] font-mono border border-zinc-300 dark:border-zinc-700 bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <NumberField
                  label="STROKE W"
                  value={selectedObject.strokeWidth}
                  onChange={(v) =>
                    updateFreeformObject(selectedObject.id, {
                      strokeWidth: Math.max(0, v),
                    })
                  }
                />
                <NumberField
                  label="RADIUS"
                  value={selectedObject.borderRadius}
                  onChange={(v) =>
                    updateFreeformObject(selectedObject.id, {
                      borderRadius: Math.max(0, v),
                    })
                  }
                />
                <NumberField
                  label="BLUR"
                  value={selectedObject.blur}
                  onChange={(v) =>
                    updateFreeformObject(selectedObject.id, {
                      blur: Math.max(0, v),
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs text-zinc-700 dark:text-zinc-300">
                  Drop Shadow
                </label>
                <input
                  type="checkbox"
                  checked={selectedObject.shadow.enabled}
                  onChange={(e) =>
                    updateFreeformObject(selectedObject.id, {
                      shadow: {
                        ...selectedObject.shadow,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="accent-[#002FA7]"
                />
              </div>
            </div>

            {/* Freeform Textbox or Label Typography */}
            {(selectedObject.type === 'textbox' ||
              selectedObject.type === 'shape') && (
              <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-500">
                  OBJECT TEXT & TYPOGRAPHY
                </div>
                <textarea
                  rows={3}
                  value={selectedObject.text || ''}
                  onChange={(e) =>
                    updateFreeformObject(selectedObject.id, { text: e.target.value })
                  }
                  placeholder="Enter text inside object..."
                  className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
                <select
                  value={selectedObject.fontFamily || 'Plus Jakarta Sans'}
                  onChange={(e) =>
                    updateFreeformObject(selectedObject.id, {
                      fontFamily: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="FONT PX"
                    value={selectedObject.fontSize || 16}
                    onChange={(v) =>
                      updateFreeformObject(selectedObject.id, {
                        fontSize: Math.max(8, v),
                      })
                    }
                  />
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">
                      TEXT COLOR
                    </label>
                    <input
                      type="color"
                      value={selectedObject.textColor || '#050505'}
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, {
                          textColor: e.target.value,
                        })
                      }
                      className="w-full h-7 border border-zinc-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image Filters, Crop & Mask */}
            {selectedObject.type === 'image' && selectedObject.imageAdjustments && (
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">
                    IMAGE FILTERS & MASK
                  </span>
                  <button
                    onClick={() => replaceImageInputRef.current?.click()}
                    className="text-[11px] font-semibold text-[#002FA7] hover:underline cursor-pointer"
                  >
                    Replace Image
                  </button>
                  <input
                    ref={replaceImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        updateFreeformObject(selectedObject.id, {
                          imageUrl: reader.result as string,
                          name: f.name,
                        });
                      };
                      reader.readAsDataURL(f);
                    }}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      Mask Shape
                    </label>
                    <select
                      value={selectedObject.imageAdjustments.mask}
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, {
                          imageAdjustments: {
                            ...selectedObject.imageAdjustments!,
                            mask: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent"
                    >
                      <option value="none">Rectangle</option>
                      <option value="rounded">Rounded</option>
                      <option value="circle">Circle</option>
                      <option value="arch">Arch</option>
                      <option value="diamond">Diamond</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      Fit Mode
                    </label>
                    <select
                      value={selectedObject.imageAdjustments.fit}
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, {
                          imageAdjustments: {
                            ...selectedObject.imageAdjustments!,
                            fit: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="fill">Stretch Fill</option>
                    </select>
                  </div>
                </div>

                {(
                  [
                    ['brightness', 'Brightness', 0, 200],
                    ['contrast', 'Contrast', 0, 200],
                    ['saturation', 'Saturation', 0, 200],
                    ['blur', 'Blur (px)', 0, 20],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <div key={key}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span>{label}</span>
                      <span className="font-mono tabular-nums">
                        {selectedObject.imageAdjustments![key]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={selectedObject.imageAdjustments![key]}
                      onChange={(e) =>
                        updateFreeformObject(selectedObject.id, {
                          imageAdjustments: {
                            ...selectedObject.imageAdjustments!,
                            [key]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-[#002FA7]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Chart Inline Data Table Editor */}
            {selectedObject.type === 'chart' && (
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-500">
                  LIVE CHART DATA EDITOR
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">
                    Chart Type
                  </label>
                  <select
                    value={selectedObject.chartKind || 'bar'}
                    onChange={(e) =>
                      updateFreeformObject(selectedObject.id, {
                        chartKind: e.target.value as ChartKind,
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">
                    Chart Title
                  </label>
                  <input
                    type="text"
                    value={selectedObject.chartTitle || ''}
                    onChange={(e) =>
                      updateFreeformObject(selectedObject.id, {
                        chartTitle: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent"
                  />
                </div>

                <div className="space-y-1.5">
                  {(selectedObject.chartData || []).map((pt, idx) => (
                    <div key={pt.id} className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={pt.color || '#002FA7'}
                        onChange={(e) => {
                          const next = [...(selectedObject.chartData || [])];
                          next[idx] = { ...pt, color: e.target.value };
                          updateFreeformObject(selectedObject.id, { chartData: next });
                        }}
                        className="w-5 h-6 border border-zinc-300 shrink-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pt.label}
                        onChange={(e) => {
                          const next = [...(selectedObject.chartData || [])];
                          next[idx] = { ...pt, label: e.target.value };
                          updateFreeformObject(selectedObject.id, { chartData: next });
                        }}
                        className="w-20 px-1.5 py-1 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                      <input
                        type="number"
                        value={pt.value}
                        onChange={(e) => {
                          const next = [...(selectedObject.chartData || [])];
                          next[idx] = { ...pt, value: Number(e.target.value) || 0 };
                          updateFreeformObject(selectedObject.id, { chartData: next });
                        }}
                        className="flex-1 px-1.5 py-1 text-xs font-mono tabular-nums border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                      <button
                        onClick={() => {
                          const next = (selectedObject.chartData || []).filter(
                            (_, i) => i !== idx
                          );
                          updateFreeformObject(selectedObject.id, { chartData: next });
                        }}
                        className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const next = [
                        ...(selectedObject.chartData || []),
                        {
                          id: uid('pt'),
                          label: `S${(selectedObject.chartData?.length || 0) + 1}`,
                          value: 50,
                          color: '#002FA7',
                        },
                      ];
                      updateFreeformObject(selectedObject.id, { chartData: next });
                    }}
                    className="w-full py-1.5 border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:border-[#002FA7] cursor-pointer"
                  >
                    + Add Data Series Row
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= 2. FLOW DOCUMENT BLOCK INSPECTOR ================= */}
        {!selectedObject && selectedFlowBlock && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-1 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveFlowBlock(selectedFlowBlock.id, 'up')}
                  className="p-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
                  title="Move Flow Block Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveFlowBlock(selectedFlowBlock.id, 'down')}
                  className="p-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
                  title="Move Flow Block Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => deleteFlowBlock(selectedFlowBlock.id)}
                className="px-2.5 py-1 border border-red-300 text-red-600 text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Block
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                BLOCK SEMANTIC TYPE
              </label>
              <select
                value={selectedFlowBlock.type}
                onChange={(e) => {
                  const nextType = e.target.value as FlowBlockType;
                  updateFlowBlock(selectedFlowBlock.id, {
                    type: nextType,
                    table:
                      nextType === 'table' && !selectedFlowBlock.table
                        ? createTableStructure(3, 3)
                        : selectedFlowBlock.table,
                  });
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
              >
                <option value="h1">Heading 1 (H1)</option>
                <option value="h2">Heading 2 (H2)</option>
                <option value="h3">Heading 3 (H3)</option>
                <option value="h4">Heading 4 (H4)</option>
                <option value="h5">Heading 5 (H5)</option>
                <option value="h6">Heading 6 (H6)</option>
                <option value="paragraph">Paragraph</option>
                <option value="quote">Block Quote</option>
                <option value="bullet-list">Unordered Bullet List</option>
                <option value="numbered-list">Ordered Numbered List</option>
                <option value="checklist">Interactive Checklist</option>
                <option value="caption">Caption</option>
                <option value="footnote">Footnote</option>
                <option value="code">Code Block</option>
                <option value="table">Structured Table</option>
              </select>
            </div>

            {/* Font Family & Size */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                TYPOGRAPHY & FONT
              </label>
              <select
                value={selectedFlowBlock.style.fontFamily || 'Plus Jakarta Sans'}
                onChange={(e) =>
                  updateFlowBlock(selectedFlowBlock.id, {
                    style: { fontFamily: e.target.value },
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mb-2"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="SIZE (PX)"
                  value={selectedFlowBlock.style.fontSize || 14}
                  onChange={(v) =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: { fontSize: Math.max(8, v) },
                    })
                  }
                />
                <NumberField
                  label="WEIGHT"
                  value={Number(selectedFlowBlock.style.fontWeight) || 400}
                  step={100}
                  onChange={(v) =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: { fontWeight: String(Math.min(900, Math.max(300, v))) },
                    })
                  }
                />
              </div>
            </div>

            {/* Inline Formatting Toggles */}
            <div>
              <div className="text-[10px] font-mono text-zinc-500 mb-1">
                CHARACTER FORMATTING
              </div>
              <div className="grid grid-cols-6 gap-1">
                <button
                  onClick={() =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: {
                        fontWeight:
                          selectedFlowBlock.style.fontWeight === '700' ? '400' : '700',
                      },
                    })
                  }
                  className={`py-1.5 flex items-center justify-center border cursor-pointer ${
                    selectedFlowBlock.style.fontWeight === '700'
                      ? 'border-[#002FA7] bg-[#002FA7] text-white'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: {
                        fontStyle:
                          selectedFlowBlock.style.fontStyle === 'italic'
                            ? 'normal'
                            : 'italic',
                      },
                    })
                  }
                  className={`py-1.5 flex items-center justify-center border cursor-pointer ${
                    selectedFlowBlock.style.fontStyle === 'italic'
                      ? 'border-[#002FA7] bg-[#002FA7] text-white'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: {
                        textDecoration:
                          selectedFlowBlock.style.textDecoration === 'underline'
                            ? 'none'
                            : 'underline',
                      },
                    })
                  }
                  className={`py-1.5 flex items-center justify-center border cursor-pointer ${
                    selectedFlowBlock.style.textDecoration === 'underline'
                      ? 'border-[#002FA7] bg-[#002FA7] text-white'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: {
                        textDecoration:
                          selectedFlowBlock.style.textDecoration === 'line-through'
                            ? 'none'
                            : 'line-through',
                      },
                    })
                  }
                  className={`py-1.5 flex items-center justify-center border cursor-pointer ${
                    selectedFlowBlock.style.textDecoration === 'line-through'
                      ? 'border-[#002FA7] bg-[#002FA7] text-white'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: {
                        verticalAlign:
                          selectedFlowBlock.style.verticalAlign === 'super'
                            ? 'baseline'
                            : 'super',
                      },
                    })
                  }
                  className={`py-1.5 flex items-center justify-center border cursor-pointer ${
                    selectedFlowBlock.style.verticalAlign === 'super'
                      ? 'border-[#002FA7] bg-[#002FA7] text-white'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  title="Superscript"
                >
                  <Superscript className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: {
                        verticalAlign:
                          selectedFlowBlock.style.verticalAlign === 'sub'
                            ? 'baseline'
                            : 'sub',
                      },
                    })
                  }
                  className={`py-1.5 flex items-center justify-center border cursor-pointer ${
                    selectedFlowBlock.style.verticalAlign === 'sub'
                      ? 'border-[#002FA7] bg-[#002FA7] text-white'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  title="Subscript"
                >
                  <Subscript className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div>
              <div className="text-[10px] font-mono text-zinc-500 mb-1">
                PARAGRAPH ALIGNMENT
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    ['left', AlignLeft],
                    ['center', AlignCenter],
                    ['right', AlignRight],
                    ['justify', AlignJustify],
                  ] as const
                ).map(([al, Icon]) => (
                  <button
                    key={al}
                    onClick={() =>
                      updateFlowBlock(selectedFlowBlock.id, {
                        style: { textAlign: al },
                      })
                    }
                    className={`py-1.5 flex items-center justify-center border cursor-pointer ${
                      (selectedFlowBlock.style.textAlign || 'left') === al
                        ? 'border-[#002FA7] bg-[#002FA7] text-white'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Colors & Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  TEXT COLOR
                </label>
                <input
                  type="color"
                  value={selectedFlowBlock.style.color || '#050505'}
                  onChange={(e) =>
                    updateFlowBlock(selectedFlowBlock.id, {
                      style: { color: e.target.value },
                    })
                  }
                  className="w-full h-7 border border-zinc-300 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  HIGHLIGHT
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={selectedFlowBlock.style.backgroundColor || '#ffffff'}
                    onChange={(e) =>
                      updateFlowBlock(selectedFlowBlock.id, {
                        style: { backgroundColor: e.target.value },
                      })
                    }
                    className="w-full h-7 border border-zinc-300 cursor-pointer"
                  />
                  <button
                    onClick={() =>
                      updateFlowBlock(selectedFlowBlock.id, {
                        style: { backgroundColor: undefined },
                      })
                    }
                    className="px-1.5 py-1 text-[10px] border border-zinc-300"
                    title="Clear Highlight"
                  >
                    Clr
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="LINE HEIGHT"
                value={selectedFlowBlock.style.lineHeight || 1.5}
                step={0.1}
                onChange={(v) =>
                  updateFlowBlock(selectedFlowBlock.id, {
                    style: { lineHeight: Math.max(0.8, v) },
                  })
                }
              />
              <NumberField
                label="INDENT LVL"
                value={selectedFlowBlock.style.indentLevel || 0}
                onChange={(v) =>
                  updateFlowBlock(selectedFlowBlock.id, {
                    style: { indentLevel: Math.max(0, Math.min(8, v)) },
                  })
                }
              />
              <NumberField
                label="SPACE AFTER"
                value={selectedFlowBlock.style.paragraphSpacingAfter ?? 10}
                onChange={(v) =>
                  updateFlowBlock(selectedFlowBlock.id, {
                    style: { paragraphSpacingAfter: Math.max(0, v) },
                  })
                }
              />
              <NumberField
                label="TRACKING (EM)"
                value={selectedFlowBlock.style.letterSpacing || 0}
                step={0.01}
                onChange={(v) =>
                  updateFlowBlock(selectedFlowBlock.id, {
                    style: { letterSpacing: v },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                HYPERLINK URL (OPTIONAL)
              </label>
              <input
                type="url"
                value={selectedFlowBlock.style.hyperlink || ''}
                onChange={(e) =>
                  updateFlowBlock(selectedFlowBlock.id, {
                    style: { hyperlink: e.target.value },
                  })
                }
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
              />
            </div>
          </div>
        )}

        {/* ================= 3. SHARED TABLE ENGINE INSPECTOR ================= */}
        {activeTable && (
          <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-500">
              TABLE ENGINE CONTROLS ({activeTable.rows}×{activeTable.cols})
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  mutateTable((tbl) => {
                    tbl.rows += 1;
                    tbl.rowHeights.push(36);
                    tbl.cells.push(
                      Array.from({ length: tbl.cols }, (_, c) => ({
                        id: uid('cell'),
                        content: `Cell ${tbl.rows},${c + 1}`,
                        backgroundColor: '#FFFFFF',
                        textColor: '#050505',
                        textAlign: 'left',
                      }))
                    );
                  })
                }
                className="py-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
              >
                + Insert Row
              </button>
              <button
                onClick={() =>
                  mutateTable((tbl) => {
                    if (tbl.rows <= 1) return;
                    tbl.rows -= 1;
                    tbl.rowHeights.pop();
                    tbl.cells.pop();
                  })
                }
                className="py-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-red-500 cursor-pointer"
              >
                - Delete Row
              </button>
              <button
                onClick={() =>
                  mutateTable((tbl) => {
                    tbl.cols += 1;
                    tbl.colWidths.push(Math.round(100 / tbl.cols));
                    tbl.cells.forEach((row, r) =>
                      row.push({
                        id: uid('cell'),
                        content: r === 0 ? `Header ${tbl.cols}` : `Cell`,
                        backgroundColor: r === 0 ? '#F4F4F5' : '#FFFFFF',
                        textColor: '#050505',
                        fontWeight: r === 0 ? 'bold' : 'normal',
                      })
                    );
                  })
                }
                className="py-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
              >
                + Insert Col
              </button>
              <button
                onClick={() =>
                  mutateTable((tbl) => {
                    if (tbl.cols <= 1) return;
                    tbl.cols -= 1;
                    tbl.colWidths.pop();
                    tbl.cells.forEach((row) => row.pop());
                  })
                }
                className="py-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-red-500 cursor-pointer"
              >
                - Delete Col
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  mutateTable((tbl) => {
                    if (tbl.cols >= 2 && tbl.cells[0]?.[0] && tbl.cells[0]?.[1]) {
                      tbl.cells[0][0].colSpan = 2;
                      tbl.cells[0][1].hidden = true;
                    }
                  })
                }
                className="py-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
              >
                Merge Top Header
              </button>
              <button
                onClick={() =>
                  mutateTable((tbl) => {
                    tbl.cells.forEach((r) =>
                      r.forEach((c) => {
                        c.colSpan = 1;
                        c.rowSpan = 1;
                        c.hidden = false;
                      })
                    );
                  })
                }
                className="py-1.5 border border-zinc-300 dark:border-zinc-700 hover:border-[#002FA7] cursor-pointer"
              >
                Split Merged Cells
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="CELL PAD (PX)"
                value={activeTable.cellPadding}
                onChange={(v) =>
                  mutateTable((tbl) => {
                    tbl.cellPadding = Math.max(2, v);
                  })
                }
              />
              <NumberField
                label="BORDER PX"
                value={activeTable.borderWidth}
                onChange={(v) =>
                  mutateTable((tbl) => {
                    tbl.borderWidth = Math.max(0, v);
                  })
                }
              />
            </div>
          </div>
        )}

        {/* ================= 4. PAGE & STUDIO SETTINGS (DEFAULT) ================= */}
        {!selectedObject && !selectedFlowBlock && activePage && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                ACTIVE PAGE NAME & PAPER COLOR
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={activePage.name}
                  onChange={(e) =>
                    commitMutation('Rename Page', 'page_rename', (draft) => {
                      draft.pages[activePageIndex].name = e.target.value;
                    })
                  }
                  className="flex-1 px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
                <input
                  type="color"
                  value={activePage.background || '#FFFFFF'}
                  onChange={(e) =>
                    commitMutation('Page Background', 'page_bg', (draft) => {
                      draft.pages[activePageIndex].background = e.target.value;
                    })
                  }
                  className="w-8 h-8 border border-zinc-300 cursor-pointer"
                  title="Page Background Color"
                />
              </div>
            </div>

            {/* Header & Footer Configuration */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">
                  RUNNING HEADER & FOOTER
                </span>
                <input
                  type="checkbox"
                  checked={project.footer.enabled}
                  onChange={(e) =>
                    updatePageSettings({
                      header: { ...project.header, enabled: e.target.checked },
                      footer: { ...project.footer, enabled: e.target.checked },
                    })
                  }
                  className="accent-[#002FA7]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-0.5">
                  Custom Edition / Field Token ({'{{custom}}'})
                </label>
                <input
                  type="text"
                  value={project.customField}
                  onChange={(e) => updatePageSettings({ customField: e.target.value })}
                  className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-0.5">
                  Footer Left Text
                </label>
                <input
                  type="text"
                  value={project.footer.leftText}
                  onChange={(e) =>
                    updatePageSettings({
                      footer: { ...project.footer, leftText: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 mb-0.5">
                  Footer Right ({{page}} / {{total}})
                </label>
                <input
                  type="text"
                  value={project.footer.rightText}
                  onChange={(e) =>
                    updatePageSettings({
                      footer: { ...project.footer, rightText: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
              </div>
            </div>

            {/* Smart Design Guides & Grid Options */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">
                SMART GUIDES, RULERS & BLEED
              </div>
              {(
                [
                  ['showRulers', 'Show Rulers (mm/px)', showRulers],
                  ['snapEnabled', 'Smart Alignment Snapping', snapEnabled],
                  ['showGrid', 'Show Baseline / Square Grid', showGrid],
                  ['snapToGrid', 'Snap Objects to Grid', snapToGrid],
                  ['showMargins', 'Show Page Margin Frame', showMargins],
                  ['showBleed', 'Show Print Bleed & Safe Area', showBleed],
                ] as const
              ).map(([opt, label, val]) => (
                <label
                  key={opt}
                  className="flex items-center justify-between py-0.5 cursor-pointer"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={() => toggleCanvasOption(opt)}
                    className="accent-[#002FA7]"
                  />
                </label>
              ))}
              <NumberField
                label="GRID STEP (PX)"
                value={gridSizePx}
                onChange={setGridSizePx}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const NumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  onChange: (val: number) => void;
}> = ({ label, value, step = 1, onChange }) => (
  <div>
    <label className="block text-[10px] font-mono text-zinc-500 mb-0.5">{label}</label>
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-2 py-1 text-xs font-mono tabular-nums bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#002FA7]"
    />
  </div>
);
