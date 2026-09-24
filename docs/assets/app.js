// The Bunyan website: the design advisor, the pattern catalogue, the learning
// index, and the glossary. Plain modules, no framework. The only request the
// page makes is for its own data file, and the only things it stores are the
// chosen language and theme.

import { advise, decodeState, encodeState, defaultAnswers, normalizeAnswers, LEVELS, PRIORITIES } from './engine.js';
import { renderPlan } from './plan.js';
import { renderBrief, eastern } from './brief.js';

const doc = document.documentElement;
const main = document.getElementById('main');

const S = {
  data: null,
  lang: doc.lang === 'ar' ? 'ar' : 'en',
  view: '',
  answers: null,
  project: '',
  advice: null,
  notice: '',
};

// Helpers

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const t = (v) => (v && typeof v === 'object' ? v[S.lang] ?? v.en : v ?? '');
const ui = (key) => {
  const v = S.data.meta.ui[key];
  if (!v) throw new Error(`Missing UI string: ${key}`);
  return t(v);
};
const num = (n) => (S.lang === 'ar' ? eastern(n) : String(n));
const sep = () => (S.lang === 'ar' ? '، ' : ', ');
const ltr = (s) => `<span dir="ltr">${esc(s)}</span>`;
const meta = () => S.data.meta;
const other = () => (S.lang === 'ar' ? 'en' : 'ar');
const gh = (folder, slug) => `${meta().project.repo}/blob/main/${folder}/${S.lang}/${slug}.md`;
const patternById = (id) => S.data.patterns.find((p) => p.id === id);
const today = () => new Date().toISOString().slice(0, 10);

// The brand mark: a room with its door, drawn like the plan.
const MARK =
  '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path class="bm-wall" d="M7 7h18v18H16M7 7v11M7 25h2"/><path class="bm-door" d="M16 25a7 7 0 0 0-7-7M16 25V18"/></svg>';

const ICONS = {
  copy: '<path d="M6.8 9.2l2.4-2.4"/><path d="M7.6 4.9l1.1-1.1a2.5 2.5 0 0 1 3.5 3.5l-1.1 1.1"/><path d="M8.4 11.1l-1.1 1.1a2.5 2.5 0 0 1-3.5-3.5l1.1-1.1"/>',
  download: '<path d="M8 2.5v7.5"/><path d="M4.8 7l3.2 3.2L11.2 7"/><path d="M3 13.2h10"/>',
  print: '<path d="M4.5 6V2.5h7V6"/><path d="M4.5 11.5H3.2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h9.6a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-1.3"/><path d="M4.5 9.2h7v4.3h-7z"/>',
  reset: '<path d="M3.2 8.2a4.8 4.8 0 1 0 1.5-3.6"/><path d="M3.2 2.6v3h3"/>',
};
const icon = (name) => `<svg class="icon" viewBox="0 0 16 16" aria-hidden="true">${ICONS[name]}</svg>`;
const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing can refuse storage. The choice then lasts for this visit only.
  }
};

// Routes live in the hash: #design?<answers>, #patterns, #patterns/P01, #learn, #glossary.
function route() {
  const raw = location.hash.slice(1);
  const cut = raw.indexOf('?');
  const path = cut < 0 ? raw : raw.slice(0, cut);
  const [view, id] = path.split('/');
  return { view: view || 'design', id: id || '', query: cut < 0 ? '' : raw.slice(cut + 1) };
}

const designQuery = () => encodeState(S.data.advisor, S.answers, S.project);
const shareUrl = () => `${location.origin}${location.pathname}?lang=${S.lang}#design?${designQuery()}`;

// Header and footer

const NAV = [
  ['design', 'navDesign'],
  ['patterns', 'navPatterns'],
  ['learn', 'navLearn'],
  ['glossary', 'navGlossary'],
];

