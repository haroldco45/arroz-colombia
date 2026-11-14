// Fotos y videos reales de ARROZ para la app (Wikimedia Commons), filtrados por título.
// Se renuevan cada 7 días. Salida: data/fotos.json
import { readFile, writeFile } from 'node:fs/promises';
const UA = { 'User-Agent': 'VibrasPositivasHM-robot/1.0 (https://arroz-colombia.netlify.app)' };
const OUT = 'data/fotos.json';
const SI = /rice|arroz|oryza|paddy|padi|arrozal|ricefield|rizi[eè]re|reisfeld|sawah/i;
const NO = /atollad|arroz con|arroz de |chaufa|tamal|sancocho|guiso|quinoa|amaranth|millet|sorghum|wheat|barley|maize|corn|cake|puff|cracker|wild[ _-]?rice|zizania|sushi|dish|food|meal|curry|fried|bowl|plate|dessert|pudding|risotto|paella|dumpling|noodle|wine|sake|logo|map|chart|diagram|stamp|coin|insect|bird|weevil|bug|beetle|frog|snake|duck|cooked|cooking|recipe|kitchen|restaurant|market stall|porridge|congee|biryani|pilaf|bibimbap|onigiri|mochi|tteok|straw art|doll|museum|painting|drawing|book|text|svg|portrait|selfie|ceremony|festival|church|temple|statue/i;
const SECCIONES = {
  hero:     ['rice paddy field', 'rice field landscape', 'Oryza sativa field'],
  cultivo:  ['rice paddy field', 'rice planting farmers', 'rice seedlings paddy', 'Oryza sativa plants'],
  insumos:  ['Oryza sativa seeds', 'paddy rice grains', 'rice seedlings nursery', 'rice panicle'],
  zonas:    ['arroz Colombia', 'arrozal', 'rice harvest combine harvester', 'rice harvest field'],
  molino:   ['rice mill', 'rice milling', 'rice husking machine', 'paddy drying'],
  mundo:    ['rice terraces', 'rice paddies Asia', 'rice field Vietnam', 'rice field Thailand'],
  innov:    ['rice transplanter machine', 'drone spraying rice field', 'rice research field trial', 'rice harvester machine']
};
async function buscar(q, tipo){
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=40' +
    '&gsrsearch=' + encodeURIComponent(`filetype:${tipo} ${q}`) + '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=900';
  const j = await (await fetch(url, { headers: UA })).json();
  return Object.values(j.query?.pages || {}).map(p => {
    const ii = p.imageinfo?.[0]; if (!ii) return null;
    const md = ii.extmetadata || {};
    const desc = (md.ImageDescription?.value || '').replace(/<[^>]+>/g, ' ');
    const cats = md.Categories?.value || '';
    return { titulo: p.title, src: ii.thumburl || ii.url, full: ii.url, page: ii.descriptionurl, w: ii.width, h: ii.height,
      autor: (md.Artist?.value || 'Wikimedia Commons').replace(/<[^>]+>/g, '').trim().slice(0, 60),
      lic: md.LicenseShortName?.value || '', texto: p.title + ' ' + desc + ' ' + cats };
  }).filter(Boolean);
}
const ok = f => SI.test(f.titulo) && !NO.test(f.texto) && f.w >= 800 && f.w > f.h * 1.15;
export async function fotos(force = false){
  try {
    const prev = JSON.parse(await readFile(OUT, 'utf8'));
    if (!force && Date.now() - new Date(prev.actualizado).getTime() < 7 * 864e5) return;
  } catch {}
  const out = { actualizado: new Date().toISOString(), secciones: {}, videos: [] };
  const usadas = new Set();
  for (const [k, qs] of Object.entries(SECCIONES)) {
    const lista = [];
    for (const q of qs) {
      try { for (const f of await buscar(q, 'bitmap')) if (ok(f) && !usadas.has(f.titulo)) { usadas.add(f.titulo); lista.push(f); } } catch (e) { console.log('Fotos', q, e.message); }
      if (lista.length >= 8) break;
    }
    out.secciones[k] = lista.slice(0, 8).map(({ texto, ...f }) => f);
    console.log('Fotos', k, out.secciones[k].length, out.secciones[k].map(f => f.titulo).join(' | '));
  }
  try {
    for (const q of ['rice harvest', 'rice planting', 'rice paddy']) {
      for (const v of await buscar(q, 'video')) if (SI.test(v.titulo) && !NO.test(v.texto) && !out.videos.find(x => x.titulo === v.titulo)) out.videos.push((({ texto, ...f }) => f)(v));
    }
    console.log('Videos', out.videos.map(v => v.titulo).join(' | '));
  } catch (e) { console.log('Videos', e.message); }
  await writeFile(OUT, JSON.stringify(out, null, 1));
}
