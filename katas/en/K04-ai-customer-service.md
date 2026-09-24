[العربية](../ar/K04-ai-customer-service.md)

# An AI agent for customer service

A design exercise. Read the brief, do the task on paper or in a document, and only then read the worked answer.

## The brief

A telecom operator in the Gulf wants an AI agent to answer customers in its app, on its website, and on a messaging channel. The agent reads the customer's plan and bills, changes plans, raises complaints, and can start a SIM replacement. It calls a large language model from a cloud provider, and reaches the billing and customer systems in the operator's data centre through a set of tools. The customer records include national ID numbers and call history, the national cybersecurity controls apply, and the data protection law covers every customer.

## Constraints

- A SIM replacement in the wrong hands gives an attacker the customer's one-time codes for every bank and service.
- The agent must never reveal one customer's data to another, whatever the conversation says.
- The team that runs the agent is small, and the model and the messaging channel are services from outside vendors.
- Customer data classified as sensitive must stay in the country.

## Your task

1. Draw the path of a request, from the customer's message to the tools and back.
2. Decide which actions the agent may take alone, which need the customer's confirmation, and which need a person.
3. Choose the patterns the design needs, and the control level for each one.
4. List the five threats you would model first.

## Try it in the advisor

Open the [design advisor with this scenario already filled in](https://bunyan.3li.info/?lang=en#design?s=ai&h=hybrid&x=public.vendors&d=regulated&o=national.privacy&a=high&m=small&b=inhouse.saas&l=enhanced), then compare its plan with your own drawing.

## A worked answer

### Zones

From the outside in: the channels, where customers sign in to the app or the website before the agent knows who they are; the agent zone, where the orchestration code, the guardrails, and the calls to the model run; the tool gateway, which is the only way to reach the billing and customer systems; the data zone on premises; and the model provider outside, which receives prompts but never credentials. Administration reaches each zone only through the management zone and the privileged access gateway.

### Patterns

- The agent and its tools, [P29](../../patterns/en/P29-ai-agents.md) and [P14](../../patterns/en/P14-llm-application-guardrails.md), because every tool call must carry the authority of the customer who signed in, and a SIM replacement or a plan change must never follow from text alone.
- The customer's identity, [P17](../../patterns/en/P17-customer-identity.md) and [P02](../../patterns/en/P02-identity-control-plane.md), because the agent may act only for a customer who signed in strongly, and a SIM replacement needs a step-up that an attacker cannot pass.
- Data and residency, [P09](../../patterns/en/P09-data-centric-protection.md) and [P30](../../patterns/en/P30-sovereign-cloud.md), so that national ID numbers and call history stay in the country, and prompts sent to the model carry only what the task needs.
- The vendors, [P25](../../patterns/en/P25-saas-guardrails.md) and [P01](../../patterns/en/P01-zero-trust-access.md), because the model and the messaging channel are outside services whose settings and access the operator must still control.
- Operations, [P10](../../patterns/en/P10-detection-telemetry.md), [P24](../../patterns/en/P24-forensic-readiness.md), and [P21](../../patterns/en/P21-exposure-management.md), because each conversation and tool call must be traceable, and the channels are exposed to the internet.

### Key decisions

- Which actions the agent may take alone, such as reading a bill, and which need a person, such as a SIM replacement.
- What the agent sends to the model, and how customer data is masked or kept out of prompts.
- How long conversations and tool calls are kept, and who may read them.

### Threats to model first

- A customer or an attacker writing instructions that make the agent act on another customer's account.
- A SIM swap started through the agent, which then opens the victim's bank accounts.
- The agent revealing personal data that belongs to another customer.
- Instructions hidden in a complaint, an attachment, or a web page that the agent reads.
- Theft of the credentials that the agent's tools use to reach the billing system.

### What people often miss

Teams test the agent against rude or strange questions, but rarely against a polite request to act on another account. The tools are often connected with one broad service account that can reach every customer, when each call should carry the authority of the customer who signed in. And the messaging channel is treated as a simple pipe, although it is a vendor service with its own administrators, logs, and data location.

## Discussion questions

- What would you log for each conversation, and how would you protect those logs?
- How would the design change if the agent also served the operator's staff?
- How would you show the regulator that sensitive data never leaves the country?