function renderChrome() {
  document.querySelector('.skip').textContent = ui('skip');
  document.getElementById('nav').innerHTML = NAV.map(
    ([view, key]) => `<a href="#${view}" data-nav="${view}">${esc(ui(key))}</a>`
  ).join('');
  document.getElementById('tools').innerHTML =
    `<a class="lang" id="lang" href="?lang=${other()}" lang="${other()}" hreflang="${other()}" aria-label="${esc(ui('switchLanguageLabel'))}">${esc(ui('switchLanguage'))}</a>` +
    `<button type="button" class="theme" id="theme" aria-label="${esc(ui('themeLabel'))}" title="${esc(ui('themeLabel'))}">` +
    '<svg viewBox="0 0 20 20" aria-hidden="true" class="theme-icon"><circle cx="10" cy="10" r="7.25" class="ti-ring"/><path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" class="ti-half"/></svg></button>';
  const p = meta().project;
  document.getElementById('colophon').innerHTML =
    `<p class="colophon-brand">${MARK}<span>${esc(t(p.tagline))}</span></p>` +
    `<p>${esc(ui('footerLicense'))} ${esc(ui('footerMaintainer'))}</p>` +
    `<p>${esc(ui('footerPrivacy'))}</p>` +
    `<p><a href="${esc(p.repo)}">${esc(ui('footerSource'))}</a> <span class="version">${ltr(`v${p.version}`)}</span></p>`;

  document.getElementById('lang').addEventListener('click', () => store('bunyan-lang', other()));
  document.getElementById('theme').addEventListener('click', () => {
    const current =
      doc.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    store('bunyan-theme', next);
  });
}

