# Changelog

All notable changes to Bunyan are listed here. The project follows semantic versioning.

## 0.7.0, 2026-09-24

- Three new design exercises in English and Arabic, each with a brief, constraints, a task, an advisor link that opens the scenario, a worked answer, and discussion questions: K04 An AI agent for customer service, K05 A ministry moves to a sovereign cloud, and K06 A bank's payment hub.
- The worked answers of K01 to K03 now include the patterns added since they were written, such as customer identity, mobile app protection, and transaction signing for mobile banking, and the tool gateway for the internal assistant.
- The advisor offers all six exercises as examples.

## 0.6.0, 2026-09-24

- Four new patterns take the catalogue to thirty-two: P29 AI agents that use tools, P30 Sovereign cloud and data residency, P31 Identity threat detection and response, and P32 Transaction signing for payments. Each has controls at three levels mapped to the three frameworks, and a diagram in each language.
- P30 takes Kuwait as its example: the CITRA cloud framework requires data at levels three and four of its classification to be hosted in the country by licensed providers.
- The advisor recommends the new patterns through nine new rules and models four new threats, each placed by importance. A mobile banking design now lists payments changed after sign-in among its first threats.
- The tools room of an AI assistant shows the tool gateway.
- Four ATT&CK techniques and three NIST SP 800-53 controls join the catalogues, among them SC-37 for out-of-band channels.
- Ten glossary terms, including excessive agency, data residency, Kerberoasting, DCSync, and transaction signing.

## 0.5.0, 2026-09-24

- Four new patterns take the catalogue to twenty-eight: P25 SaaS tenant guardrails, P26 Secure data exchange with partners, P27 Mobile application protection, and P28 Secure development lifecycle. Each has controls at three levels mapped to the three frameworks, and a diagram in each language.
- Five risks from the OWASP Mobile Top 10 join the catalogues, linked to the official project repository because the risk pages on the project site moved.
- The advisor recommends the new patterns through eight new rules and models four new threats. It now lists the ten most important threats for a design instead of eight, because the threat catalogue grew from nineteen to thirty-one.
- The partner door of a data platform now shows the managed exchange.
- Ten glossary terms, including SSPM, CDR, RASP, SAST, and DAST.
- P19 cites the NCSC device security guidance in place of a page that refuses every automated check.

## 0.4.0, 2026-09-24

- Eight new patterns take the catalogue to twenty-four: P17 Customer identity and account protection, P18 Email and collaboration protection, P19 Managed and hardened endpoints, P20 Security service edge for users anywhere, P21 Continuous exposure management, P22 Resilient availability across sites, P23 Cryptographic agility and post-quantum readiness, and P24 Forensic readiness and incident response. Each has the full structure, controls at three levels mapped to the three frameworks, and a diagram in each language.
- A new Workplace domain groups email, endpoints, and the security service edge.
- The advisor recommends the new patterns through sixteen new rules and models eight new threats, each placed in the threat list by importance.
- Floor plans draw the new patterns: the workplace room shows email, the security service edge, and managed devices, and the edge of a digital service shows customer sign-in with passkeys.
- The foundations band wraps onto a second row when it holds more than eight pieces, and a word too long for its line breaks after its hyphens, so no label is cut or spills out of its box. A test checks every label in six hundred random designs, in both languages.
- Fifteen ATT&CK techniques added and checked against attack.mitre.org, using the current IDs T1684.001 for impersonation and T1685.005 for clearing Windows event logs. Sixteen NIST SP 800-53 controls and sixteen CIS safeguards added to the catalogues.
- Eleven glossary terms, including DMARC, EDR, CASB, EPSS, CBOM, and chain of custody.
- The site is now served from https://bunyan.3li.info.

## 0.3.0, 2026-09-24

- The plan answers back: point at any piece, or tap it, to see which pattern put it there and why, and pin it to find the pattern in the list. Pointing at a pattern in the list lights up its pieces on the plan.
- Every threat can be marked up in red on the plan, to show the controls that stop it.
- After each answer, a note says which patterns were added, removed, or moved, and the new pieces flash on the plan.
- Three examples load a whole scenario with one click.
- A quiz of ten questions at a time, drawn from the patterns and the threats, with an explanation after every answer, in both languages.
- Every pattern the design recommends now has a piece on the plan: a pattern with no place of its own on a system's plan stands in the foundations band, and a test holds the plan to this.

## 0.2.0, 2026-09-24

- Every pattern page on the website shows its diagram, drawn to match the site in the light and dark themes, beside an at a glance panel of its controls, framework mappings, and related patterns.
- A more refined interface: drafting paper behind the pages, a brand mark, answers drawn in ink, icons on the sheet actions, a gentle redraw when an answer changes, and a hint on phones that the plan scrolls sideways.
- Screenshots of the website in both READMEs.
- The link check reports sites that refuse automated clients for a manual look instead of failing.

## 0.1.0, 2026-09-24

The first public release.

- A handbook of seven chapters in English and Arabic.
- Sixteen security architecture patterns, each with controls at three levels mapped to NIST SP 800-53 Rev 5, CIS Controls v8.1, and ISO/IEC 27001:2022, and a diagram in each language.
- A design advisor that asks nine questions, recommends patterns with the reason for each, lists the threats to model first, draws the architecture as a floor plan, and exports a brief in either language.
- Four templates, three design exercises with worked answers, and a glossary of 68 terms.
- Tests for data integrity, bilingual completeness, the writing rules, generated files, and the behaviour of the advisor, with a weekly check of every external link.
