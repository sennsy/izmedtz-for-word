import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { getPagePixelDimensions } from '../document/factories';
import {
  FlowBlock,
  FreeformObject,
  IzmPage,
  IzmProject,
  MM_TO_PX,
} from '../document/types';
import { packProjectToIzmBlob } from '../../storage/db/dexieDb';

export type ExportFormat =
  | 'izm'
  | 'png'
  | 'jpg'
  | 'webp'
  | 'svg'
  | 'pdf'
  | 'docx'
  | 'pptx';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function sanitizeFilename(name: string): string {
  return (name || 'izmedtzz-project')
    .trim()
    .replace(/[^a-zA-Z0-9-_.\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveHeaderFooterTokens(
  raw: string,
  project: IzmProject,
  pageIndex: number
): string {
  const dateStr = new Date(project.updatedAt).toLocaleDateString('en-CA');
  return raw
    .replace(/\{\{title\}\}/g, project.title)
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{custom\}\}/g, project.customField || '')
    .replace(/\{\{page\}\}/g, String(pageIndex + 1))
    .replace(/\{\{total\}\}/g, String(project.pages.length));
}

/**
 * Generates an accurate SVG string representation of a single hybrid page.
 */
export function renderPageToSvgString(
  project: IzmProject,
  page: IzmPage,
  pageIndex: number
): string {
  const { widthPx, heightPx } = getPagePixelDimensions(
    project.dimensionsMm,
    project.orientation
  );
  const marginTopPx = project.marginsMm.top * MM_TO_PX;
  const marginLeftPx = project.marginsMm.left * MM_TO_PX;
  const marginRightPx = project.marginsMm.right * MM_TO_PX;
  const contentWidthPx = widthPx - marginLeftPx - marginRightPx;

  const elements: string[] = [];

  // Background
  elements.push(
    `<rect width="${widthPx}" height="${heightPx}" fill="${escapeXml(page.background || '#FFFFFF')}" />`
  );

  // Header
  if (project.header.enabled && page.showHeader) {
    const left = resolveHeaderFooterTokens(project.header.leftText, project, pageIndex);
    const right = resolveHeaderFooterTokens(project.header.rightText, project, pageIndex);
    elements.push(
      `<text x="${marginLeftPx}" y="${Math.max(24, marginTopPx - 14)}" font-family="IBM Plex Mono, monospace" font-size="${project.header.fontSize}" fill="${escapeXml(project.header.textColor)}">${escapeXml(left)}</text>`
    );
    elements.push(
      `<text x="${widthPx - marginRightPx}" y="${Math.max(24, marginTopPx - 14)}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="${project.header.fontSize}" fill="${escapeXml(project.header.textColor)}">${escapeXml(right)}</text>`
    );
  }

  // Flow Blocks rendered in sequence
  let cursorY = marginTopPx + 24;
  for (const block of page.flowBlocks) {
    const fontSize = block.style.fontSize || 14;
    const fontFamily = block.style.fontFamily || 'Plus Jakarta Sans';
    const fontWeight = block.style.fontWeight || '400';
    const color = block.style.color || '#050505';
    const indentPx = (block.style.indentLevel || 0) * 24;

    if (block.type === 'table' && block.table) {
      const tbl = block.table;
      const colW = contentWidthPx / Math.max(1, tbl.cols);
      const rowH = 32;
      for (let r = 0; r < tbl.rows; r++) {
        for (let c = 0; c < tbl.cols; c++) {
          const cell = tbl.cells[r]?.[c];
          if (!cell || cell.hidden) continue;
          const cx = marginLeftPx + c * colW;
          const cy = cursorY + r * rowH;
          elements.push(
            `<rect x="${cx}" y="${cy}" width="${colW * (cell.colSpan || 1)}" height="${rowH * (cell.rowSpan || 1)}" fill="${escapeXml(cell.backgroundColor || '#FFFFFF')}" stroke="${escapeXml(tbl.borderColor)}" stroke-width="${tbl.borderWidth}" />`
          );
          elements.push(
            `<text x="${cx + 8}" y="${cy + 20}" font-family="${escapeXml(fontFamily)}" font-size="12" font-weight="${cell.fontWeight || 'normal'}" fill="${escapeXml(cell.textColor || '#050505')}">${escapeXml(cell.content)}</text>`
          );
        }
      }
      cursorY += tbl.rows * rowH + 18;
      continue;
    }

    const lines =
      block.type === 'checklist' && block.items
        ? block.items.map((it) => `${it.checked ? '[x] ' : '[ ] '}${it.text}`)
        : (block.content || '').split('\n');

    for (const line of lines) {
      // Wrap long lines roughly at character budget
      const maxChars = Math.max(25, Math.floor((contentWidthPx - indentPx) / (fontSize * 0.55)));
      const words = line.split(' ');
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length > maxChars && currentLine.length > 0) {
          elements.push(
            `<text x="${marginLeftPx + indentPx}" y="${cursorY}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(color)}">${escapeXml(currentLine)}</text>`
          );
          cursorY += fontSize * (block.style.lineHeight || 1.45);
          currentLine = word;
        } else {
          currentLine = (currentLine + ' ' + word).trim();
        }
      }
      if (currentLine) {
        elements.push(
          `<text x="${marginLeftPx + indentPx}" y="${cursorY}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(color)}">${escapeXml(currentLine)}</text>`
        );
        cursorY += fontSize * (block.style.lineHeight || 1.45);
      }
    }
    cursorY += block.style.paragraphSpacingAfter ?? 10;
  }

  // Freeform Objects sorted by zIndex
  const sortedObjects = [...page.freeformObjects]
    .filter((o) => o.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const obj of sortedObjects) {
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    const transform = obj.rotation ? ` transform="rotate(${obj.rotation} ${cx} ${cy})"` : '';
    elements.push(`<g opacity="${obj.opacity}"${transform}>`);

    if (obj.type === 'shape') {
      if (obj.shapeKind === 'circle' || obj.shapeKind === 'ellipse') {
        elements.push(
          `<ellipse cx="${cx}" cy="${cy}" rx="${obj.width / 2}" ry="${obj.height / 2}" fill="${escapeXml(obj.fill)}" stroke="${escapeXml(obj.stroke)}" stroke-width="${obj.strokeWidth}" />`
        );
      } else if (obj.shapeKind === 'line' || obj.shapeKind === 'divider' || obj.shapeKind === 'arrow') {
        elements.push(
          `<line x1="${obj.x}" y1="${cy}" x2="${obj.x + obj.width}" y2="${cy}" stroke="${escapeXml(obj.stroke)}" stroke-width="${Math.max(2, obj.strokeWidth)}" />`
        );
      } else if (obj.shapeKind === 'triangle') {
        const pts = `${cx},${obj.y} ${obj.x + obj.width},${obj.y + obj.height} ${obj.x},${obj.y + obj.height}`;
        elements.push(
          `<polygon points="${pts}" fill="${escapeXml(obj.fill)}" stroke="${escapeXml(obj.stroke)}" stroke-width="${obj.strokeWidth}" />`
        );
      } else {
        elements.push(
          `<rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" rx="${obj.borderRadius || 0}" fill="${escapeXml(obj.fill)}" stroke="${escapeXml(obj.stroke)}" stroke-width="${obj.strokeWidth}" />`
        );
      }
      if (obj.text) {
        elements.push(
          `<text x="${cx}" y="${cy + (obj.fontSize || 14) / 3}" text-anchor="middle" font-family="${escapeXml(obj.fontFamily || 'Plus Jakarta Sans')}" font-size="${obj.fontSize || 14}" font-weight="${obj.fontWeight || '600'}" fill="${escapeXml(obj.textColor || '#050505')}">${escapeXml(obj.text)}</text>`
        );
      }
    } else if (obj.type === 'textbox') {
      elements.push(
        `<rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" rx="${obj.borderRadius || 0}" fill="${escapeXml(obj.fill)}" stroke="${escapeXml(obj.stroke)}" stroke-width="${obj.strokeWidth}" />`
      );
      const lines = (obj.text || '').split('\n');
      const pad = obj.padding ?? 12;
      const fs = obj.fontSize || 16;
      lines.forEach((ln, idx) => {
        elements.push(
          `<text x="${obj.x + pad}" y="${obj.y + pad + fs + idx * fs * 1.35}" font-family="${escapeXml(obj.fontFamily || 'Plus Jakarta Sans')}" font-size="${fs}" font-weight="${obj.fontWeight || '500'}" fill="${escapeXml(obj.textColor || '#050505')}">${escapeXml(ln)}</text>`
        );
      });
    } else if (obj.type === 'image' && obj.imageUrl) {
      elements.push(
        `<image href="${escapeXml(obj.imageUrl)}" x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" preserveAspectRatio="xMidYMid slice" />`
      );
    } else if (obj.type === 'chart' && obj.chartData) {
      elements.push(
        `<rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" fill="${escapeXml(obj.fill || '#FFFFFF')}" stroke="${escapeXml(obj.stroke || '#E4E4E7')}" stroke-width="1" />`
      );
      elements.push(
        `<text x="${obj.x + 16}" y="${obj.y + 26}" font-family="Plus Jakarta Sans" font-size="13" font-weight="700" fill="#050505">${escapeXml(obj.chartTitle || 'Chart')}</text>`
      );
      const pts = obj.chartData;
      const maxVal = Math.max(1, ...pts.map((p) => p.value));
      const chartAreaH = obj.height - 64;
      const barW = Math.max(16, (obj.width - 48) / Math.max(1, pts.length) - 12);
      pts.forEach((pt, idx) => {
        const bh = (pt.value / maxVal) * (chartAreaH - 20);
        const bx = obj.x + 24 + idx * (barW + 12);
        const by = obj.y + obj.height - 28 - bh;
        elements.push(
          `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" fill="${escapeXml(pt.color || '#002FA7')}" />`
        );
        elements.push(
          `<text x="${bx + barW / 2}" y="${obj.y + obj.height - 10}" text-anchor="middle" font-family="IBM Plex Mono" font-size="10" fill="#52525B">${escapeXml(pt.label)}</text>`
        );
      });
    } else if (obj.type === 'table' && obj.tableData) {
      const tbl = obj.tableData;
      const colW = obj.width / Math.max(1, tbl.cols);
      const rowH = obj.height / Math.max(1, tbl.rows);
      for (let r = 0; r < tbl.rows; r++) {
        for (let c = 0; c < tbl.cols; c++) {
          const cell = tbl.cells[r]?.[c];
          if (!cell || cell.hidden) continue;
          const cxCell = obj.x + c * colW;
          const cyCell = obj.y + r * rowH;
          elements.push(
            `<rect x="${cxCell}" y="${cyCell}" width="${colW}" height="${rowH}" fill="${escapeXml(cell.backgroundColor || '#FFFFFF')}" stroke="${escapeXml(tbl.borderColor)}" stroke-width="${tbl.borderWidth}" />`
          );
          elements.push(
            `<text x="${cxCell + 6}" y="${cyCell + 20}" font-family="Plus Jakarta Sans" font-size="12" fill="${escapeXml(cell.textColor || '#050505')}">${escapeXml(cell.content)}</text>`
          );
        }
      }
    } else if (obj.type === 'embed') {
      elements.push(
        `<rect x="${obj.x}" y="${obj.y}" width="${obj.width}" height="${obj.height}" fill="#FAFAFA" stroke="#050505" stroke-width="1.5" />`
      );
      elements.push(
        `<text x="${obj.x + 14}" y="${obj.y + 28}" font-family="Plus Jakarta Sans" font-size="14" font-weight="700" fill="#050505">${escapeXml(obj.embedTitle || 'Reference Link')}</text>`
      );
      elements.push(
        `<text x="${obj.x + 14}" y="${obj.y + 50}" font-family="IBM Plex Mono" font-size="11" fill="#002FA7">${escapeXml(obj.embedUrl || '')}</text>`
      );
    }

    elements.push(`</g>`);
  }

  // Footer
  if (project.footer.enabled && page.showFooter) {
    const left = resolveHeaderFooterTokens(project.footer.leftText, project, pageIndex);
    const right = resolveHeaderFooterTokens(project.footer.rightText, project, pageIndex);
    const fy = heightPx - Math.max(18, project.marginsMm.bottom * MM_TO_PX - 12);
    elements.push(
      `<text x="${marginLeftPx}" y="${fy}" font-family="IBM Plex Mono, monospace" font-size="${project.footer.fontSize}" fill="${escapeXml(project.footer.textColor)}">${escapeXml(left)}</text>`
    );
    elements.push(
      `<text x="${widthPx - marginRightPx}" y="${fy}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="${project.footer.fontSize}" fill="${escapeXml(project.footer.textColor)}">${escapeXml(right)}</text>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthPx} ${heightPx}" width="${widthPx}" height="${heightPx}">${elements.join('')}</svg>`;
}

/**
 * Renders a page SVG string onto an HTML5 Canvas and returns a data URL in the requested raster format.
 */
export async function renderPageToRasterDataUrl(
  project: IzmProject,
  page: IzmPage,
  pageIndex: number,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  scale = 2
): Promise<string> {
  const svgString = renderPageToSvgString(project, page, pageIndex);
  const { widthPx, heightPx } = getPagePixelDimensions(
    project.dimensionsMm,
    project.orientation
  );

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = widthPx * scale;
      canvas.height = heightPx * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.fillStyle = page.background || '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(mimeType, 0.92));
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Builds a valid OpenXML .docx ZIP archive preserving structured flow blocks and freeform text/table content.
 */
async function generateDocxBlob(project: IzmProject): Promise<Blob> {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  const rels = zip.folder('_rels');
  rels?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const paragraphsXml: string[] = [];

  const addParagraph = (text: string, sizeHalfPt = 24, bold = false) => {
    const lines = (text || '').split('\n');
    for (const line of lines) {
      paragraphsXml.push(`<w:p>
        <w:r>
          <w:rPr>
            ${bold ? '<w:b/>' : ''}
            <w:sz w:val="${sizeHalfPt}"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(line)}</w:t>
        </w:r>
      </w:p>`);
    }
  };

  project.pages.forEach((page, pIdx) => {
    if (pIdx > 0) {
      paragraphsXml.push(`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`);
    }
    for (const block of page.flowBlocks) {
      if (block.type === 'table' && block.table) {
        const rowsXml = block.table.cells
          .map(
            (row) =>
              `<w:tr>${row
                .filter((c) => !c.hidden)
                .map(
                  (cell) =>
                    `<w:tc><w:p><w:r><w:t xml:space="preserve">${escapeXml(cell.content)}</w:t></w:r></w:p></w:tc>`
                )
                .join('')}</w:tr>`
          )
          .join('');
        paragraphsXml.push(`<w:tbl>${rowsXml}</w:tbl>`);
      } else if (block.type === 'checklist' && block.items) {
        for (const item of block.items) {
          addParagraph(`${item.checked ? '☑' : '☐'} ${item.text}`, 22, false);
        }
      } else {
        const isHeading = block.type.startsWith('h');
        const halfPt = Math.round((block.style.fontSize || 12) * 2);
        addParagraph(block.content, halfPt, isHeading);
      }
    }

    // Include freeform text boxes & chart summaries
    for (const obj of page.freeformObjects) {
      if (!obj.visible) continue;
      if (obj.type === 'textbox' || (obj.type === 'shape' && obj.text)) {
        addParagraph(`[Visual Element: ${obj.name}] ${obj.text || ''}`, 22, false);
      } else if (obj.type === 'chart' && obj.chartData) {
        const summary = obj.chartData.map((d) => `${d.label}: ${d.value}`).join(' | ');
        addParagraph(`[Chart: ${obj.chartTitle || obj.name}] ${summary}`, 20, true);
      }
    }
  });

  const word = zip.folder('word');
  word?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="${Math.round(project.dimensionsMm.width * 56.7)}" w:h="${Math.round(project.dimensionsMm.height * 56.7)}"/>
    </w:sectPr>
  </w:body>
</w:document>`
  );

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Synthesizes an OpenXML .pptx presentation package containing slide XMLs for each page.
 */
async function generatePptxBlob(project: IzmProject): Promise<Blob> {
  const zip = new JSZip();

  const slideOverrides = project.pages
    .map(
      (_, i) =>
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('\n  ');

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slideOverrides}
</Types>`
  );

  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  const ppt = zip.folder('ppt');
  const pptRels = ppt?.folder('_rels');
  const slidesFolder = ppt?.folder('slides');

  const slideRelEntries = project.pages
    .map(
      (_, i) =>
        `<Relationship Id="rIdSlide${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    )
    .join('\n  ');

  pptRels?.file(
    'presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slideRelEntries}
</Relationships>`
  );

  const slideIdEntries = project.pages
    .map((_, i) => `<p:sldId id="${256 + i}" r:id="rIdSlide${i + 1}"/>`)
    .join('\n    ');

  ppt?.file(
    'presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${slideIdEntries}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
</p:presentation>`
  );

  project.pages.forEach((page, idx) => {
    const shapesXml: string[] = [];
    let shapeId = 2;

    const addTextShape = (text: string, xPx: number, yPx: number, wPx: number, hPx: number) => {
      const emuPerPx = 9525;
      shapesXml.push(`<p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${shapeId++}" name="TextShape${shapeId}"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${Math.round(xPx * emuPerPx)}" y="${Math.round(yPx * emuPerPx)}"/>
            <a:ext cx="${Math.round(wPx * emuPerPx)}" cy="${Math.round(hPx * emuPerPx)}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square"/>
          <a:lstStyle/>
          <a:p><a:r><a:t>${escapeXml(text)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>`);
    };

    let flowY = 48;
    for (const block of page.flowBlocks) {
      addTextShape(block.content, 60, flowY, 640, 48);
      flowY += 56;
    }

    for (const obj of page.freeformObjects) {
      if (!obj.visible) continue;
      if (obj.text) {
        addTextShape(obj.text, obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'chart' && obj.chartTitle) {
        addTextShape(
          `${obj.chartTitle}: ${(obj.chartData || []).map((d) => `${d.label}=${d.value}`).join(', ')}`,
          obj.x,
          obj.y,
          obj.width,
          obj.height
        );
      }
    }

    slidesFolder?.file(
      `slide${idx + 1}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      ${shapesXml.join('\n')}
    </p:spTree>
  </p:cSld>
</p:sld>`
    );
  });

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

export async function exportProject(
  project: IzmProject,
  format: ExportFormat,
  activePageIndex = 0
): Promise<void> {
  const baseName = sanitizeFilename(project.title);
  const page = project.pages[activePageIndex] || project.pages[0];

  if (format === 'izm') {
    const blob = await packProjectToIzmBlob(project);
    triggerDownload(blob, `${baseName}.izm`);
    return;
  }

  if (format === 'svg') {
    const svgString = renderPageToSvgString(project, page, activePageIndex);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, `${baseName}-page-${activePageIndex + 1}.svg`);
    return;
  }

  if (format === 'png' || format === 'jpg' || format === 'webp') {
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    } as const;
    const dataUrl = await renderPageToRasterDataUrl(
      project,
      page,
      activePageIndex,
      mimeMap[format],
      2
    );
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    triggerDownload(blob, `${baseName}-page-${activePageIndex + 1}.${format}`);
    return;
  }

  if (format === 'pdf') {
    const wMm =
      project.orientation === 'portrait'
        ? project.dimensionsMm.width
        : project.dimensionsMm.height;
    const hMm =
      project.orientation === 'portrait'
        ? project.dimensionsMm.height
        : project.dimensionsMm.width;

    const pdf = new jsPDF({
      orientation: project.orientation === 'portrait' ? 'p' : 'l',
      unit: 'mm',
      format: [wMm, hMm],
    });

    for (let i = 0; i < project.pages.length; i++) {
      if (i > 0) {
        pdf.addPage([wMm, hMm], project.orientation === 'portrait' ? 'p' : 'l');
      }
      const dataUrl = await renderPageToRasterDataUrl(
        project,
        project.pages[i],
        i,
        'image/jpeg',
        2
      );
      pdf.addImage(dataUrl, 'JPEG', 0, 0, wMm, hMm);
    }

    pdf.save(`${baseName}.pdf`);
    return;
  }

  if (format === 'docx') {
    const blob = await generateDocxBlob(project);
    triggerDownload(blob, `${baseName}.docx`);
    return;
  }

  if (format === 'pptx') {
    const blob = await generatePptxBlob(project);
    triggerDownload(blob, `${baseName}.pptx`);
    return;
  }
}
