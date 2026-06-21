import React from 'react';
import { useTheme } from '@/lib/ThemeContext';

function getTextureSvg(id, color) {
  // '#' in a hex color breaks inline SVG data URLs; encode the whole string to escape it.
  const c = encodeURIComponent(color);

  switch (id) {
    case 'bubbles':
      // 5 circles, well spread, all inside 800x800
      return `url("data:image/svg+xml,%3Csvg width='800' height='800' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='110' cy='160' r='55' fill='${c}' opacity='0.07'/%3E%3Ccircle cx='620' cy='120' r='22' fill='${c}' opacity='0.11'/%3E%3Ccircle cx='430' cy='420' r='70' fill='${c}' opacity='0.04'/%3E%3Ccircle cx='720' cy='560' r='18' fill='${c}' opacity='0.12'/%3E%3Ccircle cx='180' cy='660' r='42' fill='${c}' opacity='0.08'/%3E%3C/svg%3E")`;

    case 'micro':
      // halved opacities
      return `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='18' cy='22' r='2' fill='${c}' opacity='0.15'/%3E%3Ccircle cx='68' cy='8' r='3.5' fill='${c}' opacity='0.11'/%3E%3Ccircle cx='140' cy='30' r='1.5' fill='${c}' opacity='0.17'/%3E%3Ccircle cx='210' cy='15' r='4' fill='${c}' opacity='0.09'/%3E%3Ccircle cx='275' cy='40' r='2' fill='${c}' opacity='0.14'/%3E%3Ccircle cx='35' cy='80' r='5' fill='${c}' opacity='0.08'/%3E%3Ccircle cx='100' cy='70' r='1.5' fill='${c}' opacity='0.16'/%3E%3Ccircle cx='165' cy='90' r='3' fill='${c}' opacity='0.12'/%3E%3Ccircle cx='240' cy='75' r='2' fill='${c}' opacity='0.15'/%3E%3Ccircle cx='285' cy='100' r='4.5' fill='${c}' opacity='0.07'/%3E%3Ccircle cx='10' cy='145' r='3' fill='${c}' opacity='0.12'/%3E%3Ccircle cx='75' cy='130' r='2' fill='${c}' opacity='0.16'/%3E%3Ccircle cx='130' cy='155' r='5.5' fill='${c}' opacity='0.06'/%3E%3Ccircle cx='200' cy='140' r='1.5' fill='${c}' opacity='0.18'/%3E%3Ccircle cx='255' cy='160' r='3' fill='${c}' opacity='0.11'/%3E%3Ccircle cx='40' cy='200' r='2.5' fill='${c}' opacity='0.14'/%3E%3Ccircle cx='110' cy='210' r='4' fill='${c}' opacity='0.10'/%3E%3Ccircle cx='180' cy='195' r='2' fill='${c}' opacity='0.16'/%3E%3Ccircle cx='245' cy='215' r='6' fill='${c}' opacity='0.06'/%3E%3Ccircle cx='290' cy='200' r='1.5' fill='${c}' opacity='0.17'/%3E%3Ccircle cx='20' cy='260' r='4' fill='${c}' opacity='0.09'/%3E%3Ccircle cx='85' cy='275' r='2' fill='${c}' opacity='0.15'/%3E%3Ccircle cx='155' cy='255' r='3.5' fill='${c}' opacity='0.11'/%3E%3Ccircle cx='220' cy='270' r='2' fill='${c}' opacity='0.14'/%3E%3Ccircle cx='270' cy='285' r='5' fill='${c}' opacity='0.07'/%3E%3C/svg%3E")`;

    case 'constellation':
      // halved opacities
      return `url("data:image/svg+xml,%3Csvg width='600' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='80' y1='100' x2='220' y2='180' stroke='${c}' stroke-width='0.6' opacity='0.09'/%3E%3Cline x1='220' y1='180' x2='380' y2='120' stroke='${c}' stroke-width='0.6' opacity='0.09'/%3E%3Cline x1='380' y1='120' x2='500' y2='250' stroke='${c}' stroke-width='0.6' opacity='0.09'/%3E%3Cline x1='150' y1='350' x2='300' y2='400' stroke='${c}' stroke-width='0.6' opacity='0.07'/%3E%3Cline x1='300' y1='400' x2='450' y2='340' stroke='${c}' stroke-width='0.6' opacity='0.07'/%3E%3Cline x1='450' y1='340' x2='540' y2='480' stroke='${c}' stroke-width='0.6' opacity='0.07'/%3E%3Ccircle cx='80' cy='100' r='4' fill='${c}' opacity='0.20'/%3E%3Ccircle cx='220' cy='180' r='6' fill='${c}' opacity='0.16'/%3E%3Ccircle cx='380' cy='120' r='3' fill='${c}' opacity='0.19'/%3E%3Ccircle cx='500' cy='250' r='5' fill='${c}' opacity='0.17'/%3E%3Ccircle cx='150' cy='350' r='4' fill='${c}' opacity='0.19'/%3E%3Ccircle cx='300' cy='400' r='7' fill='${c}' opacity='0.14'/%3E%3Ccircle cx='450' cy='340' r='3' fill='${c}' opacity='0.20'/%3E%3Ccircle cx='540' cy='480' r='5' fill='${c}' opacity='0.16'/%3E%3Ccircle cx='30' cy='220' r='2' fill='${c}' opacity='0.17'/%3E%3Ccircle cx='560' cy='80' r='2.5' fill='${c}' opacity='0.15'/%3E%3Ccircle cx='100' cy='520' r='3' fill='${c}' opacity='0.14'/%3E%3Ccircle cx='480' cy='560' r='2' fill='${c}' opacity='0.17'/%3E%3Ccircle cx='260' cy='60' r='2.5' fill='${c}' opacity='0.15'/%3E%3Ccircle cx='340' cy='500' r='2' fill='${c}' opacity='0.16'/%3E%3C/svg%3E")`;

    case 'topography':
      // halved opacities
      return `url("data:image/svg+xml,%3Csvg width='500' height='500' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='120' cy='130' r='90' fill='none' stroke='${c}' stroke-width='1' opacity='0.09'/%3E%3Ccircle cx='120' cy='130' r='58' fill='none' stroke='${c}' stroke-width='0.8' opacity='0.11'/%3E%3Ccircle cx='120' cy='130' r='28' fill='none' stroke='${c}' stroke-width='0.7' opacity='0.14'/%3E%3Ccircle cx='390' cy='200' r='110' fill='none' stroke='${c}' stroke-width='1' opacity='0.07'/%3E%3Ccircle cx='390' cy='200' r='72' fill='none' stroke='${c}' stroke-width='0.8' opacity='0.09'/%3E%3Ccircle cx='390' cy='200' r='38' fill='none' stroke='${c}' stroke-width='0.7' opacity='0.12'/%3E%3Ccircle cx='240' cy='420' r='80' fill='none' stroke='${c}' stroke-width='1' opacity='0.08'/%3E%3Ccircle cx='240' cy='420' r='48' fill='none' stroke='${c}' stroke-width='0.8' opacity='0.11'/%3E%3Ccircle cx='240' cy='420' r='20' fill='none' stroke='${c}' stroke-width='0.7' opacity='0.14'/%3E%3Ccircle cx='30' cy='380' r='60' fill='none' stroke='${c}' stroke-width='0.8' opacity='0.07'/%3E%3Ccircle cx='30' cy='380' r='32' fill='none' stroke='${c}' stroke-width='0.7' opacity='0.09'/%3E%3Ccircle cx='480' cy='450' r='70' fill='none' stroke='${c}' stroke-width='0.8' opacity='0.07'/%3E%3Ccircle cx='480' cy='450' r='38' fill='none' stroke='${c}' stroke-width='0.7' opacity='0.09'/%3E%3C/svg%3E")`;


    default:
      return 'none';
  }
}

export default function TextureOverlay() {
  const { textureId, palette } = useTheme();
  if (textureId === 'none') return null;

  const bg = getTextureSvg(textureId, palette.primary);
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{ backgroundImage: bg, backgroundRepeat: 'repeat' }}
    />
  );
}
