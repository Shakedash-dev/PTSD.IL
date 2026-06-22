import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useTreatmentSteps } from '@/api/hooks';
import PageHeader from '@/components/PageHeader';
import { Wrench, Building2, Brain, Leaf, Pill, ChevronDown, ExternalLink, Map } from 'lucide-react';

const STEP_ICON_MAP = { Wrench, Building2, Brain, Leaf, Pill };

function StepCard({ step, isActive, onToggle, index, total, lang }) {
  const Icon = STEP_ICON_MAP[step.icon];
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Timeline line */}
      {index < total - 1 && (
        <div
          className="absolute top-16 bottom-0 w-0.5 rounded-full opacity-20 bg-border"
          style={{ [isRTL ? 'right' : 'left']: '28px' }}
        />
      )}

      {/* Step number bubble */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-natural border border-border ${isActive ? 'bg-primary' : 'bg-muted'}`}
        >
          {Icon && <Icon className={`w-6 h-6 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />}
        </div>
      </div>

      {/* Card */}
      <div className={`flex-1 bg-card rounded-2xl border transition-natural overflow-hidden mb-6 ${isActive ? 'border-primary/40' : 'border-border hover:bg-muted'}`}>
        <button
          className="w-full text-start px-5 py-4 flex items-center justify-between gap-3 transition-natural"
          onClick={onToggle}
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider mb-1 block text-primary">
              {t(lang, 'step_label')} {step.step_number}
            </span>
            <h3 className="font-heading font-bold text-foreground text-lg">
              {step.title_he}
            </h3>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
        </button>

        {isActive && (
          <div className="px-5 pb-5">
            <p className="text-muted-foreground mb-4 leading-relaxed">{step.description_he}</p>
            <div className="p-4 bg-muted/40 rounded-lg mb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">{t(lang, 'how_to_start')}</p>
              <div
                className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: step.how_to_start_he }}
              />
            </div>
            {step.links?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {step.links.map((link, i) => (
                  link.url.startsWith('/') ? (
                    <Link
                      key={i}
                      to={link.url}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-natural"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-natural"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Treatment() {
  const { lang } = useLang();
  const [activeStep, setActiveStep] = useState(null);
  const { data: steps = [], isLoading, error } = useTreatmentSteps();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={Map} title={t(lang, 'treatment_title')} subtitle={t(lang, 'treatment_subtitle')} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-muted-foreground text-center mb-10">
          {t(lang, 'treatment_instruction')}
        </p>
        {isLoading && <p className="text-center text-muted-foreground">{t(lang, 'loading')}</p>}
        {error && <p className="text-center text-muted-foreground">{t(lang, 'content_error')}</p>}
        <div>
          {steps.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              total={steps.length}
              lang={lang}
              isActive={activeStep === i}
              onToggle={() => setActiveStep(activeStep === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
