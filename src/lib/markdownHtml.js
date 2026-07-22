// Markdown <-> HTML conversion for the admin write layer.
//
// The DB stores rich-text leaves as Markdown (see
// docs/superpowers/specs/2026-07-22-db-remigration-spec.md). The admin panels
// edit rich fields with react-quill (src/components/RichTextEditor.jsx), which
// works in HTML. This module is the only place that bridges the two:
//   - mdToHtml: Markdown (DB) -> HTML (quill), used when loading a draft.
//   - htmlToMd: HTML (quill) -> Markdown (DB), used when saving a draft.
//
// Only RICH fields (see the entity table in
// docs/superpowers/specs/2026-07-22-admin-write-layer-spec.md) go through
// these. Plain fields (titles, q, headings, description_he subtitles, cta,
// authors/year/url) are copied verbatim by src/api/adminSource.js.

import { marked } from 'marked';
import TurndownService from 'turndown';

marked.setOptions({ gfm: true, breaks: false });

// Configured to match the migrated DB style (see db-remigration spec):
// atx headings (`#`), `-` bullets, fenced code blocks, `*`/`**` emphasis.
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// Markdown string -> HTML string (for loading into quill). Empty/null -> ''.
export function mdToHtml(md) {
  if (!md) return '';
  const html = marked.parse(md);
  return typeof html === 'string' ? html.trim() : '';
}

// Quill HTML -> Markdown string (for saving). Empty/`<p><br></p>` -> ''.
export function htmlToMd(html) {
  if (!html) return '';
  const trimmed = html.trim();
  if (!trimmed || trimmed === '<p><br></p>') return '';
  return turndownService.turndown(trimmed).trim();
}
