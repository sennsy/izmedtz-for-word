import React from 'react';
import { ExternalLink, RotateCw } from 'lucide-react';
import { FreeformObject } from '../../../core/document/types';
import { useStudioStore } from '../../../core/history/studioStore';

export const FreeformNodeRenderer: React.FC<{
  obj: FreeformObject;
  isSelected: boolean;
  onStartTransform: (
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
  ) => void;
}> = ({ obj, isSelected, onStartTransform }) => {
  const { updateFreeformObject, commitMutation, activePageIndex } = useStudioStore();

  if (!obj.visible) return null;

  const shadowCss = obj.shadow?.enabled
    ? `${obj.shadow.offsetX}px ${obj.shadow.offsetY}px ${obj.shadow.blur}px ${obj.shadow.color}`
    : undefined;

  const maskStyle = (): React.CSSProperties => {
    const m = obj.imageAdjustments?.mask;
    if (m === 'circle') return { borderRadius: '9999px' };
    if (m === 'rounded') return { borderRadius: '20px' };
    if (m === 'arch') return { borderRadius: '999px 999px 0 0' };
    if (m === 'diamond') return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    return { borderRadius: `${obj.borderRadius || 0}px` };
  };

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onStartTransform(e, obj, 'move');
      }}
      style={{
        position: 'absolute',
        left: `${obj.x}px`,
        top: `${obj.y}px`,
        width: `${obj.width}px`,
        height: `${obj.height}px`,
        transform: `rotate(${obj.rotation}deg) scale(${obj.scaleX}, ${obj.scaleY})`,
        opacity: obj.opacity,
        zIndex: obj.zIndex + 20,
        filter: obj.blur ? `blur(${obj.blur}px)` : undefined,
        boxShadow: shadowCss,
      }}
      className={`group select-none ${
        obj.locked ? 'cursor-not-allowed' : 'cursor-move'
      } ${isSelected ? 'ring-2 ring-[#002FA7]' : 'hover:ring-1 hover:ring-[#002FA7]/60'}`}
    >
      {/* 1. TEXTBOX */}
      {obj.type === 'textbox' && (
        <div
          style={{
            backgroundColor: obj.fill,
            border: `${obj.strokeWidth}px solid ${obj.stroke}`,
            borderRadius: `${obj.borderRadius}px`,
            padding: `${obj.padding ?? 12}px`,
          }}
          className="w-full h-full overflow-hidden flex flex-col"
        >
          <textarea
            value={obj.text || ''}
            readOnly={obj.locked}
            onChange={(e) => updateFreeformObject(obj.id, { text: e.target.value })}
            onPointerDown={(e) => {
              if (isSelected) e.stopPropagation();
            }}
            style={{
              fontFamily: obj.fontFamily || 'Plus Jakarta Sans',
              fontSize: `${obj.fontSize || 16}px`,
              fontWeight: obj.fontWeight || '500',
              fontStyle: obj.fontStyle || 'normal',
              textDecoration: obj.textDecoration || 'none',
              color: obj.textColor || '#050505',
              textAlign: obj.textAlign || 'left',
              lineHeight: obj.lineHeight || 1.4,
            }}
            className="w-full h-full bg-transparent resize-none focus:outline-none"
          />
        </div>
      )}

      {/* 2. SHAPES & SVG */}
      {obj.type === 'shape' && (
        <ShapeSvgRenderer obj={obj} />
      )}

      {/* 3. IMAGES */}
      {obj.type === 'image' && (
        <div
          style={{
            ...maskStyle(),
            border: obj.imageAdjustments?.frameWidth
              ? `${obj.imageAdjustments.frameWidth}px solid ${obj.imageAdjustments.frameColor}`
              : undefined,
          }}
          className="w-full h-full overflow-hidden bg-zinc-100 flex items-center justify-center"
        >
          {obj.imageUrl ? (
            <img
              src={obj.imageUrl}
              alt={obj.imageAlt || obj.name}
              referrerPolicy="no-referrer"
              draggable={false}
              style={{
                objectFit: obj.imageAdjustments?.fit || 'cover',
                filter: `brightness(${obj.imageAdjustments?.brightness ?? 100}%) contrast(${
                  obj.imageAdjustments?.contrast ?? 100
                }%) saturate(${obj.imageAdjustments?.saturation ?? 100}%) blur(${
                  obj.imageAdjustments?.blur ?? 0
                }px)`,
              }}
              className="w-full h-full pointer-events-none"
            />
          ) : (
            <div className="text-xs font-mono text-zinc-400">Image Asset</div>
          )}
        </div>
      )}

      {/* 4. LIVE CHARTS */}
      {obj.type === 'chart' && (
        <ChartSvgRenderer obj={obj} />
      )}

      {/* 5. FREEFORM TABLE */}
      {obj.type === 'table' && obj.tableData && (
        <div className="w-full h-full bg-white overflow-hidden">
          <table className="w-full h-full border-collapse">
            <tbody>
              {obj.tableData.cells.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => {
                    if (cell.hidden) return null;
                    return (
                      <td
                        key={cell.id}
                        colSpan={cell.colSpan || 1}
                        rowSpan={cell.rowSpan || 1}
                        style={{
                          border: `${obj.tableData!.borderWidth}px solid ${obj.tableData!.borderColor}`,
                          padding: `${obj.tableData!.cellPadding}px`,
                          backgroundColor: cell.backgroundColor || '#FFFFFF',
                          color: cell.textColor || '#050505',
                          fontWeight: cell.fontWeight || 'normal',
                        }}
                      >
                        <input
                          type="text"
                          value={cell.content}
                          onPointerDown={(e) => {
                            if (isSelected) e.stopPropagation();
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            commitMutation('Edit Freeform Table Cell', `ftbl_${obj.id}`, (draft) => {
                              const pg = draft.pages[activePageIndex];
                              const fo = pg?.freeformObjects.find((o) => o.id === obj.id);
                              if (fo?.tableData?.cells[rIdx]?.[cIdx]) {
                                fo.tableData.cells[rIdx][cIdx].content = val;
                              }
                            });
                          }}
                          className="w-full bg-transparent focus:outline-none text-xs"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. EMBED / REFERENCE LINK CARD */}
      {obj.type === 'embed' && (
        <div
          style={{
            backgroundColor: obj.fill || '#FAFAFA',
            border: `${obj.strokeWidth}px solid ${obj.stroke}`,
          }}
          className="w-full h-full p-3.5 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500">
                REFERENCE EMBED
              </div>
              <div className="text-sm font-bold text-zinc-950 truncate mt-0.5">
                {obj.embedTitle || 'Reference Link'}
              </div>
            </div>
            {obj.embedUrl && (
              <a
                href={obj.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-[#002FA7] hover:bg-[#002FA7]/10"
                title="Open reference link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#002FA7] truncate">
            {obj.embedUrl}
          </div>
        </div>
      )}

      {/* SELECTION HANDLES (8 Resize + 1 Rotation + Coordinate Readout) */}
      {isSelected && !obj.locked && (
        <>
          {/* Rotation Handle */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartTransform(e, obj, 'rotate');
            }}
            title="Drag to rotate"
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#002FA7] flex items-center justify-center cursor-grab shadow-sm"
          >
            <RotateCw className="w-2.5 h-2.5 text-[#002FA7]" />
          </div>

          {/* 8 Resize Handles */}
          {(
            [
              ['nw', '-top-1.5 -left-1.5 cursor-nwse-resize'],
              ['n', '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'],
              ['ne', '-top-1.5 -right-1.5 cursor-nesw-resize'],
              ['e', 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize'],
              ['se', '-bottom-1.5 -right-1.5 cursor-nwse-resize'],
              ['s', '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize'],
              ['sw', '-bottom-1.5 -left-1.5 cursor-nesw-resize'],
              ['w', 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize'],
            ] as const
          ).map(([dir, posClass]) => (
            <div
              key={dir}
              onPointerDown={(e) => {
                e.stopPropagation();
                onStartTransform(e, obj, dir);
              }}
              className={`absolute w-3 h-3 bg-white border-2 border-[#002FA7] ${posClass}`}
            />
          ))}

          {/* Live Coordinate & Size Tag */}
          <div className="absolute -bottom-6 left-0 bg-[#050505] text-white px-1.5 py-0.5 text-[9px] font-mono tabular-nums whitespace-nowrap pointer-events-none">
            {Math.round(obj.x)}, {Math.round(obj.y)} · {Math.round(obj.width)}×
            {Math.round(obj.height)}
            {obj.rotation ? ` · ${Math.round(obj.rotation)}°` : ''}
          </div>
        </>
      )}
    </div>
  );
};

const ShapeSvgRenderer: React.FC<{ obj: FreeformObject }> = ({ obj }) => {
  const kind = obj.shapeKind || 'rectangle';
  const w = obj.width;
  const h = obj.height;

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full overflow-visible pointer-events-none"
      >
        {kind === 'circle' || kind === 'ellipse' ? (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={Math.max(2, w / 2 - obj.strokeWidth)}
            ry={Math.max(2, h / 2 - obj.strokeWidth)}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        ) : kind === 'triangle' ? (
          <polygon
            points={`${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        ) : kind === 'polygon' ? (
          <polygon
            points={`${w * 0.25},2 ${w * 0.75},2 ${w - 2},${h / 2} ${w * 0.75},${h - 2} ${
              w * 0.25
            },${h - 2} 2,${h / 2}`}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        ) : kind === 'star' ? (
          <polygon
            points={`${w * 0.5},2 ${w * 0.63},${h * 0.36} ${w - 2},${h * 0.38} ${w * 0.7},${
              h * 0.62
            } ${w * 0.81},${h - 2} ${w * 0.5},${h * 0.77} ${w * 0.19},${h - 2} ${w * 0.3},${
              h * 0.62
            } 2,${h * 0.38} ${w * 0.37},${h * 0.36}`}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        ) : kind === 'line' || kind === 'divider' ? (
          <line
            x1={0}
            y1={h / 2}
            x2={w}
            y2={h / 2}
            stroke={obj.stroke}
            strokeWidth={Math.max(2, obj.strokeWidth)}
            strokeDasharray={kind === 'divider' ? '6 4' : undefined}
          />
        ) : kind === 'arrow' ? (
          <g stroke={obj.stroke} strokeWidth={Math.max(2, obj.strokeWidth)} fill="none">
            <line x1={0} y1={h / 2} x2={w - 8} y2={h / 2} />
            <polyline points={`${w - 16},${h / 2 - 8} ${w - 2},${h / 2} ${w - 16},${h / 2 + 8}`} />
          </g>
        ) : kind === 'speech-bubble' ? (
          <path
            d={`M 8 4 H ${w - 8} Q ${w - 2} 4 ${w - 2} 12 V ${h - 22} Q ${w - 2} ${
              h - 14
            } ${w - 8} ${h - 14} H ${w * 0.35} L ${w * 0.2} ${h - 2} L ${w * 0.22} ${
              h - 14
            } H 8 Q 2 ${h - 14} 2 ${h - 22} V 12 Q 2 4 8 4 Z`}
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        ) : kind === 'custom-svg' ? (
          <svg viewBox="0 0 24 24" width={w} height={h}>
            <path
              d={obj.customSvgPath || 'M12 2L19 21L12 17L5 21L12 2Z'}
              fill={obj.fill}
              stroke={obj.stroke}
              strokeWidth={obj.strokeWidth}
            />
          </svg>
        ) : (
          <rect
            x={obj.strokeWidth / 2}
            y={obj.strokeWidth / 2}
            width={Math.max(2, w - obj.strokeWidth)}
            height={Math.max(2, h - obj.strokeWidth)}
            rx={
              kind === 'badge'
                ? Math.min(w, h) / 2
                : kind === 'rounded-rectangle' || kind === 'callout'
                ? obj.borderRadius || 16
                : obj.borderRadius || 0
            }
            fill={obj.fill}
            stroke={obj.stroke}
            strokeWidth={obj.strokeWidth}
          />
        )}
      </svg>

      {obj.text && (
        <div
          style={{
            fontFamily: obj.fontFamily || 'Plus Jakarta Sans',
            fontSize: `${obj.fontSize || 13}px`,
            fontWeight: obj.fontWeight || '600',
            color: obj.textColor || '#050505',
            textAlign: obj.textAlign || 'center',
          }}
          className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none"
        >
          {obj.text}
        </div>
      )}
    </div>
  );
};

const ChartSvgRenderer: React.FC<{ obj: FreeformObject }> = ({ obj }) => {
  const pts = obj.chartData || [];
  const kind = obj.chartKind || 'bar';
  const maxVal = Math.max(1, ...pts.map((p) => p.value));
  const w = obj.width;
  const h = obj.height;
  const padL = 36;
  const padR = 20;
  const padT = 40;
  const padB = 32;
  const plotW = Math.max(40, w - padL - padR);
  const plotH = Math.max(40, h - padT - padB);

  return (
    <div
      style={{
        backgroundColor: obj.fill || '#FFFFFF',
        border: `${obj.strokeWidth}px solid ${obj.stroke || '#E4E4E7'}`,
        borderRadius: `${obj.borderRadius}px`,
      }}
      className="w-full h-full p-3 flex flex-col justify-between overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight text-zinc-950 truncate">
          {obj.chartTitle || 'Data Chart'}
        </span>
        <span className="text-[10px] font-mono uppercase text-zinc-400">{kind}</span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
        {/* Baseline */}
        {kind !== 'pie' && kind !== 'doughnut' && (
          <line
            x1={padL}
            y1={padT + plotH}
            x2={w - padR}
            y2={padT + plotH}
            stroke="#D4D4D8"
            strokeWidth={1}
          />
        )}

        {/* BAR CHART */}
        {kind === 'bar' &&
          pts.map((pt, i) => {
            const barW = Math.max(12, plotW / Math.max(1, pts.length) - 12);
            const bh = (pt.value / maxVal) * plotH;
            const bx = padL + i * (plotW / Math.max(1, pts.length)) + 6;
            const by = padT + plotH - bh;
            return (
              <g key={pt.id}>
                <rect
                  x={bx}
                  y={by}
                  width={barW}
                  height={bh}
                  fill={pt.color || '#002FA7'}
                />
                <text
                  x={bx + barW / 2}
                  y={by - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="IBM Plex Mono"
                  fill="#050505"
                >
                  {pt.value}
                </text>
                <text
                  x={bx + barW / 2}
                  y={padT + plotH + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="IBM Plex Mono"
                  fill="#52525B"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}

        {/* LINE & AREA CHART */}
        {(kind === 'line' || kind === 'area') && pts.length > 0 && (
          <>
            {(() => {
              const coords = pts.map((pt, i) => {
                const x =
                  padL +
                  (pts.length === 1 ? plotW / 2 : (i / (pts.length - 1)) * plotW);
                const y = padT + plotH - (pt.value / maxVal) * plotH;
                return { x, y, pt };
              });
              const polyPoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
              const areaPoints = `${coords[0].x},${padT + plotH} ${polyPoints} ${
                coords[coords.length - 1].x
              },${padT + plotH}`;

              return (
                <g>
                  {kind === 'area' && (
                    <polygon points={areaPoints} fill="rgba(0, 47, 167, 0.16)" />
                  )}
                  <polyline
                    fill="none"
                    stroke="#002FA7"
                    strokeWidth={2.5}
                    points={polyPoints}
                  />
                  {coords.map((c) => (
                    <g key={c.pt.id}>
                      <circle cx={c.x} cy={c.y} r={4} fill="#050505" />
                      <text
                        x={c.x}
                        y={padT + plotH + 14}
                        textAnchor="middle"
                        fontSize="10"
                        fontFamily="IBM Plex Mono"
                        fill="#52525B"
                      >
                        {c.pt.label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </>
        )}

        {/* PIE & DOUGHNUT CHART */}
        {(kind === 'pie' || kind === 'doughnut') && pts.length > 0 && (
          <g transform={`translate(${w / 2}, ${h / 2 + 8})`}>
            {(() => {
              const total = Math.max(1, pts.reduce((s, p) => s + Math.max(0, p.value), 0));
              const r = Math.min(plotW, plotH) * 0.45;
              let accAngle = -Math.PI / 2;

              return pts.map((pt, idx) => {
                const sliceAngle = (Math.max(0, pt.value) / total) * Math.PI * 2;
                const x1 = Math.cos(accAngle) * r;
                const y1 = Math.sin(accAngle) * r;
                const x2 = Math.cos(accAngle + sliceAngle) * r;
                const y2 = Math.sin(accAngle + sliceAngle) * r;
                const largeArc = sliceAngle > Math.PI ? 1 : 0;
                const pathData = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                accAngle += sliceAngle;
                const fallbackColors = ['#050505', '#002FA7', '#52525B', '#A1A1AA', '#1D4ED8'];
                return (
                  <path
                    key={pt.id}
                    d={pathData}
                    fill={pt.color || fallbackColors[idx % fallbackColors.length]}
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                );
              });
            })()}
            {kind === 'doughnut' && (
              <circle
                cx={0}
                cy={0}
                r={Math.min(plotW, plotH) * 0.24}
                fill={obj.fill || '#FFFFFF'}
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
