import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadBundle } from '../scripts/lib/load.mjs';
import { exists, read, root } from './helpers.mjs';

const bundle = loadBundle();
const { patterns, meta, advisor, glossary, catalogs } = bundle;
const patternIds = new Set(patterns.map((p) => p.id));
const LEVELS = ['foundation', 'enhanced', 'advanced'];
const PRIORITIES = ['essential', 'recommended', 'consider'];

const isPair = (v) => v && typeof v.en === 'string' && typeof v.ar === 'string' && v.en.trim() && v.ar.trim();

function nistProblem(id) {
  const m = id.match(/^([A-Z]{2})-(\d+)(?:\((\d+)\))?$/);
  if (!m) return 'is not a NIST control identifier';
  const max = catalogs.nist.families[m[1]];
  if (!max) return `uses an unknown family ${m[1]}`;
  if (Number(m[2]) < 1 || Number(m[2]) > max) return `is beyond the ${max} controls of ${m[1]}`;
  if (!catalogs.nist.controls[id]) return 'has no title in the NIST catalogue';
  return null;
}

function cisProblem(id) {
  const m = id.match(/^(\d+)\.(\d+)$/);
  if (!m) return 'is not a CIS safeguard identifier';
  const max = catalogs.cis.safeguardsPerControl[m[1]];
  if (!max) return `uses an unknown control ${m[1]}`;
  if (Number(m[2]) < 1 || Number(m[2]) > max) return `is beyond the ${max} safeguards of control ${m[1]}`;
  if (!catalogs.cis.safeguards[id]) return 'has no title in the CIS catalogue';
  return null;
}

test('the catalogues have the published shape', () => {
  assert.equal(Object.keys(catalogs.iso.controls).length, 93, 'ISO/IEC 27001:2022 Annex A has 93 controls');
  const byTheme = { 5: 37, 6: 8, 7: 14, 8: 34 };
  for (const [theme, count] of Object.entries(byTheme)) {
    const n = Object.keys(catalogs.iso.controls).filter((k) => k.startsWith(`${theme}.`)).length;
    assert.equal(n, count, `ISO theme ${theme} has ${count} controls`);
  }
  const cisTotal = Object.values(catalogs.cis.safeguardsPerControl).reduce((a, b) => a + b, 0);
  assert.equal(cisTotal, 153, 'CIS Controls v8.1 has 153 safeguards');
  assert.equal(Object.keys(catalogs.cis.safeguardsPerControl).length, 18, 'CIS Controls v8.1 has 18 controls');
  for (const id of Object.keys(catalogs.nist.controls)) assert.equal(nistProblem(id), null, `${id} ${nistProblem(id)}`);
  for (const id of Object.keys(catalogs.cis.safeguards)) assert.equal(cisProblem(id), null, `${id} ${cisProblem(id)}`);
});

