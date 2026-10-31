import {
  ChartDataPoint,
  ChartKind,
  FlowBlock,
  FlowBlockType,
  FreeformObject,
  IzmPage,
  IzmProject,
  MM_TO_PX,
  PAGE_PRESETS_MM,
  PageOrientation,
  PageSizePreset,
  ReusableTextStyle,
  ShapeKind,
  TableCellData,
  TableStructure,
} from './types';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export const DEFAULT_TEXT_STYLES: ReusableTextStyle[] = [
  {
    id: 'style_editorial_title',
    name: 'Editorial Display H1',
    blockType: 'h1',
    style: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 1.15,
      letterSpacing: -0.03,
      color: '#050505',
      paragraphSpacingAfter: 16,
    },
  },
  {
    id: 'style_serif_heading',
    name: 'Monograph Serif H2',
    blockType: 'h2',
    style: {
      fontFamily: 'Fraunces',
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.25,
      letterSpacing: -0.01,
      color: '#050505',
      paragraphSpacingAfter: 12,
    },
  },
  {
    id: 'style_body_prose',
    name: 'Standard Body Prose',
    blockType: 'paragraph',
    style: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.65,
      letterSpacing: 0,
      color: '#18181B',
      paragraphSpacingAfter: 10,
    },
  },
  {
    id: 'style_mono_caption',
    name: 'Technical Mono Caption',
    blockType: 'caption',
    style: {
      fontFamily: 'IBM Plex Mono',
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.02,
      color: '#52525B',
      paragraphSpacingAfter: 8,
    },
  },
];

export function getPagePixelDimensions(
  dimensionsMm: { width: number; height: number },
  orientation: PageOrientation
): { widthPx: number; heightPx: number } {
  const w = orientation === 'portrait' ? dimensionsMm.width : dimensionsMm.height;
  const h = orientation === 'portrait' ? dimensionsMm.height : dimensionsMm.width;
  return {
    widthPx: Math.round(w * MM_TO_PX),
    heightPx: Math.round(h * MM_TO_PX),
  };
}

export function createTableStructure(rows = 3, cols = 3): TableStructure {
  const cells: TableCellData[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: TableCellData[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        id: uid('cell'),
        content: r === 0 ? `Header ${c + 1}` : `Cell ${r},${c + 1}`,
        rowSpan: 1,
        colSpan: 1,
        backgroundColor: r === 0 ? '#F4F4F5' : '#FFFFFF',
        textColor: '#050505',
        textAlign: 'left',
        fontWeight: r === 0 ? 'bold' : 'normal',
        padding: 8,
        textDirection: 'ltr',
      });
    }
    cells.push(row);
  }
  return {
    rows,
    cols,
    colWidths: Array(cols).fill(Math.round(100 / cols)),
    rowHeights: Array(rows).fill(36),
    borderColor: '#D4D4D8',
    borderWidth: 1,
    cellPadding: 8,
    cells,
  };
}

export function createFlowBlock(type: FlowBlockType, content = ''): FlowBlock {
  const baseSizes: Record<FlowBlockType, number> = {
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 17,
    h5: 15,
    h6: 13,
    paragraph: 14,
    quote: 16,
    'bullet-list': 14,
    'numbered-list': 14,
    checklist: 14,
    caption: 11,
    footnote: 10,
    code: 12,
    table: 13,
  };

  const defaultText: Record<FlowBlockType, string> = {
    h1: 'Primary Document Heading',
    h2: 'Section Heading',
    h3: 'Subsection Title',
    h4: 'Topic Header',
    h5: 'Minor Header',
    h6: 'Kicker Header',
    paragraph:
      'Write structured prose directly on the page. Every page in izmedtzz combines this document flow layer with freeform visual elements.',
    quote: '“Design is intelligence made visible — structured clarity meets spatial freedom.”',
    'bullet-list': 'Key point one\nKey point two\nKey point three',
    'numbered-list': 'First milestone\nSecond milestone\nThird milestone',
    checklist: 'Review typography hierarchy\nVerify local .izm archive backup',
    caption: 'Fig 01. Architectural layout specification and spatial metrics.',
    footnote: '[1] Reference note stored locally within the .izm document structure.',
    code: 'const studio = { engine: "izmedtzz", mode: "hybrid-flow-freeform", storage: "IndexedDB" };',
    table: '',
  };

  const block: FlowBlock = {
    id: uid('flow'),
    type,
    content: content || defaultText[type],
    style: {
      fontFamily:
        type === 'code' || type === 'caption'
          ? 'IBM Plex Mono'
          : type === 'quote'
          ? 'Fraunces'
          : 'Plus Jakarta Sans',
      fontSize: baseSizes[type],
      fontWeight: type.startsWith('h') ? '700' : '400',
      fontStyle: type === 'quote' ? 'italic' : 'normal',
      textDecoration: 'none',
      verticalAlign: 'baseline',
      color: type === 'caption' || type === 'footnote' ? '#52525B' : '#050505',
      textAlign: 'left',
      lineHeight: type.startsWith('h') ? 1.2 : 1.6,
      letterSpacing: type.startsWith('h') ? -0.02 : 0,
      indentLevel: 0,
      paragraphSpacingAfter: type.startsWith('h') ? 14 : 10,
    },
  };

  if (type === 'checklist') {
    block.items = [
      { id: uid('chk'), text: 'Draft executive summary in flow layer', checked: true },
      { id: uid('chk'), text: 'Position visual diagrams & data charts on canvas', checked: false },
      { id: uid('chk'), text: 'Export canonical .izm project archive', checked: false },
    ];
  }

  if (type === 'table') {
    block.table = createTableStructure(3, 3);
  }

  return block;
}

