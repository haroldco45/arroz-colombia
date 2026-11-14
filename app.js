/* Arroz de Colombia al Día — Vibras Positivas HM */
(function(){
  const TZ = 'America/Bogota';
  const C = window.CONTENT, I = window.I18N;
  let lang = localStorage.getItem('ac_lang') || 'es';
  let news = [], filter = 'all';
  const $ = s => document.querySelector(s);
  const T = k => (I[lang] && I[lang][k]) || I.es[k] || k;
  const L = v => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[lang] || v.es) : v;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = (d, withTime=true) => new Intl.DateTimeFormat(lang==='es'?'es-CO':'en-US', {timeZone:TZ, day:'numeric', month:'short', year:'numeric', ...(withTime?{hour:'numeric', minute:'2-digit'}:{})}).format(d);
  const num = (n, dec=0) => new Intl.NumberFormat(lang==='es'?'es-CO':'en-US', {maximumFractionDigits:dec, minimumFractionDigits:dec}).format(isFinite(n)?n:0);
  const money = n => '$' + num(Math.round(n));

  /* ---------- Textos fijos ---------- */
  function applyI18n(){
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i]').forEach(el => { el.textContent = T(el.dataset.i); });
    $('#btnLang').textContent = lang === 'es' ? 'EN' : 'ES';
    $('#stamp').textContent = `${T('entered')} ${fmtDate(new Date())} (hora Colombia)`.replace('(hora Colombia)', lang==='es'?'(hora Colombia)':'(Colombia time)');
  }

  /* ---------- Render de contenido ---------- */
  const card = o => `<article class="card reveal"><h4>${esc(L(o.t))}</h4><p>${esc(L(o.p))}</p>${o.l?`<a class="lnk" href="${o.l}" target="_blank" rel="noopener">${o.l.replace(/^https?:\/\/(www\.)?/,'').split('/')[0]}</a>`:''}</article>`;
  function renderContent(){
    $('#stats').innerHTML = C.stats.map(s => { const [l, src] = s[lang] || s.es; return `<div class="stat reveal"><div class="n">${esc(s.n)}</div><div class="l">${esc(l)}</div><div class="s">${esc(src)}</div></div>`; }).join('');
    $('#stages').innerHTML = C.stages.map(s => `<div class="tl reveal"><div><span class="d">${esc(L(s.d))}</span><h4>${esc(L(s.t))}</h4><p>${esc(L(s.p))}</p></div></div>`).join('');
    ['sistemas','meca','variedades','fert','sanidad','gremios','banca','normas','tlc','vecinos','global','innov'].forEach(k => {
      const el = document.getElementById(k === 'gremios' ? 'gremiosList' : k); if (el) el.innerHTML = C[k].map(card).join('');
    });
    $('#zonasList').innerHTML = C.zonas.map(card).join('');
    $('#bajoCaucaTxt').innerHTML = C.bajoCauca[lang];
    $('#epocas').innerHTML = `<tr><th>${T('th_zona')}</th><th>${T('th_siembra')}</th><th>${T('th_cosecha')}</th><th>${T('th_nota')}</th></tr>` +
      C.epocas.map(e => `<tr><td><b>${esc(e.z)}</b></td><td>${esc(L(e.s))}</td><td>${esc(L(e.c))}</td><td>${esc(L(e.n))}</td></tr>`).join('');
    $('#lab').innerHTML = C.lab.map((s,i) => `<div class="step reveal"><span class="num">${i+1}</span><h4>${esc(L(s.t))}</h4><p>${esc(L(s.p))}</p></div>`).join('');
    $('#labNote').innerHTML = C.labNote[lang];
    $('#sourceList').innerHTML = C.sources.map(([t,u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('');
    countdown(); observe();
  }

  /* ---------- Cuenta regresiva TLC ---------- */
  function countdown(){
    const target = Date.UTC(2030,0,1,5,0,0); // 1 ene 2030 00:00 hora Colombia
    const days = Math.max(0, Math.ceil((target - Date.now())/864e5));
    const months = Math.round(days/30.44);
    $('#countdown').innerHTML = `<div class="cd"><b>${num(days)}</b>${T('cd_days')}</div><div class="cd"><b>${num(months)}</b>${lang==='es'?'meses':'months'}</div><p>${T('cd_txt')}</p>`;
  }

  /* ---------- Animación al hacer scroll ---------- */
  let io;
  function observe(){
    if (!('IntersectionObserver' in window)) { document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')); return; }
    io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.08});
    document.querySelectorAll('.reveal:not(.in)').forEach(e => io.observe(e));
  }

  /* ---------- Fotos y videos reales de arroz (los escoge el robot, filtrados) ---------- */
  let FOTOS = null;
  async function loadFotos(){
    if (FOTOS) return FOTOS;
    try { FOTOS = await (await fetch('data/fotos.json?t=' + Date.now(), {cache:'no-store'})).json(); }
    catch(e){ FOTOS = {secciones:{}, videos:[]}; }
    return FOTOS;
  }
  const fotosDe = k => ((FOTOS && FOTOS.secciones && FOTOS.secciones[k]) || []);
  async function galleries(){
    await loadFotos();
    document.querySelectorAll('.gallery[data-k]').forEach(g => {
      const imgs = fotosDe(g.dataset.k).slice(0, 4);
      if (imgs.length < 2) { g.remove(); return; }
      g.innerHTML = imgs.map(i => `<figure><a href="${i.page}" target="_blank" rel="noopener"><img loading="lazy" src="${i.src}" alt="${esc(i.titulo.replace(/^File:|\.[a-z]+$/gi,''))}"></a><figcaption>${esc(i.autor)} ${esc(i.lic)}</figcaption></figure>`).join('');
    });
  }
  async function hero(){
    await loadFotos();
    const box = $('#heroMedia');
    const v = (FOTOS.videos || []).find(x => /\.(webm|ogv|mp4)$/i.test(x.full));
    if (v && matchMedia('(min-width:700px)').matches) { box.innerHTML = `<video autoplay muted loop playsinline src="${v.full}"></video>`; return; }
    const imgs = fotosDe('hero').concat(fotosDe('cultivo')).slice(0, 5);
    if (!imgs.length) return;
    box.innerHTML = imgs.map((i,k) => `<img src="${i.src}" alt="" class="${k?'':'on'}">`).join('');
    let k = 0; const all = box.querySelectorAll('img');
    if (all.length > 1) setInterval(() => { all[k].classList.remove('on'); k = (k+1) % all.length; all[k].classList.add('on'); }, 6000);
  }

  /* ---------- Noticias: robot + búsqueda en vivo ---------- */
  const CATS = [
    {k:'precio', es:'Precios', en:'Prices', re:/precio|paddy|cotiz|tonelada|price/i},
    {k:'gob', es:'Gobierno', en:'Government', re:/minagricultura|gobierno|ministr|resoluci|decreto|sic\b|subsid|apoyo/i},
    {k:'comercio', es:'TLC e importaciones', en:'Trade', re:/tlc|import|arancel|ecuador|estados unidos|contrabando|export/i},
    {k:'clima', es:'Clima', en:'Weather', re:/lluvi|inunda|sequ|niño|niña|clima|invierno/i},
    {k:'region', es:'Bajo Cauca y Caribe', en:'Bajo Cauca & Caribbean', re:/caucasia|bajo cauca|nech|córdoba|cordoba|sucre|mojana|antioquia|bol[ií]var|ayapel|montel/i},
    {k:'tec', es:'Innovación', en:'Innovation', re:/variedad|tecnolog|innova|investig|semilla|dron/i}
  ];
  const catOf = t => (CATS.find(c => c.re.test(t)) || {k:'otro'}).k;

  async function loadRobot(){
    try {
      const r = await fetch('data/noticias.json?t=' + Date.now(), {cache:'no-store'});
      const j = await r.json(); return j;
    } catch(e){ return {actualizado:null, items:[]}; }
  }
  async function liveSearch(){
    const q = '(arroz OR arroceros OR fedearroz OR "paddy verde") sourcecountry:CO';
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?format=json&mode=artlist&sort=datedesc&maxrecords=40&timespan=14d&query=' + encodeURIComponent(q);
    const ctl = new AbortController(); const to = setTimeout(()=>ctl.abort(), 9000);
    try {
      const r = await fetch(url, {signal:ctl.signal}); const j = await r.json();
      return (j.articles || []).filter(a => /arroz|arrocer|fedearroz|paddy/i.test(a.title) && /arrocer|fedearroz|expoarroz|paddy|molino|cosech|cultiv|siembr|sembr|hect[aá]rea|precio del arroz|importaci|export|arancel|tlc|contrabando|agro|campo|campesin|minagricultura|semilla|grano/i.test(a.title) && !/canci[oó]n|receta|cantante|reggaet|f[uú]tbol|arroz con (huevo|pollo|leche|coco|camar)/i.test(a.title)).map(a => ({
        titulo:a.title, url:a.url, fuente:a.domain, imagen:a.socialimage || '', fecha: gdeltDate(a.seendate), vivo:true
      }));
    } finally { clearTimeout(to); }
  }
  const gdeltDate = s => s ? new Date(s.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString() : null;

  function mergeNews(a, b){
    const seen = new Set(), out = [];
    [...a, ...b].forEach(n => {
      const k = (n.titulo||'').toLowerCase().replace(/[^a-záéíóúñ0-9]/g,'').slice(0,60);
      if (!k || seen.has(k)) return; seen.add(k); out.push(n);
    });
    return out.sort((x,y) => new Date(y.fecha||0) - new Date(x.fecha||0));
  }

  function renderNews(){
    const fbar = $('#newsFilters');
    fbar.innerHTML = [`<button data-f="all" class="${filter==='all'?'on':''}">${T('all')}</button>`]
      .concat(CATS.map(c => `<button data-f="${c.k}" class="${filter===c.k?'on':''}">${c[lang]}</button>`)).join('');
    const list = news.filter(n => filter==='all' || catOf(n.titulo) === filter).slice(0, 30);
    const last = +localStorage.getItem('ac_lastVisit') || 0;
    $('#news').innerHTML = list.length ? list.map(n => {
      const d = n.fecha ? new Date(n.fecha) : null;
      const isNew = d && d.getTime() > last && last > 0;
      const cat = CATS.find(c => c.k === catOf(n.titulo));
      return `<a class="news reveal ${isNew?'nueva':''}" href="${esc(n.url)}" target="_blank" rel="noopener">
        <div class="ph">${n.imagen?`<img loading="lazy" src="${esc(n.imagen)}" alt="" onerror="this.remove()">`:''}</div>
        <div class="tx"><span class="tag">${isNew?T('nueva'):(cat?cat[lang]:'Arroz')}</span><h4>${esc(n.titulo)}</h4>
        <div class="meta">${esc(n.fuente||'')}${d?' · '+fmtDate(d):''}</div></div></a>`;
    }).join('') : `<p>${T('noNews')}</p>`;
    $('#ticker').innerHTML = news.slice(0, 12).map(n => `<span>${esc(n.titulo)}</span>`).join('').repeat(2) || `<span>${T('noNews')}</span>`;
    fillNewsImages(list); observe();
  }
  // Para noticias sin foto, poner una foto real de arroz (Commons)
  async function fillNewsImages(){
    const empty = [...document.querySelectorAll('#news .ph')].filter(p => !p.querySelector('img'));
    if (!empty.length) return;
    await loadFotos();
    const imgs = fotosDe('cultivo').concat(fotosDe('zonas'), fotosDe('hero'));
    if (imgs.length) empty.forEach((p,i) => { const im = imgs[i % imgs.length]; p.innerHTML = `<img loading="lazy" src="${im.src}" alt="">`; });
  }

  async function loadNews(){
    const btn = $('#btnRefresh'); btn.classList.add('spin');
    $('#hoyStatus').textContent = T('searching');
    const robot = await loadRobot();
    news = mergeNews([], robot.items || []); renderNews();
    let msg = '';
    try {
      const live = await liveSearch();
      news = mergeNews(live, robot.items || []);
      msg = T('liveOk').replace('{n}', live.length);
    } catch(e){ msg = T('liveFail'); }
    if (robot.actualizado) msg += ` · ${T('robotLast')}: ${fmtDate(new Date(robot.actualizado))}`;
    $('#hoyStatus').textContent = msg;
    renderNews(); btn.classList.remove('spin');
    localStorage.setItem('ac_lastVisit', Date.now());
  }

  /* ---------- Calculadoras ---------- */
  const CALCS = {
    rent: {
      t:'calcRent',
      f:[['ha',{es:'Hectáreas',en:'Hectares'},10],['rend',{es:'Rendimiento (t/ha de paddy verde)',en:'Yield (t/ha green paddy)'},5.5],
         ['precio',{es:'Precio por tonelada ($)',en:'Price per tonne (COP)'},1340000],['costo',{es:'Costo por hectárea ($)',en:'Cost per hectare (COP)'},6500000]],
      run(v){
        const ing = v.ha*v.rend*v.precio, cos = v.ha*v.costo, ut = ing-cos, eq = v.precio ? v.costo/v.precio : 0;
        return [[money(ing), {es:'Ingreso total',en:'Total income'}],[money(cos),{es:'Costo total',en:'Total cost'}],
          [money(ut), {es:'Utilidad',en:'Profit'}, ut<0],[money(v.ha?ut/v.ha:0),{es:'Utilidad por hectárea',en:'Profit per hectare'}, ut<0],
          [num(eq,2)+' t/ha',{es:'Punto de equilibrio (lo mínimo que debe rendir)',en:'Break-even yield'}],
          [money(v.rend?v.costo/v.rend:0),{es:'Costo por tonelada producida',en:'Cost per tonne produced'}]];
      },
      h:{es:'Precio de ejemplo: paddy verde a $1,34 millones por tonelada (Fedearroz, junio 2026). El costo por hectárea es solo un ejemplo: pon el tuyo.',en:'Example price: green paddy at COP 1.34M/t (Fedearroz, June 2026). The cost per hectare is just an example: use yours.'}
    },
    molino: {
      t:'calcMolino',
      f:[['kg',{es:'Kilos brutos que entregas',en:'Gross kilos delivered'},10000],['hum',{es:'Humedad medida (%)',en:'Measured moisture (%)'},24],
         ['hbase',{es:'Humedad base del molino (%)',en:'Mill base moisture (%)'},14],['imp',{es:'Impurezas medidas (%)',en:'Measured impurities (%)'},4],
         ['ibase',{es:'Impurezas base (%)',en:'Base impurities (%)'},2],['precio',{es:'Precio por tonelada seca y limpia ($)',en:'Price per clean dry tonne (COP)'},1500000]],
      run(v){
        const exImp = Math.max(0, v.imp - v.ibase)/100;
        const limpio = v.kg * (1 - exImp);
        const seco = v.hum > v.hbase ? limpio * (100 - v.hum)/(100 - v.hbase) : limpio;
        const desc = v.kg - seco;
        return [[num(limpio)+' kg',{es:'Kilos tras descontar impurezas',en:'Kilos after impurities'}],
          [num(seco)+' kg',{es:'Kilos netos pagables (secos y limpios)',en:'Net payable kilos (dry, clean)'}],
          [num(desc)+' kg',{es:'Kilos descontados',en:'Kilos deducted'}, true],[num(v.kg?desc/v.kg*100:0,1)+' %',{es:'Porcentaje descontado',en:'Percent deducted'}, true],
          [money(seco/1000*v.precio),{es:'Pago estimado',en:'Estimated payment'}]];
      },
      h:{es:'Fórmula de merma por humedad: peso × (100 − humedad medida) ÷ (100 − humedad base). Las bases cambian según el molino y la norma; confirma las tuyas en la boleta. Si te pagan en paddy verde con tabla de descuentos, usa la tabla del molino.',en:'Moisture shrink formula: weight × (100 − measured) ÷ (100 − base). Bases vary by mill and rule; check your slip. If paid as green paddy with a discount table, use the mill\'s table.'}
    },
    cargas: {
      t:'calcCargas',
      f:[['cargas',{es:'Cargas (125 kg)',en:'Loads (125 kg)'},100],['bulto',{es:'Peso del bulto (kg)',en:'Sack weight (kg)'},50],['precioCarga',{es:'Precio por carga ($)',en:'Price per load (COP)'},167500]],
      run(v){
        const kg = v.cargas*125;
        return [[num(kg)+' kg',{es:'Kilos',en:'Kilos'}],[num(kg/1000,2)+' t',{es:'Toneladas',en:'Tonnes'}],[num(v.bulto?kg/v.bulto:0,1),{es:'Bultos',en:'Sacks'}],
          [money(v.cargas*v.precioCarga),{es:'Valor total',en:'Total value'}],[money(v.precioCarga*8),{es:'Equivale por tonelada (8 cargas)',en:'Per tonne (8 loads)'}]];
      },
      h:{es:'En el campo el paddy se negocia por carga de 125 kg: 8 cargas = 1 tonelada. $167.500 por carga equivale a $1,34 millones por tonelada.',en:'In the field paddy trades by the 125 kg load: 8 loads = 1 tonne. COP 167,500 per load equals COP 1.34M per tonne.'}
    },
    fert: {
      t:'calcFert',
      f:[['ha',{es:'Hectáreas',en:'Hectares'},10],['n',{es:'Nitrógeno N (kg/ha)',en:'Nitrogen N (kg/ha)'},150],['p',{es:'Fósforo P₂O₅ (kg/ha)',en:'Phosphorus P₂O₅ (kg/ha)'},50],
         ['k',{es:'Potasio K₂O (kg/ha)',en:'Potassium K₂O (kg/ha)'},90],['pu',{es:'Precio bulto urea ($)',en:'Urea sack price (COP)'},160000],
         ['pd',{es:'Precio bulto DAP ($)',en:'DAP sack price (COP)'},200000],['pk',{es:'Precio bulto KCl ($)',en:'KCl sack price (COP)'},150000]],
      run(v){
        const dap = v.p/0.46, nDap = dap*0.18, urea = Math.max(0, v.n - nDap)/0.46, kcl = v.k/0.60;
        const b = x => x*v.ha/50, total = b(urea)*v.pu + b(dap)*v.pd + b(kcl)*v.pk;
        return [[num(b(urea),1),{es:'Bultos de urea (46-0-0)',en:'Urea sacks (46-0-0)'}],[num(b(dap),1),{es:'Bultos de DAP (18-46-0)',en:'DAP sacks (18-46-0)'}],
          [num(b(kcl),1),{es:'Bultos de KCl (0-0-60)',en:'KCl sacks (0-0-60)'}],[money(total),{es:'Costo total de fertilizante',en:'Total fertilizer cost'}],
          [money(v.ha?total/v.ha:0),{es:'Costo por hectárea',en:'Cost per hectare'}]];
      },
      h:{es:'Las dosis de ejemplo no son una recomendación: pídelas con tu análisis de suelo al técnico. Bultos de 50 kg. El nitrógeno del DAP se resta de la urea. Los precios de ejemplo cámbialos por los de tu almacén.',en:'Example rates are not a recommendation: get yours from a soil test. 50 kg sacks. DAP nitrogen is subtracted from urea. Replace example prices with your store\'s.'}
    },
    semilla: {
      t:'calcSemilla',
      f:[['ha',{es:'Hectáreas',en:'Hectares'},10],['dosis',{es:'Semilla por hectárea (kg)',en:'Seed per hectare (kg)'},120],['bulto',{es:'Peso del bulto de semilla (kg)',en:'Seed sack weight (kg)'},40],['precio',{es:'Precio del bulto ($)',en:'Sack price (COP)'},180000]],
      run(v){
        const kg = v.ha*v.dosis, bultos = v.bulto ? Math.ceil(kg/v.bulto) : 0;
        return [[num(kg)+' kg',{es:'Semilla total',en:'Total seed'}],[num(bultos),{es:'Bultos a comprar',en:'Sacks to buy'}],[money(bultos*v.precio),{es:'Costo de semilla',en:'Seed cost'}]];
      },
      h:{es:'La siembra en surcos con sembradora necesita menos semilla que el voleo. Usa semilla certificada. Valores de ejemplo: confirma la dosis con Fedearroz.',en:'Drilled rows need less seed than broadcasting. Use certified seed. Example values: confirm the rate with Fedearroz.'}
    }
  };
  let calcOn = 'rent';
  function renderCalcTabs(){
    $('#calcTabs').innerHTML = Object.entries(CALCS).map(([k,c]) => `<button data-c="${k}" class="${k===calcOn?'on':''}">${T(c.t)}</button>`).join('');
    renderCalc();
  }
  function renderCalc(){
    const c = CALCS[calcOn];
    const saved = JSON.parse(localStorage.getItem('ac_calc_'+calcOn) || '{}');
    $('#calcBox').innerHTML = `<div class="calc-grid">${c.f.map(([k,l,d]) => `<label>${esc(L(l))}<input type="number" step="any" inputmode="decimal" name="${k}" value="${saved[k] ?? d}"></label>`).join('')}</div><div class="res" id="res"></div><p class="hint">${esc(L(c.h))}</p>`;
    $('#calcBox').oninput = runCalc; runCalc();
  }
  function runCalc(){
    const c = CALCS[calcOn], v = {};
    $('#calcBox').querySelectorAll('input').forEach(i => v[i.name] = parseFloat(i.value) || 0);
    localStorage.setItem('ac_calc_'+calcOn, JSON.stringify(v));
    $('#res').innerHTML = c.run(v).map(([val,l,bad]) => `<div class="${bad?'bad':''}"><b>${esc(val)}</b><small>${esc(L(l))}</small></div>`).join('');
  }

  /* ---------- Sistematizado de productores ---------- */
  const PK = 'ac_productores';
  const getP = () => { try { return JSON.parse(localStorage.getItem(PK)) || []; } catch(e){ return []; } };
  const setP = a => localStorage.setItem(PK, JSON.stringify(a));
  function cosechaEst(f){ if (!f) return ''; const d = new Date(f+'T12:00:00'); d.setDate(d.getDate()+120); return d.toISOString().slice(0,10); }
  function renderProd(){
    const a = getP();
    const ha = a.reduce((s,p)=>s+(+p.ha||0),0), t = a.reduce((s,p)=>s+(+p.ha||0)*(+p.rend||0),0);
    const muns = new Set(a.map(p=>p.municipio.trim().toLowerCase())).size;
    $('#prodSummary').innerHTML = `<div><b>${num(a.length)}</b>${T('p_total')}</div><div><b>${num(ha,1)}</b>${T('p_ha')}</div><div><b>${num(t,1)}</b>${T('p_t')}</div><div><b>${num(muns)}</b>${T('p_mun')}</div>`;
    const H = lang==='es' ? ['Productor','Municipio','Vereda','Ha','Variedad','Sistema','Siembra','Cosecha estimada','t esperadas','Asociación',''] : ['Grower','Municipality','Village','Ha','Variety','System','Planted','Est. harvest','Expected t','Association',''];
    $('#prodTable').innerHTML = a.length ? `<tr>${H.map(h=>`<th>${h}</th>`).join('')}</tr>` + a.map((p,i) => `<tr><td><b>${esc(p.nombre)}</b><br><small>${esc(p.cel)}</small></td><td>${esc(p.municipio)}</td><td>${esc(p.vereda)}</td><td>${num(+p.ha,1)}</td><td>${esc(p.variedad)}</td><td>${esc(p.sistema)}</td><td>${esc(p.siembra)}</td><td>${cosechaEst(p.siembra)}</td><td>${num((+p.ha||0)*(+p.rend||0),1)}</td><td>${esc(p.asoc)}</td><td><button class="del" data-del="${i}">${T('del')}</button></td></tr>`).join('') : `<tr><td>${T('prodEmpty')}</td></tr>`;
  }
  function csv(){
    const a = getP(); if (!a.length) return;
    const cols = ['nombre','cel','municipio','vereda','ha','variedad','sistema','siembra','rend','asoc','obs'];
    const head = cols.concat(['cosecha_estimada','toneladas_esperadas']);
    const rows = a.map(p => cols.map(c => p[c]??'').concat([cosechaEst(p.siembra), ((+p.ha||0)*(+p.rend||0)).toFixed(1)]));
    const txt = '﻿' + [head, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(';')).join('\n');
    const b = new Blob([txt], {type:'text/csv;charset=utf-8'}); const u = URL.createObjectURL(b);
    const l = document.createElement('a'); l.href = u; l.download = 'productores-arroz-' + new Date().toLocaleDateString('en-CA',{timeZone:TZ}) + '.csv'; l.click(); URL.revokeObjectURL(u);
  }
  function wa(){
    const a = getP(); const ha = a.reduce((s,p)=>s+(+p.ha||0),0), t = a.reduce((s,p)=>s+(+p.ha||0)*(+p.rend||0),0);
    const lines = a.map(p => `- ${p.nombre} (${p.municipio}): ${p.ha} ha, ${p.variedad||'s/d'}, siembra ${p.siembra||'s/d'}`);
    const msg = `Productores de arroz registrados: ${a.length}\nHectáreas: ${num(ha,1)}\nToneladas esperadas: ${num(t,1)}\n\n${lines.join('\n')}\n\nHecho con Arroz de Colombia al Día\nhttps://arroz-colombia.netlify.app`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  }

  /* ---------- Eventos ---------- */
  function events(){
    $('#btnLang').onclick = () => { lang = lang==='es'?'en':'es'; localStorage.setItem('ac_lang', lang); applyI18n(); renderContent(); renderNews(); renderCalcTabs(); renderProd(); };
    $('#btnRefresh').onclick = loadNews;
    $('#newsFilters').onclick = e => { const b = e.target.closest('button'); if (!b) return; filter = b.dataset.f; renderNews(); };
    $('#calcTabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; calcOn = b.dataset.c; renderCalcTabs(); };
    $('#prodForm').onsubmit = e => { e.preventDefault(); const p = Object.fromEntries(new FormData(e.target)); const a = getP(); a.push(p); setP(a); e.target.reset(); renderProd(); };
    $('#prodTable').onclick = e => { const b = e.target.closest('[data-del]'); if (!b || !confirm(T('confirmDel'))) return; const a = getP(); a.splice(+b.dataset.del,1); setP(a); renderProd(); };
    $('#btnCsv').onclick = csv; $('#btnWa').onclick = wa;
    $('#btnShare').onclick = async () => {
      const data = {title:'Arroz de Colombia al Día', text:T('shareTxt'), url:'https://arroz-colombia.netlify.app/'};
      if (navigator.share) { try { await navigator.share(data); } catch(e){} }
      else { await navigator.clipboard.writeText(data.url); alert(T('copied')); }
    };
    // Pestañas: tocar lleva a la sección y la marca; al hacer scroll se marca la que se ve
    const tabsBar = $('#tabs');
    const links = [...tabsBar.querySelectorAll('a')];
    const secs = links.map(a => document.querySelector(a.getAttribute('href')));
    let current = -1, lockUntil = 0;
    const setOn = i => {
      if (i === current) return; current = i;
      links.forEach((a,k) => a.classList.toggle('on', k===i));
      const a = links[i]; if (!a) return;
      // mover solo la barra de pestañas (no la página) para no cortar el desplazamiento
      tabsBar.scrollTo({left: a.offsetLeft - (tabsBar.clientWidth - a.offsetWidth)/2, behavior:'smooth'});
    };
    const offsetTop = () => $('.top').offsetHeight + $('.ticker').offsetHeight + tabsBar.offsetHeight + 8;
    tabsBar.addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return;
      e.preventDefault();
      const i = links.indexOf(a), sec = secs[i]; if (!sec) return;
      setOn(i); lockUntil = Date.now() + 1200;
      window.scrollTo({top: sec.getBoundingClientRect().top + window.scrollY - offsetTop(), behavior:'smooth'});
      history.replaceState(null, '', a.getAttribute('href'));
    });
    addEventListener('scroll', () => {
      if (Date.now() < lockUntil) return;
      const lim = offsetTop() + 20; let on = 0;
      secs.forEach((s,i) => { if (s && s.getBoundingClientRect().top <= lim) on = i; });
      setOn(on);
    }, {passive:true});
    setOn(0);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loadNews(); });
  }

  /* ---------- Inicio ---------- */
  applyI18n(); renderContent(); renderCalcTabs(); renderProd(); events();
  loadNews(); hero(); galleries();
  setInterval(loadNews, 30*60*1000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
