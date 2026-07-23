// Ambient type declarations for this checkJs project. No runtime effect -
// these exist only so `tsc` has a typed stopping point instead of parsing
// third-party implementation JS as if it were our own source.

// (The `turndown` package has its own type stub - see types/turndown-shim.d.ts
// and the `paths` mapping in jsconfig.json - because an ambient `declare
// module` here isn't enough to override an actually-resolvable package.)

// Google Identity Services (GSI) loads `window.google` from an external
// <script> tag at runtime (see src/pages/AdminLogin.jsx) - there's no
// first-party or @types package for it in this project.
declare global {
  interface Window {
    google?: any;
  }
}

export {};
