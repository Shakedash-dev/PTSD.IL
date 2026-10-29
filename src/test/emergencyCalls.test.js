import { describe, it, expect } from 'vitest';
import { splitForCallButtons } from '@/lib/emergencyCalls';

const calls = (text) => splitForCallButtons(text).flatMap((s) => s.calls);

describe('call buttons in chat answers', () => {
  it('puts each button right after the line that mentions the number', () => {
    const text = [
      'אני שומע אותך.',
      '**אפשר לדבר עם מישהו עכשיו:** ער״ן בטלפון **1201**, ואפשר גם בוואטסאפ.',
      'את/ה בטוח/ה עכשיו?',
      'אם יש סכנה מיידית - יש להתקשר מיד ל**מד״א 101** או ל**משטרה 100**.',
      'אני כאן.',
    ].join('\n');
    const segs = splitForCallButtons(text);
    expect(segs.map((s) => s.calls)).toEqual([['1201'], ['101', '100'], []]);
    expect(segs[0].md.endsWith('1201**, ואפשר גם בוואטסאפ.')).toBe(true);
    expect(segs.map((s) => s.md).join('\n')).toBe(text);
  });

  it('works in every language', () => {
    expect(calls('contact **MDA (emergency services) at 101** right away')).toEqual(['101']);
    expect(calls('يُرجى الاتصال فورًا بـ **نجمة داود الحمراء على الرقم 101**')).toEqual(['101']);
    expect(calls('обратитесь в службу ЭРАН по номеру **1201**')).toEqual(['1201']);
    expect(calls('Appeler la police au 100 immédiatement')).toEqual(['100']);
    expect(calls('call the police (100) now')).toEqual(['100']);
  });

  it('ignores numbers that are not the emergency lines', () => {
    expect(calls('היקף: 212 שעות אקדמיות, 100 שעות פרונטליות, 10,350 ש"ח')).toEqual([]);
    expect(calls('Phone: 02-6449666, Clalit *8703, NIS 1,100, 100% online, 101.5 FM')).toEqual([]);
    expect(calls('הקורס כולל 101 מפגשים')).toEqual([]);
  });

  it('shows one button per number per answer, at the first mention', () => {
    const segs = splitForCallButtons('ער״ן 1201.\nשוב: ער״ן 1201.\nמד״א 101 עכשיו.');
    expect(segs.map((s) => s.calls)).toEqual([['1201'], ['101']]);
  });

  it('leaves an answer without emergency numbers as one segment', () => {
    expect(splitForCallButtons('שלום\nעולם')).toEqual([{ md: 'שלום\nעולם', calls: [] }]);
  });
});
