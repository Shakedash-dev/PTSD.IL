import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { IMAGES } from '@/lib/images';
import { useQuestionnaire } from '@/api/hooks';
import { HE_SECTIONS } from '@/data/questionnaireSections';

// `question` is the DB question object: { text, options: [{answer, score, order}] }.
// The selected value stored in `answers` is the option INDEX; the score comes
// from that option's `score` field.
function QuestionCard({ idx, question, answers, onAnswer }) {
  const isAnswered = answers[idx] !== undefined;
  const opts = question.options;
  return (
    <div className={`p-6 rounded-super bg-card border transition-natural shadow-card ${
      isAnswered ? 'border-primary/30' : 'border-border'
    }`}>
      <div className="flex gap-3 mb-5">
        <span className="text-2xl font-heading font-bold text-clay/40 flex-shrink-0 leading-tight mt-0.5">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <p className="text-foreground leading-relaxed font-medium">{question.text}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {opts.map((opt, oi) => (
          <button
            key={oi}
            onClick={() => onAnswer(idx, oi)}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg border transition-natural text-center
              ${answers[idx] === oi
                ? 'bg-primary border-primary text-white'
                : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
              }
            `}
          >
            <span className="text-base font-bold">{opt.score}</span>
            <span className="text-[10px] leading-tight text-current opacity-70 hidden sm:block">
              {opt.answer}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-xs text-muted-foreground">{opts[0]?.answer}</span>
        <span className="text-xs text-muted-foreground">{opts[opts.length - 1]?.answer}</span>
      </div>
    </div>
  );
}

export default function Questionnaire() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const isHebrew = lang === 'he';

  const { data: q, isLoading, error } = useQuestionnaire({ lang });

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = q?.questions ?? [];
  const TOTAL = q?.totalQuestions ?? questions.length;
  const answered = Object.keys(answers).length;
  const progress = TOTAL ? (answered / TOTAL) * 100 : 0;

  function handleAnswer(idx, optIdx) {
    setAnswers(prev => ({ ...prev, [idx]: optIdx }));
  }

  function calculate() {
    if (answered < TOTAL) return;
    const score = questions.reduce((s, qn, i) => {
      const oi = answers[i];
      return s + (oi === undefined ? 0 : (qn.options[oi]?.score ?? 0));
    }, 0);
    setResult(score);
  }

  function reset() {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const title = q?.name || t(lang, 'questionnaire_title');
  const subtitle = q?.description || t(lang, 'questionnaire_intro');
  const isHigh = result !== null && q?.cutoffScore != null && result >= q.cutoffScore;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="dark"
        image={IMAGES.questionnaire_hero}
        imageOpacity={0.55}
        title={title}
        subtitle={subtitle}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/70">
          {t(lang, 'questionnaire_anonymous_note')}
        </p>
      </div>

      {isLoading ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 text-center text-muted-foreground py-16">
          {t(lang, 'loading') || 'טוען...'}
        </div>
      ) : error || !q ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="rounded-super p-8 text-center bg-card border border-clay/30">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-clay" />
            <p className="text-muted-foreground">{t(lang, 'error_loading') || 'שגיאה בטעינת השאלון. נסו לרענן.'}</p>
          </div>
        </div>
      ) : result === null ? (
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

          {isHebrew ? (
            <HebrewSectioned questions={questions} answers={answers} onAnswer={handleAnswer} />
          ) : (
            <div className="space-y-6">
              {questions.map((qn, idx) => (
                <QuestionCard key={qn.id ?? idx} idx={idx} question={qn} answers={answers} onAnswer={handleAnswer} />
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
                {`${TOTAL - answered} ${t(lang, 'questions_remaining_suffix')}`}
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
              {isHigh ? <AlertCircle className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              {t(lang, isHigh ? 'result_high_title' : 'result_low_title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t(lang, isHigh ? 'result_high_text' : 'result_low_text')}
            </p>

            <div className="mb-8">
              <div className={`h-3 rounded-full overflow-hidden ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-teal via-yellow-400 to-clay`}>
                <div
                  className="h-full w-1.5 bg-foreground rounded-full transition-all duration-1000 relative"
                  style={{ marginInlineStart: `${q.maxScore ? (result / q.maxScore) * 100 : 0}%` }}
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
                {t(lang, 'start_over')}
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

// Hebrew sectioned render: slices the flat DB question list into the overlay's
// sections by order. Any questions beyond the overlay's summed counts render
// flat below the last section (defensive - never drop a question).
function HebrewSectioned({ questions, answers, onAnswer }) {
  let idx = 0;
  const blocks = HE_SECTIONS.sections.map((section, sIdx) => {
    const slice = questions.slice(idx, idx + section.count);
    const startIdx = idx;
    idx += section.count;
    return (
      <div key={sIdx}>
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
          <span className="text-2xl">{section.icon}</span>
          <h2 className="font-heading font-bold text-foreground text-lg">{section.title}</h2>
        </div>
        <div className="space-y-4">
          {slice.map((qn, i) => (
            <QuestionCard key={qn.id ?? startIdx + i} idx={startIdx + i} question={qn} answers={answers} onAnswer={onAnswer} />
          ))}
        </div>
      </div>
    );
  });
  const leftover = questions.slice(idx);
  return (
    <div>
      <p className="text-center text-muted-foreground italic mb-10 text-sm">{HE_SECTIONS.intro}</p>
      <div className="space-y-10">
        {blocks}
        {leftover.length > 0 && (
          <div className="space-y-4">
            {leftover.map((qn, i) => (
              <QuestionCard key={qn.id ?? idx + i} idx={idx + i} question={qn} answers={answers} onAnswer={onAnswer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
