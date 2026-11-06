// The interactive parts of the site rest on three pure pieces: the plan names
// the pattern behind every piece it draws, the change summary compares two sets
// of recommendations, and the quiz builds fair questions. These tests hold them
// to that.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../scripts/lib/load.mjs';
import { advise, diffPatterns } from '../docs/assets/engine.js';
import { renderPlan, layoutPlan, wrap, LANDSCAPE_MIN } from '../docs/assets/plan.js';
import { buildQuiz, QUIZ_LENGTH } from '../docs/assets/quiz.js';

const bundle = loadBundle();

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function randomAnswers(random) {
  const answers = {};
  for (const q of bundle.advisor.questions) {
    answers[q.id] = q.type === 'multi'
      ? q.options.filter(() => random() < 0.4).map((o) => o.id)
      : q.options[Math.floor(random() * q.options.length)].id;
  }
  return answers;
}

test('every piece of the plan names a pattern that the design recommends', () => {
  const random = seeded(7);
  for (let i = 0; i < 200; i += 1) {
    const advice = advise(bundle, randomAnswers(random));
    const recommended = new Set(advice.patterns.map((p) => p.id));
    for (const lang of ['en', 'ar']) {
      const svg = renderPlan(advice.plan, lang, bundle.meta.ui);
      const tagged = [...svg.matchAll(/<g class="pl-item" data-pattern="([^"]*)"/g)].map((m) => m[1]);
      assert.ok(tagged.length > 5, 'the plan has pieces to point at');
      for (const id of tagged) assert.ok(recommended.has(id), `${id} on the plan is recommended`);
      assert.equal((svg.match(/<g\b/g) || []).length, (svg.match(/<\/g>/g) || []).length, 'every group closes');
    }
  }
});

