import React, { createContext, useContext } from 'react';

// What a search result asked to open: the Metiv admin (MetivAdmin.jsx) sets it
// when an editor clicks a result, and the section that holds the item opens its
// editor and scrolls it into view. `nonce` changes on every click, so clicking
// the same result twice opens it again.
//
// Shapes: { sectionId, rowId } a Metiv list item, { sectionId, path } a field
// of a singleton or page copy, { panel, itemId, cat?, age? } a PTSD-IL panel
// item (Admin.jsx), { qaId } a chatbot Q&A row.

/** @typedef {{ nonce: number, sectionId?: string, rowId?: string, path?: string, panel?: string, itemId?: string, cat?: string, age?: string, qaId?: string }} AdminFocus */

const FocusContext = createContext(/** @type {AdminFocus|null} */ (null));

export function AdminFocusProvider({ focus, children }) {
  return <FocusContext.Provider value={focus}>{children}</FocusContext.Provider>;
}

/** @returns {AdminFocus|null} */
export function useAdminFocus() {
  return useContext(FocusContext);
}

/** Scrolls an element into view and focuses its first input, once it is in the DOM. */
export function revealElement(el, selector = 'input, textarea, select') {
  if (!el) return;
  el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  const target = el.matches?.(selector) ? el : el.querySelector?.(selector);
  target?.focus?.({ preventScroll: true });
}
