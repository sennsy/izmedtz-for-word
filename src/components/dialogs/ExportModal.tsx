import React, { useState } from 'react';
import { Download, FileArchive, FileCode, FileImage, FileText, X } from 'lucide-react';
import { ExportFormat, exportProject } from '../../core/export/exportEngine';
import { useStudioStore } from '../../core/history/studioStore';

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  ext: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'izm',
    label: 'Canonical izmedtzz Archive',
    ext: '.izm',
    badge: 'SOURCE OF TRUTH',
    description:
      'Lossless master project archive containing manifest.json, document.json, binary assets, and page thumbnails.',
  },
  {
    id: 'pdf',
    label: 'Print-Ready Document PDF',
    ext: '.pdf',
    badge: 'RECOMMENDED VISUAL',
    description:
      'Multi-page calibrated PDF preserving exact hybrid flow and freeform layout geometry.',
  },
  {
    id: 'svg',
    label: 'Scalable Vector Graphic',
    ext: '.svg',
    badge: 'VECTOR',
    description: 'Resolution-independent vector scene graph of the current page.',
  },
  {
    id: 'png',
    label: 'High-Resolution PNG Image',
    ext: '.png',
    badge: '2X RASTER',
    description: 'Crisp 2x supersampled raster image of the active page.',
  },
  {
    id: 'jpg',
    label: 'Compressed JPEG Image',
    ext: '.jpg',
    badge: 'RASTER',
    description: 'Compact photographic export for rapid sharing.',
  },
  {
    id: 'webp',
    label: 'Modern WebP Image',
    ext: '.webp',
    badge: 'WEB RASTER',
    description: 'High-efficiency WebP page render.',
  },
  {
    id: 'docx',
    label: 'Microsoft Word OpenXML',
    ext: '.docx',
    badge: 'STRUCTURED FLOW',
    description:
      'Exports structured headings, paragraphs, checklists, tables, and text content into an editable Word document.',
  },
  {
    id: 'pptx',
    label: 'PowerPoint Presentation Deck',
    ext: '.pptx',
    badge: 'SLIDE DECK',
    description:
      'Maps each page into an editable OpenXML presentation slide with text frames.',
  },
];

export const ExportModal: React.FC = () => {
  const { showExportModal, setModal, project, activePageIndex, setToast } = useStudioStore();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('izm');
  const [exporting, setExporting] = useState(false);

  if (!showExportModal) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProject(project, selectedFormat, activePageIndex);
      setToast(`Exported "${project.title}" as .${selectedFormat.toUpperCase()}`);
      setModal('export', false);
    } catch (err) {
      setToast(
        err instanceof Error
          ? `Export failed: ${err.message} — your project remains safely intact.`
          : 'Export failed — your project remains safely intact.'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[#002FA7]" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
              Export Studio Project — {project.title}
            </h2>
          </div>
          <button
            onClick={() => setModal('export', false)}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FORMAT_OPTIONS.map((fmt) => {
              const active = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`text-left p-3.5 border transition-colors cursor-pointer ${
                    active
                      ? 'border-[#002FA7] bg-[#002FA7]/5 dark:bg-[#002FA7]/15'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950 dark:text-white">
                      {fmt.label} ({fmt.ext})
                    </span>
                    <span className="text-[10px] font-mono text-[#002FA7]">{fmt.badge}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {fmt.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
            <strong>Format Fidelity Note:</strong> <code>.izm</code> is the canonical lossless source-of-truth archive. Use <strong>PDF</strong> or <strong>SVG</strong> for exact visual layout preservation of freeform graphics, and <strong>DOCX / PPTX</strong> when downstream text/slide editing in Office suites is needed.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setModal('export', false)}
              className="px-4 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-5 py-2 bg-[#002FA7] hover:bg-[#00227A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting
                ? 'Synthesizing Package...'
                : `Download ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
