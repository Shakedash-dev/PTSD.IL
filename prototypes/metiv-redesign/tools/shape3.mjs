import * as D from './data.mjs';
function shape(v,d=0){
  if (Array.isArray(v)) return `Array(${v.length}) of `+(v.length?shape(v[0],d+1):'?');
  if (v&&typeof v==='object'){ if(d>2) return '{'+Object.keys(v).join(', ')+'}';
    return '{\n'+Object.entries(v).map(([k,x])=>'  '.repeat(d+1)+k+': '+shape(x,d+1)).join('\n')+'\n'+'  '.repeat(d)+'}';}
  if (typeof v==='string') return `str(${v.length}) ${JSON.stringify(v.slice(0,80))}`;
  return typeof v;
}
for (const k of ['FREE_TREATMENTS','RESEARCH_STUDIES','RESERVIST_FAMILY_PROGRAMS','CONSULTATION','VETERANS_PROGRAMS','PARENT_CHILD_GROUPS','METIV_BOOKS','VIDEO_LECTURES','TREATMENT_WHERE_BLOCK'])
  console.log('\n## additions.'+k+' =', shape(D.additions[k]));
for (const k of ['RELEASE_JOURNEY','RELEASE_JOURNEY_STATS','JOURNEY_MODELS','RELEASE_JOURNEY_CONTACTS'])
  console.log('\n## rj.'+k+' =', shape(D.releaseJourney[k]));
for (const k of ['PARTNER_GROUPS','COLLABORATION_GROUPS','COLLABORATION_CONTACT'])
  console.log('\n## about.'+k+' =', shape(D.aboutMetiv[k]));
