import React, { useState } from 'react';
import { Settings, Users, FileText, BookOpen, HelpCircle, Wrench, Heart, Baby, Shield, ClipboardList, Pencil, Trash2, Plus, Check, X, LogOut } from 'lucide-react';
import { db } from '@/data/db';
import RichTextEditor from '@/components/RichTextEditor';
import { logout } from '@/lib/auth';

// Ghost commit - no backend wired yet. This is the single place a real API call
// (POST/PATCH/DELETE) would go once one exists; every panel below already calls
// through here, so wiring a backend later means editing this one function.
function ghostCommit(action, entity, payload) {
  console.log(`[Admin] ${action} → ${entity}`, payload);
}

// ─── Hebrew label maps for values that are stored in English internally (filter
// keys, category ids, etc.) so admins never see raw English tokens. ──────────
const LANG_LABELS = { he: 'עברית', ar: 'ערבית', en: 'אנגלית' };
const AUDIENCE_LABELS = {
  general: 'כללי',
  security_forces: 'כוחות ביטחון',
  sexual_harassment: 'נפגעי תקיפה מינית',
  spouses: 'בני/בנות זוג',
  hostilities: 'נפגעי פעולות איבה',
};
const LOCATION_LABELS = {
  center: 'מרכז',
  jerusalem: 'ירושלים',
  south: 'דרום',
  online: 'מקוון',
};
const MEETING_TYPE_LABELS = {
  frontal: 'פרונטלי',
  hybrid: 'היברידי',
  digital: 'דיגיטלי',
};
const RIGHTS_CATEGORY_LABELS = {
  security_forces: 'כוחות ביטחון',
  hostilities: 'נפגעי פעולות איבה',
  sexual_harassment: 'נפגעי תקיפה מינית',
  accidents_work: 'נפגעי תאונות עבודה',
  general: 'כללי',
};
const SELF_HELP_CATEGORY_LABELS = {
  sleep: 'שינה',
  journaling: 'כתיבה ויומן',
  apps: 'אפליקציות',
};
const RESOURCE_TYPE_LABELS = {
  book: 'ספר',
  activity: 'פעילות',
  story: 'סיפור',
  video: 'סרטון',
};
const SOURCE_CATEGORY_LABELS = {
  research: 'מחקר',
  clinical: 'קליני',
  ngo: 'עמותה',
  international: 'בינלאומי',
  official: 'רשמי',
};

function labelFor(map, key) {
  return map[key] || key;
}
function toOptions(map) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

const TABS = [
  { key: 'ptsd_faqs',     label: 'שאלות PTSD',        icon: HelpCircle },
  { key: 'self_help',     label: 'כלים עצמיים',        icon: Wrench },
  { key: 'treatment',     label: 'שלבי טיפול',         icon: Heart },
  { key: 'communities',   label: 'קהילות',             icon: Users },
  { key: 'rights',        label: 'זכויות',             icon: FileText },
  { key: 'sources',       label: 'מקורות',             icon: BookOpen },
  { key: 'second_circle', label: 'מעגל שני',           icon: Shield },
  { key: 'children',      label: 'ילדים',              icon: Baby },
  { key: 'questionnaire', label: 'שאלון PCL-5',        icon: ClipboardList },
];

function Badge({ children, color = 'bg-muted text-muted-foreground' }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

function Section({ title, count }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-heading font-semibold text-lg text-foreground">{title}</h2>
      <Badge color="bg-primary/10 text-primary">{count} פריטים</Badge>
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, title, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg bg-card border border-border transition-natural ${
        tone === 'danger'
          ? 'text-muted-foreground hover:text-red-600 hover:border-red-200'
          : 'text-muted-foreground hover:text-primary hover:border-primary/30'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function AddNewButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-natural"
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

function LinksField({ value, onChange }) {
  const links = value || [];
  function updateLink(i, key, val) {
    onChange(links.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)));
  }
  function removeLink(i) {
    onChange(links.filter((_, idx) => idx !== i));
  }
  function addLink() {
    onChange([...links, { label: '', url: '' }]);
  }
  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={l.label}
            onChange={e => updateLink(i, 'label', e.target.value)}
            placeholder="תווית"
            className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
          />
          <input
            value={l.url}
            onChange={e => updateLink(i, 'url', e.target.value)}
            placeholder="URL"
            className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs"
          />
          <button type="button" onClick={() => removeLink(i)} className="text-muted-foreground hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addLink} className="text-xs text-primary flex items-center gap-1 hover:underline">
        <Plus className="w-3 h-3" /> הוספת קישור
      </button>
    </div>
  );
}

