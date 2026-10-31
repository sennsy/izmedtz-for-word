import React from 'react';
import { CheckSquare, ExternalLink, Plus, Square, Trash2 } from 'lucide-react';
import { uid } from '../../../core/document/factories';
import { FlowBlock, IzmPage } from '../../../core/document/types';
import { useStudioStore } from '../../../core/history/studioStore';

export const FlowDocumentZone: React.FC<{
  page: IzmPage;
  isActivePage: boolean;
}> = ({ page, isActivePage }) => {
  const {
    selectedFlowBlockId,
    selectFlowBlock,
    updateFlowBlock,
    addFlowBlock,
    commitMutation,
    activePageIndex,
  } = useStudioStore();

  const handleCellChange = (
    blockId: string,
    rIdx: number,
    cIdx: number,
    val: string
  ) => {
    commitMutation('Edit Table Cell', `tbl_cell_${blockId}_${rIdx}_${cIdx}`, (draft) => {
      const pg = draft.pages[activePageIndex];
      const blk = pg?.flowBlocks.find((b) => b.id === blockId);
      if (blk?.table?.cells[rIdx]?.[cIdx]) {
        blk.table.cells[rIdx][cIdx].content = val;
      }
    });
  };

  return (
    <div className="relative z-10 space-y-1">
      {page.flowBlocks.map((block) => {
        const isSelected = isActivePage && selectedFlowBlockId === block.id;
        const st = block.style;

        const textStyle: React.CSSProperties = {
          fontFamily: st.fontFamily || 'Plus Jakarta Sans',
          fontSize: `${st.fontSize || 14}px`,
          fontWeight: st.fontWeight || '400',
          fontStyle: st.fontStyle || 'normal',
          textDecoration: st.textDecoration || 'none',
          color: st.color || '#050505',
          backgroundColor: st.backgroundColor || 'transparent',
          textAlign: st.textAlign || 'left',
          lineHeight: st.lineHeight || 1.5,
          letterSpacing: st.letterSpacing ? `${st.letterSpacing}em` : undefined,
          paddingLeft: st.indentLevel ? `${st.indentLevel * 24}px` : undefined,
          marginBottom: `${st.paragraphSpacingAfter ?? 10}px`,
        };

        return (
          <div
            key={block.id}
            onClick={(e) => {
              e.stopPropagation();
              selectFlowBlock(block.id);
            }}
            className={`group relative transition-colors ${
              isSelected
                ? 'ring-1 ring-[#002FA7] bg-[#002FA7]/[0.02]'
                : 'hover:ring-1 hover:ring-zinc-300'
            }`}
          >
            {/* Semantic Block Badge when selected */}
            {isSelected && (
              <div className="absolute -top-5 left-0 flex items-center gap-1 bg-[#002FA7] text-white px-1.5 py-0.5 text-[9px] font-mono uppercase z-20">
                <span>{block.type}</span>
                {st.hyperlink && (
                  <a
                    href={st.hyperlink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 underline flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Link <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )}

            {/* CHECKLIST BLOCK */}
            {block.type === 'checklist' && (
              <div style={textStyle} className="py-1 space-y-1.5">
                {(block.items || []).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = [...(block.items || [])];
                        next[idx] = { ...item, checked: !item.checked };
                        updateFlowBlock(block.id, { items: next });
                      }}
                      className="text-[#002FA7] shrink-0 cursor-pointer"
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const next = [...(block.items || [])];
                        next[idx] = { ...item, text: e.target.value };
                        updateFlowBlock(block.id, { items: next });
                      }}
                      className={`flex-1 bg-transparent focus:outline-none ${
                        item.checked ? 'line-through text-zinc-400' : ''
                      }`}
                    />
                    {isSelected && (
                      <button
                        onClick={() => {
                          const next = (block.items || []).filter((_, i) => i !== idx);
                          updateFlowBlock(block.id, { items: next });
                        }}
                        className="text-zinc-400 hover:text-red-600 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {isSelected && (
                  <button
                    onClick={() => {
                      const next = [
                        ...(block.items || []),
                        { id: uid('chk'), text: 'New checklist item', checked: false },
                      ];
                      updateFlowBlock(block.id, { items: next });
                    }}
                    className="text-[11px] font-mono text-[#002FA7] flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                )}
              </div>
            )}

            {/* TABLE BLOCK */}
            {block.type === 'table' && block.table && (
              <div className="my-2 overflow-x-auto">
                <table
                  className="w-full border-collapse"
                  style={{
                    borderColor: block.table.borderColor,
                    borderWidth: `${block.table.borderWidth}px`,
                  }}
                >
                  <tbody>
                    {block.table.cells.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => {
                          if (cell.hidden) return null;
                          return (
                            <td
                              key={cell.id}
                              colSpan={cell.colSpan || 1}
                              rowSpan={cell.rowSpan || 1}
                              style={{
                                border: `${block.table!.borderWidth}px solid ${block.table!.borderColor}`,
                                padding: `${block.table!.cellPadding}px`,
                                backgroundColor: cell.backgroundColor || '#FFFFFF',
                                color: cell.textColor || '#050505',
                                fontWeight: cell.fontWeight || 'normal',
                                textAlign: cell.textAlign || 'left',
                              }}
                            >
                              <input
                                type="text"
                                value={cell.content}
                                onChange={(e) =>
                                  handleCellChange(block.id, rIdx, cIdx, e.target.value)
                                }
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

            {/* BULLET OR NUMBERED LIST */}
            {(block.type === 'bullet-list' || block.type === 'numbered-list') && (
              <div style={textStyle} className="py-0.5">
                {(block.content || '').split('\n').map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-zinc-500 select-none pt-0.5 shrink-0">
                      {block.type === 'bullet-list' ? '•' : `${i + 1}.`}
                    </span>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => {
                        const lines = (block.content || '').split('\n');
                        lines[i] = e.target.value;
                        updateFlowBlock(block.id, { content: lines.join('\n') });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const lines = (block.content || '').split('\n');
                          lines.splice(i + 1, 0, 'List item');
                          updateFlowBlock(block.id, { content: lines.join('\n') });
                        }
                      }}
                      className="flex-1 bg-transparent focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* STANDARD TEXT / HEADING / QUOTE / CODE / CAPTION / FOOTNOTE */}
            {block.type !== 'checklist' &&
              block.type !== 'table' &&
              block.type !== 'bullet-list' &&
              block.type !== 'numbered-list' && (
                <div
                  className={`${
                    block.type === 'quote'
                      ? 'pl-4 py-1 border-y border-zinc-200 bg-zinc-50/50'
                      : block.type === 'code'
                      ? 'p-3 bg-zinc-900 text-zinc-100 font-mono text-xs'
                      : ''
                  }`}
                >
                  <AutoResizingTextarea
                    value={block.content}
                    style={
                      block.type === 'code'
                        ? { ...textStyle, color: '#F4F4F5', backgroundColor: 'transparent' }
                        : textStyle
                    }
                    verticalAlign={st.verticalAlign}
                    onChange={(val) => updateFlowBlock(block.id, { content: val })}
                    onEnterNewBlock={() => addFlowBlock('paragraph', block.id)}
                  />
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
};

const AutoResizingTextarea: React.FC<{
  value: string;
  style: React.CSSProperties;
  verticalAlign?: 'baseline' | 'super' | 'sub';
  onChange: (val: string) => void;
  onEnterNewBlock: () => void;
}> = ({ value, style, verticalAlign, onChange }) => {
  const rows = Math.max(1, (value || '').split('\n').length);
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...style,
        fontSize:
          verticalAlign === 'super' || verticalAlign === 'sub'
            ? `calc(${style.fontSize} * 0.78)`
            : style.fontSize,
      }}
      className="w-full bg-transparent resize-none focus:outline-none overflow-hidden block"
    />
  );
};
