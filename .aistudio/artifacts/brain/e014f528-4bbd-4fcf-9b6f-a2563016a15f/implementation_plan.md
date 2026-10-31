# izmedtzz (izm) — Local-First Visual Document Creation Studio

**izmedtzz (`izm`)** is a local-first hybrid document and visual design creation studio that unifies structured rich-text publishing (Microsoft Word / Canva Docs capabilities) and freeform spatial graphic design into a single engine—operating 100% locally in the browser with zero accounts, zero cloud databases, and `.izm` as the canonical project archive format.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core product and aesthetic decisions have been confirmed and govern the architecture of **izmedtzz**:

- **Confirmed Decision 1 — Brand Identity & Native Format**: Branded throughout as **izmedtzz (`izm`)** with **`.izm`** as the canonical native project archive format (a structured ZIP container bundling `manifest.json`, `document.json`, binary `assets/`, page `thumbnails/`, and `metadata.json`).
- **Confirmed Decision 2 — Dual-Layer Hybrid Page Engine**: Every page in a document simultaneously hosts a **Structured Flow Document Layer** (respecting page margins, columns, headings, paragraphs, lists, quotes, footnotes, captions, and multi-cell tables) and a **Freeform Spatial Layer** (hosting arbitrary X/Y positioned text boxes, images, shapes, SVGs, lines, icons, frames, groups, and charts with full rotation, resize handles, and z-order stacking).
- **Confirmed Decision 3 — Editorial Monochrome + International Klein Blue Aesthetic**: Inspired by *Nothin′* (`noth.in`), the studio pairs a high-contrast monochromatic editorial canvas (`#050505` jet black and `#FAFAFA` crisp paper white) with **International Klein Blue (`#002FA7` / `#1D4ED8`)** reserved strictly for primary actions, active selection bounds, smart alignment guides, and focus states.

---

## 1. Overview & Core Concept

- **What It Does**: Lets creators write structured long-form documents and design complex visual layouts on the same multi-page canvas, save automatically to local IndexedDB storage, recover seamlessly from browser crashes, manage local storage quotas, and export to `.izm`, PDF, SVG, PNG, JPG, WEBP, DOCX, and PPTX.
- **Target Audience / Persona**: Independent designers, editorial directors, researchers, students, and studio teams who want a fast, private, offline-capable document and visual layout engine without SaaS subscriptions, login walls, or cloud lock-in.
- **Key Value**:
  - *Write like a document editor*: Full typographic hierarchy, lists, tables, footnotes, headers/footers, and project-wide find & replace.
  - *Design like a visual editor*: Sub-pixel object transforms, smart guides, snapping, layer tree management, image filters/cropping, vector shapes, and live editable charts.
  - *Store locally & export freely*: Instant IndexedDB autosave, transparent storage inspection, and multi-format export pipeline.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Editorial Studio Home & Project Hub**:
   - Opens with an expressive, *Nothin′*-inspired monochrome editorial studio view featuring oversized kinetic typography, quick project creation by page preset (A4, A5, Letter, Legal, F4, Custom), curated local template gallery (Documents, Creative, Presentation), recent local projects stored in IndexedDB with live metadata, `.izm` file import/open, and the **Local Storage Manager** modal.
   - Includes a crash recovery banner if an uncommitted recovery snapshot is detected on startup.
2. **Hybrid Desktop Editor Workspace**:
   - **Top Bar**: Wordmark (`izmedtzz`), full application menus (`File`, `Edit`, `View`, `Insert`, `Format`, `Page`, `Help`), Undo/Redo triggers with history depth indicator, real-time persistence state (`Saving...`, `Saved`, `Offline`, `Recovery available`), PWA install trigger, Print Preview button, Fullscreen toggle, and primary `Export` action.
   - **Left Tool Rail & Expandable Drawers**: Quick mode and insertion tools for `Select`, `Text` (Flow focus vs. Freeform text box), `Media` (upload, drag-and-drop, clipboard paste), `Elements` (14 vector shapes & custom SVG), `Table` (interactive grid picker & table tools), `Chart` (bar, line, pie, doughnut, area), `Embed/Link`, `Pages` (page settings & structure), `Templates`, and `Layers` (hierarchical layer tree with lock, hide, rename, group/ungroup, and z-order controls).
   - **Center Infinite Canvas**: Multi-page viewport supporting pan (Space + drag or middle-click/wheel), zoom (`25%` to `400%`, fit-to-screen, actual size), configurable rulers, baseline/square grids, margin/bleed/safe-area overlays, smart alignment guides, center snapping, and direct manipulation handles (8-point resize, rotation handle, multi-select bounding box).
   - **Right Contextual Inspector**: Dynamically adapts to the current selection—Page properties (when nothing is selected), Flow Rich-Text formatting & reusable text styles (when editing document flow), or Freeform Object properties (Transform X/Y/W/H/Rotation/Scale, Alignment/Distribution, Appearance/Opacity/Shadow/Blur, Typography, Table cell/border controls, Image crop/mask/filters, Shape stroke/fill/radius, or Chart inline spreadsheet editor).
   - **Bottom Page Navigator**: Collapsible filmstrip with page thumbnails, drag/click page reordering, add/duplicate/delete page controls, word count readout, and zoom slider.
