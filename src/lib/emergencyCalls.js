// Call buttons in chat answers. When an answer mentions ERAN 1201, MDA 101 or
// the police 100, the chat shows a "call" button on its own line right after
// the line that mentions it. 1201 is unambiguous on its own; 101 and 100 count
// only next to the service's name on the same line, so "100 שעות" in a course
// answer stays plain text. Each number gets one button per answer, at its
// first mention.

/** @typedef {'1201'|'101'|'100'} EmergencyNumber */

const NUMBER = /(?<![\d.,/-])(1201|101|100)(?![\d%]|[.,]\d)/g;

/** @type {Record<EmergencyNumber, RegExp|null>} */
const NEEDS_NAME = {
  1201: null,
  101: /מד["״']?א|מגן דוד|אמבולנס|\bMDA\b|Magen David|ambulance|نجمة داود|إسعاف|Маген Давид|МАДА|скор/i,
  100: /משטר|police|polic|الشرطة|شرطة|полици/i,
};

/**
 * Splits an answer into Markdown segments, each followed by the call buttons
 * its last line earned. Joining the `md` parts gives back the original text.
 * @param {string} text
 * @returns {{ md: string, calls: EmergencyNumber[] }[]}
 */
export function splitForCallButtons(text) {
  /** @type {{ md: string, calls: EmergencyNumber[] }[]} */
  const out = [];
  const seen = new Set();
  let buf = [];
  for (const line of text.split('\n')) {
    buf.push(line);
    /** @type {EmergencyNumber[]} */
    const calls = [];
    for (const m of line.matchAll(NUMBER)) {
      const n = /** @type {EmergencyNumber} */ (m[1]);
      const name = NEEDS_NAME[n];
      if (seen.has(n) || calls.includes(n) || (name && !name.test(line))) continue;
      calls.push(n);
    }
    if (calls.length) {
      calls.forEach((n) => seen.add(n));
      out.push({ md: buf.join('\n'), calls });
      buf = [];
    }
  }
  if (buf.length) out.push({ md: buf.join('\n'), calls: [] });
  return out;
}

/** i18n key of each number's button label. */
export const CALL_LABEL_KEY = { 1201: 'chat_call_1201', 101: 'chat_call_101', 100: 'chat_call_100' };
