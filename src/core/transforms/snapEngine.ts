import { FreeformObject } from '../document/types';

export interface SnapGuide {
  orientation: 'vertical' | 'horizontal';
  position: number; // px relative to page
  label?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

export function computeSnappedPosition(params: {
  targetId: string;
  proposedX: number;
  proposedY: number;
  width: number;
  height: number;
  pageWidthPx: number;
  pageHeightPx: number;
  marginLeftPx: number;
  marginRightPx: number;
  marginTopPx: number;
  marginBottomPx: number;
  siblings: FreeformObject[];
  snapEnabled: boolean;
  gridSizePx: number;
  snapToGrid: boolean;
  threshold?: number;
}): SnapResult {
  const {
    targetId,
    proposedX,
    proposedY,
    width,
    height,
    pageWidthPx,
    pageHeightPx,
    marginLeftPx,
    marginRightPx,
    marginTopPx,
    marginBottomPx,
    siblings,
    snapEnabled,
    gridSizePx,
    snapToGrid,
    threshold = 5,
  } = params;

  if (!snapEnabled) {
    return { x: Math.round(proposedX), y: Math.round(proposedY), guides: [] };
  }

  let finalX = proposedX;
  let finalY = proposedY;
  const guides: SnapGuide[] = [];

  if (snapToGrid && gridSizePx > 1) {
    finalX = Math.round(finalX / gridSizePx) * gridSizePx;
    finalY = Math.round(finalY / gridSizePx) * gridSizePx;
  }

  // Candidate vertical lines (X)
  const vTargets: { pos: number; label: string }[] = [
    { pos: pageWidthPx / 2, label: 'Center X' },
    { pos: marginLeftPx, label: 'Left Margin' },
    { pos: pageWidthPx - marginRightPx, label: 'Right Margin' },
  ];

  // Candidate horizontal lines (Y)
  const hTargets: { pos: number; label: string }[] = [
    { pos: pageHeightPx / 2, label: 'Center Y' },
    { pos: marginTopPx, label: 'Top Margin' },
    { pos: pageHeightPx - marginBottomPx, label: 'Bottom Margin' },
  ];

  for (const sib of siblings) {
    if (sib.id === targetId || !sib.visible) continue;
    vTargets.push(
      { pos: sib.x, label: 'Align Left' },
      { pos: sib.x + sib.width / 2, label: 'Align Center' },
      { pos: sib.x + sib.width, label: 'Align Right' }
    );
    hTargets.push(
      { pos: sib.y, label: 'Align Top' },
      { pos: sib.y + sib.height / 2, label: 'Align Middle' },
      { pos: sib.y + sib.height, label: 'Align Bottom' }
    );
  }

  const myPointsX = [
    { offset: 0, edge: 'left' },
    { offset: width / 2, edge: 'center' },
    { offset: width, edge: 'right' },
  ];

  for (const pt of myPointsX) {
    const currentEdge = finalX + pt.offset;
    for (const target of vTargets) {
      if (Math.abs(currentEdge - target.pos) <= threshold) {
        finalX = target.pos - pt.offset;
        guides.push({
          orientation: 'vertical',
          position: Math.round(target.pos),
          label: target.label,
        });
        break;
      }
    }
  }

  const myPointsY = [
    { offset: 0, edge: 'top' },
    { offset: height / 2, edge: 'middle' },
    { offset: height, edge: 'bottom' },
  ];

  for (const pt of myPointsY) {
    const currentEdge = finalY + pt.offset;
    for (const target of hTargets) {
      if (Math.abs(currentEdge - target.pos) <= threshold) {
        finalY = target.pos - pt.offset;
        guides.push({
          orientation: 'horizontal',
          position: Math.round(target.pos),
          label: target.label,
        });
        break;
      }
    }
  }

  return {
    x: Math.round(finalX),
    y: Math.round(finalY),
    guides,
  };
}