// Keep the links that carry state in step with the page.
function syncLinks() {
  const lang = document.getElementById('lang');
  if (lang) lang.href = `?lang=${other()}${location.hash}`;
  const design = S.answers ? `#design?${designQuery()}` : '#design';
  for (const a of document.querySelectorAll('[data-nav="design"], .brand')) a.href = design;
  for (const a of document.querySelectorAll('[data-nav]')) {
    if (a.dataset.nav === S.view) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

function setTitle() {
  const name = t(meta().project.name);
  const r = route();
  const titles = { design: ui('navDesign'), patterns: ui('navPatterns'), learn: ui('navLearn'), glossary: ui('navGlossary') };
  let title = titles[S.view] || name;
  const p = S.view === 'patterns' && r.id ? patternById(r.id) : null;
  if (p) title = `${p.id} ${t(p.title)}`;
  document.title = `${title} | ${name}`;
}

// Shared pieces

function controlHtml(c, showLevel = false) {
  const nist = S.data.catalogs.nist.controls;
  const maps = [
    ...c.nist.map((id) => `<abbr title="${esc(nist[id] || '')}">${ltr(`NIST ${id}`)}</abbr>`),
    ...c.cis.map((id) => ltr(`CIS ${id}`)),
    ...c.iso.map((id) => ltr(`ISO A.${id}`)),
  ].join(sep());
  const level = showLevel ? ` <span class="level">${esc(t(meta().levels[c.level]))}</span>` : '';
  return `<li><p class="cname">${esc(t(c.name))}${level}</p><p>${esc(t(c.detail))}</p><p class="maps">${maps}</p></li>`;
}

function refLink(id) {
  const entry = S.data.catalogs.attack.techniques[id] || S.data.catalogs.owasp.risks[id];
  if (!entry) return ltr(id);
  return `<a href="${esc(entry.url)}">${ltr(id)} ${esc(t(entry.name))}</a>`;
}

function patternLink(id) {
  const p = patternById(id);
  return `<a href="#patterns/${id}">${ltr(id)} ${esc(t(p.title))}</a>`;
}

const listOf = (items) => `<ul>${items.map((x) => `<li>${esc(t(x))}</li>`).join('')}</ul>`;

// The design advisor

function questionHtml(q) {
  const type = q.type === 'multi' ? 'checkbox' : 'radio';
  const value = S.answers[q.id];
  const on = (id) => (Array.isArray(value) ? value.includes(id) : value === id);
  const help = q.help ? `<p class="help">${esc(t(q.help))}</p>` : '';
  const options = q.options
    .map(
      (o) =>
        `<label class="opt"><input type="${type}" name="${q.id}" value="${o.id}"${on(o.id) ? ' checked' : ''}><span>${esc(t(o.label))}</span></label>`
    )
    .join('');
  return `<li><fieldset><legend>${esc(t(q.label))}</legend>${help}<div class="opts">${options}</div></fieldset></li>`;
}

function legendHtml() {
  const swatch = (inner) => `<svg viewBox="0 0 48 28" class="swatch" aria-hidden="true">${inner}</svg>`;
  const items = [
    [
      '<rect x="3" y="5" width="16" height="18" class="pl-room w1"/><rect x="28" y="5" width="16" height="18" class="pl-room w3"/>',
      'legendWalls',
    ],
    [
      '<line x1="2" y1="22" x2="12" y2="22" class="lg-wall"/><line x1="34" y1="22" x2="46" y2="22" class="lg-wall"/><line x1="12" y1="22" x2="12" y2="3" class="pl-leaf"/><path d="M12 3 A19 19 0 0 1 31 22" class="pl-swing"/>',
      'legendDoors',
    ],
    ['<rect x="4" y="7" width="40" height="14" class="pl-fixture pl-essential"/>', 'legendEssential'],
    ['<rect x="4" y="7" width="40" height="14" class="pl-fixture pl-recommended"/>', 'legendRecommended'],
    ['<rect x="4" y="7" width="40" height="14" class="pl-fixture pl-consider"/>', 'legendConsider'],
    ['<rect x="3" y="6" width="42" height="16" class="pl-foundation"/>', 'legendFoundations'],
    [
      '<line x1="3" y1="14" x2="22" y2="14" class="pl-oneway"/><path d="M26 14 l-7 -4 v8 z" class="pl-arrowhead"/><rect x="29" y="5" width="16" height="18" class="pl-vault"/>',
      'legendVault',
    ],
  ];
  return `<ul>${items.map(([svg, key]) => `<li>${swatch(svg)}<span>${esc(ui(key))}</span></li>`).join('')}</ul>`;
}

function viewDesign(query) {
  const { advisor } = S.data;
  if (query) {
    const state = decodeState(advisor, query);
    S.answers = state.answers;
    S.project = state.project;
  } else if (!S.answers) {
    S.answers = defaultAnswers(advisor);
  }
  const notice = S.notice;
  S.notice = '';
  main.innerHTML = `
<section class="intro">
  <h1>${esc(ui('designTitle'))}</h1>
  <p>${esc(ui('designIntro'))}</p>
  ${notice ? `<p class="notice" role="status">${esc(notice)}</p>` : ''}
</section>
<section class="sheet" aria-labelledby="sheet-title">
  <div class="sheet-head">
    <h2 id="sheet-title">${esc(ui('sheetTitle'))}</h2>
    <div class="actions">
      <button type="button" data-act="copy">${icon('copy')}<span>${esc(ui('copyLink'))}</span></button>
      <button type="button" data-act="download">${icon('download')}<span>${esc(ui('download'))}</span></button>
      <button type="button" data-act="print">${icon('print')}<span>${esc(ui('print'))}</span></button>
      <button type="button" data-act="reset" class="quiet">${icon('reset')}<span>${esc(ui('reset'))}</span></button>
    </div>
    <p class="toast" id="toast" role="status" aria-live="polite"></p>
  </div>
  <div class="plan-frame" id="plan" role="region" aria-label="${esc(ui('planLabel'))}" tabindex="0"></div>
  <p class="swipe">${esc(ui('swipeHint'))}</p>
  <div class="sheet-foot">
    <section class="legend" aria-labelledby="legend-title">
      <h3 id="legend-title">${esc(ui('legendTitle'))}</h3>
      ${legendHtml()}
    </section>
    <div class="titleblock">
      <dl id="titleblock"></dl>
      <p class="tb-mark">${MARK}<span lang="en">Bunyan</span> <span lang="ar">بُنيان</span></p>
    </div>
  </div>
</section>
<div class="workspace">
  <section class="questions" aria-labelledby="q-title">
    <h2 id="q-title">${esc(ui('questionsTitle'))}</h2>
    <label class="project" for="project"><span>${esc(ui('projectLabel'))}</span>
      <input type="text" id="project" maxlength="80" autocomplete="off" spellcheck="false" placeholder="${esc(ui('projectPlaceholder'))}" value="${esc(S.project)}">
    </label>
    <ol class="qlist" id="qlist">${advisor.questions.map(questionHtml).join('')}</ol>
  </section>
  <section class="results" aria-labelledby="r-title">
    <h2 id="r-title">${esc(ui('resultsTitle'))}</h2>
    <div id="groups"></div>
    <section class="threats" aria-labelledby="t-title">
      <h2 id="t-title">${esc(ui('threatsTitle'))}</h2>
      <p>${esc(ui('threatsIntro'))}</p>
      <ol class="tlist" id="threats"></ol>
    </section>
  </section>
</div>`;
  bindDesign();
  refresh(false);
}

function readAnswers() {
  const raw = {};
  for (const q of S.data.advisor.questions) {
    const checked = [...main.querySelectorAll(`input[name="${q.id}"]`)].filter((i) => i.checked).map((i) => i.value);
    raw[q.id] = q.type === 'multi' ? checked : checked[0];
  }
  return normalizeAnswers(S.data.advisor, raw);
}

function bindDesign() {
  document.getElementById('qlist').addEventListener('change', () => {
    S.answers = readAnswers();
    refresh(true);
  });
  const project = document.getElementById('project');
  project.addEventListener('input', () => {
    S.project = project.value.slice(0, 80);
    refreshTitleBlock();
    writeUrl();
  });
  main.querySelector('.actions').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-act]');
    if (!button) return;
    const act = { copy: copyLink, download: downloadBrief, print: () => window.print(), reset: resetDesign };
    act[button.dataset.act]();
  });
}

