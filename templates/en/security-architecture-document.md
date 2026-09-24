[العربية](../ar/security-architecture-document.md)

# Security architecture document

> Copy this file into your project, replace the guidance in each section with your own content, and keep the document next to the design it describes. Remove each line of guidance once the section is complete.

## Document control

| Field | Value |
| --- | --- |
| System | The name of the system |
| Version | The version of this document |
| Date | The date of this version |
| Author | Who wrote it |
| Reviewers | Who reviewed it |
| Status | Draft, in review, or approved |

## Purpose and scope

State what this document covers and what it does not. Name the systems, interfaces, and environments in scope.

## Business context

Describe what the system does for the business, who uses it and from where, and what happens if it is unavailable, altered, or disclosed. Name the business owner.

## Obligations

List the laws, regulations, standards, and contracts that apply, with the specific controls where you know them.

| Obligation | Specific requirements | How this design meets them |
| --- | --- | --- |
| The name of the regulation | The control identifiers | The section of this document |

## Assets and data

| Data or asset | Classification | Owner | Where it is stored |
| --- | --- | --- | --- |
| The name of the data set | Public, internal, confidential, or restricted | Who owns it | The systems that hold it |

## Security requirements

| ID | Requirement | Source | Priority |
| --- | --- | --- | --- |
| SR-1 | What must be true, not which product to buy | Risk, regulation, or the business | Must, should, or could |

## Architecture views

### Context view

Draw the system as one box, the people and systems around it, and the trust boundaries between them.

### Data view

Show where each class of data is created, stored, processed, and sent.

### Identity view

Show who and what authenticates, where, how, and with which privileges, including administrators and service accounts.

### Deployment view

Show the networks, zones, and platforms, and where each component runs.

### Operational view

Show how the system is administered, monitored, backed up, and recovered.

## Threat model summary

Summarise the most important threats and the decisions taken on them, and link to the full threat model.

## Patterns and controls

| Pattern | Level | Key controls | Owner |
| --- | --- | --- | --- |
| P01 Zero trust access | Foundation | The controls you adopt | Who owns them |

## Decisions

List the architecture decision records for this system, with the status of each.

## Verification plan

| Control | How it is tested | How often | Evidence |
| --- | --- | --- | --- |
| The control | The test | The frequency | Where the evidence is kept |

## Residual risk and acceptance

| Risk | Why it remains | Accepted by | Review date |
| --- | --- | --- | --- |
| The risk | The reason | Name and role | The date |

## Operations and review

State who owns the design in operation, where the runbooks are kept, and what triggers a review, such as a major change, a new integration, a new obligation, or an incident.
