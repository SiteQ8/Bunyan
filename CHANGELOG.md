# Changelog

All notable changes to Bunyan are listed here. The project follows semantic versioning.

## 0.8.0, 2026-11-06

- A new look for the whole site: Albert Sans with Noto Kufi Arabic, five type sizes, forest ink on plain paper, a lime fill for the action in hand, and red kept for marking up threats. The grid paper, outlined boxes, pills and thin rules are gone, and every colour, size and space comes from one set of tokens.
- The plan is laid out for the width of the screen it is shown on, one unit to one pixel, so its labels print at 14px and never shrink below 13px. A wide screen gets the landscape sheet. A tablet or a phone gets a new portrait sheet, with the rooms stacked from the entrance down, the doors in the walls between them, and the service corridor down the side. Printing always draws the landscape sheet, with the legend and the title block in a strip beside it.
- The questions sit above the plan, one at a time, in a strip of tabs with Previous and Next, and the examples as the last tab. The note on what an answer changed rides along the bottom of the screen while the plan is in view, folds a long list into a count, and the pieces an answer added or promoted are edged in green until the next answer, so red is kept for threats.
- The plan can be used from the keyboard: focus it, move between its pieces with the arrow keys, press Enter to pin a piece and Escape to let it go. Each piece now has a name for screen readers. Pointing at a piece previews its note, and pinning it adds the links to the list and the pattern. When one piece is in focus the rest fade by colour, so the doors still cut the walls.
- The patterns for a design are set as a board, essential first, and open one at a time. On first sight its rows turn over like a departure board, and after each answer the rows that changed turn again. Each threat lists the patterns that address it, and its button names the threat it marks.
- Start over can be undone for eight seconds. The skip link no longer leaves the page. A link that cannot be copied stays on screen.
- The pattern index is grouped by domain. Each pattern page opens with its facts beside the summary and sets each section beside its heading. Every diagram is drawn twice, wide and tall, the page takes the one that keeps its labels readable, and an empty drawing of the same size holds its place while it loads.
- The glossary has an introduction and sets its terms in two columns, the Learn page sets its four parts side by side, and the quiz sits in the middle of the page. The advisor page ends with a short account of who Bunyan is for, what it holds, how it works and how to take part.
- New tests hold both plan layouts to their promises at nine widths: no label loses a word or leaves its box, no piece covers another, every recommended pattern is drawn, and every piece can be reached from the keyboard.

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
