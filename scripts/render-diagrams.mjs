// Draws the Mermaid diagrams in data/diagrams as static SVG for the website.
//
//   node scripts/render-diagrams.mjs             redraw the diagrams whose source changed
//   node scripts/render-diagrams.mjs --all       redraw every diagram
//   node scripts/render-diagrams.mjs P01.en      redraw the named diagrams
//
// The site places these drawings inside its own page and styles them with its
// own stylesheet, so every style element and style attribute is removed and
// nothing in them runs in the browser. Mermaid measures text while it lays out
// a diagram, so the two site fonts in docs/assets/fonts must be installed on
// the machine that draws them, or the labels will not fit their boxes.
//
// Each drawing records a hash of its source and of the settings below, and the
// tests fail when a diagram changes without being redrawn.
//
// The Mermaid command line tool runs through npx unless MMDC names another
// command, and PUPPETEER_CONFIG can point it at a browser configuration file.

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'data', 'diagrams');
export const OUT = path.join(root, 'docs', 'diagrams');

export const CONFIG = {
  theme: 'base',
  htmlLabels: false,
  themeVariables: { fontFamily: 'Archivo, Noto Kufi Arabic, sans-serif', fontSize: '15px' },
  flowchart: { htmlLabels: false, curve: 'basis', nodeSpacing: 36, rankSpacing: 58, padding: 22 },
};

export function sourceHash(text) {
  return crypto.createHash('sha256').update(`${JSON.stringify(CONFIG)}\n${text}`).digest('hex').slice(0, 16);
}

// Layout properties that must survive as attributes once style attributes go.
const KEEP = new Set(['text-anchor', 'dominant-baseline', 'alignment-baseline']);

export function clean(svg, hash) {
  let s = svg
    .replace(/<\?xml[^>]*>\s*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
  s = s.replace(/<([a-zA-Z][\w:-]*)([^>]*?)\sstyle="([^"]*)"([^>]*)>/g, (tag, name, before, decls, after) => {
    const present = `${before} ${after}`;
    const extra = decls
      .split(';')
      .map((d) => d.split(':').map((x) => x.trim()))
      .filter(([k, v]) => KEEP.has(k) && v && !new RegExp(`\\s${k}=`).test(present))
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    return `<${name}${before}${extra}${after}>`;
  });
  s = s.replace(/<svg\b[^>]*>/, (tag) => {
    const viewBox = tag.match(/viewBox="([^"]+)"/)[1];
    const id = tag.match(/\sid="([^"]+)"/)[1];
    return `<svg xmlns="http://www.w3.org/2000/svg" id="${id}" viewBox="${viewBox}" class="diagram-svg" role="img" data-source="${hash}">`;
  });
  return `${s.trim()}\n`;
}

function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const all = process.argv.includes('--all');
  const mmdc = process.env.MMDC ? process.env.MMDC.split(' ') : ['npx', '--yes', '-p', '@mermaid-js/mermaid-cli@11', 'mmdc'];
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bunyan-diagrams-'));
  const config = path.join(tmp, 'mermaid.json');
  fs.writeFileSync(config, JSON.stringify(CONFIG));
  const files = fs
    .readdirSync(SRC)
    .filter((f) => f.endsWith('.mmd'))
    .filter((f) => !only.length || only.includes(f.replace(/\.mmd$/, '')))
    .sort();
  let drawn = 0;
  for (const file of files) {
    const name = file.replace(/\.mmd$/, '');
    const text = fs.readFileSync(path.join(SRC, file), 'utf8');
    const hash = sourceHash(text);
    const target = path.join(OUT, `${name}.svg`);
    const current = fs.existsSync(target) && fs.readFileSync(target, 'utf8').includes(`data-source="${hash}"`);
    if (current && !all && !only.length) continue;
    const raw = path.join(tmp, `${name}.svg`);
    const args = ['-i', path.join(SRC, file), '-o', raw, '-c', config, '-b', 'transparent', '-I', `d-${name.replace('.', '-')}`, '-q'];
    if (process.env.PUPPETEER_CONFIG) args.push('-p', process.env.PUPPETEER_CONFIG);
    execFileSync(mmdc[0], [...mmdc.slice(1), ...args], { stdio: 'inherit' });
    fs.writeFileSync(target, clean(fs.readFileSync(raw, 'utf8'), hash));
    drawn += 1;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${drawn} diagrams drawn, ${files.length - drawn} already current.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
