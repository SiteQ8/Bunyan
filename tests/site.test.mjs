// The website is held to the same standard as the data: these tests fail the
// build if the page loosens its security policy, loads anything from another
// site, uses a string that does not exist, or draws a class it never styles.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadBundle, root } from '../scripts/lib/load.mjs';
import { decodeState, encodeState } from '../docs/assets/engine.js';

const docs = path.join(root, 'docs');
const read = (file) => fs.readFileSync(path.join(docs, file), 'utf8');
const html = read('index.html');
const css = read('assets/styles.css');
const scripts = ['app.js', 'boot.js', 'engine.js', 'plan.js', 'brief.js'].map((f) => [f, read(`assets/${f}`)]);

test('the page sets a strict content security policy', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp, 'CSP meta tag');
  const policy = csp[1];
  for (const rule of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "font-src 'self'", "connect-src 'self'", "base-uri 'none'", "form-action 'none'"]) {
    assert.ok(policy.includes(rule), rule);
  }
  assert.ok(!/unsafe-inline|unsafe-eval|https?:/.test(policy), 'no unsafe sources and no remote hosts');
});

test('the page has no inline scripts, styles, or style attributes', () => {
  for (const tag of html.match(/<script\b[^>]*>/g)) assert.match(tag, /\ssrc="/, tag);
  assert.ok(!/<style\b/i.test(html), 'no style element');
  assert.ok(!/\sstyle="/i.test(html), 'no style attribute in the page');
  for (const [file, source] of scripts) {
    assert.ok(!/style="/.test(source), `${file} writes no style attribute`);
    assert.ok(!/\.style\./.test(source), `${file} sets no inline style`);
    assert.ok(!/\beval\(|new Function\(/.test(source), `${file} evaluates no strings`);
  }
});

test('every asset the page loads is local and exists', () => {
  const refs = [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^https:\/\/(siteq8\.github\.io\/Bunyan\/|github\.com\/SiteQ8\/Bunyan)/.test(ref) || ref.startsWith('#')) continue;
    assert.ok(!/^[a-z]+:/i.test(ref), `${ref} is local`);
    assert.ok(fs.existsSync(path.join(docs, ref)), `${ref} exists`);
  }
  for (const [file, source] of scripts) {
    for (const m of source.matchAll(/^import .* from '([^']+)';$/gm)) assert.ok(m[1].startsWith('./'), `${file} imports ${m[1]}`);
    for (const m of source.matchAll(/fetch\(\s*'([^']+)'/g)) assert.ok(!/^[a-z]+:/i.test(m[1]), `${file} fetches ${m[1]}`);
  }
  for (const m of css.matchAll(/url\("?([^")]+)"?\)/g)) {
    if (m[1].startsWith('#')) continue;
    assert.ok(!/^[a-z]+:/i.test(m[1]), `${m[1]} is local`);
    assert.ok(fs.existsSync(path.join(docs, 'assets', m[1])), `${m[1]} exists`);
  }
  for (const license of ['OFL-Archivo.txt', 'OFL-NotoKufiArabic.txt']) {
    assert.ok(fs.existsSync(path.join(docs, 'assets', 'fonts', license)), `${license} ships with the fonts`);
  }
  assert.ok(fs.existsSync(path.join(docs, '.nojekyll')), 'Pages serves the folder as is');
});

test('the social preview image is 1200 by 630', () => {
  const png = fs.readFileSync(path.join(docs, 'assets', 'og.png'));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('every interface string is defined in both languages and used', () => {
  const { meta } = loadBundle();
  const app = scripts.find(([f]) => f === 'app.js')[1];
  const plan = scripts.find(([f]) => f === 'plan.js')[1];
  const used = new Set([
    ...[...app.matchAll(/\bui\('([A-Za-z]+)'\)/g)].map((m) => m[1]),
    ...[...app.matchAll(/\[\s*'[a-z]+',\s*'([A-Za-z]+)'\s*\]/g)].map((m) => m[1]),
    ...[...app.matchAll(/'(legend[A-Za-z]+|sheet[A-Za-z]+)'/g)].map((m) => m[1]),
    ...[...plan.matchAll(/\bui\.([A-Za-z]+)/g)].map((m) => m[1]),
  ]);
  // Keys chosen at run time, such as ui(last ? 'quizFinish' : 'quizNext'), appear as quoted names.
  const quoted = new Set([...app.matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1]));
  for (const key of Object.keys(meta.ui)) if (quoted.has(key)) used.add(key);
  for (const key of used) {
    assert.ok(meta.ui[key], `${key} is defined`);
    assert.ok(meta.ui[key].en && meta.ui[key].ar, `${key} has both languages`);
  }
  for (const key of Object.keys(meta.ui)) assert.ok(used.has(key), `${key} is used by the site`);
});

test('every class the plan draws is styled', () => {
  const plan = scripts.find(([f]) => f === 'plan.js')[1];
  const classes = new Set([...plan.matchAll(/\b(pl-[a-z-]+[a-z])\b/g)].map((m) => m[1]));
  for (const c of ['w1', 'w2', 'w3', 'w4']) classes.add(c);
  for (const id of ['pl-arrow', 'pl-ground']) classes.delete(id);
  for (const p of ['essential', 'recommended', 'consider', 'structural']) classes.delete(`pl-${p}`);
  for (const c of classes) assert.ok(new RegExp(`\\.${c}\\b`).test(css), `.${c} is styled`);
  for (const p of ['essential', 'consider', 'structural']) assert.ok(css.includes(`.pl-fixture.pl-${p}`), `${p} fixtures are styled`);
});

test('each exercise opens the advisor on the scenario its text describes', () => {
  const { meta, advisor } = loadBundle();
  for (const kata of meta.katas) {
    const { answers } = decodeState(advisor, kata.advisor);
    assert.equal(encodeState(advisor, answers), kata.advisor, `${kata.slug} round trips`);
    for (const lang of ['en', 'ar']) {
      const text = fs.readFileSync(path.join(root, 'katas', lang, `${kata.slug}.md`), 'utf8');
      assert.ok(text.includes(`?lang=${lang}#design?${kata.advisor})`), `${lang}/${kata.slug} links the same scenario`);
    }
  }
});

test('every diagram is drawn for the site from its current source and is safe to place in the page', async () => {
  const { sourceHash, OUT } = await import('../scripts/render-diagrams.mjs');
  const dir = path.join(root, 'data', 'diagrams');
  const sources = fs.readdirSync(dir).filter((f) => f.endsWith('.mmd'));
  const drawings = fs.readdirSync(OUT).filter((f) => f.endsWith('.svg'));
  assert.equal(drawings.length, sources.length, 'one drawing for each source');
  for (const f of sources) {
    const file = path.join(OUT, f.replace(/\.mmd$/, '.svg'));
    assert.ok(fs.existsSync(file), `${f} is drawn`);
    const svg = fs.readFileSync(file, 'utf8');
    const hash = sourceHash(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.ok(svg.includes(`data-source="${hash}"`), `${f} was redrawn after its last change, run node scripts/render-diagrams.mjs`);
    assert.ok(!/<style|\sstyle=|<script|<foreignObject|\son[a-z]+=|href=/i.test(svg), `${f} holds nothing that could run or be blocked in the page`);
  }
});
