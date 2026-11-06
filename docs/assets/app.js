// The Bunyan website: the design advisor, the pattern catalogue, the learning
// index, and the glossary. Plain modules, no framework. The only request the
// page makes is for its own data file and drawings, and the only things it
// stores are the chosen language and theme.

import { advise, decodeState, encodeState, defaultAnswers, normalizeAnswers, diffPatterns, LEVELS, PRIORITIES } from './engine.js';
import { buildQuiz } from './quiz.js';
import { renderPlan, PRINT_WIDTH } from './plan.js';
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
  // The question shown in the strip above the plan.
  tab: 0,
  // A pinned highlight on the plan: a pattern the reader tapped, or a threat marked up in red.
  focus: null,
  // What the note under the plan says when nothing is pinned or pointed at.
  rest: '',
  // The patterns the last answer added or promoted, marked in red until the next answer.
  fresh: new Set(),
  // The width the plan was last drawn for, and whether it is being drawn for paper.
  planWidth: 0,
  printing: false,
  // The piece under the pointer, a timer that lets the pointer cross a gap, and
  // where the pointer stood when the page jumped under it.
  hover: null,
  leaving: 0,
  still: null,
  quiz: null,
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

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Fill a template such as "Question {n} of {total}" with ready-made HTML.
const fmt = (template, values) => esc(template).replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing can refuse storage. The choice then lasts for this visit only.
  }
};
// The inner width of an element, which is the width the plan is drawn for.
const contentWidth = (el) => {
  const cs = getComputedStyle(el);
  return Math.floor(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
};

// The board turns its rows over once, as it first comes into view. A board
// that is already on screen is never hidden, and a reader who asks for less
// motion sees no movement at all.
const revealer =
  typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('in');
            revealer.unobserve(entry.target);
            // After its first turn, the board only turns the rows an answer changes.
            setTimeout(() => entry.target.classList.add('shown'), 1200);
          }
        },
        { rootMargin: '0px 0px -12% 0px' }
      )
    : null;

function reveal(...sections) {
  for (const el of sections) {
    if (!el) continue;
    if (!revealer || reduced() || el.getBoundingClientRect().top < innerHeight) {
      el.classList.add('in', 'shown');
      continue;
    }
    el.classList.add('reveal');
    revealer.observe(el);
  }
}

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
  ['quiz', 'navQuiz'],
];