3. **Dedicated Compact Mobile Editor UX (`< 768px`)**:
   - Replaces desktop sidebars with an ergonomic thumb-zone layout keeping fixed chrome under 15% of viewport height: a compact top bar, touch-enabled canvas supporting pinch-to-zoom and touch drag/resize/rotate handles (`44x44px` minimum hit targets), a compact page pill switcher, a fixed **Bottom Toolbar**, and a slide-up **Contextual Bottom Sheet Inspector**.

### Visual Identity & Theme

- **Aesthetic Direction**: High-contrast editorial minimalism inspired by *Nothin′*—oversized display statements on the studio home view, crisp 1px structural hairlines in the workspace, zero decorative SaaS clutter, zero pill badges on static metadata, and tactile precision.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - *60% Dominant Neutral Canvas*: Studio Paper `#FAFAFA` (light) / Carbon `#0A0A0A` (dark workspace surroundings) and pure `#FFFFFF` page sheets.
  - *30% Structural Surfaces*: Panel surfaces `#F4F4F5` / `#141416`, hairline borders `#E4E4E7` / `#27272A`, muted metadata `#71717A`.
  - *10% Accent Budget*: **International Klein Blue (`#002FA7` / `#1D4ED8`)** for primary CTAs, active tool indicators, object selection frames, and smart snapping guides. Semantic states (error `#DC2626`, warning `#D97706`, saved `#16A34A`) always paired with explicit text labels.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - *Display & UI Structural Sans*: **Plus Jakarta Sans** (tight tracking `-0.03em` for oversized studio headlines and clean geometric precision for UI controls).
  - *Editorial Document & Serif Option*: **Fraunces** / **Cormorant Garamond** (available alongside standard document fonts inside the rich-text and freeform typography engine).
  - *Technical & Tabular Metrics*: **IBM Plex Mono** (`tabular-nums` for X/Y/W/H coordinates, ruler ticks, storage quotas, page dimensions, and inline chart data tables).
- **Interactive Feedback & Motion**:
  - Fast, deliberate transitions (`150ms cubic-bezier(0.16, 1, 0.3, 1)`) using only `transform` and `opacity`.
  - Full compliance with `prefers-reduced-motion`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Layer Hybrid Page Model vs. Separate Modes**
  - *Chosen Approach*: Each page contains both a structured rich-text document flow container (supporting headings, lists, checklists, blockquotes, code blocks, captions, footnotes, and tables) and a freeform spatial scene graph layered on the same coordinate space.
  - *Why*: Eliminates the artificial barrier between "word processors" and "design tools." Users can type a multi-paragraph proposal and immediately drop a rotated callout badge, custom SVG diagram, or live chart anywhere on the page.
- **Decision 2: Command-Patch History Engine vs. Full-State Cloning**
  - *Chosen Approach*: Transaction and patch-based history ring buffer storing forward/inverse state diffs per action, coalescing rapid continuous drags or keystrokes into single undoable transactions (`150+` undo steps).
  - *Why*: Guarantees sub-millisecond `Ctrl+Z` / `Ctrl+Shift+Z` responsiveness without exhausting memory on multi-page documents with embedded assets.
- **Decision 3: Canonical `.izm` Archive vs. Export Formats**
  - *Chosen Approach*: `.izm` (ZIP archive via `JSZip`) stores the lossless JSON scene graph, styles, history metadata, binary image blobs, and page thumbnails. PDF, SVG, PNG, JPG, WEBP, DOCX, and PPTX are generated on demand via dedicated export pipelines.
  - *Why*: Preserves 100% round-trip editing fidelity locally while clearly communicating to users that PDF/SVG are optimal for exact visual layout preservation and DOCX/PPTX map structured flow and visual elements into best-effort editable office primitives.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        izmedtzz (izm) Application Shell                    │
