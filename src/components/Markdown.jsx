import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

// Renders a Markdown string into `<div className={className}>` so the
// existing `.rich-content` CSS (and any classes callers pass) keeps applying,
// same as the old dangerouslySetInnerHTML sites did.
//
// Internal links (href starting with "/") become react-router <Link> so
// navigation stays client-side/SPA (same tab). Everything else opens in a
// new tab, matching how the old HTML content's external links behaved.
function MarkdownLink({ href, children }) {
  if (href?.startsWith('/')) {
    return <Link to={href}>{children}</Link>;
  }
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export default function Markdown({ className, children }) {
  if (!children) return null;

  return (
    <div className={className}>
      <ReactMarkdown components={{ a: MarkdownLink }}>{children}</ReactMarkdown>
    </div>
  );
}
