import React, { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { MessageCircle } from 'lucide-react';

export default function ChatbotFAB() {
  const { lang } = useLang();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50" dir="ltr">
      <div className="relative">
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-3 bg-foreground text-background text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            {t(lang, 'chat_tooltip')}
          </div>
        )}
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(s => !s)}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-accent transition-colors duration-500 ease-in-out border border-border"
          aria-label={t(lang, 'chat_tooltip')}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}