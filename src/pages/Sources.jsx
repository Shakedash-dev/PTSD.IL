import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import { BookOpen, ExternalLink, Globe } from 'lucide-react';

const STATIC_SOURCES = [
  {
    title: 'DSM-5 — Diagnostic and Statistical Manual of Mental Disorders',
    authors: 'American Psychiatric Association',
    year: '2013',
    url: 'https://www.psychiatry.org/psychiatrists/practice/dsm',
    description_he: 'המדריך האבחוני הסטנדרטי לפסיכיאטריה, כולל הגדרות ואבחנות PTSD',
    category: 'research',
  },
  {
    title: 'PCL-5 — PTSD Checklist for DSM-5',
    authors: 'Weathers, F.W., et al.',
    year: '2013',
    url: 'https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp',
    description_he: 'השאלון המשמש לסקירת תסמיני PTSD — פותח על ידי מכון ה-PTSD הלאומי של ה-VA',
    category: 'clinical',
  },
  {
    title: 'אתר נט"ל — הסברה ומידע',
    authors: 'עמותת נט"ל',
    year: '2024',
    url: 'https://www.natal.org.il',
    description_he: 'מידע ומשאבים לנפגעי טראומה ופוסט-טראומה בישראל',
    category: 'ngo',
  },
  {
    title: 'PTSD — National Institute of Mental Health',
    authors: 'NIMH',
    year: '2023',
    url: 'https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd',
    description_he: 'מידע מדעי עדכני על PTSD מהמכון הלאומי האמריקאי לבריאות הנפש',
    category: 'international',
  },
  {
    title: 'Trauma-Sensitive Yoga',
    authors: 'Emerson, D. & Hopper, E.',
    year: '2012',
    url: 'https://www.traumasensitiveyoga.com',
    description_he: 'גישת יוגה מותאמת לנפגעי טראומה',
    category: 'clinical',
  },
  {
    title: 'ביטוח לאומי — זכויות נפגעי עבודה',
    authors: 'המוסד לביטוח לאומי',
    year: '2024',
    url: 'https://www.btl.gov.il',
    description_he: 'מידע רשמי על זכויות נפגעי עבודה ונכות',
    category: 'official',
  },
  {
    title: 'אגף השיקום — משרד הביטחון',
    authors: 'משרד הביטחון הישראלי',
    year: '2024',
    url: 'https://www.idf.il',
    description_he: 'מידע על זכויות נפגעי כוחות הביטחון ונפגעי פעולות איבה',
    category: 'official',
  },
];

const CATEGORY_LABELS = {
  research: 'מחקר',
  clinical: 'קליני',
  official: 'גורם רשמי',
  ngo: 'עמותה',
  international: 'בינלאומי',
};

const CATEGORY_COLORS = {
  research: 'bg-teal/10 text-teal',
  clinical: 'bg-clay/10 text-clay',
  official: 'bg-secondary/10 text-secondary',
  ngo: 'bg-teal/10 text-teal',
  international: 'bg-clay/10 text-clay',
};

export default function Sources() {
  const { lang } = useLang();
  const [dbSources, setDbSources] = useState([]);

  useEffect(() => {
    base44.entities.SourceReference.list('sort_order')
      .then(items => setDbSources(items || []))
      .catch(() => {});
  }, []);

  const sources = dbSources.length > 0 ? dbSources : STATIC_SOURCES;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader icon={BookOpen} title={t(lang, 'sources_title')} subtitle={t(lang, 'sources_subtitle')} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sources.map((source, i) => (
            <div key={i} className="bg-card rounded-super border border-border p-5 shadow-card hover:shadow-card-hover transition-natural hover:border-primary/30 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[source.category] || 'bg-muted text-muted-foreground'}`}>
                  {CATEGORY_LABELS[source.category] || source.category}
                </span>
                {source.year && <span className="text-xs text-muted-foreground">{source.year}</span>}
              </div>

              <h3 className="font-heading font-bold text-foreground text-sm leading-snug mb-2 flex-1">
                {source.title}
              </h3>

              {source.authors && (
                <p className="text-xs text-muted-foreground mb-2">{source.authors}</p>
              )}

              {source.description_he && (
                <p className="text-xs text-muted-foreground/80 leading-relaxed mb-3">
                  {source.description_he}
                </p>
              )}

              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-natural mt-auto"
                >
                  <Globe className="w-3.5 h-3.5" />
                  קישור למקור
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}