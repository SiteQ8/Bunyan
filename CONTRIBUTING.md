[العربية](CONTRIBUTING.ar.md)

# Contributing to Bunyan

Thank you for helping. People use Bunyan to learn, so accuracy and clarity matter more than volume.

## What we welcome

- Corrections to facts, mappings, and references.
- Better Arabic, especially terminology that follows the usage of Gulf regulators.
- New patterns for recurring problems that the catalogue does not cover yet.
- New design exercises based on realistic systems.

## How the content works

The patterns, the glossary, the advisor, and the catalogues live as JSON files in the data folder. The pattern pages, the glossary pages, the pattern tables in the READMEs, and the website data are generated from them, so edit the data and then run the build and the tests:

```sh
npm run build
npm test
```

Never edit a generated file by hand. Each generated page starts with a comment that says where it comes from.

## Writing rules

The tests enforce these rules, so a pull request that breaks one of them will fail.

- Write every text in English and in Arabic, with the same meaning, the same structure, and the same numbers.
- Do not use em dashes or en dashes anywhere, and rewrite the sentence instead.
- In Arabic, put a full stop only at the end of a paragraph, a list item, or a table cell, and join the sentences inside it with connectors such as `و`, `ف`, `ثم`, `أو`, `لأن`, `لذا`, `أي`, `لكن`, `بينما`, and `بل`.
- In Arabic, use Arabic punctuation next to Arabic words, use Arabic numerals for numbers that stand alone, and keep identifiers such as NIST SP 800-207 or T1078 in Latin characters.
- Follow the terminology of Gulf regulators, such as the Kuwait NBCC and the NCA ECC, and prefer Arabic sentences that start with a verb.
- Map every control to at least one NIST SP 800-53 control, and to CIS and ISO wherever a real match exists.

## Adding a pattern

1. Copy an existing file in data/patterns, give it the next number, and fill in every field in both languages.
2. Add an English and an Arabic diagram in data/diagrams, then draw them for the website with node scripts/render-diagrams.mjs. English diagrams flow left to right, Arabic ones flow right to left, and each line of an Arabic label uses one script only. The script needs the Mermaid command line tool and the two fonts in docs/assets/fonts installed, because Mermaid measures the labels as it draws.
3. Add at least one rule in data/advisor.json that recommends the pattern, with its reason in both languages.
4. Run the build and the tests, and fix whatever fails.
5. Run the link check with npm run links to confirm that every reference opens.

## Commits and pull requests

Write commit messages as plain sentences that say what changed. Keep each pull request to one topic, and explain in its description why the change is right, with a source for every fact.

## Conduct

Be kind, be precise, and assume good intent. Review the work, not the person.
