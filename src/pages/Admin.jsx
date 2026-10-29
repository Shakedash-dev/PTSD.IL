import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Users, UserCog, FileText, BookOpen, HelpCircle, Wrench, Heart, Baby, Shield, ClipboardList, MessageCircle, Pencil, Trash2, Plus, Check, X, ChevronUp, ChevronDown, Info, History } from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import ChoiceChip from '@/components/patterns/ChoiceChip';
import AdminGuide from '@/components/admin/AdminGuide';
import EditLogPanel from '@/components/admin/EditLogPanel';
import { AddNewButton, Badge, DiscardButton, IconBtn, LoadingRow, Section, STATUS_BADGES } from '@/components/admin/AdminUi';
import { AdminLangProvider, LanguageTabs, useAdminLang } from '@/components/admin/AdminLang';
import { MetivContentView } from '@/components/admin/MetivAdmin';
import { revealElement, useAdminFocus } from '@/components/admin/AdminFocus';
import ChatbotQaPanel, { QA_SCOPE, QA_SECTION } from '@/components/admin/ChatbotQaAdmin';
import { SaveAllBar, fieldsDiff, runWrite, usePendingChanges } from '@/components/admin/PendingChanges';
import { stageSiblingDeletes, useStageTranslations } from '@/components/admin/translationStaging';
import { hasAdminAccess, hasUserManagementAccess, getCurrentUserId } from '@/lib/auth';
import {
  loadPtsdFaq, savePtsdFaq, removePtsdFaq, buildPtsdFaq,
  loadRightsFaq, saveRightsFaq, removeRightsFaq, buildRightsFaq,
  loadSecondCircle, saveSecondCircle, removeSecondCircle, buildSecondCircle,
  loadSelfHelp, saveSelfHelp, removeSelfHelp, buildSelfHelp,
  loadTreatment, saveTreatment, removeTreatment, buildTreatment,
  loadSource, saveSource, removeSource, buildSource,
  loadCommunity, saveCommunity, removeCommunity,
  loadChildrenGuidelines, saveChildrenGuidelines, buildChildrenGuidelines,
  loadChildrenResource, saveChildrenResource, removeChildrenResource, buildChildrenResource,
  loadQuestionnaires, loadQuestionnaireDetail,
  createQuestionnaire, updateQuestionnaire, removeQuestionnaire,
  addQuestion, updateQuestion, removeQuestion,
  loadArticleSiblings, writeArticleSibling,
} from '@/api/adminSource';
import { listUsers, createUser, updateUserRoles, deleteUser } from '@/api/adminUsers';
import { AREA_LABELS } from '@/pages/metiv-demos/v3/content/registry';

// /admin (and /metiv-site-demo-v3/admin, the `metiv` variant). Every content
// panel below edits through the staged-changes layer in
// src/components/admin/PendingChanges.jsx: "אישור" stages, and the only write
// path is the save-all review dialog. User management is the exception - role
// and account changes write immediately (they are access control, not site
// content, and are not part of the edit log).
//
// Every panel edits the language picked in the tabs at the top (AdminLang.jsx).
// A Hebrew edit of an article-backed panel also stages its AI translations into
// the other four languages (translationStaging.js); an edit in another tab
// writes only that language's row, stamped as edited by hand.

// ─── Hebrew label maps for values that are stored in English internally (filter
// keys, category ids, etc.) so admins never see raw English tokens. ──────────
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
  masteradmin: 'bg-destructive/10 text-destructive',
  admin: 'bg-info/10 text-info',
  moderator: 'bg-primary/10 text-primary',
  viewer: 'bg-muted text-muted-foreground',
};

// Only these two roles are assignable in the UI (create form + role edit).
// The full ROLE_LABELS/ROLE_BADGE_COLORS above are still used to DISPLAY any
// role an existing user might already have (e.g. moderator/viewer).
const ASSIGNABLE_ROLE_LABELS = {
  admin: ROLE_LABELS.admin,
  masteradmin: ROLE_LABELS.masteradmin,
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

// Backend requires a random-strength password (min 8) even though login is
// Google-only and the password is never used. Generate one so the create form
// doesn't need a password field. Uses the Web Crypto API (browser runtime).
function generatePassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const base = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '');
  return base.slice(0, 20) + 'Aa1!';
}

// Backend requires firstName AND lastName separately, but the UI collects a
// single "name". Split on the first whitespace run; a single-word name gets a
// "-" placeholder lastName (backend requires min 1 char).
function splitName(name) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '-';
  return { firstName, lastName };
}

// Display name joining firstName/lastName, hiding the "-" placeholder lastName.
function displayName(user) {
  return [user.firstName, user.lastName].filter(n => n && n !== '-').join(' ');
}

// The editable site pages, in the order the panel shows them, then the
// chatbot's curated Q&A (`shared`: the chatbot serves both sites, so the Metiv
// variant lists it under a heading of its own). Site copy and the legal
// documents are deliberately NOT here: /admin does not edit them. The Metiv
// admin edits the content i18n texts as site-copy override rows on its own
// pages (MetivAdmin.jsx); the public site honours any override row
// (src/api/source.js fetchSiteCopy/fetchLegalDoc).
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
  { key: QA_SCOPE,        label: QA_SECTION,           icon: MessageCircle, shared: true },
];

// masteradmin-only sections (hasUserManagementAccess()).
const USERS_VIEW = { key: 'users', label: 'ניהול משתמשים', icon: UserCog };
const LOG_VIEW = { key: 'log', label: 'יומן עריכות', icon: History };

// Which admin the panels render in. The Metiv admin shows content only (owner
// rule, 2026-10-29): it hides the PTSD-IL panels' format and technical fields -
// the treatment step number, the children resources' button caption, the
// questionnaire's name (its page h1), slug, order, active flag, scores and
// cutoff - and the questionnaire's structure (adding or removing
// questionnaires, questions and answers). /admin keeps them all.
const AdminVariantContext = createContext(/** @type {'ptsd'|'metiv'} */ ('ptsd'));

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
          <Button type="button" variant="quiet" size="none" onClick={() => removeLink(i)} className="hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="link" size="none" onClick={addLink} className="text-xs gap-1">
        <Plus className="w-3 h-3" /> הוספת קישור
      </Button>
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
            <Button type="button" variant="quiet" size="none" onClick={() => removeSection(i)} className="hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <RichTextEditor value={s.body} onChange={val => updateSection(i, 'body', val)} />
        </div>
      ))}
      <Button type="button" variant="link" size="none" onClick={addSection} className="text-xs gap-1">
        <Plus className="w-3 h-3" /> הוספת סעיף
      </Button>
    </div>
  );
}

