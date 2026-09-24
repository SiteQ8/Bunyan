import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../scripts/lib/load.mjs';
import { markdownProblems, universalProblems } from '../scripts/lib/text.mjs';
import {
  advise,
  decodeState,
  defaultAnswers,
  encodeState,
  levelsFor,
  matches,
  nextLevel,
  normalizeAnswers,
  recommendPatterns,
  THREAT_LIMIT,
} from '../docs/assets/engine.js';
import { renderPlan } from '../docs/assets/plan.js';
import { renderBrief } from '../docs/assets/brief.js';
import { prng, xmlProblems } from './helpers.mjs';

const bundle = loadBundle();
const { advisor, meta } = bundle;
const byPriority = (advice, priority) => advice.patterns.filter((p) => p.priority === priority).map((p) => p.id);

const SCENARIOS = {
  bank: {
    system: 'digital',
    hosting: 'hybrid',
    exposure: ['public', 'partners'],
    data: 'regulated',
    obligations: ['pci', 'bank', 'national'],
    availability: 'critical',
    admins: 'large',
    delivery: ['inhouse', 'containers'],
    maturity: 'enhanced',
  },
  utility: {
    system: 'ot',
    hosting: 'onprem',
    exposure: ['vendors'],
    data: 'internal',
    obligations: ['national'],
    availability: 'critical',
    admins: 'outsourced',
    delivery: ['saas'],
    maturity: 'foundation',
  },
  assistant: {
    system: 'ai',
    hosting: 'cloud',
    exposure: ['remote'],
    data: 'confidential',
    obligations: ['privacy'],
    availability: 'standard',
    admins: 'small',
    delivery: ['inhouse'],
    maturity: 'foundation',
  },
};

test('a bank mobile platform gets the controls a regulator will ask about', () => {
  const advice = advise(bundle, SCENARIOS.bank);
  const essential = byPriority(advice, 'essential');
  for (const id of ['P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11', 'P12', 'P15', 'P16']) {
    assert.ok(essential.includes(id), `${id} is essential`);
  }
  assert.ok(!advice.patterns.some((p) => ['P13', 'P14'].includes(p.id)), 'no industrial or AI patterns');
  assert.equal(advice.plan.rooms.at(-1).id, 'enclave', 'the regulated enclave is drawn');
  assert.ok(advice.threats.some((t) => t.id === 'api-authorization'));
  assert.ok(advice.plan.entrances.some((e) => e.pattern === 'P07'), 'partners have their own door');
});

test('vendor access to a water utility centres on zones and conduits', () => {
  const advice = advise(bundle, SCENARIOS.utility);
  const essential = byPriority(advice, 'essential');
  for (const id of ['P13', 'P01', 'P03', 'P04', 'P10', 'P12']) assert.ok(essential.includes(id), `${id} is essential`);
  assert.ok(!advice.patterns.some((p) => p.id === 'P06'), 'no cloud landing zone on premises');
  assert.ok(!advice.plan.foundations.some((f) => f.pattern === 'P06'), 'no cloud guardrails under the plan');
  const threats = advice.threats.map((t) => t.id);
  assert.ok(threats.includes('ot-remote-access') && threats.includes('third-party-access'));
  assert.equal(advice.plan.rooms.length, 4);
  assert.deepEqual(advice.plan.corridor.label, advisor.plan.systems.ot.corridor.label, 'the OT corridor goes through the DMZ');
});

test('an internal AI assistant gets guardrails and data protection', () => {
  const advice = advise(bundle, SCENARIOS.assistant);
  const essential = byPriority(advice, 'essential');
  for (const id of ['P14', 'P09', 'P01', 'P02', 'P06']) assert.ok(essential.includes(id), `${id} is essential`);
  const threats = advice.threats.map((t) => t.id);
  assert.ok(threats.includes('prompt-injection') && threats.includes('llm-data-exposure'));
});

// Find answers that satisfy a condition, so that every rule can be shown to fire.
function satisfy(cond, answers) {
  if (cond === 'always') return answers;
  if (cond.all) return cond.all.reduce((a, c) => satisfy(c, a), answers);
  if (cond.any) return satisfy(cond.any[0], answers);
  const q = advisor.questions.find((x) => x.id === cond.q);
  if (cond.in) return { ...answers, [q.id]: cond.in[0] };
  if (cond.hasNone) return { ...answers, [q.id]: (answers[q.id] || []).filter((x) => !cond.hasNone.includes(x)) };
  const add = cond.has || cond.hasAny[0];
  return { ...answers, [q.id]: [...new Set([...(answers[q.id] || []), add])] };
}

