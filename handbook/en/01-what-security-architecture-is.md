[العربية](../ar/01-what-security-architecture-is.md)

# What security architecture is

Security architecture is the discipline of deciding, before a system is built, how it will stay trustworthy when someone attacks it. It shapes the structure of the system: where the trust boundaries are, which components enforce which rules, how identities and data move, and what happens when a part fails. Good security architecture is mostly invisible, because it makes security a property of the design instead of a list of products added at the end.

## What an architect produces

A security architect rarely builds firewalls or writes policies directly. The work produces decisions, and the documents that carry them:

- A description of the system and its context: who uses it, what it holds, what it connects to, and which obligations apply.
- Security requirements derived from risk, from regulation, and from the needs of the business.
- Views of the design that show trust boundaries, data flows, identities, and enforcement points.
- A threat model that shows what can go wrong and what the design does about it.
- Decision records that explain each significant choice and the alternatives that were rejected.
- A statement of residual risk that someone with the authority to accept it has accepted.

The templates in this repository cover each of these outputs.

## Three levels of the work

Security architecture happens at three levels, and each one needs different habits.

| Level | The question it answers | Typical output |
| --- | --- | --- |
| Enterprise | Which capabilities must the organisation have, and in what order? | Reference architecture, target state, and roadmap |
| Solution | How will this system meet its security requirements? | Solution design, threat model, and decision records |
| Component | How is this control built and configured? | Standards, configuration baselines, and patterns |

Enterprise architecture sets the patterns and shared services, such as identity, logging, and key management, that every solution then reuses. Solution architecture applies them to one system, and component architecture makes them concrete. Most of the patterns in this repository live at the solution level and point down to components.

## Views, not one diagram

One diagram cannot show everything that matters for security. Architecture frameworks such as SABSA and TOGAF describe a system through several views, and the same idea works for security:

- The context view shows the system as one box, the people and systems around it, and the trust boundaries between them.
- The data view shows where each class of data is created, stored, processed, and sent.
- The identity view shows who and what authenticates, where, how, and with which privileges.
- The deployment view shows networks, zones, platforms, and where each component runs.
- The operational view shows how the system is administered, monitored, backed up, and recovered.

If a question about the design cannot be answered from one of these views, a view is missing.

## The core loop

Security architecture is iterative, and the same loop repeats for every system:

1. Understand the business context and what must be protected.
2. Identify the threats and the requirements.
3. Choose patterns and controls, and record the decisions.
4. Verify that the controls exist and that they work.
5. Revisit the design when the system, the threats, or the obligations change.

Chapter five turns this loop into a method you can follow step by step.

## What good looks like

A good security architecture is proportionate, because its controls match the value of what they protect. It is explicit, because trust boundaries and decisions are written down. It is verifiable, because every important control can be tested. It is operable, because the people who run the system can keep it secure without heroic effort. It fails gracefully, because the failure of one part does not expose everything.

## Where to go next

Read the [design principles](02-design-principles.md) in the next chapter, then try the [design advisor](https://bunyan.3li.info/?lang=en) on a system you know well.
