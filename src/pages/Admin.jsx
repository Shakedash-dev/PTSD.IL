import React, { useState, useEffect } from 'react';
import { Settings, Users, UserCog, KeyRound, FileText, BookOpen, HelpCircle, Wrench, Heart, Baby, Shield, ClipboardList, Pencil, Trash2, Plus, Check, X, LogOut, Info } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/data/db';
import RichTextEditor from '@/components/RichTextEditor';
import { logout, hasAdminAccess, hasUserManagementAccess, getCurrentUserId } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { ForbiddenError, UnauthorizedError } from '@/api/adminClient';
import {
  loadPtsdFaq, savePtsdFaq, removePtsdFaq,
  loadRightsFaq, saveRightsFaq, removeRightsFaq,
  loadSecondCircle, saveSecondCircle, removeSecondCircle,
  loadSelfHelp, saveSelfHelp, removeSelfHelp,
  loadTreatment, saveTreatment, removeTreatment,
  loadSource, saveSource, removeSource,
  loadCommunity, saveCommunity, removeCommunity,
  loadChildrenGuidelines, saveChildrenGuidelines,
  loadChildrenResource, saveChildrenResource, removeChildrenResource,
} from '@/api/adminSource';
import { listUsers, createUser, updateUserRoles, updateUserPassword, deleteUser } from '@/api/adminUsers';

// Runs a create/update/delete call against adminSource, converting the admin
// client's typed errors (src/api/adminClient.js) into a toast instead of
// letting the panel crash. Returns true on success, false on a handled
// failure (ForbiddenError or any other error) so callers can decide whether
// to close the edit form / refresh the list. UnauthorizedError is re-thrown -
// adminApi() has already dropped the session and fired AUTH_CHANGE_EVENT, so
// the /admin route guard (src/App.jsx's AdminGate) swaps to the login screen
// on its own; there's nothing else to do here besides not pretending the
// write succeeded.
async function runWrite(action) {
  try {
    await action();
    return true;
  } catch (err) {
    if (err instanceof ForbiddenError) {
      toast.error('אין לך הרשאה לבצע פעולה זו');
      return false;
    }
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    toast.error(err?.message || 'אירעה שגיאה. נסו שוב.');
    return false;
  }
}

