[العربية](../ar/design-review-checklist.md)

# Design review checklist

> Use these questions in a design review. Write each finding as a question that the team can answer, and record the answers in the architecture document.

## Context and scope

- [ ] The business owner, the data, and the obligations are named.
- [ ] Trust boundaries are drawn, including administration and third parties.
- [ ] The availability objectives were agreed with the business.

## Identity and access

- [ ] Every user and every workload authenticates through the identity provider.
- [ ] Phishing-resistant MFA protects administrators and remote access.
- [ ] Privileged access is brokered, granted just in time, and recorded.
- [ ] Every request is authorized on the server, for every object.

## Data

- [ ] The data is classified, and its handling follows the classification.
- [ ] Data is encrypted in transit and at rest, with keys held in a key management service.
- [ ] Production data does not reach test or analytics without masking.

## Network and exposure

- [ ] Every entry point from the internet sits behind the edge.
- [ ] Zones deny by default, and every allowed flow is documented.
- [ ] Outbound traffic is limited to an allow list.

## Platform and supply chain

- [ ] Secrets are kept out of code, images, and pipelines.
- [ ] Builds are signed, and deployment admits only signed artifacts.
- [ ] Cloud and container guardrails prevent the most dangerous misconfigurations.

## Detection and response

- [ ] The logs needed to detect the modeled threats are collected and protected.
- [ ] Each important detection has a playbook and an owner.
- [ ] A failure of logging raises an alert.

## Resilience

- [ ] An immutable or offline copy exists outside the production trust domain.
- [ ] A full restore was tested against the recovery objectives.

## Decisions and residual risk

- [ ] Significant decisions have architecture decision records.
- [ ] Every exception has an owner and an expiry date.
- [ ] Residual risk was accepted by someone with the authority to accept it.
