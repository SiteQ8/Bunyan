import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { exists, markdownFiles, read } from './helpers.mjs';

// Links between files in the repository must resolve, so that nobody lands on
// a missing page on GitHub. External links are checked by scripts/check-links.mjs.
test('every relative link in the Markdown resolves to a file', () => {
  const broken = [];
  for (const { path: file } of markdownFiles()) {
    const md = read(file).replace(/```[\s\S]*?```/g, '');
    for (const m of md.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const clean = decodeURI(target.split('#')[0]);
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), clean));
      if (!exists(resolved)) broken.push(`${file} links to ${target}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('links to the repository on GitHub point at files that exist', () => {
  const broken = [];
  const re = /https:\/\/github\.com\/SiteQ8\/Bunyan\/(?:blob|tree)\/main\/([^\s)"'`#]+)/g;
  for (const { path: file } of markdownFiles()) {
    for (const m of read(file).matchAll(re)) if (!exists(m[1])) broken.push(`${file} links to ${m[1]}`);
  }
  for (const file of ['docs/assets/brief.js', 'docs/assets/app.js']) {
    if (!exists(file)) continue;
    for (const m of read(file).matchAll(/\/blob\/main\/([\w/.-]+\.md)/g)) if (!exists(m[1])) broken.push(`${file} links to ${m[1]}`);
  }
  assert.deepEqual(broken, []);
});

test('the link check does not treat XML namespaces as links', async () => {
  const { collectLinks, NAMESPACES } = await import('../scripts/check-links.mjs');
  const found = collectLinks();
  for (const ns of NAMESPACES) assert.equal(found.has(ns), false, ns);
});