function refresh(write) {
  S.advice = advise(S.data, S.answers);
  const frame = document.getElementById('plan');
  frame.innerHTML = renderPlan(S.advice.plan, S.lang, meta().ui);
  // After a change of answer, each new drawing fades in, so the eye catches what changed.
  if (write) frame.classList.add('redraw');
  refreshTitleBlock();
  document.getElementById('groups').innerHTML = groupsHtml(S.advice);
  document.getElementById('threats').innerHTML = S.advice.threats.map(threatHtml).join('');
  if (write) writeUrl();
  else syncLinks();
}

function refreshTitleBlock() {
  const system = S.data.advisor.questions.find((q) => q.id === 'system');
  const drawing = t(system.options.find((o) => o.id === S.answers.system).label);
  const cells = [
    ['sheetProject', S.project ? esc(S.project) : `<span class="muted">${esc(ui('projectPlaceholder'))}</span>`],
    ['sheetDrawing', esc(drawing)],
    ['sheetLevel', esc(t(meta().levels[S.answers.maturity]))],
    ['sheetScale', esc(ui('sheetNotToScale'))],
    ['sheetDate', esc(num(today()))],
  ];
  document.getElementById('titleblock').innerHTML = cells
    .map(([key, value]) => `<div><dt>${esc(ui(key))}</dt><dd>${value}</dd></div>`)
    .join('');
}

function groupsHtml(advice) {
  return PRIORITIES.map((priority) => {
    const list = advice.patterns.filter((p) => p.priority === priority);
    if (!list.length) return '';
    return `<section class="group">
  <h3><span class="mark mark-${priority}" aria-hidden="true"></span>${esc(t(meta().priorities[priority]))} <span class="count">${num(list.length)}</span></h3>
  <ul class="plist">${list.map(recommendationHtml).join('')}</ul>
</section>`;
  }).join('');
}

