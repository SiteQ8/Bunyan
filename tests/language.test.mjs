import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  analyzeMarkdown,
  arabicProblems,
  englishProblems,
  hasArabic,
  markdownProblems,
  numbersIn,
  proseOf,
  sameNumbers,
  twinUrl,
  universalProblems,
  UNICODE_DASHES,
} from '../scripts/lib/text.mjs';
import { bilingualPairs, exists, markdownFiles, read, rel, root, twinOf, walk } from './helpers.mjs';

const dataFiles = walk(root, (f) => /\/data\/.*\.json$/.test(f) && !f.includes('/docs/')).map(rel);

test('the text rules catch what they are meant to catch', () => {
  assert.ok(arabicProblems('هذه جملة. وهذه جملة أخرى.').length, 'a full stop in the middle');
  assert.deepEqual(arabicProblems('هذه جملة، وهذه جملة أخرى.'), []);
  assert.deepEqual(arabicProblems('طبّق NIST SP 800-207 وA.5.15 وT1110.004 في كل مكان.'), [], 'identifiers keep their dots');
  assert.ok(arabicProblems('لدينا 16 نمطًا.').length, 'Western digits standing alone');
  assert.deepEqual(arabicProblems('لدينا ١٦ نمطًا.'), []);
  assert.ok(arabicProblems('ما هذا?').length, 'a Latin question mark');
  assert.ok(englishProblems('Use this - not that.').length, 'a spaced hyphen');
  assert.ok(englishProblems('Security is أمن here.').length, 'Arabic in English');
  assert.ok(universalProblems('a \u2014 b').length, 'an em dash');
  assert.ok(sameNumbers('Rev 5 and 3 levels', 'المستوى ٣ والإصدار ٥'));
  assert.ok(!sameNumbers('3 levels', '٤ مستويات'));
});

test('every bilingual text in the data follows the rules of its language', () => {
  const problems = [];
  for (const file of dataFiles) {
    const json = JSON.parse(read(file));
    for (const { trail, en, ar } of bilingualPairs(json)) {
      const where = `${file} ${trail}`;
      for (const p of [...englishProblems(en), ...universalProblems(en)]) problems.push(`${where} (en): ${p}`);
      for (const p of [...arabicProblems(ar), ...universalProblems(ar)]) problems.push(`${where} (ar): ${p}`);
      if (!hasArabic(ar) && ar !== en && !/^[A-Za-z]/.test(ar)) problems.push(`${where} (ar): has no Arabic`);
      if (!sameNumbers(en, ar)) problems.push(`${where}: numbers differ, ${numbersIn(en)} and ${numbersIn(ar)}`);
    }
  }
  assert.deepEqual(problems, []);
});

test('every Markdown document follows the rules of its language', () => {
  const problems = [];
  for (const { path: file, lang } of markdownFiles()) {
    const md = read(file);
    for (const p of markdownProblems(md, lang)) problems.push(`${file}: ${p}`);
    for (const p of universalProblems(md)) problems.push(`${file}: ${p}`);
  }
  assert.deepEqual(problems, []);
});

test('Arabic documents are marked right to left', () => {
  for (const { path: file, lang } of markdownFiles()) {
    if (lang !== 'ar') continue;
    const md = read(file);
    assert.match(md, /<div dir="rtl" lang="ar">/, `${file} opens a right to left block`);
    assert.match(md.trimEnd(), /<\/div>$/, `${file} closes its right to left block`);
  }
});

