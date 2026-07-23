import React, { useState, useEffect } from 'react';
import { useLang } from '@/lib/LanguageContext';

// Full Jacobson PMR sequence: 6 muscle groups.
// Each group: squeeze (tense) then release. Total ≈ 2 minutes.
const SQUEEZE_SECS = 6;
const RELEASE_SECS = 10;
const TICK_MS = 100;

// he/en are the clinician-authored source scripts.
// ar/ru/fr are machine-assisted translations pending clinician review.
const GROUPS = {
  he: [
    {
      name: 'ידיים',
      squeeze: 'קמצו אגרוף חזק ככל שניתן',
      release: 'שחררו לאט - שימו לב לתחושת ההקלה',
    },
    {
      name: 'כתפיים',
      squeeze: 'הרימו את הכתפיים לאוזניים ועצרו',
      release: 'שחררו - הרגישו את הכובד יורד',
    },
    {
      name: 'פנים',
      squeeze: 'קמצו את כל שרירי הפנים - עיניים, לסת, מצח',
      release: 'שחררו - פה פתוח קלות, הפנים רפויות',
    },
    {
      name: 'בטן',
      squeeze: 'הדקו את שרירי הבטן בחוזקה',
      release: 'שחררו - קחו נשימה עמוקה ורחבה',
    },
    {
      name: 'ירכיים',
      squeeze: 'לחצו את הירכיים חזק זו לזו',
      release: 'שחררו - הרגישו את המושב מתחתיכם',
    },
    {
      name: 'כפות רגליים',
      squeeze: 'קפלו את האצבעות פנימה בחוזקה',
      release: 'שחררו - הרגישו את הרצפה מתחת לרגליים',
    },
  ],
  en: [
    {
      name: 'Hands',
      squeeze: 'Clench both fists as tight as you can',
      release: 'Slowly release - feel the difference',
    },
    {
      name: 'Shoulders',
      squeeze: 'Raise your shoulders up to your ears and hold',
      release: 'Release - feel the weight drop away',
    },
    {
      name: 'Face',
      squeeze: 'Scrunch all face muscles: eyes, jaw, forehead',
      release: 'Let go - open your mouth slightly, face soft',
    },
    {
      name: 'Abdomen',
      squeeze: 'Tighten your stomach muscles firmly',
      release: 'Release - take a full, slow breath',
    },
    {
      name: 'Thighs',
      squeeze: 'Press your thighs firmly together',
      release: 'Release - feel the seat beneath you',
    },
    {
      name: 'Feet',
      squeeze: 'Curl your toes in tightly',
      release: 'Release - feel the floor under your feet',
    },
  ],
  ar: [
    {
      name: 'اليدان',
      squeeze: 'اقبض قبضتيك بأقصى ما تستطيع',
      release: 'أفلِت ببطء - لاحظ الفرق',
    },
    {
      name: 'الكتفان',
      squeeze: 'ارفع كتفيك نحو أذنيك واثبت',
      release: 'أرخِ - اشعر بالثقل ينزل',
    },
    {
      name: 'الوجه',
      squeeze: 'اقبض كل عضلات وجهك: العينين، الفك، الجبين',
      release: 'أرخِ - افتح فمك قليلًا، والوجه مرتخٍ',
    },
    {
      name: 'البطن',
      squeeze: 'شُدّ عضلات بطنك بقوة',
      release: 'أرخِ - خذ نفسًا عميقًا وواسعًا',
    },
    {
      name: 'الفخذان',
      squeeze: 'اضغط فخذيك بقوة أحدهما نحو الآخر',
      release: 'أرخِ - اشعر بالمقعد تحتك',
    },
    {
      name: 'القدمان',
      squeeze: 'اثنِ أصابع قدميك إلى الداخل بقوة',
      release: 'أرخِ - اشعر بالأرض تحت قدميك',
    },
  ],
  ru: [
    {
      name: 'Кисти рук',
      squeeze: 'Сожмите оба кулака как можно крепче',
      release: 'Медленно отпустите - заметьте разницу',
    },
    {
      name: 'Плечи',
      squeeze: 'Поднимите плечи к ушам и задержите',
      release: 'Отпустите - почувствуйте, как уходит тяжесть',
    },
    {
      name: 'Лицо',
      squeeze: 'Напрягите все мышцы лица: глаза, челюсть, лоб',
      release: 'Отпустите - слегка приоткройте рот, лицо расслаблено',
    },
    {
      name: 'Живот',
      squeeze: 'Крепко напрягите мышцы живота',
      release: 'Отпустите - сделайте глубокий, медленный вдох',
    },
    {
      name: 'Бёдра',
      squeeze: 'Крепко сожмите бёдра вместе',
      release: 'Отпустите - почувствуйте опору под собой',
    },
    {
      name: 'Стопы',
      squeeze: 'Сильно поджмите пальцы ног',
      release: 'Отпустите - почувствуйте пол под ногами',
    },
  ],
  fr: [
    {
      name: 'Les mains',
      squeeze: 'Serrez les deux poings aussi fort que possible',
      release: 'Relâchez lentement - remarquez la différence',
    },
    {
      name: 'Les épaules',
      squeeze: 'Montez les épaules vers les oreilles et maintenez',
      release: 'Relâchez - sentez le poids qui descend',
    },
    {
      name: 'Le visage',
      squeeze: 'Contractez tous les muscles du visage : yeux, mâchoire, front',
      release: 'Relâchez - entrouvrez la bouche, le visage détendu',
    },
    {
      name: 'Le ventre',
      squeeze: 'Contractez fermement les muscles du ventre',
      release: 'Relâchez - prenez une respiration ample et lente',
    },
    {
      name: 'Les cuisses',
      squeeze: 'Pressez fermement les cuisses l\'une contre l\'autre',
      release: 'Relâchez - sentez le siège sous vous',
    },
    {
      name: 'Les pieds',
      squeeze: 'Recroquevillez fortement les orteils',
      release: 'Relâchez - sentez le sol sous vos pieds',
    },
  ],
};