test('every rule can fire and every pattern can be recommended', () => {
  const seen = new Set();
  advisor.rules.forEach((rule, i) => {
    const answers = normalizeAnswers(advisor, satisfy(rule.when, defaultAnswers(advisor)));
    assert.ok(matches(rule.when, answers), `rule ${i} fires for the answers built for it`);
    const rec = recommendPatterns(advisor, answers);
    assert.ok(rec.has(rule.pattern), `rule ${i} recommends ${rule.pattern}`);
    seen.add(rule.pattern);
  });
  assert.equal(seen.size, bundle.patterns.length);
});

function randomAnswers(rand) {
  const answers = {};
  for (const q of advisor.questions) {
    if (q.type === 'multi') answers[q.id] = q.options.map((o) => o.id).filter(() => rand() < 0.4);
    else answers[q.id] = q.options[Math.floor(rand() * q.options.length)].id;
  }
  return answers;
}

test('every threat can appear in the list people see', () => {
  const shown = new Set();
  const rand = prng(99);
  const samples = [...Object.values(SCENARIOS)];
  for (const t of advisor.threats) samples.push(normalizeAnswers(advisor, satisfy(t.when, defaultAnswers(advisor))));
  for (let i = 0; i < 600; i += 1) samples.push(randomAnswers(rand));
  for (const answers of samples) {
    const advice = advise(bundle, answers);
    assert.ok(advice.threats.length <= THREAT_LIMIT);
    const order = advice.threats.map((t) => advisor.threats.findIndex((x) => x.id === t.id));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), 'threats keep their order of importance');
    advice.threats.forEach((t) => shown.add(t.id));
  }
  for (const t of advisor.threats) assert.ok(shown.has(t.id), `${t.id} is shown for some design`);
});

test('every question changes the advice', () => {
  const signature = (answers) => {
    const a = advise(bundle, answers);
    return JSON.stringify([
      a.patterns.map((p) => [p.id, p.priority, p.reasons.length, p.controls.length]),
      a.threats.map((t) => t.id),
      a.plan.rooms.map((r) => r.id),
      a.plan.entrances.length,
    ]);
  };
  for (const q of advisor.questions) {
    const seen = new Set();
    for (const o of q.options) {
      const answers = { ...defaultAnswers(advisor), [q.id]: q.type === 'multi' ? [o.id] : o.id };
      seen.add(signature(answers));
    }
    if (q.type === 'multi') seen.add(signature({ ...defaultAnswers(advisor), [q.id]: [] }));
    assert.ok(seen.size > 1, `${q.id} makes a difference`);
  }
});

test('controls follow the maturity level, and the next level is shown separately', () => {
  assert.deepEqual(levelsFor('foundation'), ['foundation']);
  assert.deepEqual(levelsFor('enhanced'), ['foundation', 'enhanced']);
  assert.deepEqual(levelsFor('advanced'), ['foundation', 'enhanced', 'advanced']);
  assert.equal(nextLevel('advanced'), null);
  for (const maturity of ['foundation', 'enhanced', 'advanced']) {
    const advice = advise(bundle, { ...SCENARIOS.bank, maturity });
    for (const p of advice.patterns) {
      assert.ok(p.controls.every((c) => levelsFor(maturity).includes(c.level)), `${p.id} at ${maturity}`);
      assert.ok(p.controls.length > 0, `${p.id} has controls at ${maturity}`);
      const next = nextLevel(maturity);
      assert.ok(p.nextControls.every((c) => c.level === next), `${p.id} next level`);
      if (next) assert.ok(p.nextControls.length > 0, `${p.id} shows what comes next`);
    }
  }
});

test('patterns explain themselves with the reasons at their own priority', () => {
  for (const scenario of Object.values(SCENARIOS)) {
    const advice = advise(bundle, scenario);
    for (const p of advice.patterns) {
      assert.ok(p.reasons.length > 0, `${p.id} has a reason`);
      const fired = advisor.rules.filter((r) => r.pattern === p.id && r.priority === p.priority && matches(r.when, advice.answers));
      assert.deepEqual(p.reasons, fired.map((r) => r.because), `${p.id} shows the reasons of the rules at its priority`);
    }
    const order = advice.patterns.map((p) => ['essential', 'recommended', 'consider'].indexOf(p.priority));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), 'essential patterns come first');
  }
});

