[العربية](../ar/threat-model.md)

# Threat model worksheet

> Work through the four questions with the people who build and run the system. Keep the result short, and keep it current.

## What are we working on?

| Field | Value |
| --- | --- |
| System | The name of the system |
| Scope | What this model covers |
| Diagram | A link to the data flow diagram with its trust boundaries |
| Participants | Who took part |
| Date | When the model was made |

List the trust boundaries in the diagram:

- The boundary, and what crosses it

## What can go wrong?

Walk through every element and every flow that crosses a trust boundary with STRIDE, and add attacker techniques from MITRE ATT&CK where they help.

| ID | Element or flow | STRIDE category | Threat | Likelihood | Impact |
| --- | --- | --- | --- | --- | --- |
| T-1 | The element | One letter of STRIDE | What could happen | Low, medium, or high | Low, medium, or high |

## What are we going to do about it?

| Threat | Decision | Mitigation or reason | Owner | Due |
| --- | --- | --- | --- | --- |
| T-1 | Mitigate, eliminate, transfer, or accept | The control, or the reason for accepting | Who | When |

## Did we do a good enough job?

- [ ] Every element that crosses a trust boundary was examined.
- [ ] The administration path and the supply chain are on the diagram.
- [ ] Every threat has a decision and an owner.
- [ ] Every mitigation can be tested.
- [ ] Accepted risks were accepted by someone with the authority to do so.
- [ ] The model has a date for its next review.
