import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { IMAGES } from '@/lib/images';
import { db } from '@/data/db';

// Content (questions, scale, cutoff) lives in src/data/static/questionnaire.js and is
// managed the same way as every other entity - see src/pages/Admin.jsx "שאלון PCL-5" tab.
const QUESTIONNAIRE = db.questionnaire;

const PCL5_SECTIONS_HE = QUESTIONNAIRE.he.sections;
const PCL5_SCALE_HE = QUESTIONNAIRE.he.scale;
const PCL5_INTRO_HE = QUESTIONNAIRE.he.intro;
const PCL5_QUESTIONS_EN = QUESTIONNAIRE.en.questions;

const SCALE_KEYS = ['not_at_all', 'a_little', 'moderately', 'quite_a_bit', 'extremely'];

const TOTAL = QUESTIONNAIRE.total_questions;

function QuestionCard({ idx, question, scale, useRawScale, answers, onAnswer, lang }) {
  const isAnswered = answers[idx] !== undefined;
  return (
    <div className={`p-6 rounded-super bg-card border transition-natural shadow-card ${
      isAnswered ? 'border-primary/30' : 'border-border'
    }`}>
      <div className="flex gap-3 mb-5">
        <span className="text-2xl font-heading font-bold text-clay/40 flex-shrink-0 leading-tight mt-0.5">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <p className="text-foreground leading-relaxed font-medium">{question}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {scale.map((label, val) => (
          <button
            key={val}
            onClick={() => onAnswer(idx, val)}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg border transition-natural text-center
              ${answers[idx] === val
                ? 'bg-primary border-primary text-white'
                : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
              }
            `}
          >
            <span className="text-base font-bold">{val}</span>
            <span className="text-[10px] leading-tight text-current opacity-70 hidden sm:block">
              {useRawScale ? label : t(lang, label)}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-xs text-muted-foreground">
          {useRawScale ? scale[0] : t(lang, 'not_at_all')}
        </span>
        <span className="text-xs text-muted-foreground">
          {useRawScale ? scale[4] : t(lang, 'extremely')}
        </span>
      </div>
    </div>
  );
}

export default function Questionnaire() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const isHebrew = lang !== 'en';

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const answered = Object.keys(answers).length;
  const progress = (answered / TOTAL) * 100;

  function handleAnswer(idx, val) {
    setAnswers(prev => ({ ...prev, [idx]: val }));
  }

  function calculate() {
    if (answered < TOTAL) return;
    const score = Object.values(answers).reduce((s, v) => s + v, 0);
    setResult(score);
  }

  function reset() {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const isHigh = result !== null && result >= QUESTIONNAIRE.cutoff_score;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="dark"
        image={IMAGES.questionnaire_hero}
        imageOpacity={0.55}
        title={t(lang, 'questionnaire_title')}
        subtitle={t(lang, 'questionnaire_intro')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/70">
          {t(lang, 'questionnaire_anonymous_note')}
        </p>
      </div>

      {result === null ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t(lang, 'pcl_instruction')}</span>
              <span>{answered}/{TOTAL}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Hebrew: sectioned friendly format */}
          {isHebrew ? (
            <div>
              <p className="text-center text-muted-foreground italic mb-10 text-sm">{PCL5_INTRO_HE}</p>
              <div className="space-y-10">
                {(() => {
                  let idx = 0;
                  return PCL5_SECTIONS_HE.map((section, sIdx) => (
                    <div key={sIdx}>
                      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
                        <span className="text-2xl">{section.icon}</span>
                        <h2 className="font-heading font-bold text-foreground text-lg">{section.title}</h2>
                      </div>
                      <div className="space-y-4">
                        {section.questions.map(q => {
                          const i = idx++;
                          return (
                            <QuestionCard
                              key={i}
                              idx={i}
                              question={q}
                              scale={PCL5_SCALE_HE}
                              useRawScale
                              answers={answers}
                              onAnswer={handleAnswer}
                              lang={lang}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          ) : (
            /* English: flat clinical format */
            <div className="space-y-6">
              {PCL5_QUESTIONS_EN.map((q, idx) => (
                <QuestionCard
                  key={idx}
                  idx={idx}
                  question={q}
                  scale={SCALE_KEYS}
                  useRawScale={false}
                  answers={answers}
                  onAnswer={handleAnswer}
                  lang={lang}
                />
              ))}
            </div>
          )}

          {/* Calculate button */}
          <div className="mt-10 text-center">
            <button
              onClick={calculate}
              disabled={answered < TOTAL}
              className={`
                px-8 py-4 rounded-super font-bold text-lg transition-natural
                ${answered >= TOTAL
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-atmospheric-md hover:shadow-atmospheric-lg'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              {t(lang, 'calculate')}
            </button>
            {answered < TOTAL && (
              <p className="text-sm text-muted-foreground mt-2">
                {isHebrew ? `נותרו ${TOTAL - answered} שאלות` : `${TOTAL - answered} questions remaining`}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Result */
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
          <div className={`rounded-super p-8 sm:p-10 text-center shadow-atmospheric-lg border ${
            isHigh ? 'bg-card border-primary/30' : 'bg-card border-teal/30'
          }`}>
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
              isHigh ? 'bg-primary/10 text-primary' : 'bg-teal/10 text-teal'
            }`}>
              {isHigh
                ? <AlertCircle className="w-10 h-10" />
                : <CheckCircle className="w-10 h-10" />
              }
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              {t(lang, isHigh ? 'result_high_title' : 'result_low_title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t(lang, isHigh ? 'result_high_text' : 'result_low_text')}
            </p>

            {/* Spectrum bar - always green at the "mild" end and red at the "significant"
                end regardless of reading direction; no raw numbers, since the score itself
                isn't the point. */}
            <div className="mb-8">
              <div className={`h-3 rounded-full overflow-hidden ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-teal via-yellow-400 to-clay`}>
                <div
                  className="h-full w-1.5 bg-foreground rounded-full transition-all duration-1000 relative"
                  style={{ marginInlineStart: `${(result / QUESTIONNAIRE.max_score) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{t(lang, 'scale_mild')}</span>
                <span>{t(lang, 'scale_significant')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={isHigh ? '/self-help' : '/calming'}
                className="px-6 py-3 bg-primary text-white rounded-super font-medium hover:bg-primary/90 transition-natural shadow-atmospheric flex items-center justify-center gap-2"
              >
                {t(lang, isHigh ? 'go_to_self_help' : 'go_to_calming')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
              <button
                onClick={reset}
                className="px-6 py-3 bg-muted text-foreground rounded-super font-medium hover:bg-muted/80 transition-natural flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {isHebrew ? 'מלא/י מחדש' : 'Start over'}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              {t(lang, 'questionnaire_anonymous_note')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
