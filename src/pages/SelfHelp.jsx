import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useSelfHelpTools } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { Wind, Moon, PenLine, Smartphone, Zap, ChevronDown, ArrowLeft, ArrowRight, Compass, Wrench, Apple, PlayCircle } from 'lucide-react';
import { IMAGES } from '@/lib/images';
import ValidatableContent from '@/components/ValidatableContent';
import Markdown from '@/components/Markdown';

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
          <div className="px-6 pb-6">
            {tool.content_he && (
              <Markdown className="text-muted-foreground leading-relaxed rich-content">
                {tool.content_he}
              </Markdown>
            )}
            {tool.apps?.length > 0 && (
              <div className="space-y-4">
                {tool.apps.map((app, i) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-border' : ''}>
                    <p className="font-heading font-semibold text-foreground text-sm mb-1">{app.title_he}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-2">{app.description_he}</p>
                    <div className="flex gap-2">
                      {app.ios_url && (
                        <a
                          href={app.ios_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-90 transition-colors duration-300"
                        >
                          <Apple className="w-3.5 h-3.5" />
                          App Store
                        </a>
                      )}
                      {app.android_url && (
                        <a
                          href={app.android_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-90 transition-colors duration-300"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Google Play
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ValidatableContent>
  );
}

export default function SelfHelp() {
  const { lang } = useLang();
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
