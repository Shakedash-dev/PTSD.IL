import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useSelfHelpTools } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { Wind, Moon, PenLine, Smartphone, Zap, ChevronDown, ArrowLeft, ArrowRight, Compass, Wrench } from 'lucide-react';
import { useImages } from '@/lib/ImageSetContext';
import ValidatableContent from '@/components/ValidatableContent';

const TOOL_ICON_MAP = { Wind, Moon, PenLine, Smartphone, Zap, Compass, Wrench };

function ToolCard({ tool, contentId }) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_ICON_MAP[tool.icon];

  return (
    <ValidatableContent contentId={contentId} label={tool.title_he}>
      <div className={`bg-card rounded-2xl border transition-natural overflow-hidden ${open ? 'border-primary/40' : 'border-border hover:bg-muted'}`}>
        <button
          className="w-full text-start px-6 py-5 flex items-center gap-4 transition-natural"
          onClick={() => setOpen(o => !o)}
        >
          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {Icon && <Icon className="w-5 h-5 text-primary" />}
          </div>
          <span className="flex-1 font-heading font-semibold text-foreground">{tool.title_he}</span>
          <ChevronDown className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div
            className="px-6 pb-6 text-muted-foreground leading-relaxed rich-content"
            dangerouslySetInnerHTML={{ __html: tool.content_he }}
          />
        )}
      </div>
    </ValidatableContent>
  );
}

export default function SelfHelp() {
  const { lang } = useLang();
  const IMAGES = useImages();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const { data: tools = [], isLoading, error } = useSelfHelpTools();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="start"
        tone="card"
        image={IMAGES.selfhelp_hero}
        eyebrow={t(lang, 'self_help')}
        title={t(lang, 'self_help_title')}
        subtitle={t(lang, 'self_help_intro')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Quick calming shortcut */}
        <div className="mb-8 p-5 rounded-2xl bg-card border border-border flex items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">{t(lang, 'self_help_overflow_prompt')}</p>
            <p className="text-foreground font-medium">{t(lang, 'self_help_overflow_cta')} ←</p>
          </div>
          <Link
            to="/calming"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-accent transition-natural flex-shrink-0 flex items-center gap-1"
          >
            {t(lang, 'calming')}
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>

        {isLoading && <p className="text-center text-muted-foreground">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground">{t(lang, 'content_error')}</p>}
        <div className="space-y-3">
          {tools.map((tool, i) => (
            <ToolCard key={i} tool={tool} contentId={`self-help.tool.${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