function renderChrome() {
  const skip = document.querySelector('.skip');
  skip.textContent = ui('skip');
  // The skip link moves focus without touching the route.
  skip.addEventListener('click', (event) => {
    event.preventDefault();
    main.focus();
  });
  document.getElementById('nav').innerHTML = NAV.map(
    ([view, key]) => `<a href="#${view}" data-nav="${view}">${esc(ui(key))}</a>`
  ).join('');
  document.getElementById('tools').innerHTML =
    `<a class="lang" id="lang" href="?lang=${other()}" hreflang="${other()}"><span lang="${other()}">${esc(ui('switchLanguage'))}</span><span class="sr-only">, ${esc(ui('switchLanguageLabel'))}</span></a>` +
    `<button type="button" class="theme" id="theme" aria-label="${esc(ui('themeLabel'))}" title="${esc(ui('themeLabel'))}">` +
    '<svg viewBox="0 0 20 20" aria-hidden="true" class="theme-icon"><circle cx="10" cy="10" r="7.25" class="ti-ring"/><path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" class="ti-half"/></svg></button>';
  const p = meta().project;
  document.getElementById('colophon').innerHTML =
    `<p>${esc(t(p.tagline))}</p>` +
    `<p>${esc(ui('footerLicense'))} ${esc(ui('footerMaintainer'))}</p>` +
    `<p>${esc(ui('footerPrivacy'))}</p>` +
    `<p><a href="${esc(p.repo)}">${esc(ui('footerSource'))}</a></p>`;

  document.getElementById('lang').addEventListener('click', () => store('bunyan-lang', other()));
  document.getElementById('theme').addEventListener('click', () => {
    const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
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
  const titles = { design: ui('navDesign'), patterns: ui('navPatterns'), learn: ui('navLearn'), glossary: ui('navGlossary'), quiz: ui('navQuiz') };
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

function questionHtml(q, i) {
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
  return `<div role="tabpanel" id="q-${q.id}" aria-labelledby="tab-${q.id}"${i === S.tab ? '' : ' hidden'}><fieldset><legend>${esc(t(q.label))}</legend>${help}<div class="opts">${options}</div></fieldset></div>`;
}

function tabsHtml(questions) {
  const tab = (id, i, label) =>
    `<button type="button" class="tab" role="tab" id="tab-${id}" aria-controls="q-${id}" aria-selected="${i === S.tab}" tabindex="${i === S.tab ? 0 : -1}">${esc(label)}</button>`;
  return [
    ...questions.map((q, i) => tab(q.id, i, t(q.short))),
    tab('examples', questions.length, ui('examplesTab')),
  ].join('');
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
    ['<rect x="4" y="7" width="40" height="14" class="pl-fixture pl-structural"/>', 'legendStructural'],
    ['<rect x="4" y="7" width="40" height="14" class="pl-fixture pl-recommended lg-fresh"/>', 'legendFresh'],
    ['<rect x="3" y="6" width="42" height="16" class="pl-foundation"/>', 'legendFoundations'],
    [
      '<line x1="3" y1="14" x2="22" y2="14" class="pl-oneway"/><path d="M26 14 l-7 -4 v8 z" class="pl-arrowhead"/><rect x="29" y="5" width="16" height="18" class="pl-vault"/>',
      'legendVault',
    ],
  ];
  return `<ul>${items.map(([svg, key]) => `<li>${swatch(svg)}<span>${esc(ui(key))}</span></li>`).join('')}</ul>`;
}

function aboutHtml() {
  const col = (head, body) => `<p><strong>${esc(ui(head))}</strong> ${esc(ui(body))}</p>`;
  return `<section class="about" aria-labelledby="about-title">
  <h2 id="about-title" class="sr-only">${esc(ui('aboutTitle'))}</h2>
  <p class="about-lead">${esc(ui('aboutLead'))}</p>
  <div class="about-cols">
    ${col('aboutWhoHead', 'aboutWho')}
    ${col('aboutWhatHead', 'aboutWhat')}
    ${col('aboutHowHead', 'aboutHow')}
    ${col('aboutJoinHead', 'aboutJoin')}
  </div>
</section>`;
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
  S.advice = null;
  const katas = meta().katas.map((k) => `<button type="button" data-example="${k.slug}">${esc(t(k.title))}</button>`).join('');
  main.innerHTML = `
<section class="intro">
  <h1>${esc(ui('designTitle'))}</h1>
  <p class="lede">${esc(ui('designIntro'))}</p>
  ${notice ? `<p class="notice" role="status">${esc(notice)}</p>` : ''}
</section>
<section class="sheet" aria-labelledby="sheet-title">
  <h2 id="sheet-title" class="sr-only">${esc(ui('sheetTitle'))}</h2>
  <div class="ask" data-ui>
    <div class="tabs" role="tablist" aria-label="${esc(ui('questionsTitle'))}">${tabsHtml(advisor.questions)}</div>
    <div class="panels" id="qlist">
      ${advisor.questions.map(questionHtml).join('')}
      <div role="tabpanel" id="q-examples" aria-labelledby="tab-examples" class="examples"${S.tab === advisor.questions.length ? '' : ' hidden'}>
        <p class="examples-intro">${esc(ui('examplesTitle'))}</p>
        <div class="chips">${katas}</div>
      </div>
    </div>
    <div class="ask-nav">
      <p class="ask-count" id="ask-count"></p>
      <button type="button" data-step="-1">${esc(ui('askPrev'))}</button>
      <button type="button" data-step="1">${esc(ui('askNext'))}</button>
    </div>
  </div>
  <div class="plan-wrap">
    <div class="plan-frame" id="plan" role="region" aria-label="${esc(ui('planLabel'))}" tabindex="0"></div>
    <div class="plan-note" id="plan-note" aria-live="polite"></div>
  </div>
  <div class="sheet-foot">
    <section class="legend" aria-labelledby="legend-title">
      <h3 id="legend-title">${esc(ui('legendTitle'))}</h3>
      ${legendHtml()}
    </section>
    <div class="titleblock" data-ui>
      <p class="tb-title" aria-hidden="true">${esc(ui('sheetTitle'))}</p>
      <dl>
        <div class="tb-project"><dt><label for="project">${esc(ui('sheetProject'))}</label></dt><dd><input type="text" id="project" maxlength="80" autocomplete="off" spellcheck="false" placeholder="${esc(ui('projectPlaceholder'))}" value="${esc(S.project)}"></dd></div>
        <div><dt>${esc(ui('sheetDrawing'))}</dt><dd id="tb-drawing"></dd></div>
        <div><dt>${esc(ui('sheetLevel'))}</dt><dd id="tb-level"></dd></div>
        <div><dt>${esc(ui('sheetScale'))}</dt><dd>${esc(ui('sheetNotToScale'))}</dd></div>
        <div><dt>${esc(ui('sheetDate'))}</dt><dd id="tb-date"></dd></div>
      </dl>
      <p class="tb-mark">${MARK}<span lang="en">Bunyan</span> <span lang="ar">بُنيان</span></p>
    </div>
    <div class="sheet-end">
      <div class="actions">
        <button type="button" data-act="download">${esc(ui('download'))}</button>
        <button type="button" data-act="copy">${esc(ui('copyLink'))}</button>
        <button type="button" data-act="print">${esc(ui('print'))}</button>
        <button type="button" data-act="reset">${esc(ui('reset'))}</button>
      </div>
      <p class="toast" id="toast" role="status" aria-live="polite"></p>
    </div>
  </div>
</section>
<section class="board" aria-labelledby="r-title">
  <div class="board-head">
    <h2 id="r-title">${esc(ui('resultsTitle'))}</h2>
    <p class="board-count" id="board-count"></p>
  </div>
  <ul class="plist" id="groups"></ul>
</section>
<section class="threats" aria-labelledby="t-title">
  <h2 id="t-title">${esc(ui('threatsTitle'))}</h2>
  <p>${esc(ui('threatsIntro'))}</p>
  <ol class="tlist" id="threats"></ol>
</section>
${aboutHtml()}`;
  bindDesign();
  showTab(S.tab, false);
  refresh(false);
  reveal(main.querySelector('.board'));
}

function readAnswers() {
  const raw = {};
  for (const q of S.data.advisor.questions) {
    const checked = [...main.querySelectorAll(`input[name="${q.id}"]`)].filter((i) => i.checked).map((i) => i.value);
    raw[q.id] = q.type === 'multi' ? checked : checked[0];
  }
  return normalizeAnswers(S.data.advisor, raw);
}

// One question at a time in the strip, with the examples as the last tab.
function showTab(index, focus) {
  const tabs = [...main.querySelectorAll('.tab')];
  const last = tabs.length - 1;
  S.tab = Math.max(0, Math.min(last, index));
  tabs.forEach((tab, i) => {
    const on = i === S.tab;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tabs[S.tab].focus();
  const total = S.data.advisor.questions.length;
  document.getElementById('ask-count').textContent =
    S.tab < total ? ui('quizProgress').replace('{n}', num(S.tab + 1)).replace('{total}', num(total)) : ui('examplesTitle');
  main.querySelector('[data-step="-1"]').disabled = S.tab === 0;
  main.querySelector('[data-step="1"]').disabled = S.tab === last;
}

// The page jumps to the plan at once, and a mouse that has not moved since
// is not taken to be pointing at whatever landed under it.
function revealPlan(event, target) {
  if (event && event.clientX !== undefined) S.still = [event.clientX, event.clientY];
  const el = target || document.getElementById('plan');
  const box = el.getBoundingClientRect();
  if (box.top < 0 || box.top > innerHeight * 0.6) el.scrollIntoView({ block: target ? 'center' : 'start' });
}
const still = (e) => S.still && e.clientX === S.still[0] && e.clientY === S.still[1];

function bindDesign() {
  document.getElementById('qlist').addEventListener('change', (event) => {
    if (!event.target.matches('input')) return;
    S.answers = readAnswers();
    refresh(true);
  });
  const tablist = main.querySelector('.tabs');
  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('.tab');
    if (tab) showTab([...tablist.children].indexOf(tab), false);
  });
  tablist.addEventListener('keydown', (event) => {
    const forward = S.lang === 'ar' ? 'ArrowLeft' : 'ArrowRight';
    const back = S.lang === 'ar' ? 'ArrowRight' : 'ArrowLeft';
    const move = { [forward]: S.tab + 1, [back]: S.tab - 1, Home: 0, End: tablist.children.length - 1 }[event.key];
    if (move === undefined) return;
    event.preventDefault();
    showTab((move + tablist.children.length) % tablist.children.length, true);
  });
  main.querySelector('.ask-nav').addEventListener('click', (event) => {
    const step = event.target.closest('button[data-step]');
    if (step) showTab(S.tab + Number(step.dataset.step), false);
  });
  const project = document.getElementById('project');
  project.addEventListener('input', () => {
    S.project = project.value.slice(0, 80);
    writeUrl();
  });
  main.querySelector('.actions').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-act]');
    if (!button) return;
    const act = { copy: copyLink, download: downloadBrief, print: () => window.print(), reset: resetDesign };
    act[button.dataset.act]();
  });

  // The plan answers back: point at a piece to see where it comes from, tap or
  // press Enter to pin it, and Escape to let it go.
  const frame = document.getElementById('plan');
  frame.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    clearTimeout(S.leaving);
    if (S.focus || still(event)) return;
    S.still = null;
    const item = event.target.closest('.pl-item');
    if (!item) {
      S.leaving = setTimeout(rest, 120);
      return;
    }
    if (item === S.hover) return;
    S.hover = item;
    light([item.dataset.pattern]);
    note(patternNote(item.dataset.pattern, item.dataset.label, false));
  });
  frame.addEventListener('pointerleave', () => {
    clearTimeout(S.leaving);
    if (!S.focus) S.leaving = setTimeout(rest, 120);
  });
  frame.addEventListener('click', (event) => {
    const item = event.target.closest('.pl-item');
    if (item) togglePin(item);
    else if (S.focus) unpin();
  });
  frame.addEventListener('keydown', (event) => {
    const items = [...frame.querySelectorAll('.pl-item')];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    const flip = S.lang === 'ar' ? -1 : 1;
    const step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: flip, ArrowLeft: -flip }[event.key];
    if (step) {
      event.preventDefault();
      items[i < 0 ? 0 : (i + step + items.length) % items.length].focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      items[event.key === 'Home' ? 0 : items.length - 1].focus();
    } else if ((event.key === 'Enter' || event.key === ' ') && i >= 0) {
      event.preventDefault();
      togglePin(items[i]);
    }
  });
  frame.addEventListener('focusin', (event) => {
    const item = event.target.closest('.pl-item');
    if (!item || S.focus) return;
    light([item.dataset.pattern]);
    note(patternNote(item.dataset.pattern, item.dataset.label, false));
  });
  // Leaving the plan for its note keeps the note; leaving for anywhere else lets it rest.
  frame.addEventListener('focusout', (event) => {
    const to = event.relatedTarget;
    if (S.focus || frame.contains(to) || (to && to.closest && to.closest('#plan-note'))) return;
    rest();
  });

  // The list lights up the plan in return.
  const groups = document.getElementById('groups');
  const fromRow = (event) => {
    const row = event.target.closest('li[data-id]');
    if (row && !S.focus) light([row.dataset.id]);
  };
  groups.addEventListener('pointerover', fromRow);
  groups.addEventListener('focusin', fromRow);
  groups.addEventListener('pointerleave', () => !S.focus && settle());
  groups.addEventListener('focusout', () => !S.focus && settle());
  // Opening a row closes the one that was open; the page then moves so that the
  // row the reader opened stays where they clicked it.
  groups.addEventListener('click', (event) => {
    const summary = event.target.closest('summary');
    if (!summary) return;
    const before = summary.getBoundingClientRect().top;
    requestAnimationFrame(() => {
      const moved = summary.getBoundingClientRect().top - before;
      if (Math.abs(moved) > 1) window.scrollBy(0, moved);
    });
  });

  // Mark up a threat in red: the controls that stop it stand out on the plan.
  document.getElementById('threats').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-threat]');
    if (!button) return;
    const threat = S.advice.threats.find((th) => th.id === button.dataset.threat);
    if (S.focus && S.focus.kind === 'threat' && S.focus.id === threat.id) return unpin();
    pin({ kind: 'threat', id: threat.id, ids: threat.addressedBy, html: threatNote(threat) });
    button.setAttribute('aria-pressed', 'true');
    revealPlan(event, document.querySelector('#plan .pl-item.hl'));
  });

  document.getElementById('plan-note').addEventListener('click', (event) => {
    const show = event.target.closest('button[data-show]');
    if (show) return showInList(show.dataset.show);
    if (event.target.closest('button[data-clear]')) unpin();
  });

  // Examples load a whole scenario at once, and the note says what it changed.
  main.querySelector('.examples').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-example]');
    if (!button) return;
    const kata = meta().katas.find((k) => k.slug === button.dataset.example);
    S.answers = decodeState(S.data.advisor, kata.advisor).answers;
    S.project = t(kata.title);
    syncInputs();
    refresh(true);
    revealPlan(event);
  });

  watchPlan(frame);
}