// Repeatable heading + rich-text-body sections (used by second-circle FAQ answers,
// which need structured content - not a single opaque HTML blob - so admins get
// dedicated controls per section instead of raw tags.
function SectionsField({ value, onChange }) {
  const sections = value || [];
  function updateSection(i, key, val) {
    onChange(sections.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  }
  function removeSection(i) {
    onChange(sections.filter((_, idx) => idx !== i));
  }
  function addSection() {
    onChange([...sections, { heading: '', body: '' }]);
  }
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              value={s.heading}
              onChange={e => updateSection(i, 'heading', e.target.value)}
              placeholder="כותרת הסעיף"
              className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-sm font-medium"
            />
            <button type="button" onClick={() => removeSection(i)} className="text-muted-foreground hover:text-red-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <RichTextEditor value={s.body} onChange={val => updateSection(i, 'body', val)} />
        </div>
      ))}
      <button type="button" onClick={addSection} className="text-xs text-primary flex items-center gap-1 hover:underline">
        <Plus className="w-3 h-3" /> הוספת סעיף
      </button>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  switch (field.type) {
    case 'select':
      return (
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
        >
          {field.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    case 'tags': {
      const arr = value || [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options.map(o => {
            const active = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => onChange(active ? arr.filter(v => v !== o.value) : [...arr, o.value])}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-natural ${
                  active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    case 'links':
      return <LinksField value={value} onChange={onChange} />;
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      );
    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm leading-relaxed"
        />
      );
    case 'richtext':
      return <RichTextEditor value={value} onChange={onChange} />;
    case 'sections':
      return <SectionsField value={value} onChange={onChange} />;
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      );
  }
}

// Generic view/edit card used by every content list below. `onDelete` omitted
// means the card can't be deleted (not used currently, but supported).
function EditableCard({ item, fields, onSave, onCancel, onDelete, renderView, startInEdit = false }) {
  const [editing, setEditing] = useState(startInEdit);
  const [draft, setDraft] = useState(item);

  if (!editing) {
    return (
      <div className="relative group p-4 rounded-xl border border-border bg-background">
        {renderView(item)}
        <div className="absolute top-3 end-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn icon={Pencil} title="עריכה" onClick={() => { setDraft(item); setEditing(true); }} />
          {onDelete && <IconBtn icon={Trash2} title="מחיקה" tone="danger" onClick={onDelete} />}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-primary/40 bg-background space-y-3">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">{f.label}</label>
          <FieldInput field={f} value={draft[f.key]} onChange={val => setDraft(d => ({ ...d, [f.key]: val }))} />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => { onSave(draft); setEditing(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90"
        >
          <Check className="w-3.5 h-3.5" /> שמירה
        </button>
        <button
          type="button"
          onClick={() => { setDraft(item); setEditing(false); onCancel && onCancel(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-semibold hover:bg-border"
        >
          <X className="w-3.5 h-3.5" /> ביטול
        </button>
      </div>
    </div>
  );
}

function PTSDFaqsPanel() {
  const langs = ['he', 'ar', 'en'];
  const [lang, setLang] = useState('he');
  const [faqsByLang, setFaqsByLang] = useState(() => ({ ...db.ptsd_info_faqs }));
  const faqs = faqsByLang[lang] || [];
  const [creating, setCreating] = useState(false);

  function setFaqs(next) {
    setFaqsByLang(prev => ({ ...prev, [lang]: next }));
  }

  const fields = [
    { key: 'q', label: 'שאלה', type: 'text' },
    { key: 'a', label: 'תשובה', type: 'richtext' },
  ];

  function renderView(faq) {
    return (
      <div className="pe-16">
        <p className="font-medium text-foreground mb-1">{faq.q}</p>
        <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: faq.a }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {langs.map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-natural ${lang === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
            {LANG_LABELS[l] || l}
          </button>
        ))}
      </div>
      <Section title="שאלות ותשובות על PTSD" count={faqs.length} />
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <EditableCard
            key={i}
            item={faq}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              setFaqs(faqs.map((f, idx) => (idx === i ? draft : f)));
              ghostCommit('update', `ptsd_info_faqs.${lang}`, draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק שאלה זו?')) return;
              setFaqs(faqs.filter((_, idx) => idx !== i));
              ghostCommit('delete', `ptsd_info_faqs.${lang}`, faq);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ q: '', a: '' }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              setFaqs([...faqs, draft]);
              ghostCommit('create', `ptsd_info_faqs.${lang}`, draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת שאלה חדשה" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function SelfHelpPanel() {
  const [tools, setTools] = useState(() => [...db.self_help_tools]);
  const [creating, setCreating] = useState(false);

  const fields = [
    { key: 'category', label: 'קטגוריה', type: 'select', options: toOptions(SELF_HELP_CATEGORY_LABELS) },
    { key: 'title_he', label: 'כותרת', type: 'text' },
    { key: 'content_he', label: 'תוכן', type: 'richtext' },
  ];

  function renderView(tool) {
    return (
      <div className="flex items-start gap-3 pe-16">
        <Badge color="bg-primary/10 text-primary">{labelFor(SELF_HELP_CATEGORY_LABELS, tool.category)}</Badge>
        <div>
          <p className="font-medium text-foreground">{tool.title_he}</p>
          <div className="text-sm text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: tool.content_he }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Section title="כלים לעזרה עצמית" count={tools.length} />
      <div className="space-y-3">
        {tools.map((tool, i) => (
          <EditableCard
            key={i}
            item={tool}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              setTools(tools.map((t, idx) => (idx === i ? draft : t)));
              ghostCommit('update', 'self_help_tools', draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק כלי זה?')) return;
              setTools(tools.filter((_, idx) => idx !== i));
              ghostCommit('delete', 'self_help_tools', tool);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ category: 'sleep', title_he: '', content_he: '' }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              setTools([...tools, draft]);
              ghostCommit('create', 'self_help_tools', draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת כלי חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function TreatmentPanel() {
  const [steps, setSteps] = useState(() => [...db.treatment_steps]);
  const [creating, setCreating] = useState(false);

  const fields = [
    { key: 'step_number', label: 'מספר שלב', type: 'number' },
    { key: 'title_he', label: 'כותרת', type: 'text' },
    { key: 'description_he', label: 'תיאור', type: 'textarea' },
    { key: 'how_to_start_he', label: 'איך מתחילים', type: 'richtext' },
    { key: 'links', label: 'קישורים', type: 'links' },
  ];

  function renderView(step) {
    return (
      <div className="flex items-start gap-3 pe-16">
        <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
          {step.step_number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{step.title_he}</p>
          <p className="text-sm text-muted-foreground mt-1">{step.description_he}</p>
          {step.how_to_start_he && (
            <div className="text-xs text-muted-foreground/80 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: step.how_to_start_he }} />
          )}
          {step.links?.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {step.links.map((l, j) => (
                <a key={j} href={l.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{l.label}</a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Section title="שלבי טיפול" count={steps.length} />
      <div className="space-y-3">
        {steps.map((step, i) => (
          <EditableCard
            key={i}
            item={step}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              setSteps(steps.map((s, idx) => (idx === i ? draft : s)));
              ghostCommit('update', 'treatment_steps', draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק שלב זה?')) return;
              setSteps(steps.filter((_, idx) => idx !== i));
              ghostCommit('delete', 'treatment_steps', step);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ step_number: steps.length + 1, title_he: '', description_he: '', how_to_start_he: '', links: [] }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              setSteps([...steps, draft]);
              ghostCommit('create', 'treatment_steps', draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת שלב חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function CommunitiesPanel() {
  const [communities, setCommunities] = useState(() => [...db.communities]);
  const [creating, setCreating] = useState(false);

  const fields = [
    { key: 'name', label: 'שם הקהילה', type: 'text' },
    { key: 'organization', label: 'ארגון מפעיל', type: 'text' },
    { key: 'description_he', label: 'תיאור', type: 'textarea' },
    { key: 'target_audience', label: 'קהל יעד', type: 'tags', options: toOptions(AUDIENCE_LABELS) },
    { key: 'location', label: 'אזור', type: 'select', options: toOptions(LOCATION_LABELS) },
    { key: 'meeting_type', label: 'סוג מפגש', type: 'select', options: toOptions(MEETING_TYPE_LABELS) },
    { key: 'contact_url', label: 'קישור ליצירת קשר', type: 'text' },
  ];

  function renderView(c) {
    return (
      <div className="pe-16">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="font-medium text-foreground">{c.name}</p>
          <div className="flex gap-1.5 flex-wrap">
            <Badge>{labelFor(MEETING_TYPE_LABELS, c.meeting_type)}</Badge>
            <Badge>{labelFor(LOCATION_LABELS, c.location)}</Badge>
            {c.target_audience?.map(a => <Badge key={a}>{labelFor(AUDIENCE_LABELS, a)}</Badge>)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{c.description_he}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {c.organization && <p className="text-xs text-muted-foreground opacity-70">{c.organization}</p>}
          {c.contact_url && (
            <a href={c.contact_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              {c.contact_url}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Section title="קהילות תמיכה" count={communities.length} />
      <div className="space-y-3">
        {communities.map((c, i) => (
          <EditableCard
            key={i}
            item={c}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              setCommunities(communities.map((it, idx) => (idx === i ? draft : it)));
              ghostCommit('update', 'communities', draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק קהילה זו?')) return;
              setCommunities(communities.filter((_, idx) => idx !== i));
              ghostCommit('delete', 'communities', c);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ name: '', organization: '', description_he: '', target_audience: [], location: 'center', meeting_type: 'frontal', contact_url: '' }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              setCommunities([...communities, draft]);
              ghostCommit('create', 'communities', draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת קהילה חדשה" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function RightsPanel() {
  const [langData, setLangData] = useState(() => ({ ...db.rights_faqs.he }));
  const categories = Object.keys(langData);
  const [cat, setCat] = useState(categories[0] || '');
  const items = langData[cat] || [];
  const [creating, setCreating] = useState(false);

  function setItems(next) {
    setLangData(prev => ({ ...prev, [cat]: next }));
  }

  const fields = [
    { key: 'q', label: 'שאלה', type: 'text' },
    { key: 'a', label: 'תשובה', type: 'richtext' },
    { key: 'steps', label: 'שלבים לביצוע', type: 'richtext' },
    { key: 'links', label: 'קישורים', type: 'links' },
  ];

  function renderView(item) {
    return (
      <div className="pe-16">
        <p className="font-medium text-foreground mb-1">{item.q}</p>
        <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: item.a }} />
        {item.steps && (
          <div className="text-xs text-muted-foreground/80 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: item.steps }} />
        )}
        {item.links?.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {item.links.map((l, j) => (
              <a key={j} href={l.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{l.label}</a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => { setCat(c); setCreating(false); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-natural ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
            {labelFor(RIGHTS_CATEGORY_LABELS, c)}
          </button>
        ))}
      </div>
      <Section title={`זכויות - ${labelFor(RIGHTS_CATEGORY_LABELS, cat)}`} count={items.length} />
      <div className="space-y-3">
        {items.map((item, i) => (
          <EditableCard
            key={i}
            item={item}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              setItems(items.map((it, idx) => (idx === i ? draft : it)));
              ghostCommit('update', `rights_faqs.he.${cat}`, draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק פריט זה?')) return;
              setItems(items.filter((_, idx) => idx !== i));
              ghostCommit('delete', `rights_faqs.he.${cat}`, item);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ q: '', a: '', steps: '', links: [] }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              setItems([...items, draft]);
              ghostCommit('create', `rights_faqs.he.${cat}`, draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת שאלה חדשה" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function SourcesPanel() {
  const [sources, setSources] = useState(() => [...db.sources]);
  const [creating, setCreating] = useState(false);
  const categoryColors = {
    research: 'bg-blue-100 text-blue-700',
    clinical: 'bg-green-100 text-green-700',
    ngo: 'bg-purple-100 text-purple-700',
    international: 'bg-orange-100 text-orange-700',
    official: 'bg-slate-100 text-slate-700',
  };

  const fields = [
    { key: 'title', label: 'כותרת', type: 'text' },
    { key: 'authors', label: 'מחברים', type: 'text' },
    { key: 'year', label: 'שנה', type: 'text' },
    { key: 'url', label: 'קישור', type: 'text' },
    { key: 'description_he', label: 'תיאור', type: 'textarea' },
    { key: 'category', label: 'קטגוריה', type: 'select', options: toOptions(SOURCE_CATEGORY_LABELS) },
  ];

  function renderView(s) {
    return (
      <div className="pe-16">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-medium text-foreground">{s.title}</p>
            <p className="text-sm text-muted-foreground">{s.authors} · {s.year}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.description_he}</p>
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 inline-block">
                {s.url}
              </a>
            )}
          </div>
          <Badge color={categoryColors[s.category] || 'bg-muted text-muted-foreground'}>{labelFor(SOURCE_CATEGORY_LABELS, s.category)}</Badge>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Section title="מקורות ומידע" count={sources.length} />
      <div className="space-y-3">
        {sources.map((s, i) => (
          <EditableCard
            key={i}
            item={s}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              setSources(sources.map((it, idx) => (idx === i ? draft : it)));
              ghostCommit('update', 'sources', draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק מקור זה?')) return;
              setSources(sources.filter((_, idx) => idx !== i));
              ghostCommit('delete', 'sources', s);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ title: '', authors: '', year: '', url: '', description_he: '', category: 'research' }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              setSources([...sources, draft]);
              ghostCommit('create', 'sources', draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת מקור חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function SecondCirclePanel() {
  const langs = Object.keys(db.second_circle_tools);
  const [lang, setLang] = useState(langs[0] || 'he');
  const [toolsByLang, setToolsByLang] = useState(() => ({ ...db.second_circle_tools }));
  const tools = toolsByLang[lang] || [];
  const [creating, setCreating] = useState(false);

  function setTools(next) {
    setToolsByLang(prev => ({ ...prev, [lang]: next }));
  }

  const fields = [
    { key: 'q', label: 'שאלה', type: 'text' },
    { key: 'intro', label: 'פתיחה', type: 'richtext' },
    { key: 'sections', label: 'סעיפים (כותרת + תוכן לכל סעיף)', type: 'sections' },
    { key: 'closing', label: 'משפט סיום (קצר, אופציונלי)', type: 'richtext' },
    { key: 'callout', label: 'תיבת אזהרה/פנייה דחופה (אופציונלי)', type: 'richtext' },
  ];

  function renderView(tool) {
    return (
      <div className="pe-16">
        <p className="font-medium text-foreground">{tool.q}</p>
        <div className="text-sm text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: tool.intro }} />
        {tool.sections?.length > 0 && (
          <p className="text-xs text-muted-foreground/70 mt-1">{tool.sections.length} סעיפים</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {langs.map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-natural ${lang === l ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
            {LANG_LABELS[l] || l}
          </button>
        ))}
      </div>
      <Section title="כלים למעגל השני" count={tools.length} />
      <div className="space-y-3">
        {tools.map((tool, i) => (
          <EditableCard
            key={i}
            item={tool}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              setTools(tools.map((t, idx) => (idx === i ? draft : t)));
              ghostCommit('update', `second_circle_tools.${lang}`, draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק פריט זה?')) return;
              setTools(tools.filter((_, idx) => idx !== i));
              ghostCommit('delete', `second_circle_tools.${lang}`, tool);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ q: '', intro: '', sections: [], closing: '', callout: '' }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              setTools([...tools, draft]);
              ghostCommit('create', `second_circle_tools.${lang}`, draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת פריט חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function ChildrenPanel() {
  const [content, setContent] = useState(() => JSON.parse(JSON.stringify(db.children_content)));
  const ageGroups = Object.keys(content);
  const [ageGroup, setAgeGroup] = useState(ageGroups[0] || '');
  const group = content[ageGroup] || {};
  const resources = group.resources || [];
  const [creating, setCreating] = useState(false);
  const [editingGuidelines, setEditingGuidelines] = useState(false);
  const [guidelinesDraft, setGuidelinesDraft] = useState(group.guidelines || '');

  function updateGroup(next) {
    setContent(prev => ({ ...prev, [ageGroup]: { ...prev[ageGroup], ...next } }));
  }

  const fields = [
    { key: 'type', label: 'סוג', type: 'select', options: toOptions(RESOURCE_TYPE_LABELS) },
    { key: 'title_he', label: 'כותרת', type: 'text' },
    { key: 'description_he', label: 'תיאור', type: 'textarea' },
    { key: 'content_he', label: 'תוכן מורחב (אופציונלי)', type: 'richtext' },
    { key: 'cta_label', label: 'טקסט כפתור פעולה (אופציונלי, למשל "לרכישת הספר")', type: 'text' },
    { key: 'cta_url', label: 'קישור כפתור הפעולה', type: 'text' },
  ];

  function renderView(r) {
    return (
      <div className="flex items-start gap-3 pe-16">
        <Badge color="bg-primary/10 text-primary">{labelFor(RESOURCE_TYPE_LABELS, r.type)}</Badge>
        <div>
          <p className="font-medium text-foreground">{r.title_he}</p>
          <p className="text-sm text-muted-foreground mt-1">{r.description_he}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {ageGroups.map(ag => (
          <button key={ag} onClick={() => { setAgeGroup(ag); setEditingGuidelines(false); setCreating(false); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-natural ${ageGroup === ag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
            {ag}
          </button>
        ))}
      </div>
      <Section title={`תכנים לגיל ${ageGroup}`} count={resources.length + (group.guidelines ? 1 : 0)} />

      <div className="relative group p-4 rounded-xl border border-primary/30 bg-primary/5 mb-3">
        <p className="text-xs font-semibold text-primary mb-2">הנחיות</p>
        {editingGuidelines ? (
          <div className="space-y-2">
            <RichTextEditor value={guidelinesDraft} onChange={setGuidelinesDraft} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  updateGroup({ guidelines: guidelinesDraft });
                  ghostCommit('update', 'children_content.guidelines', { ageGroup, guidelines: guidelinesDraft });
                  setEditingGuidelines(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90"
              >
                <Check className="w-3.5 h-3.5" /> שמירה
              </button>
              <button
                type="button"
                onClick={() => { setGuidelinesDraft(group.guidelines || ''); setEditingGuidelines(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-semibold hover:bg-border"
              >
                <X className="w-3.5 h-3.5" /> ביטול
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-foreground pe-10" dangerouslySetInnerHTML={{ __html: group.guidelines || '' }} />
            <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <IconBtn icon={Pencil} title="עריכת הנחיות" onClick={() => { setGuidelinesDraft(group.guidelines || ''); setEditingGuidelines(true); }} />
            </div>
          </>
        )}
      </div>

      <div className="space-y-3">
        {resources.map((r, i) => (
          <EditableCard
            key={i}
            item={r}
            fields={fields}
            renderView={renderView}
            onSave={draft => {
              updateGroup({ resources: resources.map((it, idx) => (idx === i ? draft : it)) });
              ghostCommit('update', `children_content.${ageGroup}`, draft);
            }}
            onDelete={() => {
              if (!window.confirm('למחוק פריט זה?')) return;
              updateGroup({ resources: resources.filter((_, idx) => idx !== i) });
              ghostCommit('delete', `children_content.${ageGroup}`, r);
            }}
          />
        ))}
        {creating && (
          <EditableCard
            item={{ type: 'book', title_he: '', description_he: '', content_he: '', cta_label: '', cta_url: '' }}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => {
              updateGroup({ resources: [...resources, draft] });
              ghostCommit('create', `children_content.${ageGroup}`, draft);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      <div className="mt-3">
        <AddNewButton label="הוספת תוכן חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function QuestionnaireSection({ section, onChange, onDelete }) {
  function updateField(key, val) {
    onChange({ ...section, [key]: val });
  }
  function updateQuestion(i, val) {
    onChange({ ...section, questions: section.questions.map((q, idx) => (idx === i ? val : q)) });
  }
  function removeQuestion(i) {
    onChange({ ...section, questions: section.questions.filter((_, idx) => idx !== i) });
    ghostCommit('delete', 'questionnaire.he.question', { section: section.title, index: i });
  }
  function addQuestion() {
    onChange({ ...section, questions: [...section.questions, ''] });
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-background">
      <div className="flex items-center gap-2 mb-3">
        <input
          value={section.icon}
          onChange={e => updateField('icon', e.target.value)}
          onBlur={() => ghostCommit('update', 'questionnaire.he.section', section)}
          className="w-12 px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-center"
        />
        <input
          value={section.title}
          onChange={e => updateField('title', e.target.value)}
          onBlur={() => ghostCommit('update', 'questionnaire.he.section', section)}
          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-semibold"
        />
        <IconBtn icon={Trash2} title="מחיקת קטגוריה" tone="danger" onClick={onDelete} />
      </div>
      <div className="space-y-2">
        {section.questions.map((question, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              value={question}
              onChange={e => updateQuestion(i, e.target.value)}
              onBlur={() => ghostCommit('update', 'questionnaire.he.section', section)}
              rows={1}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <IconBtn icon={Trash2} title="מחיקת שאלה" tone="danger" onClick={() => removeQuestion(i)} />
          </div>
        ))}
      </div>
      <button type="button" onClick={addQuestion} className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline">
        <Plus className="w-3 h-3" /> הוספת שאלה
      </button>
    </div>
  );
}

function QuestionnairePanel() {
  const [q, setQ] = useState(() => JSON.parse(JSON.stringify(db.questionnaire)));
  const [settingsDraft, setSettingsDraft] = useState({
    cutoff_score: q.cutoff_score,
    max_score: q.max_score,
    total_questions: q.total_questions,
  });

  function saveSettings() {
    setQ(prev => ({ ...prev, ...settingsDraft }));
    ghostCommit('update', 'questionnaire.settings', settingsDraft);
  }

  function updateSection(idx, next) {
    setQ(prev => ({ ...prev, he: { ...prev.he, sections: prev.he.sections.map((s, i) => (i === idx ? next : s)) } }));
  }
  function removeSection(idx) {
    if (!window.confirm('למחוק קטגוריה זו על כל שאלותיה?')) return;
    setQ(prev => {
      const removed = prev.he.sections[idx];
      ghostCommit('delete', 'questionnaire.he.section', removed);
      return { ...prev, he: { ...prev.he, sections: prev.he.sections.filter((_, i) => i !== idx) } };
    });
  }
  function addSection() {
    const blank = { icon: '🆕', title: 'קטגוריה חדשה', questions: [] };
    setQ(prev => ({ ...prev, he: { ...prev.he, sections: [...prev.he.sections, blank] } }));
    ghostCommit('create', 'questionnaire.he.section', blank);
  }

  function updateScale(idx, val) {
    setQ(prev => ({ ...prev, he: { ...prev.he, scale: prev.he.scale.map((s, i) => (i === idx ? val : s)) } }));
  }

  function updateEnQuestion(idx, val) {
    setQ(prev => ({ ...prev, en: { ...prev.en, questions: prev.en.questions.map((s, i) => (i === idx ? val : s)) } }));
  }
  function removeEnQuestion(idx) {
    setQ(prev => {
      ghostCommit('delete', 'questionnaire.en.question', prev.en.questions[idx]);
      return { ...prev, en: { ...prev.en, questions: prev.en.questions.filter((_, i) => i !== idx) } };
    });
  }
  function addEnQuestion() {
    setQ(prev => ({ ...prev, en: { ...prev.en, questions: [...prev.en.questions, ''] } }));
  }

  return (
    <div>
      <Section title="שאלון PCL-5 להערכה עצמית" count={q.total_questions} />

      <div className="p-4 rounded-xl border border-border bg-background mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">מספר שאלות</label>
          <input
            type="number"
            value={settingsDraft.total_questions}
            onChange={e => setSettingsDraft(d => ({ ...d, total_questions: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">ציון מקסימלי</label>
          <input
            type="number"
            value={settingsDraft.max_score}
            onChange={e => setSettingsDraft(d => ({ ...d, max_score: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">סף קליני (מעליו PTSD סביר)</label>
          <input
            type="number"
            value={settingsDraft.cutoff_score}
            onChange={e => setSettingsDraft(d => ({ ...d, cutoff_score: Number(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            type="button"
            onClick={saveSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90"
          >
            <Check className="w-3.5 h-3.5" /> שמירת הגדרות
          </button>
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold text-muted-foreground mb-2">סולם תשובות (עברית)</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {q.he.scale.map((label, i) => (
            <input
              key={i}
              value={label}
              onChange={e => updateScale(i, e.target.value)}
              onBlur={() => ghostCommit('update', 'questionnaire.he.scale', q.he.scale)}
              className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs text-center"
            />
          ))}
        </div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground mb-2">שאלות (עברית, מקובצות לפי נושא)</p>
      <div className="space-y-4 mb-3">
        {q.he.sections.map((section, sIdx) => (
          <QuestionnaireSection
            key={sIdx}
            section={section}
            onChange={next => updateSection(sIdx, next)}
            onDelete={() => removeSection(sIdx)}
          />
        ))}
      </div>
      <AddNewButton label="הוספת קטגוריית שאלות" onClick={addSection} />

      <p className="text-xs font-semibold text-muted-foreground mt-8 mb-2">שאלות (אנגלית, רשימה שטוחה)</p>
      <div className="space-y-2 mb-3">
        {q.en.questions.map((question, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-xs text-muted-foreground/60 mt-2.5 w-5 flex-shrink-0">{i + 1}.</span>
            <textarea
              value={question}
              onChange={e => updateEnQuestion(i, e.target.value)}
              onBlur={() => ghostCommit('update', 'questionnaire.en.question', question)}
              rows={1}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <IconBtn icon={Trash2} title="מחיקה" tone="danger" onClick={() => removeEnQuestion(i)} />
          </div>
        ))}
      </div>
      <AddNewButton label="הוספת שאלה באנגלית" onClick={addEnQuestion} />
    </div>
  );
}

const PANELS = {
  ptsd_faqs:     <PTSDFaqsPanel />,
  self_help:     <SelfHelpPanel />,
  treatment:     <TreatmentPanel />,
  communities:   <CommunitiesPanel />,
  rights:        <RightsPanel />,
  sources:       <SourcesPanel />,
  second_circle: <SecondCirclePanel />,
  children:      <ChildrenPanel />,
  questionnaire: <QuestionnairePanel />,
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('ptsd_faqs');

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground">ממשק ניהול תוכן</h1>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-semibold hover:bg-border transition-natural"
            >
              <LogOut className="w-3.5 h-3.5" /> התנתקות
            </button>
          </div>
          <p className="text-muted-foreground text-sm">עריכה, הוספה ומחיקה של תוכן · שינויים אינם נשמרים עדיין לשרת (אין חיבור ל-backend)</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-super-sm text-sm font-medium transition-natural ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-card rounded-super border border-border p-6 shadow-card">
          {PANELS[activeTab]}
        </div>
      </div>
    </div>
  );
}