function LoadingRow() {
  return <p className="text-sm text-muted-foreground py-6 text-center">טוען...</p>;
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
// Valid roles per docs/api.md §"Users" - exact-match, masteradmin is not
// implicitly any of the others.
const ROLE_LABELS = {
  masteradmin: 'מנהל-על',
  admin: 'מנהל תוכן',
  moderator: 'מנחה',
  viewer: 'צופה',
};
const ROLE_BADGE_COLORS = {
  masteradmin: 'bg-red-100 text-red-700',
  admin: 'bg-blue-100 text-blue-700',
  moderator: 'bg-purple-100 text-purple-700',
  viewer: 'bg-muted text-muted-foreground',
};

// Rights categories are audience buckets - order/keys mirror the panel's
// category tabs. adminSource's loadRightsFaq/saveRightsFaq accept either
// underscore or hyphen (they normalize internally), so these keys are passed
// straight through as `audienceSlug`.
const RIGHTS_CATEGORIES = Object.keys(RIGHTS_CATEGORY_LABELS);

// Children content age-group slugs (must match the API's /age-groups taxonomy).
const AGE_GROUPS = ['0-4', '4-6', '7-10', '10-13', '14-16', '16+'];

function labelFor(map, key) {
  return map[key] || key;
}
function toOptions(map) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

// Content CRUD tabs - shown to admin/moderator (hasAdminAccess()).
const CONTENT_TABS = [
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

// User-management tab - shown ONLY to masteradmin (hasUserManagementAccess()).
const USERS_TAB = { key: 'users', label: 'ניהול משתמשים', icon: UserCog };

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
    case 'password':
      return (
        <input
          type="password"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          autoComplete="new-password"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      );
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

// Generic view/edit card used by every content list below. `onSave` may be
// async and return `false` to indicate a handled failure (e.g. a write that
// was rejected) - in that case the card stays in edit mode with the user's
// draft intact instead of silently closing as if the save had gone through.
// `onDelete` omitted means the card can't be deleted (not used currently, but
// supported).
function EditableCard({ item, fields, onSave, onCancel, onDelete, renderView, startInEdit = false }) {
  const [editing, setEditing] = useState(startInEdit);
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);

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

  async function handleSave() {
    setSaving(true);
    const result = await onSave(draft);
    setSaving(false);
    if (result !== false) setEditing(false);
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
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
        >
          <Check className="w-3.5 h-3.5" /> {saving ? 'שומר...' : 'שמירה'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => { setDraft(item); setEditing(false); onCancel && onCancel(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-semibold hover:bg-border disabled:opacity-60"
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
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload(targetLang = lang) {
    setLoading(true);
    try {
      setFaqs(await loadPtsdFaq({ lang: targetLang }));
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת השאלות');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(lang); }, [lang]);

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
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {faqs.map(faq => (
            <EditableCard
              key={faq.id}
              item={faq}
              fields={fields}
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => savePtsdFaq(draft, { lang }));
                if (ok) await reload(lang);
                return ok;
              }}
              onDelete={async () => {
                if (!window.confirm('למחוק שאלה זו?')) return;
                const ok = await runWrite(() => removePtsdFaq(faq.id));
                if (ok) await reload(lang);
              }}
            />
          ))}
          {creating && (
            <EditableCard
              item={{ q: '', a: '' }}
              fields={fields}
              startInEdit
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => savePtsdFaq(draft, { lang }));
                if (ok) {
                  setCreating(false);
                  await reload(lang);
                }
                return ok;
              }}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת שאלה חדשה" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function SelfHelpPanel() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setTools(await loadSelfHelp());
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת הכלים');
      setTools([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

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
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {tools.map(tool => (
            <EditableCard
              key={tool.id}
              item={tool}
              fields={fields}
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveSelfHelp(draft));
                if (ok) await reload();
                return ok;
              }}
              onDelete={async () => {
                if (!window.confirm('למחוק כלי זה?')) return;
                const ok = await runWrite(() => removeSelfHelp(tool.id));
                if (ok) await reload();
              }}
            />
          ))}
          {creating && (
            <EditableCard
              item={{ category: 'sleep', title_he: '', content_he: '' }}
              fields={fields}
              startInEdit
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveSelfHelp(draft));
                if (ok) {
                  setCreating(false);
                  await reload();
                }
                return ok;
              }}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת כלי חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function TreatmentPanel() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setSteps(await loadTreatment());
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת שלבי הטיפול');
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

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
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {steps.map(step => (
            <EditableCard
              key={step.id}
              item={step}
              fields={fields}
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveTreatment(draft));
                if (ok) await reload();
                return ok;
              }}
              onDelete={async () => {
                if (!window.confirm('למחוק שלב זה?')) return;
                const ok = await runWrite(() => removeTreatment(step.id));
                if (ok) await reload();
              }}
            />
          ))}
          {creating && (
            <EditableCard
              item={{ step_number: steps.length + 1, title_he: '', description_he: '', how_to_start_he: '', links: [] }}
              fields={fields}
              startInEdit
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveTreatment(draft));
                if (ok) {
                  setCreating(false);
                  await reload();
                }
                return ok;
              }}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת שלב חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function CommunitiesPanel() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setCommunities(await loadCommunity());
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת הקהילות');
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

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
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {communities.map(c => (
            <EditableCard
              key={c.id}
              item={c}
              fields={fields}
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveCommunity(draft));
                if (ok) await reload();
                return ok;
              }}
              onDelete={async () => {
                if (!window.confirm('למחוק קהילה זו?')) return;
                const ok = await runWrite(() => removeCommunity(c.id));
                if (ok) await reload();
              }}
            />
          ))}
          {creating && (
            <EditableCard
              item={{ name: '', organization: '', description_he: '', target_audience: [], location: 'center', meeting_type: 'frontal', contact_url: '' }}
              fields={fields}
              startInEdit
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveCommunity(draft));
                if (ok) {
                  setCreating(false);
                  await reload();
                }
                return ok;
              }}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת קהילה חדשה" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function RightsPanel() {
  const [cat, setCat] = useState(RIGHTS_CATEGORIES[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload(targetCat = cat) {
    setLoading(true);
    try {
      setItems(await loadRightsFaq({ lang: 'he', audienceSlug: targetCat }));
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת הזכויות');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(cat); }, [cat]);

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
        {RIGHTS_CATEGORIES.map(c => (
          <button key={c} onClick={() => { setCat(c); setCreating(false); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-natural ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
            {labelFor(RIGHTS_CATEGORY_LABELS, c)}
          </button>
        ))}
      </div>
      <Section title={`זכויות - ${labelFor(RIGHTS_CATEGORY_LABELS, cat)}`} count={items.length} />
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <EditableCard
              key={item.id}
              item={item}
              fields={fields}
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveRightsFaq(draft, { lang: 'he', audienceSlug: cat }));
                if (ok) await reload(cat);
                return ok;
              }}
              onDelete={async () => {
                if (!window.confirm('למחוק פריט זה?')) return;
                const ok = await runWrite(() => removeRightsFaq(item.id));
                if (ok) await reload(cat);
              }}
            />
          ))}
          {creating && (
            <EditableCard
              item={{ q: '', a: '', steps: '', links: [] }}
              fields={fields}
              startInEdit
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveRightsFaq(draft, { lang: 'he', audienceSlug: cat }));
                if (ok) {
                  setCreating(false);
                  await reload(cat);
                }
                return ok;
              }}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת שאלה חדשה" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function SourcesPanel() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const categoryColors = {
    research: 'bg-blue-100 text-blue-700',
    clinical: 'bg-green-100 text-green-700',
    ngo: 'bg-purple-100 text-purple-700',
    international: 'bg-orange-100 text-orange-700',
    official: 'bg-slate-100 text-slate-700',
  };

  async function reload() {
    setLoading(true);
    try {
      setSources(await loadSource());
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת המקורות');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

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
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {sources.map(s => (
            <EditableCard
              key={s.id}
              item={s}
              fields={fields}
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveSource(draft));
                if (ok) await reload();
                return ok;
              }}
              onDelete={async () => {
                if (!window.confirm('למחוק מקור זה?')) return;
                const ok = await runWrite(() => removeSource(s.id));
                if (ok) await reload();
              }}
            />
          ))}
          {creating && (
            <EditableCard
              item={{ title: '', authors: '', year: '', url: '', description_he: '', category: 'research' }}
              fields={fields}
              startInEdit
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveSource(draft));
                if (ok) {
                  setCreating(false);
                  await reload();
                }
                return ok;
              }}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת מקור חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function SecondCirclePanel() {
  const langs = ['he', 'ar', 'en'];
  const [lang, setLang] = useState('he');
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload(targetLang = lang) {
    setLoading(true);
    try {
      setTools(await loadSecondCircle({ lang: targetLang }));
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת התכנים');
      setTools([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(lang); }, [lang]);

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
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {tools.map(tool => (
            <EditableCard
              key={tool.id}
              item={tool}
              fields={fields}
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveSecondCircle(draft, { lang }));
                if (ok) await reload(lang);
                return ok;
              }}
              onDelete={async () => {
                if (!window.confirm('למחוק פריט זה?')) return;
                const ok = await runWrite(() => removeSecondCircle(tool.id));
                if (ok) await reload(lang);
              }}
            />
          ))}
          {creating && (
            <EditableCard
              item={{ q: '', intro: '', sections: [], closing: '', callout: '' }}
              fields={fields}
              startInEdit
              renderView={renderView}
              onSave={async draft => {
                const ok = await runWrite(() => saveSecondCircle(draft, { lang }));
                if (ok) {
                  setCreating(false);
                  await reload(lang);
                }
                return ok;
              }}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת פריט חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

function ChildrenPanel() {
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0]);
  const [guidelinesItem, setGuidelinesItem] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingGuidelines, setEditingGuidelines] = useState(false);
  const [guidelinesDraft, setGuidelinesDraft] = useState('');

  async function reload(targetAgeGroup = ageGroup) {
    setLoading(true);
    try {
      const [guidelines, res] = await Promise.all([
        loadChildrenGuidelines({ ageGroupSlug: targetAgeGroup }),
        loadChildrenResource({ ageGroupSlug: targetAgeGroup }),
      ]);
      setGuidelinesItem(guidelines);
      setGuidelinesDraft(guidelines?.guidelines || '');
      setResources(res);
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת התכנים לילדים');
      setGuidelinesItem(null);
      setGuidelinesDraft('');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(ageGroup); }, [ageGroup]);

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

  async function handleSaveGuidelines() {
    const draft = { ...(guidelinesItem || {}), guidelines: guidelinesDraft };
    const ok = await runWrite(() => saveChildrenGuidelines(draft, { ageGroupSlug: ageGroup }));
    if (ok) {
      setEditingGuidelines(false);
      await reload(ageGroup);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {AGE_GROUPS.map(ag => (
          <button key={ag} onClick={() => { setAgeGroup(ag); setEditingGuidelines(false); setCreating(false); }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-natural ${ageGroup === ag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
            {ag}
          </button>
        ))}
      </div>
      <Section title={`תכנים לגיל ${ageGroup}`} count={resources.length + (guidelinesItem?.guidelines ? 1 : 0)} />

      {loading ? (
        <LoadingRow />
      ) : (
        <>
          <div className="relative group p-4 rounded-xl border border-primary/30 bg-primary/5 mb-3">
            <p className="text-xs font-semibold text-primary mb-2">הנחיות</p>
            {editingGuidelines ? (
              <div className="space-y-2">
                <RichTextEditor value={guidelinesDraft} onChange={setGuidelinesDraft} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveGuidelines}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90"
                  >
                    <Check className="w-3.5 h-3.5" /> שמירה
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGuidelinesDraft(guidelinesItem?.guidelines || ''); setEditingGuidelines(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-semibold hover:bg-border"
                  >
                    <X className="w-3.5 h-3.5" /> ביטול
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-foreground pe-10" dangerouslySetInnerHTML={{ __html: guidelinesItem?.guidelines || '' }} />
                <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconBtn icon={Pencil} title="עריכת הנחיות" onClick={() => { setGuidelinesDraft(guidelinesItem?.guidelines || ''); setEditingGuidelines(true); }} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            {resources.map(r => (
              <EditableCard
                key={r.id}
                item={r}
                fields={fields}
                renderView={renderView}
                onSave={async draft => {
                  const ok = await runWrite(() => saveChildrenResource(draft, { ageGroupSlug: ageGroup }));
                  if (ok) await reload(ageGroup);
                  return ok;
                }}
                onDelete={async () => {
                  if (!window.confirm('למחוק פריט זה?')) return;
                  const ok = await runWrite(() => removeChildrenResource(r.id));
                  if (ok) await reload(ageGroup);
                }}
              />
            ))}
            {creating && (
              <EditableCard
                item={{ type: 'book', title_he: '', description_he: '', content_he: '', cta_label: '', cta_url: '' }}
                fields={fields}
                startInEdit
                renderView={renderView}
                onSave={async draft => {
                  const ok = await runWrite(() => saveChildrenResource(draft, { ageGroupSlug: ageGroup }));
                  if (ok) {
                    setCreating(false);
                    await reload(ageGroup);
                  }
                  return ok;
                }}
                onCancel={() => setCreating(false)}
              />
            )}
          </div>
          <div className="mt-3">
            <AddNewButton label="הוספת תוכן חדש" onClick={() => setCreating(true)} />
          </div>
        </>
      )}
    </div>
  );
}

// Single user row: view (name/email/phone/roles/created date) + two
// independent inline edit affordances (roles, password reset) + delete.
// Roles/password edits don't reuse EditableCard (which edits one flat set of
// fields at once) since these are two separate actions with separate save
// buttons, not one combined "edit this record" form.
function UserRow({ user, currentUserId, onReload }) {
  const [editingRoles, setEditingRoles] = useState(false);
  const [rolesDraft, setRolesDraft] = useState(user.roles);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const isSelf = user.id === currentUserId;

  async function handleSaveRoles() {
    if (!rolesDraft.length) {
      toast.error('יש לבחור לפחות תפקיד אחד');
      return;
    }
    setSaving(true);
    const ok = await runWrite(() => updateUserRoles(user.id, rolesDraft));
    setSaving(false);
    if (ok) {
      setEditingRoles(false);
      await onReload();
    }
  }

  async function handleSavePassword() {
    if (passwordDraft.length < 8) {
      toast.error('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }
    setSaving(true);
    const ok = await runWrite(() => updateUserPassword(user.id, passwordDraft));
    setSaving(false);
    if (ok) {
      toast.success('הסיסמה עודכנה בהצלחה');
      setResettingPassword(false);
      setPasswordDraft('');
    }
  }

  async function handleDelete() {
    if (isSelf) return; // button hidden below; guard kept in case currentUserId is ever stale
    if (!window.confirm(`למחוק את המשתמש ${user.firstName} ${user.lastName}?`)) return;
    setSaving(true);
    const ok = await runWrite(() => deleteUser(user.id));
    setSaving(false);
    if (ok) await onReload();
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-background space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
            {isSelf && <Badge color="bg-primary/10 text-primary">זה אתה</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email || 'ללא אימייל'}</p>
          {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
          <p className="text-xs text-muted-foreground/70 mt-1">
            נוצר ב-{new Date(user.createdAt).toLocaleDateString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn
            icon={Pencil}
            title="עריכת תפקידים"
            onClick={() => { setRolesDraft(user.roles); setResettingPassword(false); setEditingRoles(v => !v); }}
          />
          <IconBtn
            icon={KeyRound}
            title="איפוס סיסמה"
            onClick={() => { setPasswordDraft(''); setEditingRoles(false); setResettingPassword(v => !v); }}
          />
          {!isSelf && <IconBtn icon={Trash2} title="מחיקה" tone="danger" onClick={handleDelete} />}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {user.roles.map(r => (
          <Badge key={r} color={ROLE_BADGE_COLORS[r] || 'bg-muted text-muted-foreground'}>
            {labelFor(ROLE_LABELS, r)}
          </Badge>
        ))}
      </div>

      {editingRoles && (
        <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">תפקידים</label>
          <FieldInput
            field={{ type: 'tags', options: toOptions(ROLE_LABELS) }}
            value={rolesDraft}
            onChange={setRolesDraft}
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveRoles}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" /> {saving ? 'שומר...' : 'שמירה'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setEditingRoles(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-semibold hover:bg-border disabled:opacity-60"
            >
              <X className="w-3.5 h-3.5" /> ביטול
            </button>
          </div>
        </div>
      )}

      {resettingPassword && (
        <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
          <label className="text-xs font-semibold text-muted-foreground block">סיסמה חדשה (לפחות 8 תווים)</label>
          <input
            type="password"
            value={passwordDraft}
            onChange={e => setPasswordDraft(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleSavePassword}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" /> {saving ? 'מעדכן...' : 'עדכון סיסמה'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => { setResettingPassword(false); setPasswordDraft(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-semibold hover:bg-border disabled:opacity-60"
            >
              <X className="w-3.5 h-3.5" /> ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Users panel - masteradmin only (gated in the Admin() tab bar below, not
// here; this component simply assumes it's allowed to be mounted).
function UsersPanel() {
  const currentUserId = getCurrentUserId();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת המשתמשים');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const createFields = [
    { key: 'firstName', label: 'שם פרטי', type: 'text' },
    { key: 'lastName', label: 'שם משפחה', type: 'text' },
    { key: 'email', label: 'אימייל', type: 'text' },
    { key: 'password', label: 'סיסמה (לפחות 8 תווים)', type: 'password' },
    { key: 'phone', label: 'טלפון (אופציונלי)', type: 'text' },
    { key: 'roles', label: 'תפקידים', type: 'tags', options: toOptions(ROLE_LABELS) },
  ];

  async function handleCreateUser(draft) {
    if (!draft.firstName || !draft.lastName || !draft.email) {
      toast.error('יש למלא שם פרטי, שם משפחה ואימייל');
      return false;
    }
    if (!draft.password || draft.password.length < 8) {
      toast.error('הסיסמה חייבת להכיל לפחות 8 תווים');
      return false;
    }
    const payload = {
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      password: draft.password,
      ...(draft.phone ? { phone: draft.phone } : {}),
      roles: draft.roles?.length ? draft.roles : ['viewer'],
    };
    const ok = await runWrite(() => createUser(payload));
    if (ok) {
      setCreating(false);
      await reload();
    }
    return ok;
  }

  return (
    <div>
      <Section title="ניהול משתמשים" count={users.length} />
      {loading ? (
        <LoadingRow />
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <UserRow key={u.id} user={u} currentUserId={currentUserId} onReload={reload} />
          ))}
          {creating && (
            <EditableCard
              item={{ firstName: '', lastName: '', email: '', password: '', phone: '', roles: ['viewer'] }}
              fields={createFields}
              startInEdit
              renderView={() => null}
              onSave={handleCreateUser}
              onCancel={() => setCreating(false)}
            />
          )}
        </div>
      )}
      <div className="mt-3">
        <AddNewButton label="הוספת משתמש חדש" onClick={() => setCreating(true)} />
      </div>
    </div>
  );
}

// No API endpoint exists for the PCL-5 questionnaire (see src/api/adminSource.js -
// it has no loadQuestionnaire/saveQuestionnaire). This panel is therefore
// read-only: it still renders the static content so admins can see what's
// live, but every edit/add/delete control has been removed.
function QuestionnairePanel() {
  const q = db.questionnaire;

  return (
    <div>
      <Section title="שאלון PCL-5 להערכה עצמית" count={q.total_questions} />

      <div className="flex items-start gap-2 p-4 rounded-xl border border-amber-300/60 bg-amber-50 text-amber-900 mb-5">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">{t('he', 'admin_questionnaire_readonly')}</p>
      </div>

      <div className="p-4 rounded-xl border border-border bg-background mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">מספר שאלות</label>
          <input
            type="number"
            value={q.total_questions}
            disabled
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">ציון מקסימלי</label>
          <input
            type="number"
            value={q.max_score}
            disabled
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">סף קליני (מעליו PTSD סביר)</label>
          <input
            type="number"
            value={q.cutoff_score}
            disabled
            readOnly
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground"
          />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs font-semibold text-muted-foreground mb-2">סולם תשובות (עברית)</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {q.he.scale.map((label, i) => (
            <div key={i} className="px-2 py-1.5 rounded-lg border border-border bg-muted text-xs text-center text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs font-semibold text-muted-foreground mb-2">שאלות (עברית, מקובצות לפי נושא)</p>
      <div className="space-y-4 mb-3">
        {q.he.sections.map((section, sIdx) => (
          <div key={sIdx} className="p-4 rounded-xl border border-border bg-background">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-12 px-2 py-1.5 rounded-lg border border-border bg-muted text-sm text-center">{section.icon}</span>
              <p className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-muted text-sm font-semibold text-foreground">{section.title}</p>
            </div>
            <div className="space-y-2">
              {section.questions.map((question, i) => (
                <p key={i} className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-foreground">{question}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-muted-foreground mt-8 mb-2">שאלות (אנגלית, רשימה שטוחה)</p>
      <div className="space-y-2 mb-3">
        {q.en.questions.map((question, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-xs text-muted-foreground/60 mt-2.5 w-5 flex-shrink-0">{i + 1}.</span>
            <p className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-sm text-foreground">{question}</p>
          </div>
        ))}
      </div>
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
  users:         <UsersPanel />,
};

export default function Admin() {
  // Tab visibility mirrors the two independent, exact-match role checks in
  // src/lib/auth.js: content tabs need admin/moderator, the Users tab needs
  // masteradmin. AdminGate (src/App.jsx) already guarantees at least one of
  // these is true for anyone who reaches this component, so `tabs` below is
  // never empty.
  const showContent = hasAdminAccess();
  const showUsers = hasUserManagementAccess();
  const tabs = [...(showContent ? CONTENT_TABS : []), ...(showUsers ? [USERS_TAB] : [])];

  const [activeTab, setActiveTab] = useState(() => tabs[0]?.key);

  // Defensive guard: if activeTab ever points at a tab this user can't see
  // (e.g. role claims changed underneath us), fall back to the first visible
  // tab instead of rendering nothing / a hidden panel.
  useEffect(() => {
    if (tabs.length && !tabs.some(tab => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground">ממשק ניהול</h1>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-semibold hover:bg-border transition-natural"
            >
              <LogOut className="w-3.5 h-3.5" /> התנתקות
            </button>
          </div>
          <p className="text-muted-foreground text-sm">עריכה, הוספה ומחיקה של תוכן · השינויים נשמרים ישירות מול השרת (למעט שאלון ה-PCL-5, שעריכתו אינה זמינה עדיין)</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
          {tabs.map(tab => {
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
