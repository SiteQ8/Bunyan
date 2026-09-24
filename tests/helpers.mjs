// Shared helpers for the test suite.

import fs from 'node:fs';
import path from 'node:path';
import { root } from '../scripts/lib/load.mjs';

export { root };

const SKIP = new Set(['.git', 'node_modules']);

export function walk(dir = root, filter = () => true, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, out);
    else if (filter(full)) out.push(full);
  }
  return out;
}

export const rel = (full) => path.relative(root, full).split(path.sep).join('/');
export const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');
export const exists = (relPath) => fs.existsSync(path.join(root, relPath));

// Markdown files and the language they are written in.
export function markdownFiles() {
  return walk(root, (f) => f.endsWith('.md')).map((full) => {
    const r = rel(full);
    const lang = /(^|\/)ar\/|\.ar\.md$|^glossary\/ar\.md$/.test(r) ? 'ar' : 'en';
    return { path: r, lang };
  });
}

// The Arabic twin of an English Markdown file, if the project keeps one.
export function twinOf(relPath) {
  if (/(^|\/)en\//.test(relPath)) return relPath.replace(/(^|\/)en\//, '$1ar/');
  if (relPath === 'glossary/en.md') return 'glossary/ar.md';
  if (/^(README|CONTRIBUTING|SECURITY)\.md$/.test(relPath)) return relPath.replace(/\.md$/, '.ar.md');
  return null;
}

// Every {en, ar} pair inside a JSON value, with the path that leads to it.
export function* bilingualPairs(value, trail = '') {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) yield* bilingualPairs(value[i], `${trail}[${i}]`);
    return;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 2 && keys.includes('en') && keys.includes('ar') && typeof value.en === 'string') {
      yield { trail, en: value.en, ar: value.ar };
      return;
    }
    for (const k of keys) yield* bilingualPairs(value[k], trail ? `${trail}.${k}` : k);
  }
}

// A small deterministic random generator, so sampled scenarios are repeatable.
export function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A minimal XML well-formedness check: balanced tags and no stray angle brackets.
export function xmlProblems(xml) {
  const stack = [];
  const problems = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let last = 0;
  let m;
  while ((m = re.exec(xml))) {
    const between = xml.slice(last, m.index);
    if (/[<>]/.test(between)) problems.push(`stray angle bracket near: ${between.slice(0, 40)}`);
    last = re.lastIndex;
    const [, closing, name, attrs, selfClosing] = m;
    if (/[<]/.test(attrs)) problems.push(`angle bracket inside attributes of <${name}>`);
    if (closing) {
      const open = stack.pop();
      if (open !== name) problems.push(`</${name}> closes <${open}>`);
    } else if (!selfClosing) {
      stack.push(name);
    }
  }
  if (stack.length) problems.push(`unclosed: ${stack.join(', ')}`);
  return problems;
}
