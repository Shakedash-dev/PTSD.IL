// Type-checking-only stub for the untyped `turndown` package (no shipped
// types, no @types package). Redirected here via the `paths` mapping in
// jsconfig.json so `tsc` type-checks against this stub instead of parsing
// node_modules/turndown/lib/turndown.cjs.js as application source - that file
// produces dozens of unrelated errors when run through checkJs. This mapping
// is TS-only: Vite/esbuild resolve the real `turndown` package at build and
// run time as normal (see src/lib/markdownHtml.js).
declare const TurndownService: any;
export default TurndownService;
