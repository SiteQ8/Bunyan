// The Bunyan design advisor.
//
// Pure functions only: no DOM, no network, no storage. The website imports this
// module in the browser and the test suite imports the same file in Node, so
// every behaviour the tests prove is the behaviour people get.

export const LEVELS = ['foundation', 'enhanced', 'advanced'];
export const PRIORITIES = ['essential', 'recommended', 'consider'];
export const THREAT_LIMIT = 8;

const rank = (priority) => PRIORITIES.indexOf(priority);

// A condition is "always", a question test, a pattern test, or a combination.
//   { q: 'hosting', in: ['cloud'] }        single choice is one of
//   { q: 'exposure', has: 'public' }       multiple choice includes
//   { q: 'exposure', hasAny: ['a', 'b'] }  multiple choice includes any of
//   { q: 'exposure', hasNone: ['a', 'b'] } multiple choice includes none of
//   { pattern: 'P15' }                     that pattern is recommended
//   { any: [...] } and { all: [...] }
export function matches(cond, answers, recommended = new Map()) {
  if (cond === 'always') return true;
  if (cond == null || typeof cond !== 'object') throw new Error(`Unknown condition: ${JSON.stringify(cond)}`);
  if (Array.isArray(cond.any)) return cond.any.some((c) => matches(c, answers, recommended));
  if (Array.isArray(cond.all)) return cond.all.every((c) => matches(c, answers, recommended));
  if (typeof cond.pattern === 'string') return recommended.has(cond.pattern);
  const value = answers[cond.q];
  if (Array.isArray(cond.in)) return cond.in.includes(value);
  if (typeof cond.has === 'string') return Array.isArray(value) && value.includes(cond.has);
  if (Array.isArray(cond.hasAny)) return Array.isArray(value) && cond.hasAny.some((x) => value.includes(x));
  if (Array.isArray(cond.hasNone)) return Array.isArray(value) && !cond.hasNone.some((x) => value.includes(x));
  throw new Error(`Unknown condition: ${JSON.stringify(cond)}`);
}

export function defaultAnswers(advisor) {
  const answers = {};
  for (const q of advisor.questions) answers[q.id] = Array.isArray(q.default) ? [...q.default] : q.default;
  return answers;
}

// Keep only known options, fall back to the default for anything missing or invalid,
// and keep multiple choices in the order the options are listed.
export function normalizeAnswers(advisor, raw = {}) {
  const answers = {};
  for (const q of advisor.questions) {
    const ids = q.options.map((o) => o.id);
    const given = raw[q.id];
    if (q.type === 'multi') {
      const list = Array.isArray(given) ? given : typeof given === 'string' ? given.split(',') : null;
      answers[q.id] = list ? ids.filter((id) => list.includes(id)) : [...q.default];
    } else {
      answers[q.id] = ids.includes(given) ? given : q.default;
    }
  }
  return answers;
}

export function levelsFor(maturity) {
  const i = LEVELS.indexOf(maturity);
  return LEVELS.slice(0, i < 0 ? 1 : i + 1);
}

export function nextLevel(maturity) {
  const i = LEVELS.indexOf(maturity);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}

// Decide which patterns the design needs. A pattern takes the highest priority of
// any rule that fired for it, and it explains itself with the reasons of the rules
// at that priority, so a stronger reason is never diluted by a generic one.
export function recommendPatterns(advisor, answers) {
  const found = new Map();
  for (const rule of advisor.rules) {
    if (!matches(rule.when, answers)) continue;
    const entry = found.get(rule.pattern) || { id: rule.pattern, priority: rule.priority, fired: [] };
    if (rank(rule.priority) < rank(entry.priority)) entry.priority = rule.priority;
    entry.fired.push(rule);
    found.set(rule.pattern, entry);
  }
  for (const entry of found.values()) {
    entry.reasons = entry.fired.filter((r) => r.priority === entry.priority).map((r) => r.because);
    delete entry.fired;
  }
  return found;
}

function sortRecommended(list) {
  return list.sort((a, b) => rank(a.priority) - rank(b.priority) || a.id.localeCompare(b.id));
}

export function selectThreats(advisor, answers, recommended) {
  return advisor.threats
    .filter((t) => matches(t.when, answers, recommended))
    .slice(0, THREAT_LIMIT)
    .map((t) => ({ ...t, addressedBy: t.patterns.filter((p) => recommended.has(p)) }));
}

function pick(item, answers, recommended) {
  if (!item) return null;
  if (item.when && !matches(item.when, answers, recommended)) return null;
  const out = { label: item.label };
  if (item.actor) out.actor = item.actor;
  if (item.pattern) {
    const rec = recommended.get(item.pattern);
    out.pattern = item.pattern;
    out.priority = rec ? rec.priority : null;
  } else {
    out.priority = 'structural';
  }
  return out;
}