function syncInputs() {
  for (const q of S.data.advisor.questions) {
    const value = S.answers[q.id];
    for (const input of main.querySelectorAll(`input[name="${q.id}"]`)) {
      input.checked = Array.isArray(value) ? value.includes(input.value) : value === input.value;
    }
  }
  document.getElementById('project').value = S.project;
}

// The plan is drawn for the width of its frame, and drawn again when that width changes.
const sizer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => requestAnimationFrame(redrawIfResized)) : null;

function watchPlan(frame) {
  if (!sizer) return;
  sizer.disconnect();
  sizer.observe(frame);
}

function redrawIfResized() {
  const frame = document.getElementById('plan');
  if (!frame || !S.advice || S.printing) return;
  if (Math.abs(contentWidth(frame) - S.planWidth) >= 16) drawPlan();
}

function drawPlan() {
  const frame = document.getElementById('plan');
  if (!frame || !S.advice) return;
  const width = S.printing ? PRINT_WIDTH : contentWidth(frame);
  S.planWidth = width;
  S.hover = null;
  frame.innerHTML = renderPlan(S.advice.plan, S.lang, meta().ui, width);
  for (const item of frame.querySelectorAll('.pl-item')) item.classList.toggle('is-new', S.fresh.has(item.dataset.pattern));
  settle();
}