function recommendationHtml(rec) {
  const p = rec.pattern;
  const next = rec.nextControls.length
    ? `<h4>${esc(ui('nextLevel'))}</h4><ul>${rec.nextControls.map((c) => `<li>${esc(t(c.name))}</li>`).join('')}</ul>`
    : '';
  return `<li><details><summary><span class="pid">${ltr(p.id)}</span><span class="ptitle">${esc(t(p.title))}</span><span class="pdomain">${esc(t(meta().domains[p.domain]))}</span></summary>
<div class="pbody">
  <h4>${esc(ui('why'))}</h4>${listOf(rec.reasons)}
  <h4>${esc(ui('controlsAtLevel'))}</h4><ul class="controls">${rec.controls.map((c) => controlHtml(c, true)).join('')}</ul>
  ${next}
  <h4>${esc(ui('decisions'))}</h4>${listOf(p.decisions)}
  <h4>${esc(ui('verify'))}</h4>${listOf(p.verify)}
  <p class="more"><a href="#patterns/${p.id}">${esc(ui('readPattern'))}</a></p>
</div></details></li>`;
}

function threatHtml(threat) {
  const refs = threat.refs.map(refLink).join(sep());
  const by = threat.addressedBy.map((id) => `<a href="#patterns/${id}">${ltr(id)}</a>`).join(sep());
  return `<li><p class="ttitle">${esc(t(threat.title))}</p><p class="trefs">${refs}</p><p class="tby">${esc(ui('threatsMitigated'))} ${by}</p></li>`;
}

function writeUrl() {
  history.replaceState(null, '', `${location.pathname}${location.search}#design?${designQuery()}`);
  syncLinks();
}

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.textContent = '';
  }, 3000);
}

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'offscreen';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

async function copyLink() {
  const url = shareUrl();
  let ok = false;
  try {
    await navigator.clipboard.writeText(url);
    ok = true;
  } catch {
    ok = fallbackCopy(url);
  }
  toast(ok ? ui('linkCopied') : url);
}

