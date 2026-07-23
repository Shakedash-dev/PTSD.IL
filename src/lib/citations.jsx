import React from "react";

const ROUTES = {
  source: "/sources",
  treatment_step: "/treatment",
  tool: "/self-help",
  faq: "/rights",
  book: "/children",
  activity: "/calming",
};

export function sectionRoute(type) {
  return ROUTES[type] ?? "/";
}

export function renderWithCitations(text, sources, onCite) {
  const byN = new Map(sources.map((s) => [s.n, s]));
  const parts = String(text).split(/(\[\[\d+\]\])/g);
  return parts.map((part, i) => {
    const m = /^\[\[(\d+)\]\]$/.exec(part);
    if (!m) return part;
    const src = byN.get(Number(m[1]));
    if (!src) return null; // drop unmatched citation
    return (
      <sup
        key={i}
        role="button"
        tabIndex={0}
        className="cursor-pointer text-primary font-semibold px-0.5"
        onClick={() => onCite(src)}
        onKeyDown={(e) => e.key === "Enter" && onCite(src)}
      >
        {m[1]}
      </sup>
    );
  });
}