function light(ids, mode = '') {
  const frame = document.getElementById('plan');
  if (!frame) return;
  const on = new Set(ids);
  frame.classList.toggle('focusing', on.size > 0);
  frame.classList.toggle('markup', mode === 'threat');
  for (const item of frame.querySelectorAll('.pl-item')) item.classList.toggle('hl', on.has(item.dataset.pattern));
  for (const row of document.querySelectorAll('#groups li[data-id]')) row.classList.toggle('hl', on.has(row.dataset.id));
}

// The note is only written when what it says changes, so a reader's focus inside it survives.
function note(html) {
  const el = document.getElementById('plan-note');
  if (!el || el.dataset.html === html) return;
  el.dataset.html = html;
  el.innerHTML = html;
}

// Back to the pinned state, or to the resting note when nothing is pinned.
function settle() {
  light(S.focus ? S.focus.ids : [], S.focus ? S.focus.kind : '');
  note(S.focus ? S.focus.html : S.rest);
}

function rest() {
  S.hover = null;
  settle();
}

function pin(focus) {
  for (const b of document.querySelectorAll('button[data-threat]')) b.setAttribute('aria-pressed', 'false');
  S.focus = focus;
  settle();
}

function unpin() {
  S.focus = null;
  for (const b of document.querySelectorAll('button[data-threat]')) b.setAttribute('aria-pressed', 'false');
  settle();
}

function togglePin(item) {
  const id = item.dataset.pattern;
  if (S.focus && S.focus.kind === 'pattern' && S.focus.id === id) return unpin();
  pin({ kind: 'pattern', id, ids: [id], html: patternNote(id, item.dataset.label, true) });
}

const markOf = (priority) => (priority ? `<span class="mark mark-${priority}" aria-hidden="true"></span>` : '');
const levelTag = (priority) => `<span class="level">${esc(t(meta().priorities[priority]))}</span>`;

// A touch screen has no pointer to hover with and no arrow keys, so it gets the short hint.
function hintNote() {
  return `<p class="hint hint-pointer">${esc(ui('planHint'))}</p><p class="hint hint-touch">${esc(ui('planHintTouch'))}</p>`;
}

// Pointing at a piece previews its note; pinning it adds the way to the list and the pattern.
function patternNote(id, label, pinned) {
  const p = patternById(id);
  if (!p) return S.rest;
  const rec = S.advice.patterns.find((r) => r.id === id);
  const reason = rec && rec.reasons[0] ? `<p><span class="note-key">${esc(ui('why'))}</span> ${esc(t(rec.reasons[0]))}</p>` : '';
  const end = pinned
    ? `<p class="note-actions"><button type="button" data-show="${id}">${esc(ui('showInList'))}</button><a href="#patterns/${id}">${esc(ui('readPattern'))}</a></p>`
    : `<p class="hint">${esc(ui('notePin'))}</p>`;
  return `<p class="note-head">${markOf(rec && rec.priority)}<strong>${ltr(id)} ${esc(t(p.title))}</strong>${rec ? ` ${levelTag(rec.priority)}` : ''}</p>
${label ? `<p class="note-label">${esc(label)}</p>` : ''}${reason}${end}`;
}