// Repeatable treatment-method editor. A treatment step (steps 3 and 4 on the
// public page) offers several therapies, each rendered as its own accordion by
// src/pages/Treatment.jsx's MethodAccordion. Each one carries a title, a plain
// description, a rich "how to start" body and its own links - so it gets the
// same structured controls as the step itself rather than being flattened into
// the step's text.
function MethodsField({ value, onChange }) {
  const methods = value || [];
  function updateMethod(i, key, val) {
    onChange(methods.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)));
  }
  function removeMethod(i) {
    onChange(methods.filter((_, idx) => idx !== i));
  }
  function addMethod() {
    onChange([...methods, { title_he: '', description_he: '', how_to_start_he: '', links: [] }]);
  }
  function move(i, delta) {
    const target = i + delta;
    if (target < 0 || target >= methods.length) return;
    const next = methods.slice();
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }
  return (
    <div className="space-y-3">
      {methods.map((m, i) => (
        <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              value={m.title_he || ''}
              onChange={e => updateMethod(i, 'title_he', e.target.value)}
              placeholder="שם השיטה"
              className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-sm font-medium"
            />
            <Button type="button" variant="quiet" size="none" onClick={() => move(i, -1)} disabled={i === 0} title="הזזה למעלה" className="disabled:opacity-30">
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="quiet" size="none" onClick={() => move(i, 1)} disabled={i === methods.length - 1} title="הזזה למטה" className="disabled:opacity-30">
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="quiet" size="none" onClick={() => removeMethod(i)} title="מחיקת שיטה" className="hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">תיאור</label>
            <textarea
              value={m.description_he || ''}
              onChange={e => updateMethod(i, 'description_he', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm leading-relaxed"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">איך מתחילים</label>
            <RichTextEditor value={m.how_to_start_he} onChange={val => updateMethod(i, 'how_to_start_he', val)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">קישורים</label>
            <LinksField value={m.links} onChange={val => updateMethod(i, 'links', val)} />
          </div>
        </div>
      ))}
      <Button type="button" variant="link" size="none" onClick={addMethod} className="text-xs gap-1">
        <Plus className="w-3 h-3" /> הוספת שיטת טיפול
      </Button>
    </div>
  );
}

// Repeatable app editor for a self-help tool ("אפליקציות מומלצות"): each app
// has a name, a description and its App Store / Google Play links, rendered as
// a card on the self-help page. Stored in the tool row's content as `apps`.
function AppsField({ value, onChange }) {
  const apps = value || [];
  const update = (i, key, val) => onChange(apps.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)));
  const remove = i => onChange(apps.filter((_, idx) => idx !== i));
  const add = () => onChange([...apps, { title: '', description: '', ios_url: '', android_url: '' }]);
  function move(i, delta) {
    const target = i + delta;
    if (target < 0 || target >= apps.length) return;
    const next = apps.slice();
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }
  const input = 'w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm';
  return (
    <div className="space-y-3">
      {apps.map((a, i) => (
        <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              value={a.title || ''}
              onChange={e => update(i, 'title', e.target.value)}
              placeholder="שם האפליקציה"
              aria-label={`שם האפליקציה ${i + 1}`}
              className={`flex-1 ${input} font-medium`}
            />
            <Button type="button" variant="quiet" size="none" onClick={() => move(i, -1)} disabled={i === 0} title="הזזה למעלה" className="disabled:opacity-30">
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="quiet" size="none" onClick={() => move(i, 1)} disabled={i === apps.length - 1} title="הזזה למטה" className="disabled:opacity-30">
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="quiet" size="none" onClick={() => remove(i)} title="הסרת אפליקציה" className="hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1" htmlFor={`app-${i}-description`}>תיאור</label>
            <textarea
              id={`app-${i}-description`}
              value={a.description || ''}
              onChange={e => update(i, 'description', e.target.value)}
              rows={2}
              className={`${input} leading-relaxed`}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1" htmlFor={`app-${i}-ios`}>קישור ל-App Store</label>
              <input id={`app-${i}-ios`} dir="ltr" value={a.ios_url || ''} onChange={e => update(i, 'ios_url', e.target.value)} className={input} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1" htmlFor={`app-${i}-android`}>קישור ל-Google Play</label>
              <input id={`app-${i}-android`} dir="ltr" value={a.android_url || ''} onChange={e => update(i, 'android_url', e.target.value)} className={input} />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="link" size="none" onClick={add} className="text-xs gap-1">
        <Plus className="w-3 h-3" /> הוספת אפליקציה
      </Button>
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
              <ChoiceChip
                key={o.value}
                variant="plain"
                selected={active}
                onClick={() => onChange(active ? arr.filter(v => v !== o.value) : [...arr, o.value])}
                className={`px-2.5 py-1 rounded-full text-xs ${active ? '' : 'bg-muted hover:bg-border'}`}
              >
                {o.label}
              </ChoiceChip>
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
    case 'methods':
      return <MethodsField value={value} onChange={onChange} />;
    case 'apps':
      return <AppsField value={value} onChange={onChange} />;
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

// Generic view/edit card used by every content list below. "אישור" hands the
// draft to `onSave`, which in a content panel only STAGES it (see
// src/components/admin/PendingChanges.jsx) - nothing is written until the
// editor saves everything from the review dialog. `onSave` may be async and
// return `false` to keep the card open with the draft intact (the users panel,
// which writes immediately, relies on that). `status` marks a card that
// carries a staged change, and `onDiscard` drops it.
/**
 * @param {Object} props
 * @param {any} props.item
 * @param {any[]} props.fields
 * @param {(draft: any) => Promise<boolean|void>|boolean|void} props.onSave
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onDelete]
 * @param {() => void} [props.onDiscard]
 * @param {'create'|'update'|'delete'} [props.status]
 * @param {(item: any) => React.ReactNode} props.renderView
 * @param {boolean} [props.startInEdit]
 * @param {boolean} [props.reveal]  scroll the open editor into view
 * @param {string} [props.confirmLabel]
 */
function EditableCard({ item, fields, onSave, onCancel, onDelete, onDiscard, status, renderView, startInEdit = false, reveal = false, confirmLabel = 'אישור' }) {
  const [editing, setEditing] = useState(startInEdit);
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  const box = useRef(null);
  // A search result opened this item (Metiv admin): bring the editor into view.
  useEffect(() => { if (reveal && editing) revealElement(box.current); }, [reveal, editing]);
  const badge = status && STATUS_BADGES[status];
  const staged = confirmLabel === 'אישור';

  if (!editing) {
    return (
      <div className={`relative group p-4 rounded-xl border bg-background ${badge ? 'border-warning/60' : 'border-border'}`}>
        {badge && (
          <div className="flex items-center gap-2 mb-2 flex-wrap pe-16">
            <Badge color={badge.color}>{badge.label}</Badge>
            {onDiscard && <DiscardButton onClick={onDiscard} />}
          </div>
        )}
        <div className={status === 'delete' ? 'opacity-50 line-through' : ''}>{renderView(item)}</div>
        {status !== 'delete' && (
          <div className="absolute top-3 end-3 flex gap-1">
            <IconBtn icon={Pencil} title="עריכה" onClick={() => { setDraft(item); setEditing(true); }} />
            {onDelete && <IconBtn icon={Trash2} title="מחיקה" tone="danger" onClick={onDelete} />}
          </div>
        )}
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
    <div ref={box} className="p-4 rounded-xl border border-primary/40 bg-background space-y-3">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">{f.label}</label>
          <FieldInput field={f} value={draft[f.key]} onChange={val => setDraft(d => ({ ...d, [f.key]: val }))} />
        </div>
      ))}
      <div className="flex gap-2 pt-1 items-center flex-wrap">
        <Button
          type="button"
          variant="solid"
          size="xs"
          disabled={saving}
          onClick={handleSave}
          className="gap-1.5 rounded-lg font-semibold disabled:opacity-60"
        >
          <Check className="w-3.5 h-3.5" /> {saving ? 'שומר...' : confirmLabel}
        </Button>
        <Button
          type="button"
          variant="subtle"
          size="xs"
          disabled={saving}
          onClick={() => { setDraft(item); setEditing(false); onCancel && onCancel(); }}
          className="gap-1.5 rounded-lg font-semibold hover:bg-border disabled:opacity-60"
        >
          <X className="w-3.5 h-3.5" /> ביטול
        </Button>
        {staged && (
          <span className="text-xs text-muted-foreground">השינוי יעלה לאתר רק אחרי &quot;סקירה ושמירה&quot;</span>
        )}
      </div>
    </div>
  );
}

// Loads a panel's data, re-fetching whenever `deps` change and after every
// "save all" batch (the pending-changes `version`), so a panel always shows
// what the server holds once a save lands. A stale response from a previous
// `deps` value (e.g. switching category quickly) is dropped.
function useAdminData(load, deps, errorMessage, empty) {
  const { version } = usePendingChanges();
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => {
        if (cancelled) return;
        toast.error(err?.message || errorMessage);
        setData(empty);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version, ...deps]);
  return [data, loading];
}

// Translation of the PTSD-IL panels' Hebrew edits. The panels edit page-shaped
// drafts; adminSource's build* serializes a draft into the row's content JSON
// and title, and that serialized form is what is compared, translated and
// written to the siblings - so the leaves sent match what the DB stores.
// Every non-content column of a sibling (categories, audiences, age groups,
// url, sortOrder) comes from the Hebrew row's payload.
function useArticleTranslations() {
  const stageTranslations = useStageTranslations();
  const { stage, changes } = usePendingChanges();

  /**
   * @param {{ heKey: string, scope: string, section: string, title: string, item: any, draft: any, build: (d: any) => Promise<any>, groupRef?: { groupId?: string } }} args
   */
  function translate({ heKey, scope, section, title, item, draft, build, groupRef }) {
    stageTranslations({
      heKey, scope, section, title,
      context: `${AREA_LABELS.patient} / ${section}: ${title}`,
      handEdited: (lang, sib) => changes.some(c => c.itemId === sib.id),
      prepare: async () => {
        const [oldP, newP] = await Promise.all([item ? build(item) : null, build(draft)]);
        const siblings = item?.groupId ? await loadArticleSiblings(item.groupId, newP.type) : {};
        return {
          oldContent: oldP ? JSON.parse(oldP.content) : null,
          newContent: JSON.parse(newP.content),
          oldTitle: oldP?.title,
          newTitle: newP.title,
          siblings,
          write: (lang, built, sib) => writeArticleSibling(newP, lang, built, sib, item?.groupId ?? groupRef?.groupId),
        };
      },
    });
  }

  /** Stages the deletion of a deleted Hebrew item's translations. */
  async function deleteSiblings({ heKey, scope, section, title, item, build, remove }) {
    if (!item.groupId) return;
    try {
      const payload = await build(item);
      const siblings = await loadArticleSiblings(item.groupId, payload.type);
      stageSiblingDeletes(stage, { heKey, scope, section, title, siblings, remove });
    } catch (err) {
      toast.error(err?.message || 'שגיאה באיתור התרגומים של הפריט');
    }
  }

  return { translate, deleteSiblings };
}

// A list of content items whose edits, additions and deletions are staged
// rather than written. Every content panel renders through this: it overlays
// the panel's staged changes on the server's rows (an edited row shows its
// draft, a deleted one is struck through, a new one is appended), and turns
// "אישור" / the trash icon into staged changes carrying the panel's own
// save/remove call for the save-all batch to run.
//
// In the Hebrew tab a panel that passes `build` also gets its edits translated
// (and its deletes applied to every language). In another language tab the
// list edits that language's rows only; adding and deleting stay in Hebrew,
// where the item's translations follow - unless `perLanguage` (communities,
// whose rows are not linked across languages).
/**
 * @param {Object} props
 * @param {string} props.scope       which list; staged changes are matched on it
 * @param {string} props.section     Hebrew name of the list, for review and log
 * @param {any[]} props.items
 * @param {any[]} props.fields
 * @param {(item: any) => React.ReactNode} props.renderView
 * @param {(item: any) => string} props.describe  an item's display name
 * @param {any} props.blank          a new item's starting value
 * @param {(draft: any, ctx?: any) => Promise<any>} props.save  ctx: { human } / { onSaved }
 * @param {(id: string) => Promise<any>} [props.remove]
 * @param {(draft: any) => Promise<any>} [props.build]  the article payload a save would send
 * @param {boolean} [props.perLanguage]
 * @param {string} props.addLabel
 */
function StagedList({ scope, section, items, fields, renderView, describe, blank, save, remove, build, perLanguage = false, addLabel }) {
  const { changes, stage, discard, newKey } = usePendingChanges();
  const { id: lang } = useAdminLang();
  const { translate, deleteSiblings } = useArticleTranslations();
  const focus = useAdminFocus();
  const hebrew = lang === 'he';
  const structural = hebrew || perLanguage;
  const focused = item => focus?.panel === tabOfScope(scope) && focus.itemId === item.id;
  const [creating, setCreating] = useState(false);
  const pending = changes.filter(c => c.scope === scope && !c.linkedTo);
  const byItem = new Map(pending.filter(c => c.itemId).map(c => [c.itemId, c]));
  const creates = pending.filter(c => c.action === 'create' && (c.lang || 'he') === lang);
  const langOf = hebrew ? {} : { lang };

  function stageUpdate(item, draft) {
    const key = `${scope}:${item.id}`;
    const diff = fieldsDiff(fields, item, draft);
    if (!diff.length) { discard(key); return; } // edited back to what the server has
    const title = describe(draft) || describe(item) || 'פריט';
    if (!hebrew) {
      stage({ key, scope, section, ...langOf, action: 'update', itemId: item.id, title, draft, diff, run: () => save(draft, { human: true }) });
      return;
    }
    stage({ key, scope, section, action: 'update', itemId: item.id, title, draft, diff, run: () => save(draft) });
    if (build) translate({ heKey: key, scope, section, title, item, draft, build });
  }

  function stageCreate(key, draft) {
    const title = describe(draft) || 'פריט חדש';
    const groupRef = {};
    stage({
      key, scope, section, ...langOf, action: 'create', title, draft, diff: fieldsDiff(fields, {}, draft),
      run: () => save(draft, { onSaved: saved => { groupRef.groupId = saved?.groupId; } }),
    });
    if (hebrew && build) translate({ heKey: key, scope, section, title, item: null, draft, build, groupRef });
  }

  function stageDelete(item) {
    const key = `${scope}:${item.id}`;
    const title = describe(item) || 'פריט';
    stage({ key, scope, section, ...langOf, action: 'delete', itemId: item.id, title, diff: [], run: () => remove(item.id) });
    if (hebrew && build) deleteSiblings({ heKey: key, scope, section, title, item, build, remove });
  }

  return (
    <>
      <div className="space-y-3">
        {items.map(item => {
          const p = byItem.get(item.id);
          const open = focused(item);
          return (
            <EditableCard
              key={open ? `${item.id}:${focus.nonce}` : item.id}
              startInEdit={open}
              reveal={open}
              item={p?.action === 'update' ? p.draft : item}
              fields={fields}
              renderView={renderView}
              status={p?.action}
              onDiscard={p ? () => discard(p.key) : undefined}
              onSave={draft => stageUpdate(item, draft)}
              onDelete={remove && structural ? () => stageDelete(item) : undefined}
            />
          );
        })}
        {creates.map(c => (
          <EditableCard
            key={c.key}
            item={c.draft}
            fields={fields}
            renderView={renderView}
            status="create"
            onDiscard={() => discard(c.key)}
            onSave={draft => stageCreate(c.key, draft)}
          />
        ))}
        {creating && (
          <EditableCard
            item={blank}
            fields={fields}
            startInEdit
            renderView={renderView}
            onSave={draft => { stageCreate(newKey(scope), draft); setCreating(false); }}
            onCancel={() => setCreating(false)}
          />
        )}
      </div>
      {structural && (
        <div className="mt-3">
          <AddNewButton label={addLabel} onClick={() => setCreating(true)} />
        </div>
      )}
    </>
  );
}

function PTSDFaqsPanel() {
  const { id: lang } = useAdminLang();
  const [faqs, loading] = useAdminData(() => loadPtsdFaq({ lang }), [lang], 'שגיאה בטעינת השאלות', []);

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
      <Section title="שאלות ותשובות על PTSD" count={faqs.length} />
      {loading ? <LoadingRow /> : (
        <StagedList
          key={lang}
          scope="ptsd_faqs"
          section="שאלות PTSD"
          items={faqs}
          fields={fields}
          renderView={renderView}
          describe={f => f.q}
          blank={{ q: '', a: '' }}
          save={(draft, x) => savePtsdFaq(draft, { lang, ...x })}
          build={draft => buildPtsdFaq(draft, { lang })}
          remove={removePtsdFaq}
          addLabel="הוספת שאלה חדשה"
        />
      )}
    </div>
  );
}

function SelfHelpPanel() {
  const { id: lang } = useAdminLang();
  const [tools, loading] = useAdminData(() => loadSelfHelp({ lang }), [lang], 'שגיאה בטעינת הכלים', []);

  const fields = [
    { key: 'category', label: 'קטגוריה', type: 'select', options: toOptions(SELF_HELP_CATEGORY_LABELS) },
    { key: 'title_he', label: 'כותרת', type: 'text' },
    { key: 'content_he', label: 'תוכן', type: 'richtext' },
    { key: 'apps', label: 'אפליקציות (כרטיסים עם קישורים לחנויות)', type: 'apps' },
  ];

  function renderView(tool) {
    return (
      <div className="flex items-start gap-3 pe-16">
        <Badge color="bg-primary/10 text-primary">{labelFor(SELF_HELP_CATEGORY_LABELS, tool.category)}</Badge>
        <div>
          <p className="font-medium text-foreground">{tool.title_he}</p>
          <div className="text-sm text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: tool.content_he }} />
          {tool.apps?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{tool.apps.length} אפליקציות: {tool.apps.map(a => a.title).join(' · ')}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Section title="כלים לעזרה עצמית" count={tools.length} />
      {loading ? <LoadingRow /> : (
        <StagedList
          key={lang}
          scope="self_help"
          section="כלים עצמיים"
          items={tools}
          fields={fields}
          renderView={renderView}
          describe={t => t.title_he}
          blank={{ category: 'sleep', title_he: '', content_he: '', apps: [] }}
          save={(draft, x) => saveSelfHelp(draft, { lang, ...x })}
          build={draft => buildSelfHelp(draft, { lang })}
          remove={removeSelfHelp}
          addLabel="הוספת כלי חדש"
        />
      )}
    </div>
  );
}

function TreatmentPanel() {
  const { id: lang } = useAdminLang();
  const metiv = useContext(AdminVariantContext) === 'metiv';
  const [steps, loading] = useAdminData(() => loadTreatment({ lang }), [lang], 'שגיאה בטעינת שלבי הטיפול', []);

  const fields = [
    // The step number is the order on the page ("שלב 2 / 5"): format, not
    // content, in the Metiv admin. A new step still gets the next number.
    ...(metiv ? [] : [{ key: 'step_number', label: 'מספר שלב', type: 'number' }]),
    { key: 'title_he', label: 'כותרת', type: 'text' },
    { key: 'description_he', label: 'תיאור', type: 'textarea' },
    { key: 'how_to_start_he', label: 'איך מתחילים', type: 'richtext' },
    { key: 'methods', label: 'שיטות טיפול', type: 'methods' },
    { key: 'links', label: 'קישורים', type: 'links' },
  ];

  function renderView(step) {
    return (
      <div className="flex items-start gap-3 pe-16">
        <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {step.step_number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{step.title_he}</p>
          <p className="text-sm text-muted-foreground mt-1">{step.description_he}</p>
          {step.how_to_start_he && (
            <div className="text-xs text-muted-foreground/80 mt-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: step.how_to_start_he }} />
          )}
          {step.methods?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {step.methods.length} שיטות טיפול: {step.methods.map(m => m.title_he).join(' · ')}
            </p>
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
      {loading ? <LoadingRow /> : (
        <StagedList
          key={lang}
          scope="treatment"
          section="שלבי טיפול"
          items={steps}
          fields={fields}
          renderView={renderView}
          describe={s => s.title_he}
          blank={{ step_number: steps.length + 1, title_he: '', description_he: '', how_to_start_he: '', methods: [], links: [] }}
          save={(draft, x) => saveTreatment(draft, { lang, ...x })}
          build={draft => buildTreatment(draft, { lang })}
          remove={removeTreatment}
          addLabel="הוספת שלב חדש"
        />
      )}
    </div>
  );
}

function CommunitiesPanel() {
  const { id: lang } = useAdminLang();
  const [communities, loading] = useAdminData(() => loadCommunity({ lang }), [lang], 'שגיאה בטעינת הקהילות', []);

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
      <p className="text-xs text-muted-foreground mb-4">
        לקהילות אין קישור בין שפות, ולכן הן אינן מתורגמות אוטומטית: כל שפה נערכת, מתווספת ונמחקת בלשונית שלה.
      </p>
      {loading ? <LoadingRow /> : (
        <StagedList
          key={lang}
          perLanguage
          scope="communities"
          section="קהילות"
          items={communities}
          fields={fields}
          renderView={renderView}
          describe={c => c.name}
          blank={{ name: '', organization: '', description_he: '', target_audience: [], location: 'center', meeting_type: 'frontal', contact_url: '' }}
          save={draft => saveCommunity(draft, { lang })}
          remove={removeCommunity}
          addLabel="הוספת קהילה חדשה"
        />
      )}
    </div>
  );
}

function RightsPanel() {
  const { id: lang } = useAdminLang();
  const [cat, setCat] = useState(RIGHTS_CATEGORIES[0]);
  const focus = useAdminFocus();
  useEffect(() => { if (focus?.panel === 'rights' && focus.cat) setCat(focus.cat); }, [focus]);
  const [items, loading] = useAdminData(
    () => loadRightsFaq({ lang, audienceSlug: cat }), [cat, lang], 'שגיאה בטעינת הזכויות', []
  );

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
          <ChoiceChip key={c} variant="plain" selected={cat === c}
            onClick={() => setCat(c)}
            className={`px-3 py-1 rounded-full text-sm ${cat === c ? '' : 'bg-muted hover:bg-border'}`}>
            {labelFor(RIGHTS_CATEGORY_LABELS, c)}
          </ChoiceChip>
        ))}
      </div>
      <Section title={`זכויות - ${labelFor(RIGHTS_CATEGORY_LABELS, cat)}`} count={items.length} />
      {loading ? <LoadingRow /> : (
        <StagedList
          key={`${cat}:${lang}`}
          scope={`rights:${cat}`}
          section={`זכויות - ${labelFor(RIGHTS_CATEGORY_LABELS, cat)}`}
          items={items}
          fields={fields}
          renderView={renderView}
          describe={i => i.q}
          blank={{ q: '', a: '', steps: '', links: [] }}
          save={(draft, x) => saveRightsFaq(draft, { lang, audienceSlug: cat, ...x })}
          build={draft => buildRightsFaq(draft, { lang, audienceSlug: cat })}
          remove={removeRightsFaq}
          addLabel="הוספת שאלה חדשה"
        />
      )}
    </div>
  );
}

function SourcesPanel() {
  const { id: lang } = useAdminLang();
  const [sources, loading] = useAdminData(() => loadSource({ lang }), [lang], 'שגיאה בטעינת המקורות', []);
  const categoryColors = {
    research: 'bg-category-1/10 text-category-1',
    clinical: 'bg-category-2/10 text-category-2',
    ngo: 'bg-category-4/10 text-category-4',
    international: 'bg-category-5/10 text-category-5',
    official: 'bg-category-3/10 text-category-3',
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
      {loading ? <LoadingRow /> : (
        <StagedList
          key={lang}
          scope="sources"
          section="מקורות"
          items={sources}
          fields={fields}
          renderView={renderView}
          describe={s => s.title}
          blank={{ title: '', authors: '', year: '', url: '', description_he: '', category: 'research' }}
          save={(draft, x) => saveSource(draft, { lang, ...x })}
          build={draft => buildSource(draft, { lang })}
          remove={removeSource}
          addLabel="הוספת מקור חדש"
        />
      )}
    </div>
  );
}

function SecondCirclePanel() {
  const { id: lang } = useAdminLang();
  const [tools, loading] = useAdminData(() => loadSecondCircle({ lang }), [lang], 'שגיאה בטעינת התכנים', []);

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
      <Section title="כלים למעגל השני" count={tools.length} />
      {loading ? <LoadingRow /> : (
        <StagedList
          key={lang}
          scope="second_circle"
          section="מעגל שני"
          items={tools}
          fields={fields}
          renderView={renderView}
          describe={t => t.q}
          blank={{ q: '', intro: '', sections: [], closing: '', callout: '' }}
          save={(draft, x) => saveSecondCircle(draft, { lang, ...x })}
          build={draft => buildSecondCircle(draft, { lang })}
          remove={removeSecondCircle}
          addLabel="הוספת פריט חדש"
        />
      )}
    </div>
  );
}

