// Fetch every external link in the repository and report the ones that fail.
//
//   node scripts/check-links.mjs          check everything
//   node scripts/check-links.mjs --json   print a machine readable report
//
// A link passes when it answers with a success or a redirect that ends in a
// success. A few publishers refuse automated clients outright; those are listed
// in BOT_WALLED and reported as unverified instead of failed, so that a human
// opens them, rather than the check silently passing or failing.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const BOT_WALLED = new Set([
  'www.iso.org',
  'www.pcisecuritystandards.org',
  'www.swift.com',
  'www.isa.org',
]);

// XML namespace identifiers look like addresses but are only names, and
// the servers behind them are not obliged to answer.
export const NAMESPACES = new Set([
  'http://www.w3.org/2000/svg',
  'http://www.w3.org/1999/xlink',
  'http://www.w3.org/1999/xhtml',
  'http://www.w3.org/XML/1998/namespace',
]);

const SKIP_DIRS = new Set(['.git', 'node_modules']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(md|json|html|mjs|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

export function collectLinks() {
  const found = new Map();
  for (const file of walk(root)) {
    const rel = path.relative(root, file);
    if (rel.startsWith('docs/data/')) continue;
    if (rel.startsWith('docs/assets/fonts/')) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/https?:\/\/[^\s"'<>)`\]]+/g)) {
      const url = m[0].replace(/[.,;:]+$/, '');
      if (/^https?:\/\/(localhost|127\.0\.0\.1|example\.(com|org))/.test(url)) continue;
      if (url.includes('${')) continue;
      if (NAMESPACES.has(url)) continue;
      if (!found.has(url)) found.set(url, new Set());
      found.get(url).add(rel);
    }
  }
  return found;
}

async function check(url) {
  const host = new URL(url).host;
  const attempt = async (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9',
        },
      });
      let moved = null;
      const type = res.headers.get('content-type') || '';
      if (method === 'GET' && type.includes('text/html') && res.ok) {
        const html = await res.text();
        const m = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+url=([^"'>]+)/i);
        if (m) moved = new URL(m[1], res.url).href;
      } else if (res.body) {
        await res.body.cancel().catch(() => {});
      }
      return { status: res.status, final: res.url, moved };
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let r = await attempt('GET');
    if (r.status === 405) r = await attempt('HEAD');
    const ok = r.status >= 200 && r.status < 400;
    // A page that only forwards elsewhere means the thing it named has moved,
    // for example an ATT&CK technique that was renumbered. Cite the new home.
    if (ok && r.moved) return { url, ok: false, status: r.status, final: r.final, error: `moved to ${r.moved}` };
    if (ok) return { url, ok: true, status: r.status, final: r.final };
    if (BOT_WALLED.has(host) && (r.status === 403 || r.status === 429 || r.status === 401)) {
      return { url, ok: true, unverified: true, status: r.status, final: r.final };
    }
    return { url, ok: false, status: r.status, final: r.final };
  } catch (err) {
    if (BOT_WALLED.has(host)) return { url, ok: true, unverified: true, status: 0, error: String(err.cause?.code || err.name) };
    return { url, ok: false, status: 0, error: String(err.cause?.code || err.name) };
  }
}

async function main() {
  const links = collectLinks();
  const urls = [...links.keys()].sort();
  const results = [];
  const queue = [...urls];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      results.push(await check(url));
    }
  });
  await Promise.all(workers);
  results.sort((a, b) => a.url.localeCompare(b.url));

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      const mark = !r.ok ? 'FAIL' : r.unverified ? 'OPEN BY HAND' : 'ok';
      if (mark !== 'ok') {
        console.log(`${mark.padEnd(13)} ${r.error || r.status} ${r.url}`);
        console.log(`              in ${[...links.get(r.url)].join(', ')}`);
      }
    }
    const failed = results.filter((r) => !r.ok).length;
    const unverified = results.filter((r) => r.unverified).length;
    console.log(`\n${results.length} links, ${failed} failed, ${unverified} to open by hand.`);
    if (failed) process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
