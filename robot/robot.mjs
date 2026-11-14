// Robot de noticias de Arroz de Colombia al Día — corre cada 30 minutos en GitHub Actions
// Trae noticias reales (Google Noticias + GDELT) y renueva la foto de vista previa (og.jpg) con una foto real.
import { readFile, writeFile, access } from 'node:fs/promises';

const OUT = 'data/noticias.json';
const UA = { 'User-Agent': 'Mozilla/5.0 (VibrasPositivasHM robot; +https://arroz-colombia.netlify.app)' };
const QUERIES = [
  'arroz Colombia', 'Fedearroz', 'arroceros Colombia', 'arroz paddy verde precio',
  'arroz Bajo Cauca', 'arroz Córdoba Sucre Mojana', 'arroz Casanare Tolima',
  'importaciones arroz Colombia', 'TLC arroz Estados Unidos Colombia', 'MinAgricultura arroz'
];
const RELEVANT = /arroz|arrocer|fedearroz|paddy|molino/i;

const decode = s => s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? decode(m[1]) : ''; };

async function googleNews(q){
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:14d')}&hl=es-419&gl=CO&ceid=CO:es-419`;
  const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error('GN ' + r.status);
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const it = m[1]; let titulo = tag(it, 'title'); const fuente = tag(it, 'source');
    if (fuente && titulo.endsWith(' - ' + fuente)) titulo = titulo.slice(0, -(fuente.length + 3));
    const d = new Date(tag(it, 'pubDate'));
    return { titulo, url: tag(it, 'link'), fuente, fecha: isNaN(d) ? null : d.toISOString(), imagen: '' };
  }).filter(n => n.fecha);
}

async function gdelt(){
  const q = '(arroz OR arroceros OR fedearroz OR "paddy verde") sourcecountry:CO';
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?format=json&mode=artlist&sort=datedesc&maxrecords=60&timespan=14d&query=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error('GDELT ' + r.status);
  const j = JSON.parse(await r.text() || '{}');
  return (j.articles || []).map(a => ({
    titulo: a.title, url: a.url, fuente: a.domain, imagen: a.socialimage || '',
    fecha: new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString()
  }));
}

const keyOf = t => (t || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 60);

async function main(){
  let prev = { items: [] };
  try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
  const batches = await Promise.allSettled([gdelt(), ...QUERIES.map(googleNews)]);
  batches.forEach((b, i) => { if (b.status === 'rejected') console.log('Fuente', i, 'falló:', b.reason.message); });
  const fresh = batches.filter(b => b.status === 'fulfilled').flatMap(b => b.value);

  const map = new Map();
  for (const n of [...fresh, ...(prev.items || [])]) {
    if (!n.titulo || !RELEVANT.test(n.titulo)) continue;
    const k = keyOf(n.titulo);
    const old = map.get(k);
    if (!old) map.set(k, n); else if (!old.imagen && n.imagen) old.imagen = n.imagen;
  }
  const limite = Date.now() - 45 * 864e5; // guarda 45 días
  const items = [...map.values()].filter(n => new Date(n.fecha).getTime() > limite)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 150);

  const out = { actualizado: new Date().toISOString(), zona_horaria: 'America/Bogota', total: items.length, items };
  await writeFile(OUT, JSON.stringify(out, null, 1));
  console.log('Noticias guardadas:', items.length, '· nuevas en esta vuelta:', fresh.length);
  await ogImage();
}

// Foto real para la vista previa del enlace: se renueva una vez por semana
async function ogImage(){
  const flag = 'img/og-fecha.txt';
  try {
    const last = new Date((await readFile(flag, 'utf8')).trim()).getTime();
    if (Date.now() - last < 7 * 864e5) return;
  } catch {}
  let sharp;
  try { sharp = (await import('sharp')).default; } catch { console.log('sharp no instalado; se omite og.jpg'); return; }
  const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=15' +
    '&gsrsearch=' + encodeURIComponent('filetype:bitmap rice paddy field harvest') + '&prop=imageinfo&iiprop=url|size&iiurlwidth=1600';
  const j = await (await fetch(api, { headers: UA })).json();
  const pics = Object.values(j.query?.pages || {}).map(p => p.imageinfo?.[0]).filter(i => i && i.width > i.height && i.width >= 1200);
  if (!pics.length) return;
  const pick = pics[Math.floor(Math.random() * pics.length)];
  const buf = Buffer.from(await (await fetch(pick.thumburl || pick.url, { headers: UA })).arrayBuffer());
  const svg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#0f2314" stop-opacity="0"/><stop offset="1" stop-color="#0f2314" stop-opacity="0.92"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="60" y="390" width="12" height="170" fill="#e9b43b"/>
    <text x="95" y="455" font-family="Georgia, serif" font-size="70" font-weight="bold" fill="#ffffff">Arroz de Colombia al Día</text>
    <text x="97" y="510" font-family="Arial, sans-serif" font-size="30" fill="#f6e7b8">Cultivo · Molino · Calculadoras · Bajo Cauca · TLC · Noticias</text>
    <text x="97" y="552" font-family="Arial, sans-serif" font-size="24" fill="#e9b43b">arroz-colombia.netlify.app · Vibras Positivas HM</text>
  </svg>`);
  await sharp(buf).resize(1200, 630, { fit: 'cover', position: 'attention' }).composite([{ input: svg }]).jpeg({ quality: 84 }).toFile('img/og.jpg');
  await writeFile(flag, new Date().toISOString());
  console.log('og.jpg renovada con', pick.url);
}

main().catch(e => { console.error(e); process.exit(1); });