// Fixtures only appear when their pattern is part of the design, because an
// unrecommended control drawn on the plan would suggest work nobody asked for.
function pickFixture(item, answers, recommended) {
  const f = pick(item, answers, recommended);
  if (!f || f.priority === null) return null;
  return f;
}

export function buildPlan(advisor, answers, recommended) {
  const spec = advisor.plan.systems[answers.system];
  const common = advisor.plan.common;
  const rooms = [];
  for (const room of spec.rooms) {
    if (room.when && !matches(room.when, answers, recommended)) continue;
    rooms.push({
      id: room.id,
      label: room.label,
      trust: room.trust,
      fixtures: room.fixtures.map((f) => pickFixture(f, answers, recommended)).filter(Boolean),
    });
  }
  const doors = spec.doors.slice(0, rooms.length - 1).map((d) => pick(d, answers, recommended));
  const plan = {
    system: answers.system,
    corridor: pick(spec.corridor || common.corridor, answers, recommended),
    management: {
      label: common.management.label,
      fixtures: common.management.fixtures.map((f) => pickFixture(f, answers, recommended)).filter(Boolean),
    },
    entrances: spec.entrances.map((e) => pick(e, answers, recommended)).filter(Boolean),
    rooms,
    doors,
    foundations: common.foundations.map((f) => pickFixture(f, answers, recommended)).filter(Boolean),
    vault: pickFixture(common.vault, answers, recommended),
    egress: pickFixture(common.egress, answers, recommended),
  };
  // A recommended pattern with no place of its own on this system's plan stands in
  // the foundations band, with the controls that apply across every zone, so the
  // drawing shows every pattern the design needs and each one can be pointed at.
  const drawn = new Set(
    [
      plan.corridor && plan.corridor.pattern,
      plan.vault && plan.vault.pattern,
      plan.egress && plan.egress.pattern,
      ...plan.management.fixtures.map((f) => f.pattern),
      ...plan.entrances.map((e) => e.pattern),
      ...rooms.flatMap((r) => r.fixtures.map((f) => f.pattern)),
      ...doors.filter(Boolean).map((d) => d.pattern),
      ...plan.foundations.map((f) => f.pattern),
    ].filter(Boolean)
  );
  for (const rec of sortRecommended([...recommended.values()])) {
    if (drawn.has(rec.id)) continue;
    plan.foundations.push({ label: advisor.plan.short[rec.id], pattern: rec.id, priority: rec.priority, across: true });
    drawn.add(rec.id);
  }
  return plan;
}

// Everything the interface and the brief need, from one call.
export function advise(bundle, rawAnswers) {
  const { advisor, patterns } = bundle;
  const answers = normalizeAnswers(advisor, rawAnswers);
  const recommended = recommendPatterns(advisor, answers);
  const current = levelsFor(answers.maturity);
  const next = nextLevel(answers.maturity);
  const byId = new Map(patterns.map((p) => [p.id, p]));
  const list = sortRecommended([...recommended.values()]).map((rec) => {
    const pattern = byId.get(rec.id);
    return {
      ...rec,
      pattern,
      controls: pattern.controls.filter((c) => current.includes(c.level)),
      nextControls: next ? pattern.controls.filter((c) => c.level === next) : [],
    };
  });
  return {
    answers,
    nextLevel: next,
    patterns: list,
    threats: selectThreats(advisor, answers, recommended),
    plan: buildPlan(advisor, answers, recommended),
  };
}

// Shareable state lives in the URL, so a design can be sent as a link and
// nothing has to be stored anywhere.
export function encodeState(advisor, answers, project = '') {
  const params = new URLSearchParams();
  for (const q of advisor.questions) {
    const v = answers[q.id];
    params.set(q.key, Array.isArray(v) ? v.join('.') : v);
  }
  const name = project.trim().slice(0, 80);
  if (name) params.set('n', name);
  return params.toString();
}

export function decodeState(advisor, query) {
  const params = new URLSearchParams(query);
  const raw = {};
  for (const q of advisor.questions) {
    if (!params.has(q.key)) continue;
    const v = params.get(q.key);
    raw[q.id] = q.type === 'multi' ? (v ? v.split('.') : []) : v;
  }
  return { answers: normalizeAnswers(advisor, raw), project: (params.get('n') || '').slice(0, 80) };
}

// What an answer changed: patterns added, removed, or moved to another priority.
export function diffPatterns(before, after) {
  const was = new Map(before.map((p) => [p.id, p.priority]));
  const now = new Map(after.map((p) => [p.id, p.priority]));
  const changes = [];
  for (const [id, priority] of now) {
    if (!was.has(id)) changes.push({ id, kind: 'added', priority });
    else if (was.get(id) !== priority) changes.push({ id, kind: 'moved', from: was.get(id), priority });
  }
  for (const [id, priority] of was) if (!now.has(id)) changes.push({ id, kind: 'removed', priority });
  const order = { added: 0, moved: 1, removed: 2 };
  return changes.sort((a, b) => order[a.kind] - order[b.kind] || a.id.localeCompare(b.id));
}