test('the plan never shows a door or entrance without the pattern that enforces it', () => {
  const rand = prng(20260924);
  const system = advisor.questions.find((q) => q.id === 'system');
  const samples = [...Object.values(SCENARIOS)];
  for (let i = 0; i < 600; i += 1) samples.push(randomAnswers(rand));
  for (const o of system.options) samples.push({ ...defaultAnswers(advisor), system: o.id });
  for (const answers of samples) {
    const { plan, patterns } = advise(bundle, answers);
    const where = JSON.stringify(answers);
    assert.equal(plan.doors.length, plan.rooms.length - 1, where);
    assert.ok(plan.rooms.length >= 3, where);
    for (const item of [...plan.entrances, ...plan.doors, plan.corridor, plan.vault, plan.egress]) {
      assert.ok(item && item.priority, `${where}: ${JSON.stringify(item && item.label)}`);
    }
    for (const r of plan.rooms) for (const f of r.fixtures) assert.ok(f.priority, where);
    const ids = new Set(patterns.map((p) => p.id));
    for (const f of plan.foundations) assert.ok(ids.has(f.pattern), where);
    assert.ok(plan.entrances.length > 0 || answers.system === 'ot', `${where}: someone can get in`);
  }
});

test('the plan renders as well formed SVG in both languages for every system', () => {
  const system = advisor.questions.find((q) => q.id === 'system');
  for (const o of system.options) {
    for (const scenario of [defaultAnswers(advisor), SCENARIOS.bank, SCENARIOS.utility]) {
      const { plan } = advise(bundle, { ...scenario, system: o.id });
      for (const lang of ['en', 'ar']) {
        const svg = renderPlan(plan, lang, meta.ui);
        assert.deepEqual(xmlProblems(svg), [], `${o.id} ${lang}`);
        assert.ok(!/undefined|NaN|\[object/.test(svg), `${o.id} ${lang} has no missing values`);
        for (const r of plan.rooms) {
          const first = r.label[lang].split(' ')[0].replace(/&/g, '&amp;');
          assert.ok(svg.includes(first), `${o.id} ${lang} shows the room ${r.label[lang]}`);
        }
        if (lang === 'ar') assert.match(svg, /direction="rtl"/);
        else assert.doesNotMatch(svg, /direction="rtl"/);
      }
    }
  }
});

test('the downloadable brief follows the language rules', () => {
  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    const advice = advise(bundle, scenario);
    for (const lang of ['en', 'ar']) {
      const md = renderBrief(bundle, advice, { lang, project: 'Test', date: '2026-09-24', link: 'https://siteq8.github.io/Bunyan/#design' });
      assert.deepEqual(markdownProblems(md, lang), [], `${name} ${lang}`);
      assert.deepEqual(universalProblems(md), [], `${name} ${lang}`);
      assert.ok(!/undefined|\[object/.test(md), `${name} ${lang} has no missing values`);
      for (const p of advice.patterns) assert.ok(md.includes(`${p.id} ${p.pattern.title[lang]}`), `${name} ${lang} lists ${p.id}`);
    }
  }
});

test('a design survives the trip through a link', () => {
  const rand = prng(7);
  for (let i = 0; i < 100; i += 1) {
    const answers = normalizeAnswers(advisor, randomAnswers(rand));
    const query = encodeState(advisor, answers, 'Core banking & payments');
    const back = decodeState(advisor, query);
    assert.deepEqual(back.answers, answers);
    assert.equal(back.project, 'Core banking & payments');
  }
  const odd = decodeState(advisor, 's=spaceship&x=public.moon&l=advanced');
  assert.equal(odd.answers.system, advisor.questions[0].default, 'unknown options fall back to the default');
  assert.deepEqual(odd.answers.exposure, ['public'], 'unknown choices are dropped');
  assert.equal(odd.answers.maturity, 'advanced');
  assert.deepEqual(decodeState(advisor, '').answers, defaultAnswers(advisor));
  const empty = decodeState(advisor, 'o=');
  assert.deepEqual(empty.answers.obligations, [], 'an empty multiple choice stays empty');
});
