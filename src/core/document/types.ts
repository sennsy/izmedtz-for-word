export type PageSizePreset = 'A4' | 'A5' | 'Letter' | 'Legal' | 'F4' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageDimensionsMm {
  width: number;
  height: number;
}

export const PAGE_PRESETS_MM: Record<Exclude<PageSizePreset, 'Custom'>, PageDimensionsMm> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  F4: { width: 215, height: 330 },
};

// 1 mm = 3.7795275591 px at 96 DPI (we use 3.78 px/mm for crisp layout)
export const MM_TO_PX = 3.78;

export type FlowBlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'paragraph'
  | 'quote'
  | 'bullet-list'
  | 'numbered-list'
  | 'checklist'
  | 'caption'
  | 'footnote'
  | 'code'
  | 'table';

export interface TableCellData {
  id: string;
  content: string;
  rowSpan?: number;
  colSpan?: number;
  hidden?: boolean; // when merged into another cell
  backgroundColor?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  padding?: number;
  textDirection?: 'ltr' | 'rtl' | 'vertical';
}

export interface TableStructure {
  rows: number;
  cols: number;
  colWidths: number[]; // percentages or px
  rowHeights: number[]; // px
  borderColor: string;
  borderWidth: number;
  cellPadding: number;
  cells: TableCellData[][];
}

export interface FlowBlockStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  verticalAlign?: 'baseline' | 'super' | 'sub';
  color?: string;
  backgroundColor?: string; // highlight
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number; // em or px
  indentLevel?: number;
  paragraphSpacingAfter?: number; // px
  hyperlink?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface FlowBlock {
  id: string;
  type: FlowBlockType;
  content: string; // HTML/rich text or plain text
  items?: ChecklistItem[]; // for checklist, bullet-list, numbered-list
  table?: TableStructure; // when type === 'table'
  style: FlowBlockStyle;
  stylePresetId?: string;
}

export type FreeformObjectType =
  | 'textbox'
  | 'shape'
  | 'image'
  | 'chart'
  | 'table'
  | 'embed'
  | 'frame'
  | 'group';

export type ShapeKind =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'arrow'
  | 'line'
  | 'divider'
  | 'speech-bubble'
  | 'badge'
  | 'callout'
  | 'custom-svg';

export type ChartKind = 'bar' | 'line' | 'pie' | 'doughnut' | 'area';

export interface ChartDataPoint {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

export interface ImageAdjustments {
  brightness: number; // 0 - 200, default 100
  contrast: number; // 0 - 200, default 100
  saturation: number; // 0 - 200, default 100
  blur: number; // 0 - 20, default 0
  fit: 'cover' | 'contain' | 'fill';
  mask: 'none' | 'circle' | 'rounded' | 'arch' | 'diamond';
  cropX: number; // 0 - 100%
  cropY: number; // 0 - 100%
  cropW: number; // 10 - 100%
  cropH: number; // 10 - 100%
  frameWidth: number;
  frameColor: string;
}

export interface ObjectShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface FreeformObject {
  id: string;
  name: string;
  type: FreeformObjectType;
  x: number; // px relative to page top-left
  y: number; // px relative to page top-left
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
  opacity: number; // 0 - 1
  visible: boolean;
  locked: boolean;
  zIndex: number;
  groupId?: string;

  // Common appearance
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  blur: number;
  shadow: ObjectShadow;

  // Textbox & Callout/Badge text properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textColor?: string;
  textHighlight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  padding?: number;
  hyperlink?: string;

  // Shape specific
  shapeKind?: ShapeKind;
  customSvgPath?: string;
  polygonSides?: number;

  // Image specific
  assetId?: string;
  imageUrl?: string; // Data URL or object URL fallback
  imageAlt?: string;
  imageAdjustments?: ImageAdjustments;

  // Chart specific
  chartKind?: ChartKind;
  chartTitle?: string;
  chartData?: ChartDataPoint[];
  chartShowLegend?: boolean;
  chartShowGrid?: boolean;

  // Freeform Table specific
  tableData?: TableStructure;

  // Embed/Link specific
  embedUrl?: string;
  embedTitle?: string;
  embedSubtitle?: string;
}

export interface HeaderFooterConfig {
  enabled: boolean;
  leftText: string; // Supports tokens: {{title}}, {{date}}, {{custom}}
  centerText: string;
  rightText: string; // Supports {{page}} / {{total}}
  showPageNumbers: boolean;
  fontSize: number;
  textColor: string;
}

export interface PageMarginsMm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface IzmPage {
  id: string;
  name: string;
  background: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'ruled';
  showHeader: boolean;
  showFooter: boolean;
  flowBlocks: FlowBlock[];
  freeformObjects: FreeformObject[];
  thumbnailDataUrl?: string;
}

export interface ReusableTextStyle {
  id: string;
  name: string;
  blockType: FlowBlockType;
  style: FlowBlockStyle;
}

export interface IzmProject {
  id: string;
  title: string;
  category: 'document' | 'creative' | 'presentation';
  createdAt: number;
  updatedAt: number;
  pageSizePreset: PageSizePreset;
  orientation: PageOrientation;
  dimensionsMm: PageDimensionsMm;
  marginsMm: PageMarginsMm;
  bleedMm: number;
  safeAreaMm: number;
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  customField: string;
  textStyles: ReusableTextStyle[];
  pages: IzmPage[];
  assetIds: string[];
}

export interface IzmAsset {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  createdAt: number;
}

export interface IzmRecoverySnapshot {
  projectId: string;
  projectTitle: string;
  timestamp: number;
  projectData: IzmProject;
}

export interface IzmArchiveManifest {
  format: 'izm-archive';
  extension: '.izm';
  version: '1.0.0';
  app: 'izmedtzz';
  exportedAt: string;
  projectId: string;
  title: string;
  pageCount: number;
  assetCount: number;
}
