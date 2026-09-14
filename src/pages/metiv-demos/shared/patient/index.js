// Public API of the patient kit. Design versions import from here only.

import { ROUTES } from '@/pages/metiv-demos/shared/routes';
import { IMAGES } from '@/lib/images';
import { tx, SITE_NAME } from './copy';
import {
  CONSULTATION,
  ERAN_PHONE,
  ERAN_WHATSAPP,
  METIV_SERVICES,
  ADDITION_ANCHORS,
} from './additions';

import FirstCircle from './pages/FirstCircle';
import SecondCircle from './pages/SecondCircle';
import SecondCircleTools from './pages/SecondCircleTools';
import Questionnaire from './pages/Questionnaire';
import PTSDInfo from './pages/PTSDInfo';
import SelfHelp from './pages/SelfHelp';
import Treatment from './pages/Treatment';
import WhereToGetHelp from './pages/WhereToGetHelp';
import FreeTreatmentAndResearch from './pages/FreeTreatmentAndResearch';
import Rights from './pages/Rights';
import Community from './pages/Community';
import Children from './pages/Children';
import Sources from './pages/Sources';
import Calming from './pages/Calming';
import CalmingBreathing from './pages/CalmingBreathing';
import CalmingGrounding from './pages/CalmingGrounding';
import CalmingMuscle from './pages/CalmingMuscle';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

export { SITE_NAME } from './copy';

/**
 * Page bodies keyed by ROUTES key. Mount each at versionBase + ROUTES[key],
 * inside <DemoChromeProvider>. No props.
 * @type {Record<string, () => JSX.Element>}
 */
export const PATIENT_PAGES = {
  firstCircle: FirstCircle,
  secondCircle: SecondCircle,
  secondCircleTools: SecondCircleTools,
  questionnaire: Questionnaire,
  ptsdInfo: PTSDInfo,
  selfHelp: SelfHelp,
  treatment: Treatment,
  whereToGetHelp: WhereToGetHelp,
  freeTreatment: FreeTreatmentAndResearch,
  rights: Rights,
  community: Community,
  children: Children,
  sources: Sources,
  calming: Calming,
  calmingBreathing: CalmingBreathing,
  calmingGrounding: CalmingGrounding,
  calmingMuscle: CalmingMuscle,
  privacy: PrivacyPolicy,
  terms: TermsOfUse,
};

/** Route keys to render in a minimal distraction-free shell (mirrors Layout.jsx). */
export const SANCTUARY_ROUTES = ['calming', 'calmingBreathing', 'calmingGrounding', 'calmingMuscle'];

/**
 * @typedef {{ key: string, label: string, route: string }} NavLink
 * @typedef {NavLink & { children?: NavLink[] }} NavItem
 */

/** @type {NavLink[]} */
const FIRST_CIRCLE_LINKS = [
  { key: 'ptsdInfo', label: tx('nav_ptsd_info'), route: ROUTES.ptsdInfo },
  { key: 'selfHelp', label: tx('nav_self_help'), route: ROUTES.selfHelp },
  { key: 'rights', label: tx('nav_rights'), route: ROUTES.rights },
  { key: 'treatment', label: tx('nav_treatment'), route: ROUTES.treatment },
  { key: 'community', label: tx('nav_community'), route: ROUTES.community },
  { key: 'children', label: tx('nav_children'), route: ROUTES.children },
];

// Order mirrors the SecondCircle landing page (children before community).
/** @type {NavLink[]} */
const SECOND_CIRCLE_LINKS = [
  { key: 'ptsdInfo', label: tx('nav_ptsd_info'), route: ROUTES.ptsdInfo },
  { key: 'secondCircleTools', label: tx('nav_second_circle_tools'), route: ROUTES.secondCircleTools },
  { key: 'rights', label: tx('nav_rights'), route: ROUTES.rights },
  { key: 'treatment', label: tx('nav_treatment'), route: ROUTES.treatment },
  { key: 'children', label: tx('nav_children'), route: ROUTES.children },
  { key: 'community', label: tx('nav_community'), route: ROUTES.community },
];