test('every English document has an Arabic twin with the same shape', () => {
  const problems = [];
  for (const { path: file, lang } of markdownFiles()) {
    if (lang !== 'en') continue;
    const twin = twinOf(file);
    if (!twin) continue;
    if (!exists(twin)) {
      problems.push(`${file} has no Arabic twin at ${twin}`);
      continue;
    }
    const a = analyzeMarkdown(read(file));
    const b = analyzeMarkdown(read(twin));
    const sa = a.structure;
    const sb = b.structure;
    for (const level of [1, 2, 3, 4]) {
      if ((sa.headings[level] || 0) !== (sb.headings[level] || 0)) {
        problems.push(`${file} and ${twin}: ${sa.headings[level] || 0} and ${sb.headings[level] || 0} headings at level ${level}`);
      }
    }
    for (const key of ['items', 'rows', 'fences', 'mermaid']) {
      if (sa[key] !== sb[key]) problems.push(`${file} and ${twin}: ${sa[key]} and ${sb[key]} ${key}`);
    }
    const la = a.links.map(twinUrl).sort();
    const lb = b.links.map(twinUrl).sort();
    if (JSON.stringify(la) !== JSON.stringify(lb)) {
      const onlyA = la.filter((x) => !lb.includes(x));
      const onlyB = lb.filter((x) => !la.includes(x));
      problems.push(`${file} and ${twin}: links differ, only English ${onlyA.join(' ')}, only Arabic ${onlyB.join(' ')}`);
    }
    if (!sameNumbers(proseOf(read(file)), proseOf(read(twin)))) {
      const na = numbersIn(proseOf(read(file)));
      const nb = numbersIn(proseOf(read(twin)));
      const onlyA = na.filter((x) => !nb.includes(x));
      const onlyB = nb.filter((x) => !na.includes(x));
      problems.push(`${file} and ${twin}: numbers differ, only English ${onlyA.join(' ')}, only Arabic ${onlyB.join(' ')}`);
    }
  }
  for (const { path: file, lang } of markdownFiles()) {
    if (lang !== 'ar') continue;
    const english = markdownFiles().find((m) => m.lang === 'en' && twinOf(m.path) === file);
    if (!english) problems.push(`${file} has no English original`);
  }
  assert.deepEqual(problems, []);
});

test('diagrams exist in both languages, state the same numbers, and keep each label line in one script', () => {
  const problems = [];
  const files = fs.readdirSync(`${root}/data/diagrams`);
  for (const f of files.filter((x) => x.endsWith('.en.mmd'))) {
    const twin = f.replace('.en.mmd', '.ar.mmd');
    if (!files.includes(twin)) {
      problems.push(`${f} has no Arabic twin`);
      continue;
    }
    const en = read(`data/diagrams/${f}`);
    const ar = read(`data/diagrams/${twin}`);
    const labels = (s) => [...s.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    const lenLabels = labels(en);
    const arLabels = labels(ar);
    if (!sameNumbers(lenLabels.join(' '), arLabels.join(' '))) problems.push(`${f}: numbers differ from ${twin}`);
    if (lenLabels.length !== arLabels.length) problems.push(`${f}: ${lenLabels.length} labels, ${twin}: ${arLabels.length}`);
    if (!/^flowchart (LR|TB)\b/.test(en)) problems.push(`${f}: English diagrams flow left to right or top to bottom`);
    if (!/^flowchart (RL|TB)\b/.test(ar)) problems.push(`${twin}: Arabic diagrams flow right to left or top to bottom`);
    if (/^flowchart LR/.test(en) !== /^flowchart RL/.test(ar)) problems.push(`${twin}: mirrors ${f}`);
    for (const label of lenLabels) if (hasArabic(label)) problems.push(`${f}: Arabic in "${label}"`);
    for (const label of arLabels) {
      for (const lineText of label.split('<br/>')) {
        // A line that mixes scripts is reordered by the bidirectional algorithm
        // inside a left to right SVG, so each line holds one script only.
        if (hasArabic(lineText) && /[A-Za-z]/.test(lineText)) problems.push(`${twin}: mixed scripts in "${lineText}"`);
        if (hasArabic(lineText) && /[0-9]/.test(lineText)) problems.push(`${twin}: Western digits in "${lineText}"`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('no file uses a Unicode dash', () => {
  const textFile = /\.(md|json|mjs|js|html|css|yml|yaml|mmd|svg|txt)$|LICENSE$|\.gitignore$/;
  const offenders = walk(root, (f) => textFile.test(f) && !f.includes('/docs/assets/fonts/'))
    .map(rel)
    .filter((f) => UNICODE_DASHES.test(read(f)));
  assert.deepEqual(offenders, []);
});