export function createFreeformShape(kind: ShapeKind, zIndex = 1): FreeformObject {
  const isLine = kind === 'line' || kind === 'divider' || kind === 'arrow';
  return {
    id: uid('obj'),
    name: `${kind.charAt(0).toUpperCase() + kind.slice(1).replace('-', ' ')}`,
    type: 'shape',
    shapeKind: kind,
    x: 120,
    y: 160,
    width: isLine ? 260 : 180,
    height: isLine ? 24 : 140,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    fill: isLine ? '#050505' : kind === 'badge' || kind === 'callout' ? '#002FA7' : '#F4F4F5',
    stroke: '#050505',
    strokeWidth: isLine ? 2 : 1.5,
    borderRadius: kind === 'rounded-rectangle' || kind === 'callout' ? 16 : kind === 'badge' ? 999 : 0,
    blur: 0,
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.18)',
      blur: 16,
      offsetX: 0,
      offsetY: 6,
    },
    text: kind === 'badge' ? 'STUDIO EDITION' : kind === 'callout' ? 'Key Visual Callout' : kind === 'speech-bubble' ? 'Editorial note' : '',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 13,
    fontWeight: '600',
    textColor: kind === 'badge' || kind === 'callout' ? '#FFFFFF' : '#050505',
    textAlign: 'center',
    polygonSides: 6,
    customSvgPath:
      kind === 'custom-svg'
        ? 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'
        : undefined,
  };
}

export function createFreeformTextbox(text = 'Freeform Editorial Text Box', zIndex = 2): FreeformObject {
  return {
    id: uid('obj'),
    name: 'Text Box',
    type: 'textbox',
    x: 140,
    y: 140,
    width: 280,
    height: 110,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    fill: 'rgba(255,255,255,0.92)',
    stroke: '#050505',
    strokeWidth: 1,
    borderRadius: 0,
    blur: 0,
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.15)',
      blur: 12,
      offsetX: 0,
      offsetY: 4,
    },
    text,
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'normal',
    textDecoration: 'none',
    textColor: '#050505',
    textAlign: 'left',
    lineHeight: 1.45,
    letterSpacing: 0,
    padding: 12,
  };
}

export function createFreeformChart(kind: ChartKind = 'bar', zIndex = 3): FreeformObject {
  const defaultData: ChartDataPoint[] = [
    { id: uid('pt'), label: 'Q1', value: 42, secondaryValue: 28, color: '#050505' },
    { id: uid('pt'), label: 'Q2', value: 68, secondaryValue: 45, color: '#002FA7' },
    { id: uid('pt'), label: 'Q3', value: 54, secondaryValue: 50, color: '#52525B' },
    { id: uid('pt'), label: 'Q4', value: 89, secondaryValue: 64, color: '#1D4ED8' },
  ];

  return {
    id: uid('obj'),
    name: `${kind.toUpperCase()} Chart`,
    type: 'chart',
    chartKind: kind,
    chartTitle: 'Quarterly Performance Index',
    chartData: defaultData,
    chartShowLegend: true,
    chartShowGrid: true,
    x: 110,
    y: 220,
    width: 380,
    height: 250,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    fill: '#FFFFFF',
    stroke: '#E4E4E7',
    strokeWidth: 1,
    borderRadius: 4,
    blur: 0,
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.12)',
      blur: 14,
      offsetX: 0,
      offsetY: 4,
    },
  };
}