function downloadBrief() {
  const markdown = renderBrief(S.data, S.advice, { lang: S.lang, project: S.project, date: today(), link: shareUrl() });
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const slug = S.project.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'design';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bunyan-${slug}-${today()}.md`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function resetDesign() {
  S.answers = defaultAnswers(S.data.advisor);
  S.project = '';
  viewDesign('');
  writeUrl();
  document.getElementById('project').focus();
}

// The pattern catalogue

function viewIndex() {
  const rows = S.data.patterns
    .map(
      (p) =>
        `<tr><td class="pid">${ltr(p.id)}</td><td><a href="#patterns/${p.id}">${esc(t(p.title))}</a><p>${esc(t(p.summary))}</p></td><td>${esc(t(meta().domains[p.domain]))}</td></tr>`
    )
    .join('');
  main.innerHTML = `<section class="page wide">
  <h1>${esc(ui('patternsTitle'))}</h1>
  <p class="lede">${esc(ui('patternsIntro'))}</p>
  <div class="table-wrap"><table class="index">
    <thead><tr><th scope="col">${esc(ui('colNumber'))}</th><th scope="col">${esc(ui('colPattern'))}</th><th scope="col">${esc(ui('colDomain'))}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
</section>`;
}

function viewPattern(id) {
  const p = patternById(id);
  if (!p) return notFound();
  const m = meta();
  const controls = LEVELS.map((level) => {
    const list = p.controls.filter((c) => c.level === level);
    if (!list.length) return '';
    return `<h3>${esc(t(m.levels[level]))}</h3><ul class="controls">${list.map((c) => controlHtml(c)).join('')}</ul>`;
  }).join('');
  const refs = [...p.attack, ...p.owasp];
  const threats = refs.length
    ? `<h2>${esc(ui('threats'))}</h2><ul>${refs.map((r) => `<li>${refLink(r)}</li>`).join('')}</ul>`
    : '';
  const row = (label, value) => `<span class="row"><span>${label}</span><span class="n">${esc(num(value))}</span></span>`;
  const distinct = (key) => new Set(p.controls.flatMap((c) => c[key])).size;
  const refRows = [
    [p.attack.length, 'MITRE ATT&CK'],
    [p.owasp.length, 'OWASP'],
  ]
    .filter(([n]) => n)
    .map(([n, name]) => row(ltr(name), n))
    .join('');
  main.innerHTML = `<article class="page pattern">
  <p class="back"><a href="#patterns">${esc(ui('backToIndex'))}</a></p>
  <h1><span class="pid">${ltr(p.id)}</span> ${esc(t(p.title))}</h1>
  <p class="domain">${esc(t(m.domains[p.domain]))}</p>
  <p class="lede">${esc(t(p.summary))}</p>
  <figure class="diagram" id="diagram" hidden>
    <figcaption>${esc(ui('diagramCaption'))}</figcaption>
    <div class="diagram-canvas" id="diagram-canvas" tabindex="0" role="region" aria-label="${esc(ui('diagramCaption'))}"></div>
  </figure>
  <div class="pattern-body">
    <div class="pattern-main">
      <h2>${esc(ui('problem'))}</h2><p>${esc(t(p.problem))}</p>
      <h2>${esc(ui('useWhen'))}</h2>${listOf(p.useWhen)}
      <h2>${esc(ui('design'))}</h2>${p.design.map((d) => `<p>${esc(t(d))}</p>`).join('')}
      <h2>${esc(ui('controls'))}</h2>${controls}
      <h2>${esc(ui('decisions'))}</h2>${listOf(p.decisions)}
      <h2>${esc(ui('tradeoffs'))}</h2>${listOf(p.tradeoffs)}
      <h2>${esc(ui('antipatterns'))}</h2>${listOf(p.antipatterns)}
      <h2>${esc(ui('verify'))}</h2>${listOf(p.verify)}
      ${threats}
      <h2>${esc(ui('references'))}</h2><ul>${p.references.map((r) => `<li><a href="${esc(r.url)}">${esc(t(r.title))}</a></li>`).join('')}</ul>
    </div>
    <aside class="glance" aria-labelledby="glance-title">
      <h2 id="glance-title">${esc(ui('atAGlance'))}</h2>
      <dl>
        <div><dt>${esc(ui('colDomain'))}</dt><dd>${esc(t(m.domains[p.domain]))}</dd></div>
        <div><dt>${esc(ui('controls'))}</dt><dd>${LEVELS.map((l) => row(esc(t(m.levels[l])), p.controls.filter((c) => c.level === l).length)).join('')}</dd></div>
        <div><dt>${esc(ui('mappedTo'))}</dt><dd>${['nist', 'cis', 'iso'].map((k) => row(ltr(t(m.frameworks[k])), distinct(k))).join('')}</dd></div>
        ${refRows ? `<div><dt>${esc(ui('threats'))}</dt><dd>${refRows}</dd></div>` : ''}
      </dl>
      <h3>${esc(ui('related'))}</h3>
      <ul class="plain">${p.related.map((r) => `<li>${patternLink(r)}</li>`).join('')}</ul>
      <p class="more"><a href="${gh('patterns', `${p.id}-${p.slug}`)}">${esc(ui('openOnGitHub'))}</a></p>
    </aside>
  </div>
</article>`;
  // The diagram is drawn ahead of time by scripts/render-diagrams.mjs and styled by this page.
  fetch(`diagrams/${p.id}.${S.lang}.svg`)
    .then((res) => (res.ok ? res.text() : ''))
    .then((svg) => {
      const canvas = document.getElementById('diagram-canvas');
      if (!svg || !canvas || route().id !== p.id) return;
      canvas.innerHTML = svg;
      const drawing = canvas.querySelector('svg');
      if (drawing) drawing.setAttribute('aria-label', `${p.id} ${t(p.title)}`);
      document.getElementById('diagram').hidden = false;
    })
    .catch(() => {});
}

// Learning

function viewLearn() {
  const m = meta();
  const item = (href, title, summary, extra = '') =>
    `<li><a href="${esc(href)}">${esc(t(title))}</a><p>${esc(t(summary))}</p>${extra}</li>`;
  const katas = m.katas
    .map((k) => item(gh('katas', k.slug), k.title, k.summary, `<p class="more"><a href="#design?${esc(k.advisor)}">${esc(ui('tryInAdvisor'))}</a></p>`))
    .join('');
  main.innerHTML = `<section class="page learn">
  <h1>${esc(ui('learnTitle'))}</h1>
  <p class="lede">${esc(ui('learnIntro'))}</p>
  <div class="learn-grid">
    <section><h2>${esc(ui('handbookTitle'))}</h2><ol class="steps">${m.handbook.map((c) => item(gh('handbook', c.slug), c.title, c.summary)).join('')}</ol></section>
    <div class="learn-side">
      <section><h2>${esc(ui('katasTitle'))}</h2><ul class="items">${katas}</ul></section>
      <section><h2>${esc(ui('templatesTitle'))}</h2><ul class="items">${m.templates.map((x) => item(gh('templates', x.slug), x.title, x.summary)).join('')}</ul></section>
      <section><h2>${esc(ui('practiceTitle'))}</h2><ul class="items">${m.practice.map((x) => item(x.url, x.name, x.summary)).join('')}</ul></section>
    </div>
  </div>
</section>`;
}

// Glossary

// Search ignores case, Arabic diacritics, and the common spelling variants of alef, yaa, and taa marbuta.
const fold = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647');

function viewGlossary() {
  const twin = other();
  const terms = [...S.data.glossary].sort((a, b) => t(a.term).localeCompare(t(b.term), S.lang));
  const rows = terms
    .map((g) => {
      const key = fold(`${g.term.en} ${g.term.ar} ${t(g.definition)}`);
      const link = g.pattern ? ` <a href="#patterns/${g.pattern}">${ltr(g.pattern)}</a>` : '';
      return `<div class="term" data-key="${esc(key)}"><dt>${esc(t(g.term))} <span class="twin" lang="${twin}" dir="${twin === 'ar' ? 'rtl' : 'ltr'}">${esc(g.term[twin])}</span></dt><dd>${esc(t(g.definition))}${link}</dd></div>`;
    })
    .join('');
  main.innerHTML = `<section class="page glossary">
  <h1>${esc(ui('glossaryTitle'))}</h1>
  <label class="search" for="gq"><span>${esc(ui('glossarySearch'))}</span><input type="search" id="gq" autocomplete="off" spellcheck="false"></label>
  <dl class="terms">${rows}</dl>
  <p class="empty" id="gempty" hidden>${esc(ui('glossaryEmpty'))}</p>
</section>`;
  const input = document.getElementById('gq');
  input.addEventListener('input', () => {
    const q = fold(input.value.trim());
    let shown = 0;
    for (const el of main.querySelectorAll('.term')) {
      const hit = !q || el.dataset.key.includes(q);
      el.hidden = !hit;
      if (hit) shown += 1;
    }
    document.getElementById('gempty').hidden = shown > 0;
  });
}

// Routing

function notFound() {
  S.notice = ui('notFound');
  S.view = 'design';
  history.replaceState(null, '', `${location.pathname}${location.search}#design`);
  viewDesign('');
}

function render(moved) {
  const r = route();
  S.view = r.view;
  if (r.view === 'design') viewDesign(r.query);
  else if (r.view === 'patterns' && r.id) viewPattern(r.id);
  else if (r.view === 'patterns') viewIndex();
  else if (r.view === 'learn') viewLearn();
  else if (r.view === 'glossary') viewGlossary();
  else notFound();
  setTitle();
  syncLinks();
  if (moved) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

async function init() {
  try {
    const res = await fetch('data/bunyan.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    S.data = await res.json();
  } catch {
    main.innerHTML =
      '<p class="notice">The design data could not be loaded. Reload the page, or read Bunyan on <a href="https://github.com/SiteQ8/Bunyan">GitHub</a>. <span lang="ar" dir="rtl">تعذّر تحميل بيانات التصميم، لذا أعد تحميل الصفحة أو اقرأ بُنيان على GitHub.</span></p>';
    return;
  }
  renderChrome();
  window.addEventListener('hashchange', () => render(true));
  render(false);
}

init();