/** Ordered sub-navigation for the patient area. @type {NavItem[]} */
export const PATIENT_NAV = [
  { key: 'patient', label: 'ראשי', route: ROUTES.patient },
  { key: 'firstCircle', label: tx('path1_title'), route: ROUTES.firstCircle, children: FIRST_CIRCLE_LINKS },
  { key: 'secondCircle', label: tx('path2_title'), route: ROUTES.secondCircle, children: SECOND_CIRCLE_LINKS },
  { key: 'questionnaire', label: tx('questionnaire'), route: ROUTES.questionnaire },
  { key: 'whereToGetHelp', label: 'איפה מקבלים טיפול', route: ROUTES.whereToGetHelp },
  { key: 'freeTreatment', label: 'טיפולים ללא עלות ומחקרים', route: ROUTES.freeTreatment },
  { key: 'calming', label: tx('calming'), route: ROUTES.calming },
  { key: 'sources', label: tx('sources'), route: ROUTES.sources },
];

/**
 * @typedef {{ key: string, label: string, route: string, icon: string, description: string }} HubLink
 */

/** Data for the patient hub page that replaces the old home page. */
export const PATIENT_HUB = {
  hero: {
    brand: SITE_NAME,
    eyebrow: tx('hero_eyebrow'),
    headline: tx('hero_headline'),
    subtitle: tx('hero_subtitle'),
    ctaLabel: tx('quick_nav_title'),
    image: IMAGES.home_hero,
    about: tx('about_ptsd_short'),
    aboutLinkLabel: tx('read_more'),
    aboutRoute: ROUTES.ptsdInfo,
  },

  paths: [
    { key: 'firstCircle', route: ROUTES.firstCircle, title: tx('path1_title'), subtitle: tx('path1_subtitle'), image: IMAGES.home_path1, ctaLabel: tx('enter_path') },
    { key: 'secondCircle', route: ROUTES.secondCircle, title: tx('path2_title'), subtitle: tx('path2_subtitle'), image: IMAGES.home_path2, ctaLabel: tx('enter_path') },
    { key: 'questionnaire', route: ROUTES.questionnaire, title: tx('path3_title'), subtitle: tx('path3_subtitle'), image: IMAGES.home_path3, ctaLabel: tx('enter_path') },
  ],

  /** @type {HubLink[]} */
  quickLinks: [
    { key: 'ptsdInfo', label: tx('ptsd_info'), route: ROUTES.ptsdInfo, icon: 'Brain', description: 'שאלות ותשובות על פוסט-טראומה.' },
    { key: 'selfHelp', label: tx('self_help'), route: ROUTES.selfHelp, icon: 'Wind', description: 'כלים שאפשר לנסות לבד, אפליקציות והרצאות וידאו.' },
    { key: 'treatment', label: tx('treatment'), route: ROUTES.treatment, icon: 'Heart', description: 'מפת הדרכים לטיפול, שלב אחר שלב.' },
    { key: 'whereToGetHelp', label: 'איפה אפשר לקבל טיפול', route: ROUTES.whereToGetHelp, icon: 'MapPin', description: 'מסגרות טיפול ופרטי פנייה, באותו מבנה לכולן.' },
    { key: 'freeTreatment', label: 'טיפולים ללא עלות ומחקרים', route: ROUTES.freeTreatment, icon: 'HandHeart', description: 'מסגרות ללא עלות ומחקרים שמגייסים משתתפים.' },
    { key: 'rights', label: tx('rights'), route: ROUTES.rights, icon: 'FileText', description: 'זכויות לפי סוג הפגיעה, ואיך מגישים.' },
    { key: 'community', label: tx('community'), route: ROUTES.community, icon: 'Users', description: 'קבוצות תמיכה ומפגשים ברחבי הארץ.' },
    { key: 'secondCircleTools', label: tx('nav_second_circle_tools'), route: ROUTES.secondCircleTools, icon: 'Shield', description: 'כלים לבני משפחה ולקרובים.' },
    { key: 'children', label: tx('children_content'), route: ROUTES.children, icon: 'Baby', description: 'איך מדברים עם ילדים, לפי גיל.' },
    { key: 'calming', label: tx('calming'), route: ROUTES.calming, icon: 'Wind', description: 'נשימות, קרקוע והרפיית שרירים.' },
    { key: 'questionnaire', label: tx('questionnaire'), route: ROUTES.questionnaire, icon: 'ClipboardList', description: 'שאלון אנונימי לבדיקה עצמית. אינו אבחון.' },
    { key: 'sources', label: tx('sources'), route: ROUTES.sources, icon: 'Library', description: 'המקורות שעליהם מבוסס המידע.' },
  ],

  /** The 8 Metiv additions, for highlighting. @type {HubLink[]} */
  additions: [
    { key: 'whereToGetHelp', label: 'איפה אפשר לקבל טיפול', route: ROUTES.whereToGetHelp, icon: 'MapPin', description: 'מסגרות ציבוריות, עמותות ומרפאות מטיב, עם פרטי פנייה.' },
    { key: 'freeTreatment', label: 'טיפולים ללא עלות והשתתפות במחקרים', route: ROUTES.freeTreatment, icon: 'HandHeart', description: 'למי מתאים, מה כולל ואיך פונים.' },
    { key: 'veterans', label: 'חיילים משוחררים ומילואימניקים', route: `${ROUTES.community}#${ADDITION_ANCHORS.veterans}`, icon: 'Compass', description: 'מסע שחרור, קבוצות למשפחות מילואים וקבוצות הורים וילדים.' },
    { key: 'parentChildGroups', label: 'קבוצות להורים וילדים', route: `${ROUTES.children}#${ADDITION_ANCHORS.parentChildGroups}`, icon: 'Baby', description: 'פנד"ה, נמ"ל ומפגש משחק ללא עלות.' },
    { key: 'reservistFamilies', label: 'לבני משפחה של מילואימניקים', route: `${ROUTES.secondCircleTools}#${ADDITION_ANCHORS.reservistFamilies}`, icon: 'Users', description: 'פנד"ה למשפחה ונמ"ל למשפחה.' },
    { key: 'metivBooks', label: 'ספרים של אנשי מטיב', route: `${ROUTES.sources}#${ADDITION_ANCHORS.metivBooks}`, icon: 'Library', description: 'ספרים שכתבו או ערכו אנשי מטיב.' },
    { key: 'videoLectures', label: 'הרצאות וידאו', route: `${ROUTES.selfHelp}#${ADDITION_ANCHORS.videoLectures}`, icon: 'Youtube', description: 'ערוץ היוטיוב של מטיב.' },
    { key: 'consultation', label: CONSULTATION.title, route: CONSULTATION.route, icon: 'MessageCircle', description: CONSULTATION.text },
  ],

  crisisLines: [
    { key: 'eranPhone', label: tx('footer_emergency_heading'), value: ERAN_PHONE, href: `tel:${ERAN_PHONE}`, icon: 'Phone' },
    { key: 'eranWhatsapp', label: 'ער"ן בוואטסאפ', value: 'WhatsApp', href: ERAN_WHATSAPP, icon: 'MessageCircle' },
  ],

  consultation: {
    title: CONSULTATION.title,
    text: CONSULTATION.text,
    phone: CONSULTATION.phone,
    route: CONSULTATION.route,
    linkLabel: CONSULTATION.linkLabel,
  },

  /** Metiv service anchors on the directory page, for landing-page links. */
  metivServices: METIV_SERVICES.map((s) => ({
    id: s.id,
    title: s.title,
    icon: s.icon,
    route: `${ROUTES.whereToGetHelp}#${s.id}`,
  })),

  disclaimer: tx('footer_disclaimer'),
};
