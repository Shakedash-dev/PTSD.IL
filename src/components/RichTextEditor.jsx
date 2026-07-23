import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

// WYSIWYG editor for admin content fields that are stored/rendered as HTML
// (dangerouslySetInnerHTML) on the public pages. Admins never see raw tags -
// they get bold/underline/lists/links buttons and the output is HTML under
// the hood, same as before.
const TOOLBAR = [
  [{ header: [false, 3, 2] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
];

const FORMATS = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'blockquote', 'link'];

/**
 * @param {Object} props
 * @param {string} [props.value]
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.placeholder]
 */
export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);
  // Quill's own link tooltip is positioned relative to the text selection and gets
  // clipped/stranded near the editor's edges - replaced with an in-flow panel below
  // the toolbar instead, so it's never off-screen, clipped, or cursor-relative-tiny.
  const [linkPanel, setLinkPanel] = useState(null); // { range, url }

  const openLinkPanel = useCallback(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection(true);
    if (!range) return;
    const format = quill.getFormat(range);
    setLinkPanel({ range, url: typeof format.link === 'string' ? format.link : '' });
  }, []);

  const modules = useMemo(() => ({
    toolbar: { container: TOOLBAR, handlers: { link: openLinkPanel } },
  }), [openLinkPanel]);

  function applyLink() {
    const quill = quillRef.current?.getEditor();
    if (!quill || !linkPanel) return;
    const url = linkPanel.url.trim();
    quill.setSelection(linkPanel.range);
    if (url && linkPanel.range.length === 0) {
      quill.insertText(linkPanel.range.index, url, { link: url }, 'user');
      quill.setSelection(linkPanel.range.index + url.length, 0, 'user');
    } else {
      quill.format('link', url || false, 'user');
    }
    setLinkPanel(null);
  }

  function removeLink() {
    const quill = quillRef.current?.getEditor();
    if (quill && linkPanel) {
      quill.setSelection(linkPanel.range);
      quill.format('link', false, 'user');
    }
    setLinkPanel(null);
  }

  return (
    <div className="rich-text-editor rounded-lg border border-border" dir="rtl">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
      {linkPanel && (
        <div className="rte-link-panel">
          <label htmlFor="rte-link-input">כתובת קישור</label>
          <input
            id="rte-link-input"
            type="text"
            dir="ltr"
            placeholder="https://example.com"
            value={linkPanel.url}
            autoFocus
            onChange={e => setLinkPanel(p => ({ ...p, url: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
              if (e.key === 'Escape') { e.preventDefault(); setLinkPanel(null); }
            }}
          />
          <div className="rte-link-panel-actions">
            <button type="button" onClick={applyLink}>{linkPanel.url ? 'עדכון' : 'הוספה'}</button>
            {linkPanel.url && <button type="button" onClick={removeLink}>הסרה</button>}
            <button type="button" onClick={() => setLinkPanel(null)}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  );
}
