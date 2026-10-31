import React, { useEffect, useRef, useState } from 'react';
import {
  createFreeformImage,
  getPagePixelDimensions,
  uid,
} from '../../../core/document/factories';
import { FreeformObject, MM_TO_PX } from '../../../core/document/types';
import { useStudioStore } from '../../../core/history/studioStore';
import { computeSnappedPosition, SnapGuide } from '../../../core/transforms/snapEngine';
import { saveAssetToDb } from '../../../storage/db/dexieDb';
import { FlowDocumentZone } from './FlowDocumentZone';
import { FreeformNodeRenderer } from './FreeformNodeRenderer';

export const HybridCanvasWorkspace: React.FC = () => {
  const {
    project,
    activePageIndex,
    selectedObjectIds,
    zoom,
    panX,
    panY,
    showRulers,
    showGrid,
    gridSizePx,
    snapEnabled,
    snapToGrid,
    showMargins,
    showBleed,
    setActivePageIndex,
    selectObject,
    selectFlowBlock,
    addFreeformObject,
    updateFreeformObject,
    setZoom,
    setPan,
    setToast,
  } = useStudioStore();

  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([]);
  const [isPanning, setIsPanning] = useState(false);

  const { widthPx, heightPx } = getPagePixelDimensions(
    project.dimensionsMm,
    project.orientation
  );

  const marginTopPx = Math.round(project.marginsMm.top * MM_TO_PX);
  const marginRightPx = Math.round(project.marginsMm.right * MM_TO_PX);
  const marginBottomPx = Math.round(project.marginsMm.bottom * MM_TO_PX);
  const marginLeftPx = Math.round(project.marginsMm.left * MM_TO_PX);
  const bleedPx = Math.round(project.bleedMm * MM_TO_PX);

  // Handle clipboard image paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = async () => {
            const dataUrl = reader.result as string;
            const assetId = uid('asset');
            await saveAssetToDb({
              id: assetId,
              name: file.name || 'clipboard-image.png',
              mimeType: file.type,
              sizeBytes: file.size,
              dataUrl,
              createdAt: Date.now(),
            });
            addFreeformObject(
              createFreeformImage(dataUrl, 'Pasted Clipboard Image', assetId)
            );
            setToast('Pasted image from clipboard onto active page.');
          };
          reader.readAsDataURL(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFreeformObject, setToast]);

  // Handle drag and drop media files onto canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const assetId = uid('asset');
      await saveAssetToDb({
        id: assetId,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        dataUrl,
        createdAt: Date.now(),
      });
      addFreeformObject(createFreeformImage(dataUrl, file.name, assetId));
      setToast(`Dropped "${file.name}" onto canvas.`);
    };
    reader.readAsDataURL(file);
  };

  // Interactive Pointer Transform Handler (Drag, Alt-Duplicate, Resize, Rotate)
  const handleStartTransform = (
    e: React.PointerEvent,
    obj: FreeformObject,
    mode:
      | 'move'
      | 'rotate'
      | 'nw'
      | 'n'
      | 'ne'
      | 'e'
      | 'se'
      | 's'
      | 'sw'
      | 'w'
  ) => {
    selectObject(obj.id, e.shiftKey);
    if (obj.locked) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origX = obj.x;
    const origY = obj.y;
    const origW = obj.width;
    const origH = obj.height;
    const origRot = obj.rotation;

    let targetId = obj.id;

    // Optional Alt/Option-drag duplication
    if (mode === 'move' && e.altKey) {
      const copy: FreeformObject = JSON.parse(JSON.stringify(obj));
      copy.id = uid('obj');
      copy.name = `${obj.name} Copy`;
      addFreeformObject(copy);
      targetId = copy.id;
    }

    const activePage = project.pages[activePageIndex];
    const siblings = activePage ? activePage.freeformObjects : [];

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startClientX) / zoom;
      const dy = (moveEvent.clientY - startClientY) / zoom;

      if (mode === 'move') {
        let nextX = origX + dx;
        let nextY = origY + dy;

        if (moveEvent.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) nextY = origY;
          else nextX = origX;
        }

        const snapped = computeSnappedPosition({
          targetId,
          proposedX: nextX,
          proposedY: nextY,
          width: origW,
          height: origH,
          pageWidthPx: widthPx,
          pageHeightPx: heightPx,
          marginLeftPx,
          marginRightPx,
          marginTopPx,
          marginBottomPx,
          siblings,
          snapEnabled,
          gridSizePx,
          snapToGrid,
        });

        setActiveGuides(snapped.guides);
        updateFreeformObject(
          targetId,
          { x: snapped.x, y: snapped.y },
          `drag_${targetId}`
        );
      } else if (mode === 'rotate') {
        const angleDelta = dx * 0.8;
        const nextRot = moveEvent.shiftKey
          ? Math.round((origRot + angleDelta) / 15) * 15
          : Math.round(origRot + angleDelta);
        updateFreeformObject(
          targetId,
          { rotation: nextRot },
          `rot_${targetId}`
        );
      } else {
        let nx = origX;
        let ny = origY;
        let nw = origW;
        let nh = origH;

        if (mode.includes('e')) nw = Math.max(24, origW + dx);
        if (mode.includes('s')) nh = Math.max(24, origH + dy);
        if (mode.includes('w')) {
          const possibleW = origW - dx;
          if (possibleW >= 24) {
            nw = possibleW;
            nx = origX + dx;
          }
        }
        if (mode.includes('n')) {
          const possibleH = origH - dy;
          if (possibleH >= 24) {
            nh = possibleH;
            ny = origY + dy;
          }
        }

        updateFreeformObject(
          targetId,
          {
            x: Math.round(nx),
            y: Math.round(ny),
            width: Math.round(nw),
            height: Math.round(nh),
          },
          `resize_${targetId}`
        );
      }
    };

    const onPointerUp = () => {
      setActiveGuides([]);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const resolveTokens = (raw: string, pageIdx: number) => {
    const dateStr = new Date(project.updatedAt).toLocaleDateString('en-CA');
    return raw
      .replace(/\{\{title\}\}/g, project.title)
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{custom\}\}/g, project.customField || '')
      .replace(/\{\{page\}\}/g, String(pageIdx + 1))
      .replace(/\{\{total\}\}/g, String(project.pages.length));
  };

  return (
    <main
      ref={viewportRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setZoom(zoom + (e.deltaY < 0 ? 0.08 : -0.08));
        }
      }}
      onPointerDown={(e) => {
        if (e.button === 1 || e.altKey) {
          setIsPanning(true);
          const sx = e.clientX - panX;
          const sy = e.clientY - panY;
          const onMove = (me: PointerEvent) => setPan(me.clientX - sx, me.clientY - sy);
          const onUp = () => {
            setIsPanning(false);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        } else {
          selectObject(null);
          selectFlowBlock(null);
        }
      }}
      className={`flex-1 relative bg-[#ECECEE] dark:bg-[#0D0D0F] overflow-auto flex flex-col items-center py-10 px-6 ${
        isPanning ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Top Horizontal Ruler */}
      {showRulers && (
        <div className="sticky top-0 left-0 right-0 h-5 bg-white/90 dark:bg-zinc-900/90 border-b border-zinc-300 dark:border-zinc-800 flex items-center px-8 text-[9px] font-mono text-zinc-400 z-20 pointer-events-none select-none w-full justify-center">
          <div
            style={{ width: `${Math.round(widthPx * zoom)}px` }}
            className="flex justify-between"
          >
            <span>0 mm</span>
            <span>{Math.round(project.dimensionsMm.width * 0.25)} mm</span>
            <span>{Math.round(project.dimensionsMm.width * 0.5)} mm</span>
            <span>{Math.round(project.dimensionsMm.width * 0.75)} mm</span>
            <span>{project.dimensionsMm.width} mm</span>
          </div>
        </div>
      )}

      {/* Multi-Page Stack */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px)`,
        }}
        className="flex flex-col items-center gap-12 pb-24"
      >
        {project.pages.map((page, pageIndex) => {
          const isActivePage = pageIndex === activePageIndex;

          return (
            <div key={page.id} className="flex flex-col items-center">
              {/* Page Kicker Bar */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-2 px-1">
                <span>
                  PAGE {String(pageIndex + 1).padStart(2, '0')} /{' '}
                  {String(project.pages.length).padStart(2, '0')} · {page.name}
                </span>
                <span>
                  {project.pageSizePreset} ({project.dimensionsMm.width}×
                  {project.dimensionsMm.height} mm)
                </span>
              </div>

              {/* Scaled Page Container */}
              <div
                style={{
                  width: `${Math.round(widthPx * zoom)}px`,
                  height: `${Math.round(heightPx * zoom)}px`,
                }}
                className="relative"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActivePage) setActivePageIndex(pageIndex);
                  }}
                  style={{
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    backgroundColor: page.background || '#FFFFFF',
                    backgroundImage: showGrid
                      ? `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`
                      : undefined,
                    backgroundSize: showGrid
                      ? `${gridSizePx}px ${gridSizePx}px`
                      : undefined,
                  }}
                  className={`relative shadow-xl transition-shadow overflow-hidden ${
                    isActivePage
                      ? 'ring-2 ring-[#002FA7]'
                      : 'ring-1 ring-zinc-300 dark:ring-zinc-800'
                  }`}
                >
                  {/* Print Bleed Overlay */}
                  {showBleed && (
                    <div
                      style={{
                        inset: `${bleedPx}px`,
                      }}
                      className="absolute border border-dashed border-rose-500/60 pointer-events-none z-30"
                    />
                  )}

                  {/* Margin Guide Frame */}
                  {showMargins && (
                    <div
                      style={{
                        top: `${marginTopPx}px`,
                        right: `${marginRightPx}px`,
                        bottom: `${marginBottomPx}px`,
                        left: `${marginLeftPx}px`,
                      }}
                      className="absolute border border-dashed border-zinc-300/80 pointer-events-none z-10"
                    />
                  )}

                  {/* Running Header */}
                  {project.header.enabled && page.showHeader && (
                    <div
                      style={{
                        left: `${marginLeftPx}px`,
                        right: `${marginRightPx}px`,
                        top: `${Math.max(12, marginTopPx - 28)}px`,
                        fontSize: `${project.header.fontSize}px`,
                        color: project.header.textColor,
                      }}
                      className="absolute flex items-center justify-between font-mono pointer-events-none select-none z-20"
                    >
                      <span>{resolveTokens(project.header.leftText, pageIndex)}</span>
                      <span>{resolveTokens(project.header.rightText, pageIndex)}</span>
                    </div>
                  )}

                  {/* LAYER 1: Structured Flow Document Zone */}
                  <div
                    style={{
                      paddingTop: `${marginTopPx}px`,
                      paddingRight: `${marginRightPx}px`,
                      paddingBottom: `${marginBottomPx}px`,
                      paddingLeft: `${marginLeftPx}px`,
                    }}
                    className="w-full h-full relative z-10"
                  >
                    <FlowDocumentZone page={page} isActivePage={isActivePage} />
                  </div>

                  {/* LAYER 2: Freeform Spatial Objects Layer */}
                  <div className="absolute inset-0 pointer-events-auto z-20">
                    {page.freeformObjects.map((obj) => (
                      <FreeformNodeRenderer
                        key={obj.id}
                        obj={obj}
                        isSelected={
                          isActivePage && selectedObjectIds.includes(obj.id)
                        }
                        onStartTransform={handleStartTransform}
                      />
                    ))}
                  </div>

                  {/* Smart Alignment Snapping Guides */}
                  {isActivePage &&
                    activeGuides.map((g, i) =>
                      g.orientation === 'vertical' ? (
                        <div
                          key={`v_${i}`}
                          style={{ left: `${g.position}px` }}
                          className="absolute top-0 bottom-0 w-px bg-[#002FA7] z-40 pointer-events-none"
                        >
                          {g.label && (
                            <span className="bg-[#002FA7] text-white text-[9px] font-mono px-1 py-0.5 absolute top-2 left-1 whitespace-nowrap">
                              {g.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          key={`h_${i}`}
                          style={{ top: `${g.position}px` }}
                          className="absolute left-0 right-0 h-px bg-[#002FA7] z-40 pointer-events-none"
                        >
                          {g.label && (
                            <span className="bg-[#002FA7] text-white text-[9px] font-mono px-1 py-0.5 absolute left-2 top-1 whitespace-nowrap">
                              {g.label}
                            </span>
                          )}
                        </div>
                      )
                    )}

                  {/* Running Footer */}
                  {project.footer.enabled && page.showFooter && (
                    <div
                      style={{
                        left: `${marginLeftPx}px`,
                        right: `${marginRightPx}px`,
                        bottom: `${Math.max(12, marginBottomPx - 26)}px`,
                        fontSize: `${project.footer.fontSize}px`,
                        color: project.footer.textColor,
                      }}
                      className="absolute flex items-center justify-between font-mono pointer-events-none select-none z-20"
                    >
                      <span>{resolveTokens(project.footer.leftText, pageIndex)}</span>
                      <span>{resolveTokens(project.footer.rightText, pageIndex)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};
