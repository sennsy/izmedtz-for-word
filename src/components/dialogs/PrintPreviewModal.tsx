import React, { useMemo, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { PAGE_PRESETS_MM, PageOrientation, PageSizePreset } from '../../core/document/types';
import { renderPageToSvgString } from '../../core/export/exportEngine';
import { useStudioStore } from '../../core/history/studioStore';

export const PrintPreviewModal: React.FC = () => {
  const { showPrintModal, setModal, project, updatePageSettings } = useStudioStore();

  const [scaleMode, setScaleMode] = useState<'fit' | 'actual' | 'custom'>('fit');
  const [customScale, setCustomScale] = useState(100);
  const [pageRange, setPageRange] = useState('');

  const filteredPages = useMemo(() => {
    if (!pageRange.trim()) {
      return project.pages.map((p, idx) => ({ page: p, index: idx }));
    }
    const indices = new Set<number>();
    const parts = pageRange.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const s = parseInt(startStr, 10);
        const e = parseInt(endStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
            if (i >= 1 && i <= project.pages.length) indices.add(i - 1);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= project.pages.length) {
          indices.add(num - 1);
        }
      }
    }
    const list = Array.from(indices).sort((a, b) => a - b);
    return list.map((idx) => ({ page: project.pages[idx], index: idx }));
  }, [project.pages, pageRange]);

  if (!showPrintModal) return null;

  const effectiveScale =
    scaleMode === 'fit' ? 0.55 : scaleMode === 'actual' ? 0.85 : (customScale / 100) * 0.75;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-5xl h-[86vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Printer className="w-4 h-4 text-[#002FA7]" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
              Print Calibration & Preview ({project.pageSizePreset} · {project.dimensionsMm.width}×{project.dimensionsMm.height} mm)
            </h2>
          </div>
          <button
            onClick={() => setModal('print', false)}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Calibration Sidebar */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Page Size Standard
              </label>
              <select
                value={project.pageSizePreset}
                onChange={(e) =>
                  updatePageSettings({ pageSizePreset: e.target.value as PageSizePreset })
                }
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="F4">F4 Folio (215 × 330 mm)</option>
                <option value="Letter">US Letter (215.9 × 279.4 mm)</option>
                <option value="Legal">US Legal (215.9 × 355.6 mm)</option>
                <option value="A5">A5 (148 × 210 mm)</option>
                <option value="Custom">Custom Dimensions</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['portrait', 'landscape'] as PageOrientation[]).map((ori) => (
                  <button
                    key={ori}
                    onClick={() => updatePageSettings({ orientation: ori })}
                    className={`py-1.5 text-xs font-medium border capitalize cursor-pointer ${
                      project.orientation === ori
                        ? 'border-[#002FA7] bg-[#002FA7] text-white'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {ori}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Margins (mm) — Top / Right / Bottom / Left
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
                  <input
                    key={edge}
                    type="number"
                    min={0}
                    max={80}
                    value={project.marginsMm[edge]}
                    onChange={(e) =>
                      updatePageSettings({
                        marginsMm: {
                          ...project.marginsMm,
                          [edge]: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs font-mono tabular-nums bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-center"
                    title={`${edge} margin (mm)`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Scale Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['fit', 'actual', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setScaleMode(mode)}
                    className={`py-1.5 text-xs font-medium border capitalize cursor-pointer ${
                      scaleMode === mode
                        ? 'border-[#002FA7] bg-[#002FA7] text-white'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {mode === 'actual' ? '100%' : mode}
                  </button>
                ))}
              </div>
              {scaleMode === 'custom' && (
                <input
                  type="number"
                  min={25}
                  max={200}
                  value={customScale}
                  onChange={(e) => setCustomScale(Number(e.target.value) || 100)}
                  className="mt-2 w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                Page Range (e.g. 1-2, leave blank for all {project.pages.length} pages)
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder={`All (${project.pages.length} pages)`}
                className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 bg-[#002FA7] hover:bg-[#00227A] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Document ({filteredPages.length} Page{filteredPages.length === 1 ? '' : 's'})
              </button>
            </div>
          </div>

          {/* Live Sheet Preview */}
          <div
            id="izm-print-root"
            className="flex-1 bg-zinc-100 dark:bg-zinc-900 p-8 overflow-y-auto flex flex-col items-center gap-8"
          >
            {filteredPages.map(({ page, index }) => {
              const svgMarkup = renderPageToSvgString(project, page, index);
              return (
                <div key={page.id} className="izm-print-page flex flex-col items-center">
                  <div className="text-[11px] font-mono text-zinc-500 mb-2">
                    Page {index + 1} · {project.pageSizePreset} ({project.orientation})
                  </div>
                  <div
                    className="bg-white shadow-lg border border-zinc-300 origin-top"
                    style={{
                      transform: `scale(${effectiveScale})`,
                      marginBottom: `-${Math.round((1 - effectiveScale) * 520)}px`,
                    }}
                    dangerouslySetInnerHTML={{ __html: svgMarkup }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
