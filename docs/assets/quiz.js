// Builds a round of quiz questions from the data. Each question shows a problem
// or a threat and four patterns, exactly one of which answers it. The random
// source can be replaced, so the tests can check many rounds deterministically.

export const QUIZ_LENGTH = 10;

function take(list, n, random) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}

export function buildQuiz(bundle, count = QUIZ_LENGTH, random = Math.random) {
  const ids = bundle.patterns.map((p) => p.id);
  const pool = [
    ...bundle.patterns.map((p) => ({ kind: 'problem', prompt: p.problem, answer: p.id, right: [p.id] })),
    ...bundle.advisor.threats.map((th) => ({
      kind: 'threat',
      prompt: th.title,
      answer: take(th.patterns, 1, random)[0],
      right: th.patterns,
      threat: th.id,
    })),
  ];
  return take(pool, count, random).map((q) => {
    const others = take(ids.filter((id) => !q.right.includes(id)), 3, random);
    return { kind: q.kind, prompt: q.prompt, answer: q.answer, threat: q.threat, options: take([q.answer, ...others], 4, random) };
  });
}