│         PWA Service Worker · Offline Detector · Crash Recovery Guard       │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│     Editorial Studio Home View       │  │   Hybrid Studio Editor View      │
│  ┌────────────────────────────────┐  │  │  ┌────────────────────────────┐  │
│  │ Oversized Kinetic Header &     │  │  │  │ Top Menu & Action Bar      │  │
│  │ Quick Page Preset Launcher     │  │  │  ├──────┬──────────────┬──────┤  │
│  ├────────────────────────────────┤  │  │  │ Left │ Center       │Right │  │
│  │ Local Template Gallery         │  │  │  │ Tool │ Infinite     │Contx.│  │
│  │ (Documents/Creative/Deck)      │  │  │  │ Rail │ Multi-Page   │Inspec│  │
│  ├────────────────────────────────┤  │  │  │ &    │ Hybrid       │-tor  │  │
│  │ IndexedDB Project Vault &      │  │  │  │Layer │ Canvas       │Panel │  │
│  │ .izm Archive Import / Backup   │  │  │  │Tree  │ (Flow+Free)  │      │  │
│  ├────────────────────────────────┤  │  │  ├──────┴──────────────┴──────┤  │
│  │ Local Storage Quota Manager    │  │  │  │ Bottom Page Filmstrip /    │  │
│  └────────────────────────────────┘  │  │  │ Mobile Thumb-Zone Sheet    │  │
└───────────────────┬──────────────────┘  └──┴──────────────┬─────────────┴──┘
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                  Granular Zustand Studio Store & Command Bus               │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Document & Page │ │ Flow Rich-Text & │ │ Freeform    │ │ Patch Undo/ │  │
│  │ Geometry Engine │ │ Table Controller │ │ Transform & │ │ Redo History│  │
│  │ (A4/F4/Custom)  │ │ (Styles/Search)  │ │ Snap Guides │ │ (150+ steps)│  │
│  └─────────────────┘ └──────────────────┘ └─────────────┘ └─────────────┘  │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    ▼                                    ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│   Local Persistence Layer (Dexie)    │  │   Multi-Format Export Engine     │
│  • projects (document, pages, meta)  │  │  • Native: .izm (JSZip Archive)  │
│  • assets (Blob binary deduplicated) │  │  • Raster/Vector: PNG,JPG,WEBP,  │
│  • recoverySnapshots (crash guard)   │  │    SVG, Print-Ready PDF          │
│  • customTemplates & textStyles      │  │  • Office: DOCX & PPTX Synthesizers│
└──────────────────────────────────────┘  └──────────────────────────────────┘
```

### Data Model & State

- **`IzmProject`**: `id`, `title`, `createdAt`, `updatedAt`, `pageSizePreset` (`A4`, `A5`, `Letter`, `Legal`, `F4`, `Custom`), `orientation` (`portrait` | `landscape`), `dimensionsMm`, `marginsMm`, `bleedMm`, `safeAreaMm`, `headerConfig`, `footerConfig`, `textStyles[]`, `pages[]`, `assetIds[]`.
- **`IzmPage`**: `id`, `index`, `name`, `background` (color/pattern), `showHeaderFooter`, `flowBlocks[]` (structured rich-text blocks: `h1`-`h6`, `paragraph`, `quote`, `bullet-list`, `numbered-list`, `checklist`, `caption`, `footnote`, `code`, `table`), and `freeformObjects[]` (scene-graph nodes).
- **`FreeformObject`**: Shared spatial base (`id`, `name`, `type`, `x`, `y`, `width`, `height`, `rotation`, `scaleX`, `scaleY`, `opacity`, `visible`, `locked`, `zIndex`, `groupId`, `shadow`, `blur`, `borderRadius`) with specialized payloads for:
  - `textbox` (rich spans, font family/size/weight, line height, tracking, alignment, fill/padding)
  - `shape` (`rect`, `rounded-rect`, `circle`, `ellipse`, `triangle`, `polygon`, `star`, `arrow`, `line`, `divider`, `speech-bubble`, `badge`, `callout`, `custom-svg` with fill, stroke, strokeWidth)
  - `image` (asset blob reference, crop rect, mask shape, frame border, brightness, contrast, saturation, blur, fit mode)
  - `chart` (`bar`, `line`, `pie`, `doughnut`, `area` with editable series/rows, legend toggle, and palette)
  - `table` (rows, columns, cell merges/splits, cell padding, cell background, border width/color, text direction)
  - `embed` (styled hyperlink/reference card)

### Interactive Component & State Mapping

- **Debounced Autosave & Crash Recovery**: Every state mutation writes a fast recovery checkpoint to `IndexedDB.recoverySnapshots` within `300ms` and commits to `IndexedDB.projects` within `900ms`, updating the status indicator (`Saving...` -> `Saved`). Unclean exits trigger a recovery prompt on next launch.
- **Smart Snapping & Guides Engine**: During drag/resize on the canvas, object edges and centers are tested against page margins, page centerlines, grid increments, and sibling bounding boxes within a `5px` threshold, rendering live `#002FA7` alignment lines and distance readouts.
- **Project-Wide Search & Find/Replace**: Scans all pages across both `flowBlocks` and `freeformObjects` (`textbox` & `table` cells), highlights matched substrings, jumps the viewport directly to the target page/object, and supports single or batch replacement as an atomic undoable command.
- **Print Preview & Calibration Modal**: Dedicated print preparation view supporting A4/F4/Letter/Custom dimensions, portrait/landscape switching, custom margins, scale (`Fit` vs `Actual Size` vs custom `%`), and page range filtering with clean `@media print` stylesheet isolation.
- **Storage Manager**: Queries `navigator.storage.estimate()` plus Dexie table metrics to display exact used bytes, project count, and binary asset count, offering one-click orphan asset garbage collection, full `.izm-backup` vault export, and backup restoration.
