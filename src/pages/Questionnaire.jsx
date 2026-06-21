import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const PCL5_QUESTIONS_HE = [
  'זיכרונות חוזרים ובלתי רצויים, מחשבות או תמונות של אירוע לחוץ?',
  'חלומות מטרידים חוזרים של האירוע הלחוץ?',
  'הרגשה פתאומית שהאירוע הלחוץ קורה שוב (כאילו חי/ה אותו)?',
  'הרגשה של עוררות רגשית כאשר משהו מזכיר לך את האירוע?',
  'תגובות גופניות כאשר משהו מזכיר לך את האירוע?',
  'הימנעות מזיכרונות, מחשבות או רגשות הקשורים לאירוע?',
  'הימנעות מגורמים חיצוניים המזכירים את האירוע (אנשים, מקומות, שיחות)?',
  'קושי להיזכר בחלקים חשובים של האירוע?',
  'אמונות שליליות חזקות לגבי עצמך, אחרים או העולם?',
  'האשמת עצמך או אחרים על האירוע?',
  'רגשות שליליים חזקים כמו פחד, אימה, כעס, אשמה או בושה?',
  'אובדן עניין בפעילויות שנהנית מהן?',
  'תחושת ריחוק מאחרים?',
  'קושי לחוות רגשות חיוביים כמו אושר או אהבה?',
  'התנהגות עצבנית, פרצי כעס?',
  'נטילת סיכונים מוגזמים?',
  'דריכות מוגזמת, ממה שנחשב לנורמלי?',
  'קשיי ריכוז?',
  'הפרעות שינה?',
  'בהלה קיצונית בתגובה לרעש פתאומי?',
];

const PCL5_QUESTIONS_EN = [
  'Repeated, disturbing, and unwanted memories of the stressful experience?',
  'Repeated, disturbing dreams of the stressful experience?',
  'Suddenly feeling or acting as if the stressful experience were actually happening again?',
  'Feeling very upset when something reminded you of the stressful experience?',
  'Having strong physical reactions when something reminded you?',
  'Avoiding memories, thoughts, or feelings related to the stressful experience?',
  'Avoiding external reminders of the stressful experience?',
  'Trouble remembering important parts of the stressful experience?',
  'Having strong negative beliefs about yourself, others, or the world?',
  'Blaming yourself or someone else for the stressful experience or what happened?',
  'Having strong negative feelings such as fear, horror, anger, guilt, or shame?',
  'Loss of interest in activities that you used to enjoy?',
  'Feeling distant or cut off from other people?',
  'Trouble experiencing positive feelings?',
  'Irritable behavior, angry outbursts, or acting aggressively?',
  'Taking too many risks or doing things that could cause you harm?',
  'Being "superalert" or watchful or on guard?',
  'Feeling jumpy or easily startled?',
  'Having difficulty concentrating?',
  'Trouble falling or staying asleep?',
];

// Array index IS the score value (0-4), matching PCL-5 scoring where each item is rated 0-4.
const SCALE_LABELS = ['not_at_all', 'a_little', 'moderately', 'quite_a_bit', 'extremely'];

export default function Questionnaire() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Only Hebrew and English have validated translations; all other languages fall back to Hebrew.
  const questions = lang === 'en' ? PCL5_QUESTIONS_EN : PCL5_QUESTIONS_HE;
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  function handleAnswer(idx, val) {
    setAnswers(prev => ({ ...prev, [idx]: val }));
  }

  function calculate() {
    if (answered < total) return;
    const score = Object.values(answers).reduce((s, v) => s + v, 0);
    setResult(score);
  }

  function reset() {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 33 is the PCL-5 clinical cutoff for probable PTSD (National Center for PTSD).
  const isHigh = result !== null && result >= 33;

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h1 className="text-4xl font-heading font-black text-foreground mb-4">
          {t(lang, 'questionnaire_title')}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {t(lang, 'questionnaire_intro')}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-3">
          {t(lang, 'questionnaire_anonymous_note')}
        </p>
      </div>

      {result === null ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t(lang, 'pcl_instruction')}</span>
              <span>{answered}/{total}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-super bg-card border transition-natural shadow-card ${
                  answers[idx] !== undefined ? 'border-primary/30' : 'border-border'
                }`}
              >
                <div className="flex gap-3 mb-5">
                  <span className="text-2xl font-heading font-bold text-clay/40 flex-shrink-0 leading-tight mt-0.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="text-foreground leading-relaxed font-medium">{q}</p>
                </div>

                {/* Scale */}
                <div className="grid grid-cols-5 gap-2">
                  {SCALE_LABELS.map((labelKey, val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswer(idx, val)}
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
                        {t(lang, labelKey)}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-xs text-muted-foreground">{t(lang, 'not_at_all')}</span>
                  <span className="text-xs text-muted-foreground">{t(lang, 'extremely')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculate button */}
          <div className="mt-8 text-center">
            <button
              onClick={calculate}
              disabled={answered < total}
              className={`
                px-8 py-4 rounded-super font-bold text-lg transition-natural
                ${answered >= total
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-atmospheric-md hover:shadow-atmospheric-lg'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              {t(lang, 'calculate')}
            </button>
            {answered < total && (
              <p className="text-sm text-muted-foreground mt-2">
                נותרו {total - answered} שאלות
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Result */
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
          <div className={`rounded-super p-8 sm:p-10 text-center shadow-atmospheric-lg border ${
            isHigh
              ? 'bg-card border-primary/30'
              : 'bg-card border-teal/30'
          }`}>
            {/* Score display */}
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-black ${
              isHigh ? 'bg-primary/10 text-primary' : 'bg-teal/10 text-teal'
            }`}>
              {result}
            </div>

            {isHigh ? (
              <AlertCircle className="w-8 h-8 text-primary mx-auto mb-4 opacity-60" />
            ) : (
              <CheckCircle className="w-8 h-8 text-teal mx-auto mb-4 opacity-60" />
            )}

            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              {t(lang, isHigh ? 'result_high_title' : 'result_low_title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t(lang, isHigh ? 'result_high_text' : 'result_low_text')}
            </p>

            {/* Spectrum bar */}
            <div className="mb-8">
              <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-teal via-yellow-400 to-clay">
                <div
                  className="h-full w-1.5 bg-foreground rounded-full transition-all duration-1000 relative"
                  style={{ marginInlineStart: `${(result / 80) * 100}%` }}  /* max 80 = 20 items × 4 */
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>33</span>
                <span>80</span>
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
                מלא/י מחדש
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