const STRINGS = {
  he: {
    title: 'כיווץ ושחרור שרירים',
    intro: 'תרגיל PMR מפחית מתח גופני על ידי כיווץ ושחרור של 6 קבוצות שרירים. כ-2 דקות.',
    start: 'התחלה',
    again: 'עוד פעם',
    done_title: 'כל הכבוד.',
    done_text: 'קחו רגע לשים לב איך הגוף שלכם מרגיש עכשיו.',
    squeeze_label: 'כיווץ',
    release_label: 'שחרור',
    eran: 'ער״ן: 1201',
  },
  en: {
    title: 'Squeeze & Release',
    intro: 'PMR reduces physical tension by tensing and releasing 6 muscle groups. About 2 minutes.',
    start: 'Start',
    again: 'Start again',
    done_title: 'Well done.',
    done_text: 'Take a moment to notice how your body feels now.',
    squeeze_label: 'Tense',
    release_label: 'Release',
    eran: 'Eran: 1201',
  },
  ar: {
    title: 'شدّ العضلات وإرخاؤها',
    intro: 'تمرين الاسترخاء العضلي التدريجي يخفّف التوتر الجسدي عبر شدّ 6 مجموعات عضلية وإرخائها. نحو دقيقتين.',
    start: 'ابدأ',
    again: 'مرة أخرى',
    done_title: 'أحسنت.',
    done_text: 'خذ لحظة لتلاحظ كيف يشعر جسدك الآن.',
    squeeze_label: 'شدّ',
    release_label: 'إرخاء',
    eran: 'إيران: 1201',
  },
  ru: {
    title: 'Напряжение и расслабление мышц',
    intro: 'Прогрессивная мышечная релаксация снижает телесное напряжение через напряжение и расслабление 6 групп мышц. Около 2 минут.',
    start: 'Начать',
    again: 'Ещё раз',
    done_title: 'Молодец.',
    done_text: 'Уделите минуту, чтобы заметить, как ваше тело чувствует себя сейчас.',
    squeeze_label: 'Напряжение',
    release_label: 'Расслабление',
    eran: 'ЭРАН: 1201',
  },
  fr: {
    title: 'Contraction et relâchement musculaire',
    intro: 'La relaxation musculaire progressive réduit la tension physique en contractant et en relâchant 6 groupes de muscles. Environ 2 minutes.',
    start: 'Commencer',
    again: 'Recommencer',
    done_title: 'Bravo.',
    done_text: 'Prenez un instant pour remarquer comment votre corps se sent maintenant.',
    squeeze_label: 'Contraction',
    release_label: 'Relâchement',
    eran: 'ERAN : 1201',
  },
};

// Flat phase list: [squeeze g0, release g0, squeeze g1, release g1, ...]
function buildPhases(groups) {
  return groups.flatMap((g, gi) => [
    { groupIdx: gi, action: 'squeeze', instruction: g.squeeze, seconds: SQUEEZE_SECS },
    { groupIdx: gi, action: 'release', instruction: g.release, seconds: RELEASE_SECS },
  ]);
}

const SHAPE_PX = 208;
const RING_R = SHAPE_PX / 2 - 5;
const RING_CIRC = 2 * Math.PI * RING_R;

// Warm clay for squeeze, cool sage for release
const COLOR_SQUEEZE = '#C07B5A';
const COLOR_RELEASE = '#7A9E8D';