function threatNote(threat) {
  const by = threat.addressedBy.map((id) => patternLink(id)).join(sep());
  return `<p class="note-head"><span class="mark mark-threat" aria-hidden="true"></span><strong>${esc(t(threat.title))}</strong></p>
<p><span class="note-key">${esc(ui('stoppedBy'))}</span> ${by}</p>
<p class="note-actions"><button type="button" data-clear>${esc(ui('clearMarks'))}</button></p>`;
}

function changesNote(changes) {
  const title = `<strong>${esc(ui('changesTitle'))}</strong>`;
  if (!changes.length) return `<p class="note-head">${title}</p><p class="note-label">${esc(ui('changeNone'))}</p>`;
  const key = { added: 'changeAdded', moved: 'changeMoved', removed: 'changeRemoved' };
  const items = changes.map((c) => {
    const text = fmt(ui(key[c.kind]), { pattern: patternLink(c.id), priority: levelTag(c.priority) });
    return `<li class="chg chg-${c.kind}">${text}</li>`;
  });
  const list = `<ul class="changes">${items.join('')}</ul>`;
  if (changes.length <= 3) return `<p class="note-head">${title}</p>${list}`;
  const counts = [
    ['added', 'changesAdded'],
    ['moved', 'changesMoved'],
    ['removed', 'changesRemoved'],
  ];
  const summary = counts
    .map(([kind, k]) => [k, changes.filter((c) => c.kind === kind).length])
    .filter(([, n]) => n)
    .map(([k, n]) => esc(ui(k).replace('{n}', num(n))))
    .join(sep());
  return `<p class="note-head">${title} <span class="note-label">${summary}</span></p><details class="chg-more"><summary>${esc(ui('changeShow'))}</summary>${list}</details>`;
}

function showInList(id) {
  const row = document.querySelector(`#groups li[data-id="${id}"]`);
  if (!row) return;
  row.querySelector('details').open = true;
  row.scrollIntoView({ block: 'center' });
  row.classList.remove('flash');
  row.getBoundingClientRect();
  row.classList.add('flash');
  row.querySelector('summary').focus({ preventScroll: true });
}

function refresh(write) {
  const before = S.advice;
  S.advice = advise(S.data, S.answers);
  S.focus = null;
  if (write && before) {
    const changes = diffPatterns(before.patterns, S.advice.patterns);
    S.rest = changesNote(changes);
    S.fresh = new Set(changes.filter((c) => c.kind !== 'removed').map((c) => c.id));
  } else {
    S.rest = hintNote();
    S.fresh = new Set();
  }
  refreshTitleBlock();
  document.getElementById('groups').innerHTML = boardHtml(S.advice);
  document.getElementById('board-count').innerHTML = countHtml(S.advice);
  document.getElementById('threats').innerHTML = S.advice.threats.map(threatHtml).join('');
  drawPlan();
  if (write) writeUrl();
  else syncLinks();
}

function refreshTitleBlock() {
  const system = S.data.advisor.questions.find((q) => q.id === 'system');
  document.getElementById('tb-drawing').textContent = t(system.options.find((o) => o.id === S.answers.system).label);
  document.getElementById('tb-level').textContent = t(meta().levels[S.answers.maturity]);
  document.getElementById('tb-date').textContent = num(today());
}

// The patterns for this design, essential first, each row opening onto its detail.
function boardHtml(advice) {
  return PRIORITIES.flatMap((priority) => advice.patterns.filter((p) => p.priority === priority))
    .map(recommendationHtml)
    .join('');
}

function countHtml(advice) {
  return PRIORITIES.map((priority) => {
    const n = advice.patterns.filter((p) => p.priority === priority).length;
    return n ? `<span>${esc(t(meta().priorities[priority]))} <b>${esc(num(n))}</b></span>` : '';
  }).join('');
}

function recommendationHtml(rec) {
  const p = rec.pattern;
  const next = rec.nextControls.length
    ? `<h3>${esc(ui('nextLevel'))}</h3><ul>${rec.nextControls.map((c) => `<li>${esc(t(c.name))}</li>`).join('')}</ul>`
    : '';
  return `<li data-id="${p.id}"${S.fresh.has(p.id) ? ' class="flap"' : ''}><details name="plist"><summary><span class="ptitle">${esc(t(p.title))}</span><span class="pdomain">${esc(t(meta().domains[p.domain]))}</span><span class="pid">${ltr(p.id)}</span><span class="pstatus pst-${rec.priority}">${esc(t(meta().priorities[rec.priority]))}</span></summary>
<div class="pbody">
  <div class="pcol">
    <h3>${esc(ui('why'))}</h3>${listOf(rec.reasons)}
    <h3>${esc(ui('decisions'))}</h3>${listOf(p.decisions)}
    <h3>${esc(ui('verify'))}</h3>${listOf(p.verify)}
  </div>
  <div class="pcol">
    <h3>${esc(ui('controlsAtLevel'))}</h3><ul class="controls">${rec.controls.map((c) => controlHtml(c, true)).join('')}</ul>
    ${next}
    <p class="more"><a href="#patterns/${p.id}">${esc(ui('readPattern'))}</a></p>
  </div>
</div></details></li>`;
}

