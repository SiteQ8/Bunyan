// Read every data file into one bundle. The build, the tests, and (through the
// generated docs/data/bunyan.json) the website all start from this bundle.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

export function loadBundle() {
  const dir = path.join(root, 'data', 'patterns');
  const patterns = fs
    .readdirSync(dir)
    .filter((f) => /^P\d{2}\.json$/.test(f))
    .sort()
    .map((f) => readJson(`data/patterns/${f}`));
  return {
    meta: readJson('data/meta.json'),
    advisor: readJson('data/advisor.json'),
    glossary: readJson('data/glossary.json').terms,
    patterns,
    catalogs: {
      nist: readJson('data/catalogs/nist-800-53r5.json'),
      cis: readJson('data/catalogs/cis-v8.1.json'),
      iso: readJson('data/catalogs/iso27001-2022.json'),
      attack: readJson('data/catalogs/attack.json'),
      owasp: readJson('data/catalogs/owasp.json'),
    },
  };
}

export function readDiagram(id, lang) {
  return fs.readFileSync(path.join(root, 'data', 'diagrams', `${id}.${lang}.mmd`), 'utf8').trimEnd();
}
