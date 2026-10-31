import {
  createFlowBlock,
  createFreeformChart,
  createFreeformShape,
  createFreeformTable,
  createFreeformTextbox,
  createNewProject,
  uid,
} from '../document/factories';
import { IzmProject, PageOrientation, PageSizePreset } from '../document/types';

export interface BuiltinTemplateMeta {
  id: string;
  name: string;
  subcategory: string;
  category: 'document' | 'creative' | 'presentation';
  preset: PageSizePreset;
  orientation: PageOrientation;
  description: string;
  build: () => IzmProject;
}

export const BUILTIN_TEMPLATES: BuiltinTemplateMeta[] = [
  // ================= DOCUMENTS (8) =================
  {
    id: 'tpl_doc_report',
    name: 'Annual Studio Report',
    subcategory: 'Report',
    category: 'document',
    preset: 'A4',
    orientation: 'portrait',
    description: 'Executive summary, key financial metrics table, and quarterly bar chart.',
    build: () => {
      const p = createNewProject({
        title: 'Annual Studio Report 2026',
        preset: 'A4',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'ANNUAL MONOGRAPH & STUDIO REPORT'),
        createFlowBlock('caption', 'EDITION 04 · FISCAL YEAR 2026–2027 · LOCAL ARCHIVE'),
        createFlowBlock(
          'paragraph',
          'This report synthesizes structural typography and visual data into a single hybrid document layout. All metrics and visual annotations below remain editable offline.'
        ),
        createFlowBlock('h2', '01. Key Performance Breakdown'),
        createFlowBlock('table'),
      ];
      const chart = createFreeformChart('bar', 2);
      chart.x = 75;
      chart.y = 660;
      chart.width = 640;
      chart.height = 260;
      p.pages[0].freeformObjects = [chart];
      return p;
    },
  },
  {
    id: 'tpl_doc_proposal',
    name: 'Architectural & Creative Proposal',
    subcategory: 'Proposal',
    category: 'document',
    preset: 'A4',
    orientation: 'portrait',
    description: 'Project scope, deliverables checklist, and visual budget badge.',
    build: () => {
      const p = createNewProject({
        title: 'Creative Direction Proposal',
        preset: 'A4',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'CREATIVE DIRECTION & SYSTEM PROPOSAL'),
        createFlowBlock('quote', '“Form is not an ornament added to content; it is the clarity of structure itself.”'),
        createFlowBlock('h2', 'Scope & Deliverables'),
        createFlowBlock('checklist'),
        createFlowBlock(
          'paragraph',
          'Phase 1 establishes the foundational design language and typographic grid. Phase 2 delivers production-ready spatial specifications.'
        ),
      ];
      const badge = createFreeformShape('badge', 2);
      badge.x = 520;
      badge.y = 82;
      badge.width = 180;
      badge.height = 40;
      badge.text = 'APPROVED DRAFT';
      p.pages[0].freeformObjects = [badge];
      return p;
    },
  },
  {
    id: 'tpl_doc_essay',
    name: 'Long-Form Critical Essay',
    subcategory: 'Essay',
    category: 'document',
    preset: 'A5',
    orientation: 'portrait',
    description: 'Refined literary monograph with Fraunces serif headings and footnotes.',
    build: () => {
      const p = createNewProject({
        title: 'On Spatial Typography',
        preset: 'A5',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'The Silence Between Letters'),
        createFlowBlock('caption', 'ESSAY IN THREE PARTS · MONOGRAPH SERIES'),
        createFlowBlock(
          'paragraph',
          'Negative space is never empty; it acts as the acoustic chamber through which typographic statements resonate. When we treat the page as both a linear manuscript and an open field, new editorial rhythms emerge.'
        ),
        createFlowBlock('quote', '“White space is to be regarded as an active element, not a passive background.” — Jan Tschichold'),
        createFlowBlock('footnote', '[1] First published in Elementare Typographie, 1925.'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_doc_article',
    name: 'Editorial Feature Article',
    subcategory: 'Article',
    category: 'document',
    preset: 'Letter',
    orientation: 'portrait',
    description: 'Feature journalism spread with pull-quote callout box and structured prose.',
    build: () => {
      const p = createNewProject({
        title: 'Feature: Future of Local-First Tools',
        preset: 'Letter',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'ISSUE 19 · TECHNOLOGY & DESIGN'),
        createFlowBlock('h1', 'Why Local-First Software Owns the Next Decade'),
        createFlowBlock(
          'paragraph',
          'For fifteen years, creative tools migrated into remote browser tabs tethered to subscription servers. Today, modern browser storage engines and WebAssembly allow studio-grade editors to live entirely on the creator’s machine.'
        ),
        createFlowBlock('h2', 'Key Principles of Ownership'),
        createFlowBlock('numbered-list', 'Canonical local archive files (.izm)\nInstant zero-latency IndexedDB persistence\nComplete offline capability via Service Worker'),
      ];
      const callout = createFreeformTextbox('PULL QUOTE:\n“Your files belong on your disk, ready whether you are on a flight or in the studio.”', 2);
      callout.x = 460;
      callout.y = 480;
      callout.width = 280;
      callout.height = 140;
      callout.fill = '#050505';
      callout.textColor = '#FFFFFF';
      p.pages[0].freeformObjects = [callout];
      return p;
    },
  },
  {
    id: 'tpl_doc_cv',
    name: 'Academic & Studio Curriculum Vitae',
    subcategory: 'CV',
    category: 'document',
    preset: 'A4',
    orientation: 'portrait',
    description: 'Comprehensive academic and studio CV with publications and exhibitions.',
    build: () => {
      const p = createNewProject({
        title: 'Curriculum Vitae — Creative Director',
        preset: 'A4',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'SOREN VANDERBERG'),
        createFlowBlock('caption', 'PRINCIPAL DESIGN DIRECTOR · PARIS / TOKYO · SOREN@STUDIO.LOCAL'),
        createFlowBlock('h2', '01. Selected Appointments'),
        createFlowBlock('bullet-list', '2023–Present: Principal Director, Studio Nothin-Inspired Lab\n2019–2023: Senior Typographic Architect, Zurich Press\n2016–2019: Editorial Systems Designer, Milan'),
        createFlowBlock('h2', '02. Exhibitions & Monographs'),
        createFlowBlock('table'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_doc_resume',
    name: 'Minimalist Product Designer Resume',
    subcategory: 'Resume',
    category: 'document',
    preset: 'Letter',
    orientation: 'portrait',
    description: 'Crisp single-page resume with monochrome grid and International Klein Blue accent.',
    build: () => {
      const p = createNewProject({
        title: 'Resume — Product & Systems Designer',
        preset: 'Letter',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'ELENA ROSTOVA'),
        createFlowBlock('caption', 'STAFF DESIGN ENGINEER · SAN FRANCISCO · PORTFOLIO.LOCAL'),
        createFlowBlock('h2', 'Experience'),
        createFlowBlock('paragraph', 'Led the architecture of hybrid document-canvas engines, reducing layout latency by 64% while introducing zero-dependency offline persistence.'),
        createFlowBlock('h2', 'Core Competencies'),
        createFlowBlock('bullet-list', 'Design Systems & Editorial Typography\nScene-Graph Canvas Rendering & SVG Pipelines\nLocal-First Architecture (IndexedDB, Service Workers)'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_doc_letter',
    name: 'Executive Correspondence Letter',
    subcategory: 'Letter',
    category: 'document',
    preset: 'A4',
    orientation: 'portrait',
    description: 'Formal studio letterhead with precision margins and signature block.',
    build: () => {
      const p = createNewProject({
        title: 'Formal Studio Letterhead',
        preset: 'A4',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'IZMEDTZZ STUDIO CORRESPONDENCE · REF #2026-88'),
        createFlowBlock('h2', 'To the Selection Committee,'),
        createFlowBlock(
          'paragraph',
          'We are pleased to submit the enclosed architectural dossier and visual identity specifications for the upcoming biennial exhibition. All accompanying diagrams and schedules have been verified.'
        ),
        createFlowBlock('paragraph', 'Sincerely,\n\nEditorial Direction Board'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_doc_worksheet',
    name: 'Structured Research Worksheet',
    subcategory: 'Worksheet',
    category: 'document',
    preset: 'F4',
    orientation: 'portrait',
    description: 'F4-sized assessment and field research worksheet with checklist and grid table.',
    build: () => {
      const p = createNewProject({
        title: 'Field Research & Audit Worksheet',
        preset: 'F4',
        orientation: 'portrait',
        category: 'document',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'FIELD AUDIT & VERIFICATION WORKSHEET'),
        createFlowBlock('caption', 'F4 STANDARD FORMAT (215 × 330 MM) · PRINT CALIBRATED'),
        createFlowBlock('h3', 'Verification Checklist'),
        createFlowBlock('checklist'),
        createFlowBlock('h3', 'Measurement Log'),
        createFlowBlock('table'),
      ];
      return p;
    },
  },

  // ================= CREATIVE (6) =================
  {
    id: 'tpl_cre_poster',
    name: 'Brutalist Exhibition Poster',
    subcategory: 'Poster',
    category: 'creative',
    preset: 'A4',
    orientation: 'portrait',
    description: 'High-contrast typographic exhibition poster with geometric freeform shapes.',
    build: () => {
      const p = createNewProject({
        title: 'Exhibition Poster — Form & Void',
        preset: 'A4',
        orientation: 'portrait',
        category: 'creative',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'MUSEUM OF CONTEMPORARY TYPOGRAPHY · NOVEMBER 2026'),
        createFlowBlock('h1', 'FORM / VOID / PERSPECTIVE'),
      ];
      const circle = createFreeformShape('circle', 1);
      circle.x = 180;
      circle.y = 320;
      circle.width = 420;
      circle.height = 420;
      circle.fill = '#002FA7';
      circle.strokeWidth = 0;

      const label = createFreeformTextbox('NOT A STYLE,\nA PERSPECTIVE.\n\nGALLERY 04 · FREE ENTRY', 2);
      label.x = 120;
      label.y = 780;
      label.width = 550;
      label.height = 140;
      label.fill = '#050505';
      label.textColor = '#FFFFFF';
      label.fontSize = 22;

      p.pages[0].freeformObjects = [circle, label];
      return p;
    },
  },
  {
    id: 'tpl_cre_flyer',
    name: 'Design Symposium Flyer',
    subcategory: 'Flyer',
    category: 'creative',
    preset: 'A5',
    orientation: 'portrait',
    description: 'Compact A5 event flyer combining flow schedule and freeform graphic badges.',
    build: () => {
      const p = createNewProject({
        title: 'Symposium Flyer 2026',
        preset: 'A5',
        orientation: 'portrait',
        category: 'creative',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'SYNTHESIS 2026'),
        createFlowBlock('caption', 'ANNUAL VISUAL DOCUMENT SYMPOSIUM'),
        createFlowBlock('bullet-list', '10:00 — Keynote: Hybrid Engines\n13:30 — Workshop: Kinetic Grids\n16:00 — Open Archive Review'),
      ];
      const star = createFreeformShape('star', 2);
      star.x = 340;
      star.y = 420;
      star.width = 140;
      star.height = 140;
      star.fill = '#002FA7';
      p.pages[0].freeformObjects = [star];
      return p;
    },
  },
  {
    id: 'tpl_cre_invitation',
    name: 'Private Vernissage Invitation',
    subcategory: 'Invitation',
    category: 'creative',
    preset: 'A5',
    orientation: 'landscape',
    description: 'Refined horizontal invitation card with monochrome border framing.',
    build: () => {
      const p = createNewProject({
        title: 'Private View Invitation',
        preset: 'A5',
        orientation: 'landscape',
        category: 'creative',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'PRIVATE VERNISSAGE · RUE DE TURENNE'),
        createFlowBlock('h1', 'ATELIER ARCHIVE N° 09'),
        createFlowBlock('paragraph', 'You are cordially invited to the preview of our autumn monograph collection. Friday, 19:00–22:00.'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_cre_certificate',
    name: 'Diploma & Excellence Certificate',
    subcategory: 'Certificate',
    category: 'creative',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Landscape certificate of excellence with seal badge and verification code.',
    build: () => {
      const p = createNewProject({
        title: 'Certificate of Design Excellence',
        preset: 'A4',
        orientation: 'landscape',
        category: 'creative',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'INTERNATIONAL VISUAL SYSTEMS COUNCIL'),
        createFlowBlock('h1', 'CERTIFICATE OF DISTINCTION'),
        createFlowBlock('paragraph', 'This certifies that the recipient has demonstrated mastery in hybrid typographic engineering and visual communication.'),
      ];
      const badge = createFreeformShape('badge', 2);
      badge.x = 820;
      badge.y = 540;
      badge.width = 210;
      badge.height = 54;
      badge.text = 'VERIFIEDHONORS · 2026';
      p.pages[0].freeformObjects = [badge];
      return p;
    },
  },
  {
    id: 'tpl_cre_brochure',
    name: 'Architectural Studio Brochure',
    subcategory: 'Brochure',
    category: 'creative',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Multi-zone brochure spread for architecture and industrial design studios.',
    build: () => {
      const p = createNewProject({
        title: 'Architectural Studio Brochure',
        preset: 'A4',
        orientation: 'landscape',
        category: 'creative',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'SPATIAL MONOLITHS'),
        createFlowBlock('paragraph', 'Designing permanent public structures with minimal material footprint and high structural legibility.'),
      ];
      const box = createFreeformTextbox('PROJECT INDEX\n01. Concrete Pavilion\n02. Nordic Library\n03. Solar Atrium', 2);
      box.x = 680;
      box.y = 140;
      box.width = 340;
      box.height = 240;
      p.pages[0].freeformObjects = [box];
      return p;
    },
  },
  {
    id: 'tpl_cre_magazine',
    name: 'Avant-Garde Magazine Spread',
    subcategory: 'Magazine',
    category: 'creative',
    preset: 'A4',
    orientation: 'portrait',
    description: 'Editorial magazine layout pairing Fraunces display quotes with geometric blocks.',
    build: () => {
      const p = createNewProject({
        title: 'Magazine Issue 01 — Monochrome',
        preset: 'A4',
        orientation: 'portrait',
        category: 'creative',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'ISSUE N° 01 · AUTUMN / WINTER'),
        createFlowBlock('h1', 'THE NEW BRUTALISM IN DIGITAL PRINT'),
        createFlowBlock('quote', '“Every pixel on the canvas should answer to a typographic grid.”'),
        createFlowBlock(
          'paragraph',
          'Across independent publishing houses, designers are rejecting templated homogeneity in favor of stark black-and-white contrast, intentional negative space, and kinetic proportions.'
        ),
      ];
      return p;
    },
  },

  // ================= PRESENTATION (8) =================
  {
    id: 'tpl_pres_title',
    name: '01. Keynote Title Slide',
    subcategory: 'Title',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Oversized bold presentation cover slide with studio metadata.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Title Slide',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'KEYNOTE PRESENTATION · 2026'),
        createFlowBlock('h1', 'ARCHITECTURE OF CLARITY'),
        createFlowBlock('paragraph', 'A strategic overview of visual systems, design operations, and local-first publishing.'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_pres_agenda',
    name: '02. Structured Agenda Slide',
    subcategory: 'Agenda',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Numbered session agenda with timing callouts.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Agenda',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'SESSION AGENDA'),
        createFlowBlock('numbered-list', '01. Context & Problem Definition\n02. Hybrid Layout Architecture\n03. Quantitative Benchmarks\n04. Rollout & Next Milestones'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_pres_content',
    name: '03. Executive Content Slide',
    subcategory: 'Content',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Focused narrative slide with thesis statement and supporting points.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Core Thesis',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'SECTION 02 · CORE THESIS'),
        createFlowBlock('h1', 'UNIFYING TEXT FLOW & SPATIAL DESIGN'),
        createFlowBlock('paragraph', 'Separating word processing from visual layout forces teams to bounce between incompatible file formats. A unified hybrid page engine eliminates translation loss.'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_pres_image',
    name: '04. Visual Showcase Slide',
    subcategory: 'Image',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Presentation slide framed for visual media and caption commentary.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Visual Showcase',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h2', 'VISUAL ART DIRECTION SHOWCASE'),
        createFlowBlock('caption', 'Drop any PNG, JPG, WEBP, or SVG onto the canvas frame right.'),
      ];
      const frame = createFreeformShape('rectangle', 2);
      frame.x = 100;
      frame.y = 220;
      frame.width = 900;
      frame.height = 440;
      frame.fill = '#F4F4F5';
      frame.text = 'VISUAL SHOWCASE FRAME — DROP MEDIA OR EDIT SHAPE';
      p.pages[0].freeformObjects = [frame];
      return p;
    },
  },
  {
    id: 'tpl_pres_comparison',
    name: '05. Side-by-Side Comparison Slide',
    subcategory: 'Comparison',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Structured comparison matrix contrasting legacy vs. hybrid workflows.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Architecture Comparison',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'LEGACY SILOS VS. HYBRID ENGINE'),
        createFlowBlock('table'),
      ];
      return p;
    },
  },
  {
    id: 'tpl_pres_timeline',
    name: '06. Roadmap & Timeline Slide',
    subcategory: 'Timeline',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Milestone timeline with connected vector blocks.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Delivery Roadmap',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', '2026–2027 DELIVERY TIMELINE'),
        createFlowBlock('caption', 'FOUR-PHASE LOCAL-FIRST RELEASE SCHEDULE'),
      ];
      const q1 = createFreeformTextbox('PHASE 01\nCore Engine & .izm Vault', 2);
      q1.x = 80;
      q1.y = 260;
      q1.width = 220;
      q1.height = 140;

      const q2 = createFreeformTextbox('PHASE 02\nRich Typography & Tables', 3);
      q2.x = 330;
      q2.y = 260;
      q2.width = 220;
      q2.height = 140;

      const q3 = createFreeformTextbox('PHASE 03\nCharts & Smart Guides', 4);
      q3.x = 580;
      q3.y = 260;
      q3.width = 220;
      q3.height = 140;

      const q4 = createFreeformTextbox('PHASE 04\nFull Multi-Format Export', 5);
      q4.x = 830;
      q4.y = 260;
      q4.width = 220;
      q4.height = 140;
      q4.fill = '#002FA7';
      q4.textColor = '#FFFFFF';

      p.pages[0].freeformObjects = [q1, q2, q3, q4];
      return p;
    },
  },
  {
    id: 'tpl_pres_chart',
    name: '07. Data & Telemetry Slide',
    subcategory: 'Chart',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Quantitative presentation slide with editable live data chart.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Quantitative Metrics',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('h1', 'BENCHMARK PERFORMANCE METRICS'),
        createFlowBlock('caption', 'SELECT THE CHART BELOW TO EDIT DATA POINTS DIRECTLY IN THE INSPECTOR'),
      ];
      const chart = createFreeformChart('area', 2);
      chart.x = 80;
      chart.y = 210;
      chart.width = 940;
      chart.height = 460;
      p.pages[0].freeformObjects = [chart];
      return p;
    },
  },
  {
    id: 'tpl_pres_closing',
    name: '08. Closing & Q&A Manifesto Slide',
    subcategory: 'Closing',
    category: 'presentation',
    preset: 'A4',
    orientation: 'landscape',
    description: 'Bold closing slide with manifesto statement and contact coordinates.',
    build: () => {
      const p = createNewProject({
        title: 'Deck — Closing Slide',
        preset: 'A4',
        orientation: 'landscape',
        category: 'presentation',
      });
      p.pages[0].flowBlocks = [
        createFlowBlock('caption', 'END OF PRESENTATION · IZMEDTZZ STUDIO'),
        createFlowBlock('h1', 'WRITE. DESIGN. STORE LOCALLY. EXPORT FREELY.'),
        createFlowBlock('paragraph', 'Thank you. All project artifacts are preserved in canonical .izm format.'),
      ];
      return p;
    },
  },
];
