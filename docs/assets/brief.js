// Writes the design brief that people download from the advisor.
// Pure function: takes the advice and the bundle, returns Markdown.
// The Arabic brief follows the same writing rules as the rest of the project,
// and the test suite checks it with the same linter.

const EASTERN = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const eastern = (s) => String(s).replace(/[0-9]/g, (d) => EASTERN[d]).replace(/(\d|[٠-٩])\.(?=[٠-٩])/g, '$1٫');

const WORDS = {
  en: {
    title: 'Proposed security architecture',
    made: (date, site) => `Made with Bunyan on ${date}. Open the same design at ${site}`,
    answers: 'Your answers',
    none: 'None',
    patterns: 'Patterns for this design',
    why: 'Why',
    controls: 'Controls at your level',
    next: 'When you are ready for the next level',
    decisions: 'Decisions to record',
    verify: 'How you will know it works',
    threats: 'Threats to model first',
    threat: 'Threat',
    refs: 'References',
    addressed: 'Addressed by',
    steps: 'Next steps',
    stepsList: (repo) => [
      `Record each decision above in an architecture decision record, using ${repo}/blob/main/templates/en/architecture-decision-record.md`,
      `Run a threat model for the system, starting with the threats above, using ${repo}/blob/main/templates/en/threat-model.md`,
      `Write the design up in ${repo}/blob/main/templates/en/security-architecture-document.md and review it with ${repo}/blob/main/templates/en/design-review-checklist.md`,
    ],
    disclaimer: 'This brief is a starting point for a design, not a design. Test every suggestion against your own context, risks, and obligations.',
  },
  ar: {
    title: 'معمارية الأمن المقترحة',
    made: (date, site) => `أُعدّ هذا الملخص باستخدام بُنيان بتاريخ ${date}، ويمكنك فتح التصميم نفسه عبر الرابط ${site}`,
    answers: 'إجاباتك',
    none: 'لا شيء',
    patterns: 'أنماط هذا التصميم',
    why: 'السبب',
    controls: 'الضوابط المناسبة لمستواك',
    next: 'حين تستعد للمستوى التالي',
    decisions: 'قرارات يجب توثيقها',
    verify: 'كيف تتحقق من أنه يعمل',
    threats: 'تهديدات تبدأ بنمذجتها',
    threat: 'التهديد',
    refs: 'المراجع',
    addressed: 'يعالجها',
    steps: 'الخطوات التالية',
    stepsList: (repo) => [
      `وثّق كل قرار مما سبق في سجل للقرار المعماري مستخدمًا القالب ${repo}/blob/main/templates/ar/architecture-decision-record.md`,
      `نفّذ نمذجة التهديدات للنظام بدءًا بالتهديدات السابقة مستخدمًا القالب ${repo}/blob/main/templates/ar/threat-model.md`,
      `اكتب التصميم في القالب ${repo}/blob/main/templates/ar/security-architecture-document.md ثم راجعه بالقائمة ${repo}/blob/main/templates/ar/design-review-checklist.md`,
    ],
    disclaimer: 'هذا الملخص نقطة انطلاق للتصميم وليس تصميمًا مكتملًا، لذا اختبر كل اقتراح في ضوء سياقك ومخاطرك والتزاماتك.',
  },
};

export function mappings(control) {
  return [
    ...control.nist.map((id) => `\`NIST ${id}\``),
    ...control.cis.map((id) => `\`CIS ${id}\``),
    ...control.iso.map((id) => `\`ISO A.${id}\``),
  ].join(' ');
}

export function refLabel(bundle, id, lang) {
  const tech = bundle.catalogs.attack.techniques[id];
  if (tech) return `${id} ${tech.name[lang]}`;
  const risk = bundle.catalogs.owasp.risks[id];
  if (risk) return `${id} ${risk.name[lang]}`;
  return id;
}

export function renderBrief(bundle, advice, { lang = 'en', project = '', date = '', link = '' } = {}) {
  const w = WORDS[lang];
  const t = (v) => v[lang];
  const num = (s) => (lang === 'ar' ? eastern(s) : String(s));
  const { meta, advisor } = bundle;
  const sep = lang === 'ar' ? '، ' : ', ';
  const out = [];
  const name = project.trim();
  out.push(`# ${w.title}${name ? `: ${name}` : ''}`, '');
  out.push(`${w.made(num(date), link || meta.project.site)}.`, '');
  out.push(`> ${w.disclaimer}`, '');

  out.push(`## ${w.answers}`, '');
  for (const q of advisor.questions) {
    const v = advice.answers[q.id];
    const ids = Array.isArray(v) ? v : [v];
    const labels = ids.map((id) => t(q.options.find((o) => o.id === id).label));
    out.push(`- **${t(q.label)}** ${labels.length ? labels.join(sep) : w.none}`);
  }
  out.push('');

  out.push(`## ${w.patterns}`, '');
  for (const priority of ['essential', 'recommended', 'consider']) {
    const group = advice.patterns.filter((p) => p.priority === priority);
    if (!group.length) continue;
    out.push(`### ${t(meta.priorities[priority])}`, '');
    for (const p of group) {
      out.push(`#### ${p.id} ${t(p.pattern.title)}`, '');
      out.push(`${t(p.pattern.summary)}`, '');
      out.push(`**${w.why}**`, '');
      for (const r of p.reasons) out.push(`- ${t(r)}`);
      out.push('');
      out.push(`**${w.controls}**`, '');
      for (const c of p.controls) out.push(`- **${t(c.name)}:** ${t(c.detail)} ${mappings(c)}`);
      out.push('');
      if (p.nextControls.length) {
        out.push(`**${w.next}**`, '');
        for (const c of p.nextControls) out.push(`- **${t(c.name)}:** ${t(c.detail)}`);
        out.push('');
      }
      out.push(`**${w.decisions}**`, '');
      for (const d of p.pattern.decisions) out.push(`- ${t(d)}`);
      out.push('');
      out.push(`**${w.verify}**`, '');
      for (const v of p.pattern.verify) out.push(`- ${t(v)}`);
      out.push('');
    }
  }

  out.push(`## ${w.threats}`, '');
  out.push(`| ${w.threat} | ${w.refs} | ${w.addressed} |`, '| --- | --- | --- |');
  for (const th of advice.threats) {
    const refs = th.refs.map((id) => refLabel(bundle, id, lang)).join(sep);
    const by = th.addressedBy.join(sep);
    out.push(`| ${t(th.title)} | ${refs || w.none} | ${by || w.none} |`);
  }
  out.push('');

  out.push(`## ${w.steps}`, '');
  w.stepsList(meta.project.repo).forEach((s, i) => out.push(`${i + 1}. ${s}`));
  out.push('');
  return out.join('\n');
}
