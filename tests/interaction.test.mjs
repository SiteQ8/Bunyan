// The interactive parts of the site rest on three pure pieces: the plan names
// the pattern behind every piece it draws, the change summary compares two sets
// of recommendations, and the quiz builds fair questions. These tests hold them
// to that.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../scripts/lib/load.mjs';
import { advise, diffPatterns } from '../docs/assets/engine.js';
import { renderPlan, layoutFoundations, wrap } from '../docs/assets/plan.js';
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
    const svg = renderPlan(advice.plan, 'ar', bundle.meta.ui);
    const drawn = new Set([...svg.matchAll(/data-pattern="([^"]*)"/g)].map((m) => m[1]));
    for (const p of advice.patterns) assert.ok(drawn.has(p.id), `${p.id} is drawn on the ${advice.plan.system} plan`);
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

test('no foundation label is cut or overflows, however crowded the band', () => {
  const random = seeded(24);
  let most = 0;
  for (let i = 0; i < 600; i += 1) {
    const { plan } = advise(bundle, randomAnswers(random));
    const band = layoutFoundations(plan.foundations.length);
    most = Math.max(most, plan.foundations.length);
    for (const f of plan.foundations) {
      for (const lang of ['en', 'ar']) {
        const label = typeof f.label === 'object' ? f.label[lang] : f.label;
        const used = wrap(label, band.bw - 10, band.size).length;
        assert.ok(used <= band.maxLines, `"${label}" needs ${used} lines in a band of ${plan.foundations.length}`);
      }
    }
  }
  assert.ok(most > 8, `the sample includes a band crowded enough to wrap (largest was ${most})`);
});