function TimerRing({ progress, isSqueeze }) {
  const offset = RING_CIRC * (1 - progress);
  const color = isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE;
  return (
    <svg
      width={SHAPE_PX}
      height={SHAPE_PX}
      className="absolute inset-0"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={SHAPE_PX / 2} cy={SHAPE_PX / 2} r={RING_R}
        fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={3}
      />
      <circle
        cx={SHAPE_PX / 2} cy={SHAPE_PX / 2} r={RING_R}
        fill="none" stroke={color} strokeOpacity={0.65} strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={RING_CIRC}
        strokeDashoffset={offset}
        style={{ transition: `stroke-dashoffset ${TICK_MS}ms linear` }}
      />
    </svg>
  );
}

export default function CalmingMuscle() {
  const { lang } = useLang();
  const groups = GROUPS[lang] || GROUPS.he;
  const s = STRINGS[lang] || STRINGS.he;
  const phases = buildPhases(groups);

  const [started, setStarted] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!started || done) return;
    const id = setInterval(() => setElapsed(e => e + TICK_MS / 1000), TICK_MS);
    return () => clearInterval(id);
  }, [started, done]);

  useEffect(() => {
    if (!started || done) return;
    const phase = phases[phaseIdx];
    if (elapsed >= phase.seconds) {
      if (phaseIdx < phases.length - 1) {
        setPhaseIdx(i => i + 1);
        setElapsed(0);
      } else {
        setDone(true);
      }
    }
  }, [elapsed, phaseIdx, started, done, phases]);

  function restart() {
    setStarted(false);
    setPhaseIdx(0);
    setElapsed(0);
    setDone(false);
  }

  const phase = phases[phaseIdx];
  const isSqueeze = phase?.action === 'squeeze';
  const progress = phase ? Math.min(1, elapsed / phase.seconds) : 0;
  const secondsLeft = phase ? Math.max(1, Math.ceil(phase.seconds - elapsed)) : 0;
  const currentGroup = groups[phase?.groupIdx ?? 0];
  const completedGroups = Math.floor(phaseIdx / 2);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 pt-14">
      <div className="w-full max-w-sm flex flex-col items-center text-center">

        {!started ? (
          <>
            <h2 className="font-heading font-semibold text-3xl text-foreground mb-3">{s.title}</h2>
            <p className="text-card-foreground leading-relaxed mb-10 max-w-xs">{s.intro}</p>
            <button
              onClick={() => setStarted(true)}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg hover:bg-primary/90 transition-colors duration-300 shadow-card hover:shadow-card-hover"
            >
              {s.start}
            </button>
          </>

        ) : done ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <span className="text-3xl font-heading font-bold text-primary">✓</span>
            </div>
            <h2 className="font-heading font-semibold text-3xl text-foreground mb-3">{s.done_title}</h2>
            <p className="text-card-foreground leading-relaxed mb-10 max-w-xs">{s.done_text}</p>
            <button
              onClick={restart}
              className="px-10 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg hover:bg-primary/90 transition-colors duration-300 shadow-card"
            >
              {s.again}
            </button>
          </>

        ) : (
          <>
            {/* Group progress dots */}
            <div className="flex gap-2.5 mb-10">
              {groups.map((_, i) => {
                const isDone = i < completedGroups;
                const isActive = i === completedGroups;
                return (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${isDone ? 'bg-primary' : isActive ? 'scale-125' : 'bg-border'}`}
                    style={isActive ? { backgroundColor: isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE } : undefined}
                  />
                );
              })}
            </div>

            {/* Body part label */}
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2 font-semibold">
              {currentGroup.name}
            </div>

            {/* Morphing shape + timer ring */}
            <div className="relative flex items-center justify-center mb-7" style={{ width: SHAPE_PX, height: SHAPE_PX }}>
              <TimerRing progress={progress} isSqueeze={isSqueeze} />
              <div
                style={{
                  width: isSqueeze ? '118px' : '158px',
                  height: isSqueeze ? '118px' : '158px',
                  borderRadius: isSqueeze ? '18px' : '50%',
                  backgroundColor: isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE,
                  transition: 'all 700ms ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="text-white text-sm font-semibold tracking-wide select-none">
                  {isSqueeze ? s.squeeze_label : s.release_label}
                </span>
              </div>
            </div>

            {/* Instruction */}
            <p className="font-heading font-semibold text-lg text-foreground leading-snug mb-3 max-w-xs">
              {phase.instruction}
            </p>

            {/* Countdown */}
            <div
              className="text-5xl font-heading font-bold tabular-nums transition-colors duration-700"
              style={{ color: isSqueeze ? COLOR_SQUEEZE : COLOR_RELEASE }}
            >
              {secondsLeft}
            </div>
          </>
        )}

        <div className="mt-12">
          <a href="tel:1201" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
            {s.eran}
          </a>
        </div>
      </div>
    </div>
  );
}
