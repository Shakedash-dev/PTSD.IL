import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Settings, Users, FileText, Heart, Baby, BookOpen, HelpCircle, ChevronDown, Plus, Trash2, Edit3, Save, X, Check } from 'lucide-react';

const TABS = [
  { key: 'faq', label: 'שאלות ותשובות', icon: HelpCircle },
  { key: 'communities', label: 'קהילות', icon: Users },
  { key: 'rights', label: 'זכויות', icon: FileText },
  { key: 'sources', label: 'מקורות', icon: BookOpen },
];

function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-primary text-white rounded-full shadow-atmospheric text-sm flex items-center gap-2 animate-fade-in">
      <Check className="w-4 h-4" />
      {msg}
    </div>
  );
}

function FAQManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    base44.entities.FAQItem.list('sort_order')
      .then(data => { setItems(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function save(item) {
    if (item.id) {
      await base44.entities.FAQItem.update(item.id, item);
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    } else {
      const created = await base44.entities.FAQItem.create(item);
      setItems(prev => [...prev, created]);
    }
    setEditing(null);
    setToast(true);
  }

  async function remove(id) {
    if (!window.confirm('למחוק?')) return;
    await base44.entities.FAQItem.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const CATS = ['ptsd_info', 'self_help', 'rights', 'treatment', 'second_circle', 'children'];
  const CAT_LABELS = { ptsd_info: 'מידע PTSD', self_help: 'עזרה עצמית', rights: 'זכויות', treatment: 'טיפול', second_circle: 'מעגל שני', children: 'ילדים' };

  if (loading) return <div className="text-center py-8 text-muted-foreground">טוען...</div>;

  return (
    <div>
      {toast && <Toast msg="נשמר בהצלחה ✓" onClose={() => setToast(false)} />}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">{items.length} פריטים</span>
        <button
          onClick={() => setEditing({ category: 'ptsd_info', question_he: '', answer_he: '', sort_order: 0, is_published: true })}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-super-sm text-sm font-medium hover:bg-primary/90 transition-natural"
        >
          <Plus className="w-4 h-4" />
          הוסף שאלה
        </button>
      </div>

      {editing && (
        <div className="mb-4 p-5 bg-primary/5 rounded-super border border-primary/20">
          <h4 className="font-semibold mb-3">עריכת שאלה</h4>
          <div className="space-y-3">
            <select
              value={editing.category}
              onChange={e => setEditing({ ...editing, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
            <input
              placeholder="שאלה (עברית)"
              value={editing.question_he || ''}
              onChange={e => setEditing({ ...editing, question_he: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <textarea
              placeholder="תשובה (עברית) — ניתן להכניס HTML"
              value={editing.answer_he || ''}
              onChange={e => setEditing({ ...editing, answer_he: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-32 resize-y"
            />
            <div className="flex gap-2">
              <button onClick={() => save(editing)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-natural flex items-center gap-1">
                <Save className="w-4 h-4" /> שמור
              </button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-natural flex items-center gap-1">
                <X className="w-4 h-4" /> ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/20 transition-natural">
            <div className="flex-1 min-w-0">
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{CAT_LABELS[item.category] || item.category}</span>
              <p className="font-medium text-sm mt-1 truncate">{item.question_he}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setEditing(item)} className="p-1.5 hover:bg-muted rounded-md transition-natural text-muted-foreground hover:text-foreground">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => remove(item.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-natural text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    base44.entities.CommunityGroup.list()
      .then(data => { setItems(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function save(item) {
    if (item.id) {
      await base44.entities.CommunityGroup.update(item.id, item);
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    } else {
      const created = await base44.entities.CommunityGroup.create(item);
      setItems(prev => [...prev, created]);
    }
    setEditing(null);
    setToast(true);
  }

  async function remove(id) {
    if (!window.confirm('למחוק?')) return;
    await base44.entities.CommunityGroup.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const LOCS = [
    { v: 'north', l: 'צפון' }, { v: 'center', l: 'מרכז' }, { v: 'south', l: 'דרום' },
    { v: 'jerusalem', l: 'ירושלים' }, { v: 'online', l: 'מקוון' },
  ];
  const MTYPES = [{ v: 'frontal', l: 'פרונטלי' }, { v: 'digital', l: 'דיגיטלי' }, { v: 'hybrid', l: 'היברידי' }];

  if (loading) return <div className="text-center py-8 text-muted-foreground">טוען...</div>;

  return (
    <div>
      {toast && <Toast msg="נשמר בהצלחה ✓" onClose={() => setToast(false)} />}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">{items.length} קהילות</span>
        <button
          onClick={() => setEditing({ name: '', description_he: '', location: 'center', meeting_type: 'frontal', contact_url: '', is_published: true })}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-super-sm text-sm font-medium hover:bg-primary/90 transition-natural"
        >
          <Plus className="w-4 h-4" /> הוסף קהילה
        </button>
      </div>

      {editing && (
        <div className="mb-4 p-5 bg-primary/5 rounded-super border border-primary/20">
          <h4 className="font-semibold mb-3">עריכת קהילה</h4>
          <div className="space-y-3">
            <input placeholder="שם הקהילה" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <textarea placeholder="תיאור (עברית)" value={editing.description_he || ''} onChange={e => setEditing({ ...editing, description_he: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-20 resize-y" />
            <div className="grid grid-cols-2 gap-3">
              <select value={editing.location} onChange={e => setEditing({ ...editing, location: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {LOCS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
              </select>
              <select value={editing.meeting_type} onChange={e => setEditing({ ...editing, meeting_type: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {MTYPES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <input placeholder="קישור להצטרפות (URL)" value={editing.contact_url || ''} onChange={e => setEditing({ ...editing, contact_url: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" dir="ltr" />
            <input placeholder="ארגון מארח" value={editing.organization || ''} onChange={e => setEditing({ ...editing, organization: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <div className="flex gap-2">
              <button onClick={() => save(editing)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-natural flex items-center gap-1"><Save className="w-4 h-4" /> שמור</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80 transition-natural flex items-center gap-1"><X className="w-4 h-4" /> ביטול</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/20 transition-natural">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.location} · {item.meeting_type}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(item)} className="p-1.5 hover:bg-muted rounded-md transition-natural text-muted-foreground hover:text-foreground"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => remove(item.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-natural text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    base44.entities.SourceReference.list('sort_order')
      .then(data => { setItems(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function save(item) {
    if (item.id) {
      await base44.entities.SourceReference.update(item.id, item);
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    } else {
      const created = await base44.entities.SourceReference.create(item);
      setItems(prev => [...prev, created]);
    }
    setEditing(null);
    setToast(true);
  }

  async function remove(id) {
    if (!window.confirm('למחוק?')) return;
    await base44.entities.SourceReference.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  if (loading) return <div className="text-center py-8 text-muted-foreground">טוען...</div>;

  return (
    <div>
      {toast && <Toast msg="נשמר בהצלחה ✓" onClose={() => setToast(false)} />}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">{items.length} מקורות</span>
        <button onClick={() => setEditing({ title: '', authors: '', year: '', url: '', description_he: '', category: 'research' })}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-super-sm text-sm font-medium hover:bg-primary/90 transition-natural">
          <Plus className="w-4 h-4" /> הוסף מקור
        </button>
      </div>
      {editing && (
        <div className="mb-4 p-5 bg-primary/5 rounded-super border border-primary/20">
          <div className="space-y-3">
            <input placeholder="שם המקור / כותרת" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="מחברים" value={editing.authors || ''} onChange={e => setEditing({ ...editing, authors: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
              <input placeholder="שנה" value={editing.year || ''} onChange={e => setEditing({ ...editing, year: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <input placeholder="URL" value={editing.url || ''} onChange={e => setEditing({ ...editing, url: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" dir="ltr" />
            <textarea placeholder="תיאור קצר" value={editing.description_he || ''} onChange={e => setEditing({ ...editing, description_he: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-16 resize-y" />
            <div className="flex gap-2">
              <button onClick={() => save(editing)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-natural flex items-center gap-1"><Save className="w-4 h-4" /> שמור</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm flex items-center gap-1"><X className="w-4 h-4" /> ביטול</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.authors} · {item.year}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(item)} className="p-1.5 hover:bg-muted rounded-md transition-natural text-muted-foreground hover:text-foreground"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => remove(item.id)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-natural text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('faq');

  const COMPONENTS = {
    faq: FAQManager,
    communities: CommunityManager,
    sources: SourcesManager,
    rights: () => <div className="text-center py-12 text-muted-foreground">ניהול זכויות — בקרוב</div>,
  };
  const ActiveComponent = COMPONENTS[activeTab] || (() => null);

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">ממשק ניהול תוכן</h1>
          </div>
          <p className="text-muted-foreground text-sm">עריכה ועדכון תכני האתר</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
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
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}