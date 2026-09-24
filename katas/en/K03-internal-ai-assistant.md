[العربية](../ar/K03-internal-ai-assistant.md)

# An internal AI assistant

A design exercise. Read the brief, do the task on paper or in a document, and only then read the worked answer.

## The brief

A company wants an assistant that answers employees' questions from internal documents, such as policies, procedures, and project files, and that can raise IT and HR tickets on their behalf. The assistant will use a language model from a cloud provider, retrieve documents from the company's document stores, and call the API of the ticketing system. Some documents are confidential, and a personal data protection law applies.

## Constraints

- Employees must never see documents that they could not open themselves.
- Tickets must be raised in the employee's name, not by a generic service account.
- Prompts and outputs may contain personal data.
- The first version must ship within three months.

## Your task

1. Draw the zones and the trust boundaries, from the employee to the model and the document stores.
2. Decide which actions the assistant may take on its own, and which ones need the employee to confirm.
3. Write the three decisions you would record first.
4. List the threats you would model first.

## Try it in the advisor

Open the [design advisor with this scenario already filled in](https://bunyan.3li.info/?lang=en#design?s=ai&h=cloud&x=remote&d=confidential&o=privacy&a=standard&m=small&b=inhouse&l=foundation), then compare its plan with your own drawing.

## A worked answer

### Zones

The edge, with sign-in and rate limits; the assistant zone, with the orchestrator, the guardrails, and the connection to the model; the tools and retrieval zone, which calls the document stores and the ticketing API with the user's identity; and the data sources themselves, which keep their existing permissions.

### Patterns

- [P14](../../patterns/en/P14-llm-application-guardrails.md) guardrails for the assistant at the centre: retrieval with the user's permissions, narrow tools, output checks, and human approval for actions.
- [P02](../../patterns/en/P02-identity-control-plane.md) identity, so that every request carries the employee's identity from sign-in to the ticketing API.
- [P09](../../patterns/en/P09-data-centric-protection.md) data protection, so that confidential documents are classified and personal data is handled as the law requires.
- [P01](../../patterns/en/P01-zero-trust-access.md) zero trust access for employees who use the assistant remotely.
- [P06](../../patterns/en/P06-cloud-landing-zone.md) and [P08](../../patterns/en/P08-secrets-keys-workload-identity.md) for the cloud platform, and for the keys and secrets it needs.

### Key decisions

- Which model provider and region to use, and which data may be sent to the model.
- Which actions the assistant may take, and which ones need the employee to confirm.
- How long prompts and outputs are kept, and who may read them.

### Threats to model first

- Prompt injection hidden in a document, which tries to make the assistant raise tickets or reveal data.
- Retrieval that returns confidential documents to the wrong employee.
- Leakage of personal data through prompts, logs, or model output.
- Runaway usage and cost, through loops or abuse.

### What people often miss

The retrieval index is often built with a service account that can read everything, which quietly removes every document permission the company has. The logs of prompts become a new store of sensitive data that needs its own protection. And actions that look harmless, such as raising a ticket, can still be abused to reach people or systems beyond the assistant.

## Discussion questions

- What would change if the assistant could also approve requests, such as leave or purchases?
- How would you test the assistant against prompt injection before each release?
- What would you tell employees about what the assistant records?
