[العربية](../ar/07-learning-path.md)

# A learning path

Security architects come from many places: networks, development, operations, audit, and risk. Wherever you start, the path below fills the gaps in a sensible order. Each stage says what to learn, how to practise it, and where to go deeper.

## Stage one: foundations

Learn how the things you will protect actually work. Architects who do not understand networks, operating systems, identity, and cryptography end up drawing boxes that cannot be built.

- Networks: routing, DNS, TLS, and how traffic crosses firewalls and proxies.
- Operating systems and directories: how Windows domains, Linux permissions, and service accounts work.
- Identity: authentication, federation with SAML and OpenID Connect, and OAuth 2.0.
- Cryptography: what encryption, hashing, signatures, and certificates do, and how keys are managed.
- Cloud: accounts, identity and access management, and the shared responsibility model.

## Stage two: controls and frameworks

Learn the vocabulary in which controls are described, and practise mapping between frameworks.

- Read NIST CSF 2.0 from end to end, then the CIS Controls, then skim SP 800-53 family by family.
- Map ten controls from one framework to another, and notice where the mapping is weak.
- Read one regulation that applies to you, such as the NBCC or CORF, and list the patterns it touches.

## Stage three: design

Learn to reason about systems as an architect does. This is where the handbook and the patterns in this repository do most of their work.

- Read the first six chapters of this handbook, and one pattern a week.
- Threat model three systems you know, using the worksheet.
- Solve the [design exercises](../../katas/en/K01-mobile-banking.md) before reading the worked answers.
- Write a decision record for a real decision at work.

## Stage four: specialise

Pick the areas your organisation depends on most, and go deep in one or two of them.

| Area | Go deeper with |
| --- | --- |
| Cloud | The landing zone guidance of your cloud provider, and the [SC-100 study companion](https://siteq8.github.io/SC-100/) for Microsoft environments |
| Applications and APIs | OWASP ASVS 5.0 and the OWASP API Security Top 10 |
| Operational technology | ISA/IEC 62443 and NIST SP 800-82 Rev 3 |
| AI systems | NIST AI 600-1, the OWASP Top 10 for LLM Applications 2025, and MITRE ATLAS |
| Detection and response | MITRE ATT&CK, D3FEND, and NIST SP 800-61 Rev 3 |

## Stage five: lead

Architecture is as much about people as about systems. Learn to explain risk to executives, to negotiate with delivery teams, and to run reviews that improve designs instead of blocking them.

- Present one design to a non-technical audience, and ask them what they understood.
- Review other people's designs with the checklist, and write your findings as questions.
- Learn an enterprise architecture method, such as SABSA or TOGAF, well enough to work within it.

## Certifications that fit the path

Certifications do not make an architect, but they give structure to study and a common language with others. These fit security architecture well.

| Certification | Issued by | Focus |
| --- | --- | --- |
| [GIAC Defensible Security Architecture, GDSA](https://www.giac.org/certifications/defensible-security-architecture-gdsa/) | GIAC | Practical architecture for networks, data, and zero trust |
| [CISSP-ISSAP](https://www.isc2.org/certifications/issap) | ISC2 | The architecture concentration for experienced CISSP holders |
| [SABSA Chartered Foundation](https://sabsa.org/) | The SABSA Institute | Security architecture driven by the business |
| [TOGAF certification](https://www.opengroup.org/togaf) | The Open Group | The enterprise architecture method |
| [Microsoft Cybersecurity Architect Expert, SC-100](https://learn.microsoft.com/en-us/credentials/certifications/cybersecurity-architect-expert/) | Microsoft | Architecture on Microsoft security platforms |

## A reading list

| Resource | Why read it |
| --- | --- |
| Ross Anderson, Security Engineering, third edition ([link](https://www.cl.cam.ac.uk/~rja14/book.html)) | The widest single book on how systems fail and how to build them to resist |
| Adam Shostack, Threat Modeling: Designing for Security | The standard practical guide to threat modeling |
| John Sherwood, Andrew Clark, and David Lynas, Enterprise Security Architecture: A Business-Driven Approach | The book behind SABSA |
| [NIST SP 800-160 Vol 1 Rev 1](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final) | Systems security engineering, from principles to the whole life cycle |
| [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) | The reference description of zero trust architecture |

## Practise every week

Skills fade without practice. Once a week, run a system you know through the [design advisor](https://siteq8.github.io/Bunyan/?lang=en), or read one incident report and ask which pattern would have stopped it, or write one decision record. Small, regular practice builds judgement faster than occasional courses.
