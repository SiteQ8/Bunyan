[العربية](../ar/04-threat-modeling.md)

# Threat modeling for architects

Threat modeling is a structured way of asking what can go wrong with a system while acting on the answer is still cheap. For an architect it is not a separate activity. It is how a design gets its requirements, and how you show that the design meets them.

## Four questions

The Threat Modeling Manifesto reduces the practice to four questions, and every method below is a way of answering one of them:

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

## Model the system

Draw the system as a data flow diagram: external entities, processes, data stores, and the flows between them. Then draw the trust boundaries, the lines where the level of trust changes. Keep the diagram at the level of the design, not the code.

Two paths are forgotten more often than any other. One is the administration path, meaning how people and tools manage the system. The other is the supply chain, meaning how code, dependencies, and images reach it. Put both on the diagram.

## Find what can go wrong

STRIDE is the most widely used way to generate threats. Walk through each element and each flow that crosses a trust boundary, and ask which of the six threats apply.

| Threat | The property it breaks | The usual design answer |
| --- | --- | --- |
| Spoofing | Authentication | Strong authentication, mutual TLS, and signed tokens |
| Tampering | Integrity | Signing, input validation, and integrity monitoring |
| Repudiation | Accountability | Logs that the actor cannot change |
| Information disclosure | Confidentiality | Encryption, authorization, and data minimisation |
| Denial of service | Availability | Rate limits, capacity, isolation, and recovery |
| Elevation of privilege | Authorization | Least privilege, isolation, and complete mediation |

Other methods answer the same question from different angles:

- PASTA is centred on risk, and runs in seven stages from business objectives to attack simulation.
- LINDDUN focuses on privacy threats, such as linkability and identifiability.
- Attack trees break one attacker goal into the paths that reach it, which shows where one control blocks many paths.
- MITRE ATT&CK gives real techniques to test the model against, and shows which of them your design would detect.

## Decide what to do

Every threat gets a written decision with an owner:

- Mitigate it with a control, which becomes a requirement of the design.
- Eliminate it by removing the feature, the data, or the interface.
- Transfer it, for example to a provider under contract, knowing that accountability stays with you.
- Accept it, with the reason and the name of the person who accepted it.

The patterns in this repository list the threats that each one addresses, which makes them a quick source of mitigations. Start from the [pattern catalogue](../../patterns/en/README.md).

## Check the work

A threat model is good enough when every element that crosses a trust boundary was examined, every threat has a decision and an owner, every mitigation can be tested, and the model has a date for its next review. Revisit it when the design changes, when a new attack technique becomes common, or after an incident.

## Common mistakes

- Modeling after the system is built, when changes are expensive.
- Modeling at the level of code, which produces hundreds of findings and no design decisions.
- Leaving out administration, pipelines, and third parties.
- Producing a document that nobody follows up.

## Practise

Threat model a system you know with the [worksheet](../../templates/en/threat-model.md). To draw the system and walk it with STRIDE in the browser, try [Mimar](https://siteq8.github.io/Mimar/). Then read the [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/), the [LINDDUN](https://linddun.org/) method, and Adam Shostack's book Threat Modeling: Designing for Security.