test('patterns are numbered in order and named after their files', () => {
  const files = fs.readdirSync(path.join(root, 'data/patterns')).sort();
  assert.equal(patterns.length, 32);
  patterns.forEach((p, i) => {
    assert.equal(p.id, `P${String(i + 1).padStart(2, '0')}`);
    assert.equal(files[i], `${p.id}.json`);
    assert.match(p.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  assert.equal(new Set(patterns.map((p) => p.slug)).size, patterns.length, 'slugs are unique');
});

test('every pattern is complete in both languages', () => {
  for (const p of patterns) {
    for (const key of ['title', 'summary', 'problem']) assert.ok(isPair(p[key]), `${p.id}.${key}`);
    assert.ok(meta.domains[p.domain], `${p.id} domain ${p.domain} is listed in meta.json`);
    const minimum = { useWhen: 3, design: 2, decisions: 3, tradeoffs: 3, antipatterns: 3, verify: 3, references: 3 };
    for (const [key, n] of Object.entries(minimum)) {
      assert.ok(Array.isArray(p[key]) && p[key].length >= n, `${p.id}.${key} has at least ${n} entries`);
    }
    for (const key of ['useWhen', 'design', 'decisions', 'tradeoffs', 'antipatterns', 'verify']) {
      p[key].forEach((v, i) => assert.ok(isPair(v), `${p.id}.${key}[${i}]`));
    }
    for (const r of p.references) {
      assert.ok(isPair(r.title), `${p.id} reference title`);
      assert.match(r.url, /^https:\/\//, `${p.id} reference uses https`);
    }
  }
});

test('controls cover all three levels and map to real catalogue entries', () => {
  for (const p of patterns) {
    assert.ok(p.controls.length >= 6, `${p.id} has at least six controls`);
    for (const level of LEVELS) {
      assert.ok(p.controls.some((c) => c.level === level), `${p.id} has a ${level} control`);
    }
    const names = new Set();
    for (const c of p.controls) {
      const label = `${p.id} "${c.name.en}"`;
      assert.ok(LEVELS.includes(c.level), `${label} level`);
      assert.ok(isPair(c.name) && isPair(c.detail), `${label} text`);
      assert.ok(!names.has(c.name.en), `${label} is not repeated`);
      names.add(c.name.en);
      assert.ok(c.nist.length + c.cis.length + c.iso.length > 0, `${label} maps to at least one framework`);
      assert.ok(c.nist.length > 0, `${label} maps to NIST SP 800-53`);
      for (const id of c.nist) assert.equal(nistProblem(id), null, `${label}: NIST ${id} ${nistProblem(id)}`);
      for (const id of c.cis) assert.equal(cisProblem(id), null, `${label}: CIS ${id} ${cisProblem(id)}`);
      for (const id of c.iso) assert.ok(catalogs.iso.controls[id], `${label}: ISO A.${id} is an Annex A control`);
      for (const list of [c.nist, c.cis, c.iso]) assert.equal(new Set(list).size, list.length, `${label} has no duplicate mapping`);
    }
    // Levels appear in order, so the generated pages and the advisor read naturally.
    const order = p.controls.map((c) => LEVELS.indexOf(c.level));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), `${p.id} lists controls from foundation to advanced`);
  }
});

test('threat references and related patterns resolve', () => {
  for (const p of patterns) {
    for (const id of p.attack) assert.ok(catalogs.attack.techniques[id], `${p.id} ATT&CK ${id} is in the catalogue`);
    for (const id of p.owasp) assert.ok(catalogs.owasp.risks[id], `${p.id} OWASP ${id} is in the catalogue`);
    assert.ok(p.attack.length + p.owasp.length > 0, `${p.id} names at least one threat`);
    assert.ok(p.related.length >= 2, `${p.id} links at least two related patterns`);
    for (const id of p.related) {
      assert.ok(patternIds.has(id), `${p.id} related ${id} exists`);
      assert.notEqual(id, p.id, `${p.id} does not relate to itself`);
    }
    assert.equal(new Set(p.related).size, p.related.length, `${p.id} related patterns are unique`);
  }
});

test('every catalogue entry for threats is cited somewhere', () => {
  const cited = new Set();
  for (const p of patterns) [...p.attack, ...p.owasp].forEach((id) => cited.add(id));
  for (const t of advisor.threats) t.refs.forEach((id) => cited.add(id));
  for (const id of Object.keys(catalogs.attack.techniques)) assert.ok(cited.has(id), `ATT&CK ${id} is used`);
  for (const id of Object.keys(catalogs.owasp.risks)) assert.ok(cited.has(id), `OWASP ${id} is used`);
  for (const [id, t] of Object.entries(catalogs.attack.techniques)) {
    const [base, sub] = id.split('.');
    const url = `https://attack.mitre.org/techniques/${base}/${sub ? `${sub}/` : ''}`;
    assert.equal(t.url, url, `${id} links to its own page`);
    assert.equal(t.matrix, id.startsWith('T0') ? 'ics' : 'enterprise', `${id} is in the right matrix`);
    assert.ok(isPair(t.name), `${id} name`);
  }
});

test('glossary terms are unique, bilingual, and point at real patterns', () => {
  assert.ok(glossary.length >= 60, 'the glossary has at least 60 terms');
  const ids = new Set();
  const en = new Set();
  const ar = new Set();
  for (const g of glossary) {
    assert.ok(!ids.has(g.id), `glossary id ${g.id} is unique`);
    ids.add(g.id);
    assert.ok(isPair(g.term) && isPair(g.definition), `glossary ${g.id}`);
    assert.ok(!en.has(g.term.en) && !ar.has(g.term.ar), `glossary term ${g.id} is unique in both languages`);
    en.add(g.term.en);
    ar.add(g.term.ar);
    if (g.pattern) assert.ok(patternIds.has(g.pattern), `glossary ${g.id} pattern ${g.pattern} exists`);
  }
});

function conditionProblems(cond, where) {
  if (cond === 'always') return [];
  if (cond.any || cond.all) return (cond.any || cond.all).flatMap((c) => conditionProblems(c, where));
  if (cond.pattern) return patternIds.has(cond.pattern) ? [] : [`${where}: unknown pattern ${cond.pattern}`];
  const q = advisor.questions.find((x) => x.id === cond.q);
  if (!q) return [`${where}: unknown question ${cond.q}`];
  const options = new Set(q.options.map((o) => o.id));
  const values = cond.in || cond.hasAny || cond.hasNone || (cond.has ? [cond.has] : null);
  if (!values) return [`${where}: no operator`];
  const problems = values.filter((v) => !options.has(v)).map((v) => `${where}: ${cond.q} has no option ${v}`);
  if (cond.in && q.type !== 'single') problems.push(`${where}: "in" needs a single choice question`);
  if ((cond.has || cond.hasAny || cond.hasNone) && q.type !== 'multi') problems.push(`${where}: "has" needs a multiple choice question`);
  return problems;
}

test('advisor questions are well formed', () => {
  const ids = new Set();
  const keys = new Set();
  for (const q of advisor.questions) {
    assert.ok(!ids.has(q.id) && !keys.has(q.key), `question ${q.id} and key ${q.key} are unique`);
    ids.add(q.id);
    keys.add(q.key);
    assert.notEqual(q.key, 'n', 'the key n is kept for the project name');
    assert.ok(['single', 'multi'].includes(q.type), `${q.id} type`);
    assert.ok(isPair(q.label), `${q.id} label`);
    const options = q.options.map((o) => o.id);
    assert.equal(new Set(options).size, options.length, `${q.id} options are unique`);
    q.options.forEach((o) => assert.ok(isPair(o.label), `${q.id}.${o.id} label`));
    if (q.type === 'multi') {
      assert.ok(Array.isArray(q.default) && q.default.every((d) => options.includes(d)), `${q.id} default`);
      assert.ok(isPair(q.help), `${q.id} explains that several answers are allowed`);
    } else {
      assert.ok(options.includes(q.default), `${q.id} default`);
    }
  }
  assert.deepEqual(
    advisor.questions.find((q) => q.id === 'maturity').options.map((o) => o.id),
    LEVELS,
    'maturity options match the control levels',
  );
  for (const id of ['system', 'maturity']) assert.ok(ids.has(id), `the engine needs the ${id} question`);
});

test('the design intro states the real number of questions', () => {
  const words = { 7: ['seven', 'سبعة'], 8: ['eight', 'ثمانية'], 9: ['nine', 'تسعة'], 10: ['ten', 'عشرة'] };
  const [en, ar] = words[advisor.questions.length];
  assert.match(meta.ui.designIntro.en, new RegExp(`\\b${en}\\b`, 'i'));
  assert.ok(meta.ui.designIntro.ar.includes(ar));
});

test('advisor rules and threats refer to real questions, options, and patterns', () => {
  const problems = [];
  advisor.rules.forEach((r, i) => {
    if (!patternIds.has(r.pattern)) problems.push(`rule ${i}: unknown pattern ${r.pattern}`);
    if (!PRIORITIES.includes(r.priority)) problems.push(`rule ${i}: unknown priority ${r.priority}`);
    if (!isPair(r.because)) problems.push(`rule ${i}: needs a reason in both languages`);
    problems.push(...conditionProblems(r.when, `rule ${i}`));
  });
  const threatIds = new Set();
  for (const t of advisor.threats) {
    if (threatIds.has(t.id)) problems.push(`threat ${t.id} repeated`);
    threatIds.add(t.id);
    if (!isPair(t.title)) problems.push(`threat ${t.id} title`);
    for (const id of t.refs) {
      if (!catalogs.attack.techniques[id] && !catalogs.owasp.risks[id]) problems.push(`threat ${t.id}: unknown reference ${id}`);
    }
    for (const id of t.patterns) if (!patternIds.has(id)) problems.push(`threat ${t.id}: unknown pattern ${id}`);
    problems.push(...conditionProblems(t.when, `threat ${t.id}`));
  }
  assert.deepEqual(problems, []);
  for (const id of patternIds) assert.ok(advisor.rules.some((r) => r.pattern === id), `${id} can be recommended by a rule`);
  for (const t of advisor.threats) {
    assert.ok(t.patterns.length > 0, `threat ${t.id} names the patterns that address it`);
  }
});

test('every system has a plan whose parts are consistent', () => {
  const system = advisor.questions.find((q) => q.id === 'system');
  const { common, systems } = advisor.plan;
  const problems = [];
  const checkItem = (item, where) => {
    if (!isPair(item.label)) problems.push(`${where}: label`);
    if (item.pattern && !patternIds.has(item.pattern)) problems.push(`${where}: unknown pattern ${item.pattern}`);
    if (item.when) problems.push(...conditionProblems(item.when, where));
  };
  checkItem(common.corridor, 'corridor');
  common.management.fixtures.forEach((f, i) => checkItem(f, `management fixture ${i}`));
  common.foundations.forEach((f, i) => checkItem(f, `foundation ${i}`));
  checkItem(common.vault, 'vault');
  checkItem(common.egress, 'egress');
  for (const o of system.options) {
    const plan = systems[o.id];
    if (!plan) {
      problems.push(`no plan for ${o.id}`);
      continue;
    }
    if (plan.corridor) checkItem(plan.corridor, `${o.id} corridor`);
    assert.ok(plan.rooms.length >= 3, `${o.id} has at least three rooms`);
    assert.equal(plan.doors.length, plan.rooms.length - 1, `${o.id} has a door between each pair of rooms`);
    plan.rooms.forEach((r, i) => {
      if (r.when && i !== plan.rooms.length - 1) problems.push(`${o.id}: only the last room may be conditional`);
      if (![1, 2, 3, 4].includes(r.trust)) problems.push(`${o.id}.${r.id}: trust must be 1 to 4`);
      if (i > 0 && r.trust < plan.rooms[i - 1].trust) problems.push(`${o.id}.${r.id}: rooms run from least to most restricted`);
      if (r.fixtures.length > 3) problems.push(`${o.id}.${r.id}: at most three fixtures fit in a room`);
      checkItem(r, `${o.id}.${r.id}`);
      r.fixtures.forEach((f, j) => checkItem(f, `${o.id}.${r.id} fixture ${j}`));
    });
    plan.doors.forEach((d, i) => checkItem(d, `${o.id} door ${i}`));
    plan.entrances.forEach((e, i) => {
      checkItem(e, `${o.id} entrance ${i}`);
      if (!isPair(e.actor)) problems.push(`${o.id} entrance ${i}: actor`);
    });
  }
  assert.deepEqual(problems, []);
});

test('the learning index matches the files on disk, in both languages', () => {
  const sections = { handbook: meta.handbook, katas: meta.katas, templates: meta.templates };
  for (const [dir, list] of Object.entries(sections)) {
    for (const entry of list) {
      for (const lang of ['en', 'ar']) {
        const file = `${dir}/${lang}/${entry.slug}.md`;
        assert.ok(exists(file), `${file} exists`);
        const h1 = read(file).match(/^# (.+)$/m);
        assert.ok(h1, `${file} has a title`);
        assert.equal(h1[1].trim(), entry.title[lang], `${file} title matches data/meta.json`);
      }
      assert.ok(isPair(entry.summary), `${dir}/${entry.slug} summary`);
    }
    const onDisk = fs.readdirSync(path.join(root, dir, 'en')).filter((f) => f.endsWith('.md')).sort();
    assert.deepEqual(onDisk, list.map((e) => `${e.slug}.md`).sort(), `${dir} has no unlisted files`);
  }
});
