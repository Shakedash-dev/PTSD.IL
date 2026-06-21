import React, { useState } from 'react';
import { Settings, Users, FileText, BookOpen, HelpCircle, AlertTriangle } from 'lucide-react';

const TABS = [
  { key: 'faq', label: 'שאלות ותשובות', icon: HelpCircle },
  { key: 'communities', label: 'קהילות', icon: Users },
  { key: 'rights', label: 'זכויות', icon: FileText },
  { key: 'sources', label: 'מקורות', icon: BookOpen },
];

function NoBackendNotice() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-sm">אין חיבור לשרת</p>
        <p className="text-sm mt-0.5">ניהול תוכן מצריך שירות backend. יש לחבר מסד נתונים לפני שניתן לערוך ולשמור תכנים.</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('faq');

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
          <NoBackendNotice />
        </div>
      </div>
    </div>
  );
}
