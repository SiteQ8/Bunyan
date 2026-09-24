[العربية](../ar/03-frameworks-map.md)

# A map of frameworks and methods

There are more frameworks than any architect can master. What matters is knowing which question each one answers, and using the smallest set that covers your questions.

## Which framework answers which question

| The question | Where to look | What you get |
| --- | --- | --- |
| How do we organise the whole security programme? | [NIST CSF 2.0](https://www.nist.gov/cyberframework) | Outcomes grouped in six functions: Govern, Identify, Protect, Detect, Respond, and Recover |
| How do we trace security back to business requirements? | [SABSA](https://sabsa.org/) | A layered model that traces every control to a business attribute |
| How does security fit into enterprise architecture? | [TOGAF Standard, 10th Edition](https://www.opengroup.org/togaf) | An architecture development method, with guidance for security |
| How do we engineer a trustworthy system? | [NIST SP 800-160 Vol 1 Rev 1](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final) | Systems security engineering principles across the life cycle |
| Which controls exist, in full detail? | [NIST SP 800-53 Rev 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) | The most complete catalogue of security and privacy controls |
| Which controls should come first? | [CIS Controls v8.1](https://www.cisecurity.org/controls/v8-1) | 18 controls and 153 safeguards in three implementation groups |
| What does a certifiable management system need? | [ISO/IEC 27001:2022](https://www.iso.org/standard/27001) | Management system requirements and 93 controls in Annex A |
| How do we design for zero trust? | [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) and [CISA Zero Trust Maturity Model 2.0](https://www.cisa.gov/zero-trust-maturity-model) | The reference architecture, and a maturity model across five pillars |
| How do attackers actually operate? | [MITRE ATT&CK](https://attack.mitre.org/) and [D3FEND](https://d3fend.mitre.org/) | Real attack techniques to model, and defensive techniques to map against them |
| How do we verify an application? | [OWASP ASVS 5.0](https://github.com/OWASP/ASVS) | Security requirements for applications, written so that they can be tested |
| How do we secure industrial systems? | [ISA/IEC 62443](https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards) and [NIST SP 800-82 Rev 3](https://csrc.nist.gov/pubs/sp/800/82/r3/final) | Zones, conduits, security levels, and operational technology practice |
| How do we secure software delivery? | [NIST SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final) and [SLSA](https://slsa.dev/) | Secure development practices, and levels of build integrity |
| How do we manage AI risk? | [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), [NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1), [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/), and [MITRE ATLAS](https://atlas.mitre.org/) | Governance of AI risk, and the threats specific to AI systems |

## Gulf regulations

In the Gulf, national and sector regulations add their own requirements, and they often decide what an auditor will ask for first.

| Regulation | Issued by | Applies to |
| --- | --- | --- |
| [National Baseline Cybersecurity Controls, NBCC](https://github.com/SiteQ8/Kuwait-NBCC) | Kuwait National Cyber Security Center, Decision No. 2 of 2026 | The entities in Kuwait that the decision covers |
| [Cyber and Operational Resilience Framework, CORF](https://github.com/SiteQ8/CORF) | Central Bank of Kuwait, version 1.0, December 2025 | Banks and the other institutions that the Central Bank supervises |
| [Essential Cybersecurity Controls, ECC-2:2024](https://github.com/SiteQ8/NCA-ECC-Crosswalk) | National Cybersecurity Authority, Saudi Arabia | Government bodies and critical entities in Saudi Arabia |
| Cyber Security Framework | Saudi Central Bank, SAMA | The financial institutions that SAMA regulates |
| [PCI DSS v4.0.1](https://www.pcisecuritystandards.org/document_library/) | PCI Security Standards Council | Anyone who stores, processes, or transmits payment card data |
| [SWIFT Customer Security Controls Framework](https://www.swift.com/customer-security-programme-csp) | SWIFT | Every SWIFT user, with an attestation every year |

## A practical stack

Most organisations need fewer frameworks than they think. A practical stack is NIST CSF 2.0 to organise the programme, CIS Controls to decide what comes first, one control catalogue as the shared vocabulary, either NIST SP 800-53 or Annex A of ISO/IEC 27001, then ATT&CK to test designs against real attacks, and the regulation of your sector on top. Every control in the Bunyan patterns is mapped to SP 800-53, CIS, and ISO, so that one design can serve several frameworks at once.

## Do not collect frameworks

Each framework you adopt adds mapping, evidence, and audit work. Adopt one control vocabulary, map the others to it once, and keep the mapping where tests can check it. The [NCA ECC crosswalk](https://github.com/SiteQ8/NCA-ECC-Crosswalk) and the [CORF workbook](https://github.com/SiteQ8/CORF) show one way to do this.