function threatHtml(threat) {
  const refs = threat.refs.map(refLink).join(sep());
  const by = threat.addressedBy.map((id) => `<a href="#patterns/${id}">${ltr(id)}</a>`).join(sep());
  return `<li><span class="tdot" aria-hidden="true"></span><p class="ttitle" id="th-${threat.id}">${esc(t(threat.title))}</p><p class="tby">${esc(ui('threatsMitigated'))} ${by}</p><p class="tline">${refs}</p><p class="tline"><button type="button" class="mark-btn" data-threat="${threat.id}" aria-pressed="false" aria-describedby="th-${threat.id}">${esc(ui('showOnPlan'))}</button></p></li>`;
}

function writeUrl() {
  history.replaceState(null, '', `${location.pathname}${location.search}#design?${designQuery()}`);
  syncLinks();
}

// A short message beside the sheet's actions, with an optional action of its own.
function toast(message, { sticky = false, action = null, ms = 3000 } = {}) {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(toast.timer);
  if (!message) {
    el.removeAttribute('data-on');
    el.textContent = '';
    return;
  }
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').addEventListener('click', action.run, { once: true });
  el.setAttribute('data-on', '');
  if (sticky) return;
  toast.timer = setTimeout(() => {
    el.removeAttribute('data-on');
    toast.timer = setTimeout(() => {
      el.textContent = '';
    }, 200);
  }, ms);
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
  // A link that could not be copied stays on screen until the reader takes it.
  if (ok) toast(ui('linkCopied'));
  else toast(url, { sticky: true });
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

// Starting over keeps what it replaced for a few seconds, so one click cannot lose a design.
function resetDesign() {
  const before = { answers: S.answers, project: S.project, tab: S.tab };
  S.answers = defaultAnswers(S.data.advisor);
  S.project = '';
  S.tab = 0;
  viewDesign('');
  writeUrl();
  document.getElementById('project').focus({ preventScroll: true });
  toast(ui('resetDone'), {
    ms: 8000,
    action: {
      label: ui('undo'),
      run: () => {
        Object.assign(S, before);
        viewDesign('');
        writeUrl();
        main.querySelector('[data-act="reset"]').focus({ preventScroll: true });
      },
    },
  });
}

// The pattern catalogue

function viewIndex() {
  const m = meta();
  const groups = Object.keys(m.domains)
    .map((d) => {
      const list = S.data.patterns.filter((p) => p.domain === d);
      if (!list.length) return '';
      const rows = list
        .map((p) => `<li><a href="#patterns/${p.id}">${esc(t(p.title))}</a><span class="inum">${ltr(p.id)}</span><p class="isum">${esc(t(p.summary))}</p></li>`)
        .join('');
      return `<section class="igroup" aria-labelledby="d-${d}"><h2 id="d-${d}">${esc(t(m.domains[d]))}</h2><ul class="irows">${rows}</ul></section>`;
    })
    .join('');
  main.innerHTML = `<section class="page">
  <h1>${esc(ui('patternsTitle'))}</h1>
  <p class="lede">${esc(ui('patternsIntro'))}</p>
  <div class="index">${groups}</div>
</section>`;
}

function viewPattern(id) {
  const p = patternById(id);
  if (!p) return notFound();
  const m = meta();
  const sec = (key, body) => `<section class="psec"><h2>${esc(ui(key))}</h2><div>${body}</div></section>`;
  const controls = LEVELS.map((level) => {
    const list = p.controls.filter((c) => c.level === level);
    if (!list.length) return '';
    return `<h3>${esc(t(m.levels[level]))}</h3><ul class="controls">${list.map((c) => controlHtml(c)).join('')}</ul>`;
  }).join('');
  const refs = [...p.attack, ...p.owasp];
  const row = (label, value) => `<span class="row">${label} <b>${esc(num(value))}</b></span>`;
  const distinct = (key) => new Set(p.controls.flatMap((c) => c[key])).size;
  const refRows = [
    [p.attack.length, 'MITRE ATT&CK'],
    [p.owasp.length, 'OWASP'],
  ]
    .filter(([n]) => n)
    .map(([n, name]) => row(ltr(name), n))
    .join('');
  main.innerHTML = `<article class="page pattern">
  <nav class="crumbs" aria-label="${esc(ui('crumbs'))}"><a href="#patterns">${esc(ui('navPatterns'))}</a><span aria-hidden="true">/</span><span aria-current="page">${ltr(p.id)}</span></nav>
  <h1>${esc(t(p.title))}</h1>
  <div class="phead-body">
  <p class="lede">${esc(t(p.summary))}</p>
  <dl class="facts" aria-label="${esc(ui('atAGlance'))}">
    <div><dt>${esc(ui('colDomain'))}</dt><dd>${esc(t(m.domains[p.domain]))}</dd></div>
    <div><dt>${esc(ui('controls'))}</dt><dd>${LEVELS.map((l) => row(esc(t(m.levels[l])), p.controls.filter((c) => c.level === l).length)).join('')}</dd></div>
    <div><dt>${esc(ui('mappedTo'))}</dt><dd>${['nist', 'cis', 'iso'].map((k) => row(ltr(t(m.frameworks[k])), distinct(k))).join('')}</dd></div>
    ${refRows ? `<div><dt>${esc(ui('threats'))}</dt><dd>${refRows}</dd></div>` : ''}
  </dl>
  </div>
  <figure class="diagram" id="diagram">
    <figcaption>${esc(ui('diagramCaption'))}</figcaption>
    <div class="diagram-canvas" id="diagram-canvas" data-ui tabindex="0" role="region" aria-label="${esc(ui('diagramCaption'))}"></div>
  </figure>
  <div class="pattern-body">
    ${sec('problem', `<p>${esc(t(p.problem))}</p>`)}
    ${sec('useWhen', listOf(p.useWhen))}
    ${sec('design', p.design.map((d) => `<p>${esc(t(d))}</p>`).join(''))}
    ${sec('controls', controls)}
    ${sec('decisions', listOf(p.decisions))}
    ${sec('tradeoffs', listOf(p.tradeoffs))}
    ${sec('antipatterns', listOf(p.antipatterns))}
    ${sec('verify', listOf(p.verify))}
    ${refs.length ? sec('threats', `<ul>${refs.map((r) => `<li>${refLink(r)}</li>`).join('')}</ul>`) : ''}
    ${sec('references', `<ul>${p.references.map((r) => `<li><a href="${esc(r.url)}">${esc(t(r.title))}</a></li>`).join('')}</ul>`)}
    ${sec('related', `<ul class="plain">${p.related.map((r) => `<li>${patternLink(r)}</li>`).join('')}</ul><p class="more"><a href="${gh('patterns', `${p.id}-${p.slug}`)}">${esc(ui('openOnGitHub'))}</a></p>`)}
  </div>
</article>`;
  drawDiagram(p);
}

// The diagram is drawn ahead of time by scripts/render-diagrams.mjs, in a wide
// and a tall version, and styled by this page. The page takes the version that
// sets its labels nearest their true size, and a narrow screen pans a drawing
// it cannot fit rather than shrinking it past reading. An empty drawing of the
// same size holds its place while it loads, so the text below never jumps.
const LEGIBLE = 0.87; // the smallest scale at which 15px diagram labels stay at 13px
function diagramChoice(p, width) {
  const boxes = S.data.diagrams || {};
  const size = (name) => (boxes[name] ? boxes[name].split(' ').map(Number) : null);
  const wide = `${p.id}.${S.lang}`;
  const tall = `${wide}.tall`;
  if (!size(wide)) return null;
  const fit = (name) => Math.min(1.1, width / size(name)[2]);
  let name = wide;
  if (fit(wide) < LEGIBLE && size(tall)) {
    const tallHeight = size(tall)[3] * fit(tall);
    if (width < 900 || tallHeight <= 900) name = tall;
  }
  const [, , w, h] = size(name);
  const scale = fit(name) < LEGIBLE ? Math.max(fit(name), width < 900 ? 0.93 : fit(name)) : fit(name);
  return { name, box: boxes[name], w: Math.round(w * scale), h: Math.round(h * scale), pan: w * scale > width + 1 };
}

function drawDiagram(p) {
  const figure = document.getElementById('diagram');
  const canvas = document.getElementById('diagram-canvas');
  const choice = diagramChoice(p, contentWidth(canvas));
  if (!choice) return void (figure.hidden = true);
  const sized = (svg) => {
    svg.setAttribute('width', choice.w);
    svg.setAttribute('height', choice.h);
  };
  canvas.classList.toggle('pan', choice.pan);
  canvas.innerHTML = `<svg class="diagram-svg" viewBox="${choice.box}" aria-hidden="true"></svg>`;
  sized(canvas.firstElementChild);
  fetch(`diagrams/${choice.name}.svg`)
    .then((res) => (res.ok ? res.text() : ''))
    .then((svg) => {
      if (route().id !== p.id || !document.getElementById('diagram-canvas')) return;
      if (!svg) return void (figure.hidden = true);
      canvas.innerHTML = svg;
      const drawing = canvas.querySelector('svg');
      if (!drawing) return;
      sized(drawing);
      drawing.setAttribute('aria-label', `${p.id} ${t(p.title)}`);
    })
    .catch(() => {
      if (document.getElementById('diagram')) figure.hidden = true;
    });
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
  <p class="more quiz-link"><a href="#quiz">${esc(ui('quizTitle'))}</a></p>
  <div class="learn-cols">
    <section><h2>${esc(ui('handbookTitle'))}</h2><ol class="steps">${m.handbook.map((c) => item(gh('handbook', c.slug), c.title, c.summary)).join('')}</ol></section>
    <section><h2>${esc(ui('katasTitle'))}</h2><ul class="items">${katas}</ul></section>
    <section><h2>${esc(ui('templatesTitle'))}</h2><ul class="items">${m.templates.map((x) => item(gh('templates', x.slug), x.title, x.summary)).join('')}</ul></section>
    <section><h2>${esc(ui('practiceTitle'))}</h2><ul class="items">${m.practice.map((x) => item(x.url, x.name, x.summary)).join('')}</ul></section>
  </div>
</section>`;
}

// Glossary

// Search ignores case, Arabic diacritics, and the common spelling variants of alef, yaa, and taa marbuta.
const fold = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');

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
  <p class="lede">${esc(ui('glossaryIntro'))}</p>
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

// The quiz

function viewQuiz() {
  if (!S.quiz) S.quiz = { questions: buildQuiz(S.data), index: 0, results: [] };
  main.innerHTML = `<section class="page quiz">
  <h1>${esc(ui('quizTitle'))}</h1>
  <p class="lede">${esc(ui('quizIntro'))}</p>
  <div class="quiz-card" id="quiz"></div>
  <p class="quiz-keys">${esc(ui('quizKeys'))}</p>
</section>`;
  document.getElementById('quiz').addEventListener('click', (event) => {
    const option = event.target.closest('.quiz-option');
    if (option) return answerQuiz(option.dataset.id);
    if (event.target.closest('[data-next]')) {
      S.quiz.index += 1;
      drawQuiz();
      const first = document.querySelector('.quiz-option, [data-again]');
      if (first) first.focus();
      return;
    }
    if (event.target.closest('[data-again]')) {
      S.quiz = { questions: buildQuiz(S.data), index: 0, results: [] };
      drawQuiz();
      document.querySelector('.quiz-option').focus();
    }
  });
  drawQuiz();
}

function drawQuiz() {
  const box = document.getElementById('quiz');
  const Q = S.quiz;
  const total = Q.questions.length;
  const scale = `<div class="scale" aria-hidden="true">${Q.questions
    .map((q, i) => `<span class="${i < Q.results.length ? (Q.results[i] ? 'ok' : 'miss') : i === Q.index ? 'now' : ''}"></span>`)
    .join('')}</div>`;
  if (Q.index >= total) {
    const right = Q.results.filter(Boolean).length;
    const missed = [...new Set(Q.questions.filter((q, i) => !Q.results[i]).map((q) => q.answer))];
    const review = missed.length
      ? `<h3>${esc(ui('quizReview'))}</h3><ul class="plain">${missed.map((id) => `<li>${patternLink(id)}</li>`).join('')}</ul>`
      : '';
    box.innerHTML = `${scale}<h2 class="quiz-score">${fmt(ui('quizScore'), { n: esc(num(right)), total: esc(num(total)) })}</h2>${review}
<p class="quiz-actions"><button type="button" class="quiz-go" data-again>${esc(ui('quizAgain'))}</button></p>`;
    return;
  }
  const q = Q.questions[Q.index];
  const options = q.options
    .map(
      (id, i) =>
        `<button type="button" class="quiz-option" data-id="${id}"><span class="key">${esc(num(i + 1))}</span><span>${ltr(id)} ${esc(t(patternById(id).title))}</span></button>`
    )
    .join('');
  box.innerHTML = `${scale}
<p class="quiz-progress">${fmt(ui('quizProgress'), { n: esc(num(Q.index + 1)), total: esc(num(total)) })}</p>
<h2 class="quiz-ask">${esc(ui(q.kind === 'threat' ? 'quizThreat' : 'quizProblem'))}</h2>
<blockquote class="quiz-prompt">${esc(t(q.prompt))}</blockquote>
<div class="quiz-options">${options}</div>
<div class="quiz-feedback" id="quiz-feedback" aria-live="polite"></div>`;
}

function answerQuiz(id) {
  const Q = S.quiz;
  if (Q.results.length > Q.index || Q.index >= Q.questions.length) return;
  const q = Q.questions[Q.index];
  const ok = id === q.answer;
  Q.results.push(ok);
  for (const button of document.querySelectorAll('.quiz-option')) {
    button.disabled = true;
    if (button.dataset.id === q.answer) button.classList.add('right');
    else if (button.dataset.id === id) button.classList.add('wrong');
  }
  const segment = document.querySelectorAll('.scale span')[Q.index];
  if (segment) segment.className = ok ? 'ok' : 'miss';
  const last = Q.index + 1 >= Q.questions.length;
  const verdict = ok ? esc(ui('quizRight')) : `${esc(ui('quizWrong'))} ${patternLink(q.answer)}`;
  document.getElementById('quiz-feedback').innerHTML = `<p class="verdict ${ok ? 'ok' : 'miss'}">${verdict}</p>
<p>${esc(t(patternById(q.answer).summary))}</p>
<p class="quiz-actions"><button type="button" class="quiz-go" data-next>${esc(ui(last ? 'quizFinish' : 'quizNext'))}</button><a href="#patterns/${q.answer}">${esc(ui('readPattern'))}</a></p>`;
  document.querySelector('[data-next]').focus();
}

// Keys: Escape clears the marks, and 1 to 4 answer the quiz, in either set of numerals.
function onKey(event) {
  if (event.key === 'Escape' && S.view === 'design' && S.focus) {
    const inPlan = document.activeElement && document.activeElement.closest && document.activeElement.closest('#plan');
    unpin();
    if (inPlan) document.getElementById('plan').focus();
    return;
  }
  if (S.view !== 'quiz' || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest && event.target.closest('input, textarea')) return;
  const digit = '1234'.indexOf(event.key) >= 0 ? '1234'.indexOf(event.key) : '١٢٣٤'.indexOf(event.key);
  if (digit < 0) return;
  const option = document.querySelectorAll('.quiz-option')[digit];
  if (option && !option.disabled) option.click();
}

// Printing draws the landscape sheet, whatever the screen, and puts the screen's drawing back after.
function onPrint(printing) {
  if (S.view !== 'design') return;
  S.printing = printing;
  drawPlan();
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
  if (sizer) sizer.disconnect();
  if (r.view === 'design') viewDesign(r.query);
  else if (r.view === 'patterns' && r.id) viewPattern(r.id);
  else if (r.view === 'patterns') viewIndex();
  else if (r.view === 'learn') viewLearn();
  else if (r.view === 'glossary') viewGlossary();
  else if (r.view === 'quiz') viewQuiz();
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
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => render(true));
  window.addEventListener('beforeprint', () => onPrint(true));
  window.addEventListener('afterprint', () => onPrint(false));
  render(false);
}

init();