test('every pattern the design recommends has a piece on the plan', () => {
  const random = seeded(19);
  for (let i = 0; i < 400; i += 1) {
    const advice = advise(bundle, randomAnswers(random));
    for (const width of [1280, 390]) {
      const svg = renderPlan(advice.plan, 'ar', bundle.meta.ui, width);
      const drawn = new Set([...svg.matchAll(/data-pattern="([^"]*)"/g)].map((m) => m[1]));
      for (const p of advice.patterns) assert.ok(drawn.has(p.id), `${p.id} is drawn on the ${advice.plan.system} plan at ${width}px`);
    }
  }
});

test('every threat marked up on the plan lights at least one piece', () => {
  const random = seeded(3);
  for (let i = 0; i < 150; i += 1) {
    const advice = advise(bundle, randomAnswers(random));
    const svg = renderPlan(advice.plan, 'en', bundle.meta.ui);
    const drawn = new Set([...svg.matchAll(/data-pattern="([^"]*)"/g)].map((m) => m[1]));
    for (const threat of advice.threats) {
      assert.ok(threat.id, 'a threat has an id to mark it up by');
      assert.ok(threat.addressedBy.some((id) => drawn.has(id)), `${threat.id} lights something on the plan`);
    }
  }
});

test('the change summary names what was added, moved, and removed', () => {
  const before = [
    { id: 'P01', priority: 'consider' },
    { id: 'P02', priority: 'essential' },
    { id: 'P13', priority: 'essential' },
  ];
  const after = [
    { id: 'P01', priority: 'essential' },
    { id: 'P02', priority: 'essential' },
    { id: 'P15', priority: 'recommended' },
  ];
  assert.deepEqual(diffPatterns(before, after), [
    { id: 'P15', kind: 'added', priority: 'recommended' },
    { id: 'P01', kind: 'moved', from: 'consider', priority: 'essential' },
    { id: 'P13', kind: 'removed', priority: 'essential' },
  ]);
  assert.deepEqual(diffPatterns(after, after), []);
});

test('every quiz question offers four different patterns and exactly one right answer', () => {
  const random = seeded(11);
  const ids = new Set(bundle.patterns.map((p) => p.id));
  for (let round = 0; round < 300; round += 1) {
    const quiz = buildQuiz(bundle, QUIZ_LENGTH, random);
    assert.equal(quiz.length, QUIZ_LENGTH);
    assert.equal(new Set(quiz.map((q) => `${q.kind}:${q.threat || q.answer}`)).size, QUIZ_LENGTH, 'no question twice in a round');
    for (const q of quiz) {
      assert.equal(new Set(q.options).size, 4, 'four different options');
      assert.ok(q.options.includes(q.answer), 'the answer is offered');
      for (const o of q.options) assert.ok(ids.has(o), `${o} is a pattern`);
      const right = q.kind === 'threat' ? bundle.advisor.threats.find((th) => th.id === q.threat).patterns : [q.answer];
      assert.equal(q.options.filter((o) => right.includes(o)).length, 1, 'exactly one option answers it');
      assert.ok(q.prompt.en && q.prompt.ar, 'the prompt exists in both languages');
    }
  }
});

// The plan is laid out for the width it is shown at, landscape on a wide frame
// and portrait on a narrow one, and both must keep every word of every label
// inside its box at 14px. The width estimate is the one the layout uses, which
// was measured against the site fonts.
const WIDTHS = [1440, 1296, LANDSCAPE_MIN, 1100, 900, 700, 520, 390, 320];
const ADVANCE = { en: 0.56, ar: 0.6 };

function labelledBoxes(L) {
  const fixtures = [...L.rooms.flatMap((r) => r.fixtures), ...L.management.fixtures, ...L.foundations];
  return [
    ...fixtures.map((b) => ({ src: b.src, lines: b.lines, room: b.w - 16 })),
    ...L.doors.map((d) => ({ src: d.src, lines: d.tag.lines, room: d.tag.w - 16 })),
    ...(L.vault ? [{ src: L.vault.src, lines: L.vault.lines, room: L.vault.w - 34 }] : []),
  ];
}

test('no label on the plan loses a word or runs out of its box, at any width', () => {
  const random = seeded(24);
  let most = 0;
  for (let i = 0; i < 300; i += 1) {
    const { plan } = advise(bundle, randomAnswers(random));
    most = Math.max(most, plan.foundations.length);
    for (const lang of ['en', 'ar']) {
      for (const width of WIDTHS) {
        const L = layoutPlan(plan, lang, bundle.meta.ui, width);
        for (const box of labelledBoxes(L)) {
          const label = typeof box.src.label === 'object' ? box.src.label[lang] : box.src.label;
          const joined = box.lines.join(' ').replace(/- /g, '-');
          assert.equal(joined, label.replace(/\s+/g, ' '), `"${label}" keeps every word at ${width}px`);
          for (const line of box.lines) {
            const wide = line.length * 14 * ADVANCE[lang];
            assert.ok(wide <= box.room + 0.5, `"${line}" fits its box at ${width}px (${Math.round(wide)} of ${Math.round(box.room)})`);
          }
        }
      }
    }
  }
  assert.ok(most > 12, `the sample includes a crowded foundations band (largest was ${most})`);
});

test('the plan is landscape on a wide frame, portrait on a narrow one, and drawn at its true size', () => {
  const { plan } = advise(bundle, randomAnswers(seeded(5)));
  for (const width of WIDTHS) {
    const L = layoutPlan(plan, 'en', bundle.meta.ui, width);
    assert.equal(L.kind, width >= LANDSCAPE_MIN ? 'landscape' : 'portrait', `${width}px`);
    const svg = renderPlan(plan, 'en', bundle.meta.ui, width);
    const [, w] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    // A landscape sheet is never drawn narrower than its rooms need, so its
    // labels shrink by less than a tenth on the narrowest frame that takes it.
    if (L.kind === 'landscape') assert.ok(width / Number(w) >= 0.93, `${width}px shows 14px labels at 13px or more`);
    else assert.equal(Number(w), width, `the portrait sheet is drawn one unit to one pixel at ${width}px`);
  }
});

test('in either layout, pieces never overlap the doors or one another', () => {
  const random = seeded(41);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (let i = 0; i < 200; i += 1) {
    const { plan } = advise(bundle, randomAnswers(random));
    for (const width of [1296, 900, 390]) {
      const L = layoutPlan(plan, 'ar', bundle.meta.ui, width);
      const fixtures = L.rooms.flatMap((r) => r.fixtures);
      for (const [n, a] of fixtures.entries()) for (const b of fixtures.slice(n + 1)) assert.ok(!overlap(a, b), `fixtures overlap at ${width}px`);
      for (const d of L.doors) for (const f of fixtures) assert.ok(!overlap(d.tag, f), `a door tag covers a fixture at ${width}px`);
      if (L.kind === 'landscape') for (const f of fixtures) assert.ok(f.y + f.h <= L.bottom - 110, 'fixtures stay clear of the doors');
    }
  }
});

test('every piece of the plan can be reached from the keyboard', () => {
  const { plan } = advise(bundle, randomAnswers(seeded(9)));
  for (const width of [1296, 390]) {
    const svg = renderPlan(plan, 'ar', bundle.meta.ui, width);
    const items = [...svg.matchAll(/<g class="pl-item"[^>]*>/g)].map((m) => m[0]);
    assert.ok(items.length > 5);
    for (const g of items) {
      assert.match(g, /tabindex="-1"/, 'each piece takes focus');
      assert.match(g, /role="button"/, 'each piece says it can be pressed');
      assert.match(g, /aria-label="[^"]+"/, 'each piece has a name');
    }
    assert.match(svg, /role="group" aria-labelledby="plan-title plan-desc"/, 'the drawing is a named group, so its pieces are not hidden');
  }
});
