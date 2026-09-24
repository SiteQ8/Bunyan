// Text rules shared by the build, the tests, and the site.
//
// Everything written in this repository follows the same rules, and the rules
// live in one place so that a document, a data file, and a generated design
// brief are all held to exactly the same standard.

const AR = '\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF';
const AR_RE = new RegExp(`[${AR}]`);
const AR_SPLIT = new RegExp(`[${AR}]+`, 'g');
const EASTERN = '٠١٢٣٤٥٦٧٨٩';

// Every Unicode dash and dash lookalike. Plain ASCII hyphens are allowed inside
// words and identifiers, nothing else.
export const UNICODE_DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/;

export const hasArabic = (s) => AR_RE.test(s);

export function toWesternDigits(s) {
  return s
    .replace(/[٠-٩]/g, (d) => String(EASTERN.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',');
}

export function toEasternDigits(s) {
  return String(s)
    .replace(/[0-9]/g, (d) => EASTERN[Number(d)])
    .replace(/\./g, '٫');
}

// The numbers a text states, normalised so that ٢٠٢٦ and 2026 compare equal.
export function numbersIn(s) {
  const t = toWesternDigits(s);
  return (t.match(/\d+(?:[.:]\d+)*/g) || []).sort();
}

export function sameNumbers(a, b) {
  const x = numbersIn(a);
  const y = numbersIn(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

// Remove Markdown and HTML markup, keeping the words a reader sees.
export function stripInline(s) {
  return s
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<https?:[^>]+>/g, ' ')
    .replace(/https?:\/\/[^\s)|]+/g, ' ')
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
    .replace(/\*\*|__/g, '')
    .replace(/(^|\s)[*_](\S)/g, '$1$2')
    .replace(/(\S)[*_](\s|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

// Identifiers such as NIST SP 800-207, v8.1, A.5.15 or T1110.004 carry their
// own dots and digits. They are replaced by a placeholder before sentence
// punctuation is checked, so that only real sentence punctuation is counted.
const LATIN_RUN = /[A-Za-z0-9][A-Za-z0-9._:/+()'&-]*[A-Za-z0-9)]|[A-Za-z0-9]/g;

// Arabic style, as the project writes it:
// a full stop only at the end of a paragraph, list item or cell, with the
// sentences inside it joined by connectors; Arabic punctuation next to Arabic
// words; Arabic numerals for numbers that stand alone; and no stretch of
// untranslated English.
export function arabicProblems(text) {
  const problems = [];
  const t = stripInline(text);
  if (!t) return problems;

  const masked = t.replace(LATIN_RUN, 'X').trim();
  const body = masked.replace(/[\s)\]»"']+$/, '');
  const inner = body.slice(0, -1);
  if (inner.includes('.')) {
    problems.push('a full stop in the middle: join the sentences with a connector and keep the full stop for the end');
  }
  if (/\.\.\./.test(t)) problems.push('an ellipsis');

  const arabicThenLatin = new RegExp(`[${AR}]\\s*[,;?]`);
  const latinThenArabic = new RegExp(`[,;?]\\s*[${AR}]`);
  if (arabicThenLatin.test(t) || latinThenArabic.test(t)) {
    problems.push('Latin punctuation next to Arabic words: use ، ؛ ؟');
  }

  for (const run of t.split(AR_SPLIT)) {
    if (/[0-9]/.test(run) && !/[A-Za-z]/.test(run)) {
      problems.push(`Western digits outside an identifier: "${run.trim()}" should use Arabic numerals`);
    }
    const words = run.match(/[A-Za-z][A-Za-z'-]*/g) || [];
    if (words.length > 8) {
      problems.push(`a long English passage in Arabic text: "${run.trim().slice(0, 60)}"`);
    }
  }
  return problems;
}

const EN_ALLOWED_ARABIC = new Set(['العربية', 'بُنيان', 'بنيان']);

export function englishProblems(text) {
  const problems = [];
  const t = stripInline(text);
  if (!t) return problems;
  const arabicWords = (t.match(new RegExp(`[${AR}]+`, 'g')) || []).filter(
    (w) => !EN_ALLOWED_ARABIC.has(w),
  );
  if (arabicWords.length) problems.push(`Arabic words in English text: ${arabicWords.slice(0, 3).join(' ')}`);
  if (/\s-\s/.test(t)) problems.push('a spaced hyphen used as a dash: rewrite the sentence');
  if (/\.\.\./.test(t)) problems.push('an ellipsis');
  return problems;
}

export function universalProblems(text) {
  const problems = [];
  if (UNICODE_DASHES.test(text)) problems.push('a Unicode dash');
  if (/\bTODO\b|\bTBD\b|\bFIXME\b|lorem ipsum/i.test(text)) problems.push('an unfinished placeholder');
  return problems;
}

// Split a Markdown document into the units a reader experiences, and count its
// structure so that an English page and its Arabic twin can be compared.
export function analyzeMarkdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const units = [];
  const structure = { headings: {}, items: 0, rows: 0, fences: 0, mermaid: 0 };
  const links = [];
  let fence = null;
  let para = [];
  let last = null;

  const flush = () => {
    if (para.length) {
      last = { kind: 'para', text: para.join(' ') };
      units.push(last);
      para = [];
    }
  };

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```|~~~)\s*([\w-]*)/);
    if (fenceMatch) {
      flush();
      if (fence) {
        fence = null;
      } else {
        fence = fenceMatch[2] || 'text';
        structure.fences += 1;
        if (fence === 'mermaid') structure.mermaid += 1;
      }
      last = null;
      continue;
    }
    if (fence) continue;

    for (const m of line.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) links.push(m[1]);

    if (!line.trim() || /^\s*<!--.*-->\s*$/.test(line) || /^\s*<\/?[a-zA-Z][^>]*>\s*$/.test(line)) {
      flush();
      last = null;
      continue;
    }

    let m;
    if ((m = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/))) {
      flush();
      const level = m[1].length;
      structure.headings[level] = (structure.headings[level] || 0) + 1;
      last = { kind: 'heading', level, text: m[2] };
      units.push(last);
      continue;
    }
    if (/^\s*\|/.test(line)) {
      flush();
      if (/^\s*\|?\s*:?-{3,}/.test(line)) continue;
      structure.rows += 1;
      for (const cell of line.split('|').slice(1, -1)) {
        if (cell.trim()) units.push({ kind: 'cell', text: cell.trim() });
      }
      last = null;
      continue;
    }
    if ((m = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/))) {
      flush();
      structure.items += 1;
      last = { kind: 'item', text: m[1] };
      units.push(last);
      continue;
    }
    if ((m = line.match(/^\s*>\s?(.*)$/))) {
      flush();
      if (last && last.kind === 'quote') last.text += ` ${m[1]}`;
      else {
        last = { kind: 'quote', text: m[1] };
        units.push(last);
      }
      continue;
    }
    if (/^\s{2,}\S/.test(line) && last && last.kind === 'item') {
      last.text += ` ${line.trim()}`;
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return { units, structure, links };
}

// The prose of a document without list markers, code, or URLs, for comparing
// the numbers an English page and its Arabic twin state.
export function proseOf(md) {
  return analyzeMarkdown(md)
    .units.map((u) => stripInline(u.text))
    .join('\n');
}

export function markdownProblems(md, lang) {
  const out = [];
  const { units } = analyzeMarkdown(md);
  for (const u of units) {
    const check = lang === 'ar' ? arabicProblems : englishProblems;
    let found = check(u.text);
    if (u.kind === 'heading' && lang === 'ar') {
      found = found.filter((p) => !p.startsWith('a full stop'));
    }
    for (const p of found) out.push(`${p} in: ${stripInline(u.text).slice(0, 90)}`);
  }
  return out;
}

// Normalise a URL so that the English and Arabic twins of a page compare equal
// when they point at the same place in their own language.
export function twinUrl(url) {
  return url
    .replace(/\/(en|ar)\//g, '/xx/')
    .replace(/\.ar\.md\b/g, '.md')
    .replace(/([?&#])lang=(en|ar)/g, '$1lang=xx');
}
