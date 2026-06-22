import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useImages } from '@/lib/ImageSetContext';

// ─── Hebrew: friendly/conversational, grouped by symptom cluster ──────────────
const PCL5_SECTIONS_HE = [
  {
    icon: '🧠',
    title: 'מחשבות שלא עוזבות',
    questions: [
      'הזיכרון של מה שקרה פשוט קופץ לך לראש פתאום, בלי שתרצה?',
      'יש לך חלומות רעים או סיוטים בלילה על מה שהיה?',
      'קורה לך שאתה מרגיש לרגע כאילו אתה ממש נמצא שם שוב?',
      'כשמשהו מזכיר לך את זה, הלב שלך נופל או מרגיש מועקה קשה?',
      'כשהזיכרון עולה, הגוף מגיב? (למשל דופק גבוה, זיעה קרה, רעד, קוצר נשימה)',
    ],
  },
  {
    icon: '🛑',
    title: 'הניסיונות לברוח',
    questions: [
      'אתה מנסה בכוח להשתיק מחשבות, רגשות או זיכרונות שקשורים לזה?',
      'אתה מתרחק ממקומות, אנשים או מצבים שמזכירים לך את מה שקרה, כדי לא להרגיש רע?',
    ],
  },
  {
    icon: '😔',
    title: 'מה שזה עשה למצב הרוח שלך',
    questions: [
      'יש חלקים או פרטים חשובים מהאירוע שאתה פשוט לא מצליח לזכור?',
      'התחלת לחשוב דברים קשים על עצמך או על העולם - כמו "אני אשם", "העולם מסוכן", "אי אפשר לסמוך על אף אחד"?',
      'אתה מוצא את עצמך מאשים את עצמך במה שקרה, שוב ושוב - גם כשאתה יודע שזה לא הגיוני?',
      'אתה מרגיש שרגשות כבדים כמו פחד, עצב, עצבנות או בושה פשוט לא משחררים אותך?',
      'איבדת חשק לדברים ולתחביבים שפעם ממש אהבת ועשו לך טוב?',
      'אתה מרגיש מנותק, לבד, או שאף אחד לא באמת מבין אותך?',
      'קשה לך להרגיש אהבה, שמחה, או סתם שקט נפשי?',
    ],
  },
  {
    icon: '⚡',
    title: 'הגוף שנשאר דרוך',
    questions: [
      'אתה מוצא את עצמך עצבני, קצר רוח, או מתפרץ על אנשים בלי שרצית?',
      'אתה עושה שטויות או דברים מסוכנים בלי לחשוב על התוצאות?',
      'אתה מרגיש כל הזמן "על הקצה" - מחפש סכנות, בודק מי סביבך, במתח תמידי?',
      'אתה קופץ ונבהל בקלות מכל רעש קטן או תנועה פתאומית?',
      'חווה ירידה ביכולת הריכוז? מתמודד עם קושי להתמקד במשימות, בעבודה או בלימודים?',
      'השינה שלך נפגעה? (קשה להירדם, מתעורר המון, או ישן גרוע)',
    ],
  },
];

const PCL5_SCALE_HE = ['בכלל לא', 'קצת', 'ככה ככה', 'הרבה', 'שובר אותי לגמרי'];
const PCL5_INTRO_HE = 'קח נשימה, תחשוב על החודש האחרון ועל האירוע שעברת, ותראה כמה כל דבר כאן מציק לך:';

// ─── English: flat clinical questions, i18n scale ─────────────────────────────
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

const SCALE_KEYS = ['not_at_all', 'a_little', 'moderately', 'quite_a_bit', 'extremely'];

const TOTAL = 20;

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
  const IMAGES = useImages();
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

  // 33 is the PCL-5 clinical cutoff for probable PTSD (National Center for PTSD).
  const isHigh = result !== null && result >= 33;

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
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-black ${
              isHigh ? 'bg-primary/10 text-primary' : 'bg-teal/10 text-teal'
            }`}>
              {result}
            </div>

            {isHigh
              ? <AlertCircle className="w-8 h-8 text-primary mx-auto mb-4" />
              : <CheckCircle className="w-8 h-8 text-teal mx-auto mb-4" />
            }

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
                  style={{ marginInlineStart: `${(result / 80) * 100}%` }}
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