const GUIDELINES_FIELDS = [{ key: 'guidelines', label: 'הנחיות', type: 'richtext' }];

function ChildrenPanel() {
  const metiv = useContext(AdminVariantContext) === 'metiv';
  const { changes, stage, discard } = usePendingChanges();
  const { id: lang } = useAdminLang();
  const { translate } = useArticleTranslations();
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[0]);
  const focus = useAdminFocus();
  useEffect(() => { if (focus?.panel === 'children' && focus.age) setAgeGroup(focus.age); }, [focus]);
  const [data, loading] = useAdminData(
    async () => {
      const [guidelines, resources] = await Promise.all([
        loadChildrenGuidelines({ ageGroupSlug: ageGroup, lang }),
        loadChildrenResource({ ageGroupSlug: ageGroup, lang }),
      ]);
      return { guidelines, resources };
    },
    [ageGroup, lang], 'שגיאה בטעינת התכנים לילדים', { guidelines: null, resources: [] }
  );
  const [editingGuidelines, setEditingGuidelines] = useState(false);
  const [guidelinesDraft, setGuidelinesDraft] = useState('');

  const guidelinesItem = data.guidelines;
  const resources = data.resources;
  const section = `ילדים - גיל ${ageGroup}`;
  // Its own scope (not `children:<age>`), so StagedList never mistakes a staged
  // guidelines row for one of the resources.
  const guidelinesKey = `children:guidelines:${ageGroup}:${lang}`;
  // A missing translation of the guidelines is created by translating the
  // Hebrew; there is nothing to link a hand-written one to.
  const canEditGuidelines = lang === 'he' || Boolean(guidelinesItem?.id);
  const guidelinesPending = changes.find(c => c.key === guidelinesKey);
  const shownGuidelines = guidelinesPending ? guidelinesPending.draft.guidelines : (guidelinesItem?.guidelines || '');

  const fields = [
    { key: 'type', label: 'סוג', type: 'select', options: toOptions(RESOURCE_TYPE_LABELS) },
    { key: 'title_he', label: 'כותרת', type: 'text' },
    { key: 'description_he', label: 'תיאור', type: 'textarea' },
    { key: 'content_he', label: 'תוכן מורחב (אופציונלי)', type: 'richtext' },
    // A button caption is format in the Metiv admin; the link is content.
    ...(metiv ? [] : [{ key: 'cta_label', label: 'טקסט כפתור פעולה (אופציונלי, למשל "לרכישת הספר")', type: 'text' }]),
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

  function handleConfirmGuidelines() {
    const draft = { ...(guidelinesItem || {}), guidelines: guidelinesDraft };
    const diff = fieldsDiff(GUIDELINES_FIELDS, guidelinesItem || {}, draft);
    if (!diff.length) {
      discard(guidelinesKey);
    } else {
      const slug = ageGroup;
      const title = `הנחיות לגיל ${slug}`;
      const groupRef = {};
      stage({
        key: guidelinesKey,
        scope: `children:guidelines:${slug}`,
        section,
        ...(lang === 'he' ? {} : { lang }),
        action: guidelinesItem?.id ? 'update' : 'create',
        itemId: guidelinesItem?.id,
        title,
        draft,
        diff,
        run: () => saveChildrenGuidelines(draft, {
          ageGroupSlug: slug, lang, human: lang !== 'he', onSaved: saved => { groupRef.groupId = saved?.groupId; },
        }),
      });
      if (lang === 'he') {
        translate({
          heKey: guidelinesKey, scope: `children:guidelines:${slug}`, section, title,
          item: guidelinesItem?.id ? guidelinesItem : null, draft, groupRef,
          build: d => buildChildrenGuidelines(d, { ageGroupSlug: slug, lang }),
        });
      }
    }
    setEditingGuidelines(false);
  }

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {AGE_GROUPS.map(ag => (
          <ChoiceChip key={ag} variant="plain" selected={ageGroup === ag}
            onClick={() => { setAgeGroup(ag); setEditingGuidelines(false); }}
            className={`px-3 py-1 rounded-full text-sm ${ageGroup === ag ? '' : 'bg-muted hover:bg-border'}`}>
            {ag}
          </ChoiceChip>
        ))}
      </div>
      <Section title={`תכנים לגיל ${ageGroup}`} count={resources.length + (guidelinesItem?.guidelines ? 1 : 0)} />

      {loading ? (
        <LoadingRow />
      ) : (
        <>
          <div className={`relative group p-4 rounded-xl border bg-primary/5 mb-3 ${guidelinesPending ? 'border-warning/60' : 'border-primary/30'}`}>
            <div className="flex items-center gap-2 mb-2 flex-wrap pe-10">
              <p className="text-xs font-semibold text-primary">הנחיות</p>
              {guidelinesPending && !editingGuidelines && (
                <>
                  <Badge color={STATUS_BADGES.update.color}>{STATUS_BADGES.update.label}</Badge>
                  <DiscardButton onClick={() => discard(guidelinesKey)} />
                </>
              )}
            </div>
            {editingGuidelines ? (
              <div className="space-y-2">
                <RichTextEditor value={guidelinesDraft} onChange={setGuidelinesDraft} />
                <div className="flex gap-2 items-center flex-wrap">
                  <Button
                    type="button"
                    variant="solid"
                    size="xs"
                    onClick={handleConfirmGuidelines}
                    className="gap-1.5 rounded-lg font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" /> אישור
                  </Button>
                  <Button
                    type="button"
                    variant="subtle"
                    size="xs"
                    onClick={() => setEditingGuidelines(false)}
                    className="gap-1.5 rounded-lg font-semibold hover:bg-border"
                  >
                    <X className="w-3.5 h-3.5" /> ביטול
                  </Button>
                  <span className="text-xs text-muted-foreground">השינוי יעלה לאתר רק אחרי &quot;סקירה ושמירה&quot;</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-foreground pe-10" dangerouslySetInnerHTML={{ __html: shownGuidelines }} />
                {canEditGuidelines ? (
                  <div className="absolute top-3 end-3">
                    <IconBtn icon={Pencil} title="עריכת הנחיות" onClick={() => { setGuidelinesDraft(shownGuidelines); setEditingGuidelines(true); }} />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">אין עדיין הנחיות בשפה הזו. הן ייווצרו כשההנחיות בעברית ייערכו ויתורגמו.</p>
                )}
              </>
            )}
          </div>

          <StagedList
            key={`${ageGroup}:${lang}`}
            scope={`children:${ageGroup}`}
            section={section}
            items={resources}
            fields={fields}
            renderView={renderView}
            describe={r => r.title_he}
            blank={{ type: 'book', title_he: '', description_he: '', content_he: '', cta_label: '', cta_url: '' }}
            save={(draft, x) => saveChildrenResource(draft, { ageGroupSlug: ageGroup, lang, ...x })}
            build={draft => buildChildrenResource(draft, { ageGroupSlug: ageGroup, lang })}
            remove={removeChildrenResource}
            addLabel="הוספת תוכן חדש"
          />
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

  async function handleDelete() {
    if (isSelf) return; // button hidden below; guard kept in case currentUserId is ever stale
    if (!window.confirm(`למחוק את המשתמש ${displayName(user)}?`)) return;
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
            <p className="font-medium text-foreground">{displayName(user)}</p>
            {isSelf && <Badge color="bg-primary/10 text-primary">זה אתה</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email || 'ללא אימייל'}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            נוצר ב-{new Date(user.createdAt).toLocaleDateString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn
            icon={Pencil}
            title="עריכת תפקידים"
            onClick={() => { setRolesDraft(user.roles); setEditingRoles(v => !v); }}
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
            field={{ type: 'tags', options: toOptions(ASSIGNABLE_ROLE_LABELS) }}
            value={rolesDraft}
            onChange={setRolesDraft}
          />
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="solid"
              size="xs"
              disabled={saving}
              onClick={handleSaveRoles}
              className="gap-1.5 rounded-lg font-semibold disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" /> {saving ? 'שומר...' : 'שמירה'}
            </Button>
            <Button
              type="button"
              variant="subtle"
              size="xs"
              disabled={saving}
              onClick={() => setEditingRoles(false)}
              className="gap-1.5 rounded-lg font-semibold hover:bg-border disabled:opacity-60"
            >
              <X className="w-3.5 h-3.5" /> ביטול
            </Button>
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
    { key: 'name', label: 'שם', type: 'text' },
    { key: 'email', label: 'אימייל', type: 'text' },
    { key: 'roles', label: 'תפקידים', type: 'tags', options: toOptions(ASSIGNABLE_ROLE_LABELS) },
  ];

  async function handleCreateUser(draft) {
    if (!draft.name?.trim() || !draft.email) {
      toast.error('יש למלא שם ואימייל');
      return false;
    }
    const { firstName, lastName } = splitName(draft.name);
    const payload = {
      firstName,
      lastName,
      email: draft.email,
      password: generatePassword(),
      roles: draft.roles?.length ? draft.roles : ['admin'],
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
              item={{ name: '', email: '', roles: ['admin'] }}
              fields={createFields}
              startInEdit
              confirmLabel="יצירת משתמש"
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

// Full CRUD for the questionnaires resource (dedicated API, not /admin/articles).
// Lists the Hebrew rows; edit metadata; expand to edit questions + options;
// create/delete questionnaires and questions - every one of those staged, like
// the article panels. totalQuestions is server-managed (read-only). Deletes
// are admin-only server-side - a moderator's staged delete fails at save time
// with a 403 toast and stays staged.
//
// A questionnaire staged for creation has no id yet, so its questions can only
// be edited once it has been saved.
const QUESTIONNAIRE_SECTION = 'שאלון PCL-5';

const QUESTIONNAIRE_FIELDS = [
  { key: 'slug', label: 'slug' },
  { key: 'name', label: 'שם' },
  { key: 'description', label: 'תיאור' },
  { key: 'maxScore', label: 'ציון מקסימלי' },
  { key: 'cutoffScore', label: 'סף קליני' },
  { key: 'sortOrder', label: 'סדר תצוגה' },
  { key: 'isActive', label: 'פעיל', type: 'checkbox' },
];

const QUESTION_FIELDS = [
  { key: 'text', label: 'טקסט השאלה' },
  { key: 'sortOrder', label: 'סדר' },
  { key: 'options', label: 'תשובות' },
];

// A question as diffable flat text - options become one line each.
function flatQuestion(q) {
  return {
    text: q.text ?? '',
    sortOrder: q.sortOrder ?? '',
    options: (q.options ?? []).map(o => `${o.answer} = ${o.score} (סדר ${o.order})`).join('\n'),
  };
}

function QuestionnairePanel() {
  const metiv = useContext(AdminVariantContext) === 'metiv';
  const { changes, stage, discard, newKey } = usePendingChanges();
  const [creating, setCreating] = useState(false);
  const { id: lang } = useAdminLang();
  // Each language's questionnaire is its own row (no groupId), so the panel
  // lists the tab's language and nothing is translated automatically.
  const [items, loading] = useAdminData(
    async () => (await loadQuestionnaires()).filter(q => q.langId === lang),
    [lang], 'שגיאה בטעינת השאלונים', []
  );

  const scope = 'questionnaire';
  const pending = changes.filter(c => c.scope === scope);
  const byItem = new Map(pending.filter(c => c.itemId).map(c => [c.itemId, c]));
  const creates = pending.filter(c => c.action === 'create');

  function stageCreate(key, draft) {
    stage({ key, scope, section: QUESTIONNAIRE_SECTION, action: 'create', title: draft.name || 'שאלון חדש', draft, diff: fieldsDiff(QUESTIONNAIRE_FIELDS, {}, draft), run: () => createQuestionnaire(draft) });
  }

  if (loading) return <LoadingRow />;

  return (
    <div>
      <Section title="שאלונים" count={items.length} />
      <p className="text-xs text-muted-foreground mb-4">
        {metiv
          ? 'השאלון אינו מתורגם אוטומטית: כל שפה נערכת בלשונית שלה, ושינוי בעברית לא משנה את השפות האחרות. אפשר לערוך את התיאור, את נוסח השאלות ואת נוסח התשובות; הניקוד, הסף, הסדר ומבנה השאלון קבועים.'
          : 'השאלון אינו מתורגם אוטומטית: כל שפה נערכת בלשונית שלה, ושינוי בעברית לא משנה את השפות האחרות. totalQuestions מנוהל בשרת ומתעדכן אוטומטית עם הוספת/מחיקת שאלות.'}
      </p>

      <div className="space-y-3 mt-3">
        {items.map(q => {
          const p = byItem.get(q.id);
          return (
            <QuestionnaireRow
              key={q.id}
              q={p?.action === 'update' ? { ...q, ...p.draft } : q}
              status={p?.action}
              onDiscard={p ? () => discard(p.key) : undefined}
              onStage={draft => {
                const key = `${scope}:${q.id}`;
                const diff = fieldsDiff(QUESTIONNAIRE_FIELDS, q, draft);
                if (!diff.length) { discard(key); return; }
                stage({ key, scope, section: QUESTIONNAIRE_SECTION, action: 'update', itemId: q.id, title: draft.name || q.name, draft, diff, run: () => updateQuestionnaire(q.id, draft) });
              }}
              onDelete={metiv ? undefined : () => stage({
                key: `${scope}:${q.id}`, scope, section: QUESTIONNAIRE_SECTION, action: 'delete', itemId: q.id,
                title: `${q.name} (כולל כל השאלות שלו)`, diff: [], run: () => removeQuestionnaire(q.id),
              })}
            />
          );
        })}
        {creates.map(c => (
          <QuestionnaireRow
            key={c.key}
            q={c.draft}
            status="create"
            onDiscard={() => discard(c.key)}
            onStage={draft => stageCreate(c.key, draft)}
          />
        ))}
        {creating && (
          <div className="rounded-xl border border-primary/40 bg-background p-4">
            <QuestionnaireMetaForm
              initial={{ langId: lang, slug: 'pcl-5', name: '', description: '', maxScore: 80, cutoffScore: 33, isActive: true, sortOrder: 0 }}
              onCancel={() => setCreating(false)}
              onSave={draft => { stageCreate(newKey(scope), draft); setCreating(false); }}
            />
          </div>
        )}
      </div>

      {!metiv && (
        <div className="mt-3">
          <AddNewButton label="הוספת שאלון חדש" onClick={() => setCreating(true)} />
        </div>
      )}
    </div>
  );
}

// One questionnaire row: metadata view/edit + expandable questions editor.
/**
 * @param {Object} props
 * @param {any} props.q
 * @param {'create'|'update'|'delete'} [props.status]
 * @param {(draft: any) => void} props.onStage
 * @param {() => void} [props.onDelete]
 * @param {() => void} [props.onDiscard]
 */
function QuestionnaireRow({ q, status, onStage, onDelete, onDiscard }) {
  const metiv = useContext(AdminVariantContext) === 'metiv';
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const badge = status && STATUS_BADGES[status];

  return (
    <div className={`rounded-xl border bg-background ${badge ? 'border-warning/60' : 'border-border'}`}>
      <div className="p-4">
        {editing ? (
          <QuestionnaireMetaForm
            initial={q}
            onCancel={() => setEditing(false)}
            onSave={draft => { onStage(draft); setEditing(false); }}
          />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              {badge && <div className="mb-2"><Badge color={badge.color}>{badge.label}</Badge></div>}
              <div className={status === 'delete' ? 'opacity-50 line-through' : ''}>
                <p className="font-semibold text-foreground">{q.name}</p>
                {metiv ? (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    slug: {q.slug} · שאלות: {q.totalQuestions ?? 0} · max: {q.maxScore} · סף: {q.cutoffScore ?? '-'} · {q.isActive ? 'פעיל' : 'לא פעיל'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
              {onDiscard && <DiscardButton onClick={onDiscard} />}
              {status !== 'delete' && (
                <Button variant="outline-subtle" size="none" onClick={() => setEditing(true)} className="p-2 rounded-lg" title="עריכה"><Pencil className="w-4 h-4" /></Button>
              )}
              {onDelete && status !== 'delete' && (
                <Button variant="outline-subtle" size="none" onClick={onDelete} className="p-2 rounded-lg text-destructive" title="מחיקה"><Trash2 className="w-4 h-4" /></Button>
              )}
            </div>
          </div>
        )}
      </div>

      {q.id && status !== 'delete' && (
        <div className="border-t border-border">
          <Button
            variant="quiet"
            size="none"
            onClick={() => setExpanded(v => !v)}
            className="w-full justify-start text-start px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {expanded ? '▾' : '▸'} שאלות ({q.totalQuestions ?? 0})
          </Button>
          {expanded && <QuestionsEditor questionnaireId={q.id} questionnaireName={q.name} />}
        </div>
      )}
    </div>
  );
}

// Metadata form for create/edit.
function QuestionnaireMetaForm({ initial, onSave, onCancel }) {
  const metiv = useContext(AdminVariantContext) === 'metiv';
  const [draft, setDraft] = useState({
    langId: initial.langId ?? 'he', // the language tab's; not editable here
    slug: initial.slug ?? '',
    name: initial.name ?? '',
    description: initial.description ?? '',
    maxScore: initial.maxScore ?? 0,
    cutoffScore: initial.cutoffScore ?? '',
    isActive: initial.isActive ?? true,
    sortOrder: initial.sortOrder ?? 0,
  });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm';

  return (
    <div className="space-y-3">
      {!metiv && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">slug</label>
            <input className={inputCls} value={draft.slug} onChange={e => set('slug', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">ציון מקסימלי</label>
            <input type="number" className={inputCls} value={draft.maxScore} onChange={e => set('maxScore', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">סף קליני</label>
            <input type="number" className={inputCls} value={draft.cutoffScore} onChange={e => set('cutoffScore', e.target.value)} />
          </div>
        </div>
      )}
      {!metiv && (
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">שם</label>
          <input className={inputCls} value={draft.name} onChange={e => set('name', e.target.value)} />
        </div>
      )}
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1">תיאור</label>
        <textarea className={inputCls} rows={2} value={draft.description ?? ''} onChange={e => set('description', e.target.value)} />
      </div>
      {!metiv && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">סדר תצוגה</label>
            <input type="number" className={inputCls} value={draft.sortOrder} onChange={e => set('sortOrder', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!draft.isActive} onChange={e => set('isActive', e.target.checked)} />
            פעיל
          </label>
        </div>
      )}
      <div className="flex gap-2 items-center flex-wrap">
        <Button variant="solid" size="none" onClick={() => onSave(draft)} className="px-4 py-2 rounded-lg text-sm gap-1"><Check className="w-4 h-4" /> אישור</Button>
        <Button variant="outline-subtle" size="none" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm gap-1"><X className="w-4 h-4" /> ביטול</Button>
        <span className="text-xs text-muted-foreground">השינוי יעלה לאתר רק אחרי &quot;סקירה ושמירה&quot;</span>
      </div>
    </div>
  );
}

// Questions editor: lazy-loads the questionnaire detail, lists questions with
// inline option editing, add/delete - all staged.
function QuestionsEditor({ questionnaireId, questionnaireName }) {
  const metiv = useContext(AdminVariantContext) === 'metiv';
  const { changes, stage, discard, newKey } = usePendingChanges();
  const [detail, loading] = useAdminData(
    () => loadQuestionnaireDetail(questionnaireId), [questionnaireId], 'שגיאה בטעינת השאלות', null
  );
  const [addingNew, setAddingNew] = useState(false);

  if (loading || detail === null) return <div className="p-4"><LoadingRow /></div>;
  const questions = [...(detail.questions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const scope = `questionnaire:${questionnaireId}`;
  const section = `${QUESTIONNAIRE_SECTION} - ${questionnaireName}`;
  const pending = changes.filter(c => c.scope === scope);
  const byItem = new Map(pending.filter(c => c.itemId).map(c => [c.itemId, c]));
  const creates = pending.filter(c => c.action === 'create');

  const blankOptions = () => [0, 1, 2, 3, 4].map(n => ({ answer: '', score: n, order: n }));

  function stageCreate(key, draft) {
    stage({ key, scope, section, action: 'create', title: draft.text || 'שאלה חדשה', draft, diff: fieldsDiff(QUESTION_FIELDS, {}, flatQuestion(draft)), run: () => addQuestion(questionnaireId, draft) });
  }

  return (
    <div className="p-4 space-y-3 bg-muted/30">
      {questions.map((qn, i) => {
        const p = byItem.get(qn.id);
        const key = `${scope}:${qn.id}`;
        return (
          <QuestionRow
            key={qn.id}
            index={i}
            question={p?.action === 'update' ? { ...qn, ...p.draft } : qn}
            status={p?.action}
            onDiscard={p ? () => discard(p.key) : undefined}
            onSave={draft => {
              const diff = fieldsDiff(QUESTION_FIELDS, flatQuestion(qn), flatQuestion(draft));
              if (!diff.length) { discard(key); return; }
              stage({ key, scope, section, action: 'update', itemId: qn.id, title: draft.text || qn.text, draft, diff, run: () => updateQuestion(questionnaireId, qn.id, draft) });
            }}
            onDelete={metiv ? undefined : () => stage({ key, scope, section, action: 'delete', itemId: qn.id, title: qn.text, diff: [], run: () => removeQuestion(questionnaireId, qn.id) })}
          />
        );
      })}

      {creates.map((c, i) => (
        <QuestionRow
          key={c.key}
          index={questions.length + i}
          question={c.draft}
          status="create"
          onDiscard={() => discard(c.key)}
          onSave={draft => stageCreate(c.key, draft)}
        />
      ))}

      {addingNew ? (
        <QuestionRow
          index={questions.length + creates.length}
          question={{ text: '', sortOrder: questions.length + creates.length, options: blankOptions() }}
          startInEdit
          onSave={draft => { stageCreate(newKey(scope), draft); setAddingNew(false); }}
          onCancel={() => setAddingNew(false)}
        />
      ) : !metiv && (
        <AddNewButton label="הוספת שאלה" onClick={() => setAddingNew(true)} />
      )}
    </div>
  );
}

// One question: text + 5-ish options (answer/score/order), view or edit.
/**
 * @param {Object} props
 * @param {number} props.index
 * @param {any} props.question
 * @param {(draft: any) => void} props.onSave
 * @param {() => void} [props.onDelete]
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onDiscard]
 * @param {'create'|'update'|'delete'} [props.status]
 * @param {boolean} [props.startInEdit]
 */
function QuestionRow({ index, question, onSave, onDelete, onCancel, onDiscard, status, startInEdit = false }) {
  // The Metiv admin edits the wording only: scores, order and the set of answers are the PCL-5 protocol.
  const metiv = useContext(AdminVariantContext) === 'metiv';
  const [editing, setEditing] = useState(startInEdit);
  const seed = q => (q.options ?? []).map(o => ({ answer: o.answer ?? '', score: o.score ?? 0, order: o.order ?? 0 }));
  const [text, setText] = useState(question.text ?? '');
  const [sortOrder, setSortOrder] = useState(question.sortOrder ?? index);
  const [options, setOptions] = useState(seed(question));
  const inputCls = 'px-2 py-1.5 rounded-lg border border-border bg-background text-sm';
  const badge = status && STATUS_BADGES[status];

  const setOpt = (i, k, v) => setOptions(os => os.map((o, j) => (j === i ? { ...o, [k]: v } : o)));

  // Re-seed from what is currently shown (server row or staged draft) every
  // time editing starts, so a discarded change does not linger in the form.
  function startEdit() {
    setText(question.text ?? '');
    setSortOrder(question.sortOrder ?? index);
    setOptions(seed(question));
    setEditing(true);
  }

  if (!editing) {
    return (
      <div className={`p-3 rounded-lg border bg-background flex items-start justify-between gap-3 ${badge ? 'border-warning/60' : 'border-border'}`}>
        <div>
          {badge && <div className="mb-1"><Badge color={badge.color}>{badge.label}</Badge></div>}
          <div className={status === 'delete' ? 'opacity-50 line-through' : ''}>
            <p className="text-sm text-foreground"><span className="text-muted-foreground/60">{index + 1}. </span>{question.text}</p>
            <p className="text-xs text-muted-foreground mt-1">{(question.options ?? []).map(o => (metiv ? o.answer : `${o.answer}=${o.score}`)).join(' · ')}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          {onDiscard && <DiscardButton onClick={onDiscard} />}
          {status !== 'delete' && (
            <Button variant="outline-subtle" size="none" onClick={startEdit} className="p-2 rounded-lg" title="עריכה"><Pencil className="w-4 h-4" /></Button>
          )}
          {onDelete && status !== 'delete' && (
            <Button variant="outline-subtle" size="none" onClick={onDelete} className="p-2 rounded-lg text-destructive" title="מחיקה"><Trash2 className="w-4 h-4" /></Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border border-primary/30 bg-background space-y-2">
      <div className="flex gap-2">
        {!metiv && <input className={`${inputCls} w-16`} type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} title="sortOrder" />}
        <input className={`${inputCls} flex-1`} value={text} onChange={e => setText(e.target.value)} placeholder="טקסט השאלה" aria-label="טקסט השאלה" />
      </div>
      <div className="space-y-1">
        {options.map((o, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className={`${inputCls} flex-1`} value={o.answer} onChange={e => setOpt(i, 'answer', e.target.value)} placeholder="תשובה" aria-label={`תשובה ${i + 1}`} />
            {!metiv && (
              <>
                <input className={`${inputCls} w-16`} type="number" value={o.score} onChange={e => setOpt(i, 'score', e.target.value)} title="score" />
                <input className={`${inputCls} w-16`} type="number" value={o.order} onChange={e => setOpt(i, 'order', e.target.value)} title="order" />
                <Button variant="outline-subtle" size="none" onClick={() => setOptions(os => os.filter((_, j) => j !== i))} className="p-1.5 rounded-lg text-destructive"><X className="w-3 h-3" /></Button>
              </>
            )}
          </div>
        ))}
        {!metiv && (
          <Button variant="link" size="none" onClick={() => setOptions(os => [...os, { answer: '', score: os.length, order: os.length }])} className="text-xs gap-1 mt-1"><Plus className="w-3 h-3" /> הוספת תשובה</Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="solid" size="none" onClick={() => { onSave({ text, sortOrder, options }); if (!startInEdit) setEditing(false); }} className="px-3 py-1.5 rounded-lg text-sm gap-1"><Check className="w-4 h-4" /> אישור</Button>
        <Button variant="outline-subtle" size="none" onClick={() => { if (startInEdit) { onCancel?.(); } else { setEditing(false); } }} className="px-3 py-1.5 rounded-lg text-sm gap-1"><X className="w-4 h-4" /> ביטול</Button>
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
  [QA_SCOPE]:    <ChatbotQaPanel />,
};

// What the Metiv admin's search looks through in the PTSD-IL panels, for one
// language: every panel's items as { panel, itemId, title, text }, plus the
// rights category / children age group an item sits under, so a result can
// switch the panel to it. Text is the item's HTML; the search strips it.
async function ptsdSearchEntries(lang) {
  const ctx = { lang };
  const join = (...parts) => parts.flat().filter(Boolean).join(' · ');
  const entry = (panel, item, title, text, extra = {}) => ({ panel, itemId: item.id, title: title || '', text: text || '', ...extra });
  const [faqs, tools, steps, communities, sources, second, rights, children] = await Promise.all([
    loadPtsdFaq(ctx),
    loadSelfHelp(ctx),
    loadTreatment(ctx),
    loadCommunity(ctx),
    loadSource(ctx),
    loadSecondCircle(ctx),
    Promise.all(RIGHTS_CATEGORIES.map(cat => loadRightsFaq({ ...ctx, audienceSlug: cat }).then(items => items.map(i => ({ ...i, cat }))))),
    Promise.all(AGE_GROUPS.map(async age => {
      const [guidelines, resources] = await Promise.all([
        loadChildrenGuidelines({ ...ctx, ageGroupSlug: age }),
        loadChildrenResource({ ...ctx, ageGroupSlug: age }),
      ]);
      return { age, guidelines, resources };
    })),
  ]);
  return [
    ...faqs.map(f => entry('ptsd_faqs', f, f.q, f.a)),
    ...tools.map(t => entry('self_help', t, t.title_he, join(t.content_he, (t.apps || []).map(x => [x.title, x.description])))),
    ...steps.map(st => entry('treatment', st, st.title_he, join(st.description_he, st.how_to_start_he, (st.methods || []).map(m => [m.title_he, m.description_he])))),
    ...communities.map(c => entry('communities', c, c.name, join(c.organization, c.description_he, c.location))),
    ...sources.map(src => entry('sources', src, src.title, join(src.authors, src.description_he))),
    ...second.map(t => entry('second_circle', t, t.q, join(t.intro, (t.sections || []).map(x => [x.heading, x.body]), t.closing, t.callout))),
    ...rights.flat().map(r => entry('rights', r, r.q, join(r.a, r.steps), { cat: r.cat })),
    ...children.flatMap(({ age, guidelines, resources }) => [
      ...(guidelines?.guidelines ? [{ panel: 'children', itemId: undefined, title: `הנחיות לגיל ${age}`, text: guidelines.guidelines, age }] : []),
      ...resources.map(r => entry('children', r, r.title_he, join(r.description_he, r.content_he), { age })),
    ]),
  ];
}

// Staged changes carry their list's scope (`rights:general`,
// `children:guidelines:0-4`, `questionnaire:<id>` ...); the part before the
// first colon is always the content tab they belong to.
function tabOfScope(scope) {
  return scope.split(':')[0];
}

// The Metiv page tree's tool pages (the chatbot Q&A, users, the edit log).
function renderTool(kind) {
  if (kind === 'qa') return PANELS[QA_SCOPE];
  if (kind === 'users') return <UsersPanel />;
  return <EditLogPanel />;
}

// The panel's two main sections - the guide (home) and the editable pages -
// plus, for masteradmin, user management and the edit log. Visibility mirrors
// the exact-match role checks in src/lib/auth.js: content needs
// admin/moderator, users and the log need masteradmin. AdminGate
// (src/App.jsx) guarantees at least one of them for anyone who gets here.
//
// `variant="metiv"` (/metiv-site-demo-v3/admin) swaps the content view for the
// Metiv groups (MetivAdmin.jsx), which hold the nine panels below in their
// patient group. Users, the log and the guide are the same.
/** @param {{ variant?: 'ptsd'|'metiv' }} props */
export default function Admin({ variant = 'ptsd' }) {
  const showContent = hasAdminAccess();
  const showUsers = hasUserManagementAccess();
  const { changes } = usePendingChanges();
  const metiv = variant === 'metiv';
  // The Metiv variant keeps users and the edit log in its page tree.
  const views = [
    { key: 'guide', label: 'מדריך שימוש', icon: Info },
    ...(showContent || (metiv && showUsers) ? [{ key: 'content', label: 'עריכת תוכן', icon: Pencil }] : []),
    ...(showUsers && !metiv ? [USERS_VIEW, LOG_VIEW] : []),
  ];
  const [view, setView] = useState('guide');
  const [activeTab, setActiveTab] = useState(CONTENT_TABS[0].key);
  const [lang, setLang] = useState('he');

  /** @type {Record<string, number>} */
  const pendingByTab = {};
  for (const c of changes) {
    const tab = tabOfScope(c.scope);
    pendingByTab[tab] = (pendingByTab[tab] || 0) + 1;
  }

  return (
    <AdminVariantContext.Provider value={variant}>
      <div className={`${metiv ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 sm:px-6 py-8 pb-28`}>
        <nav aria-label="אזורי ממשק הניהול" className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
          {views.map(v => {
            const Icon = v.icon;
            return (
              <ChoiceChip
                key={v.key}
                variant="plain"
                selected={view === v.key}
                onClick={() => setView(v.key)}
                className="gap-2 px-4 py-2 rounded-super-sm text-sm"
              >
                <Icon className="w-4 h-4" />
                {v.label}
                {v.key === 'content' && changes.length > 0 && (
                  <Badge color="bg-warning/20 text-foreground">{changes.length}</Badge>
                )}
              </ChoiceChip>
            );
          })}
        </nav>

        {view === 'guide' && <AdminGuide canEdit={showContent} onStart={() => setView('content')} />}

        {view === 'content' && metiv && (showContent || showUsers) && (
          <AdminLangProvider lang={lang}>
            <LanguageTabs lang={lang} onChange={setLang} />
            <MetivContentView
              ptsdTabs={CONTENT_TABS}
              renderPtsd={key => PANELS[key]}
              renderTool={renderTool}
              ptsdSearch={ptsdSearchEntries}
              showContent={showContent}
              showUsers={showUsers}
            />
          </AdminLangProvider>
        )}

        {view === 'content' && showContent && !metiv && (
          <AdminLangProvider lang={lang}>
            <LanguageTabs lang={lang} onChange={setLang} />
            <h2 className="text-xs font-semibold text-muted-foreground mb-2">עמודי האתר הניתנים לעריכה</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {CONTENT_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <ChoiceChip
                    key={tab.key}
                    variant="plain"
                    selected={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="gap-2 px-4 py-2 rounded-super-sm text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {pendingByTab[tab.key] > 0 && (
                      <Badge color="bg-warning/20 text-foreground">{pendingByTab[tab.key]}</Badge>
                    )}
                  </ChoiceChip>
                );
              })}
            </div>
            <div className="bg-card rounded-super border border-border p-6 shadow-card">
              {PANELS[activeTab]}
            </div>
          </AdminLangProvider>
        )}

        {view === 'users' && showUsers && (
          <div className="bg-card rounded-super border border-border p-6 shadow-card"><UsersPanel /></div>
        )}

        {view === 'log' && showUsers && (
          <div className="bg-card rounded-super border border-border p-6 shadow-card"><EditLogPanel /></div>
        )}

        <SaveAllBar />
      </div>
    </AdminVariantContext.Provider>
  );
}