export function createFreeformImage(
  imageUrl: string,
  name = 'Studio Image',
  assetId?: string,
  zIndex = 3
): FreeformObject {
  return {
    id: uid('obj'),
    name,
    type: 'image',
    assetId,
    imageUrl,
    imageAlt: name,
    x: 140,
    y: 180,
    width: 300,
    height: 220,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    fill: 'transparent',
    stroke: '#050505',
    strokeWidth: 0,
    borderRadius: 0,
    blur: 0,
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.2)',
      blur: 16,
      offsetX: 0,
      offsetY: 6,
    },
    imageAdjustments: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      fit: 'cover',
      mask: 'none',
      cropX: 0,
      cropY: 0,
      cropW: 100,
      cropH: 100,
      frameWidth: 0,
      frameColor: '#050505',
    },
  };
}

export function createFreeformTable(rows = 3, cols = 3, zIndex = 3): FreeformObject {
  return {
    id: uid('obj'),
    name: `Table (${rows}×${cols})`,
    type: 'table',
    tableData: createTableStructure(rows, cols),
    x: 100,
    y: 200,
    width: 420,
    height: rows * 42 + 12,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    fill: '#FFFFFF',
    stroke: '#D4D4D8',
    strokeWidth: 1,
    borderRadius: 0,
    blur: 0,
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.12)',
      blur: 10,
      offsetX: 0,
      offsetY: 4,
    },
  };
}

export function createFreeformEmbed(
  url = 'https://www.noth.in/',
  title = 'Editorial Design Reference',
  subtitle = 'External Resource & Specification Link',
  zIndex = 3
): FreeformObject {
  return {
    id: uid('obj'),
    name: 'Embed / Reference Card',
    type: 'embed',
    embedUrl: url,
    embedTitle: title,
    embedSubtitle: subtitle,
    x: 130,
    y: 220,
    width: 340,
    height: 92,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    fill: '#FAFAFA',
    stroke: '#050505',
    strokeWidth: 1.5,
    borderRadius: 0,
    blur: 0,
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.1)',
      blur: 10,
      offsetX: 0,
      offsetY: 4,
    },
  };
}

export function createBlankPage(index = 1): IzmPage {
  return {
    id: uid('page'),
    name: `Page ${index}`,
    background: '#FFFFFF',
    backgroundPattern: 'none',
    showHeader: true,
    showFooter: true,
    flowBlocks: [
      createFlowBlock('h1', index === 1 ? 'Untitled Studio Document' : `Section ${index}`),
      createFlowBlock(
        'paragraph',
        'Type here to compose structured document blocks, or use the left tool rail to place freeform shapes, media, tables, and live charts anywhere on this page.'
      ),
    ],
    freeformObjects: [],
  };
}

export function createNewProject(options?: {
  title?: string;
  preset?: PageSizePreset;
  orientation?: PageOrientation;
  customDimensionsMm?: { width: number; height: number };
  category?: 'document' | 'creative' | 'presentation';
}): IzmProject {
  const preset = options?.preset || 'A4';
  const orientation = options?.orientation || 'portrait';
  const dimensionsMm =
    preset === 'Custom'
      ? options?.customDimensionsMm || { width: 210, height: 297 }
      : PAGE_PRESETS_MM[preset];

  const now = Date.now();
  return {
    id: uid('proj'),
    title: options?.title || 'Untitled Studio Project',
    category: options?.category || 'document',
    createdAt: now,
    updatedAt: now,
    pageSizePreset: preset,
    orientation,
    dimensionsMm: { ...dimensionsMm },
    marginsMm: { top: 20, right: 20, bottom: 20, left: 20 },
    bleedMm: 3,
    safeAreaMm: 10,
    header: {
      enabled: true,
      leftText: '{{title}}',
      centerText: '',
      rightText: '{{date}}',
      showPageNumbers: false,
      fontSize: 10,
      textColor: '#71717A',
    },
    footer: {
      enabled: true,
      leftText: 'izmedtzz studio · {{custom}}',
      centerText: '',
      rightText: '{{page}} / {{total}}',
      showPageNumbers: true,
      fontSize: 10,
      textColor: '#71717A',
    },
    customField: 'EDITION 2026–2027',
    textStyles: [...DEFAULT_TEXT_STYLES],
    pages: [createBlankPage(1)],
    assetIds: [],
  };
}
