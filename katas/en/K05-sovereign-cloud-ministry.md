[العربية](../ar/K05-sovereign-cloud-ministry.md)

# A ministry moves to a sovereign cloud

A design exercise. Read the brief, do the task on paper or in a document, and only then read the worked answer.

## The brief

A ministry in the Gulf is moving its citizen services portal from its own data centre to a local region of a cloud provider licensed by the national regulator. Citizens sign in to apply for permits and follow their cases, the case management system is a SaaS product, and an integrator builds and supports the portal. Some records, such as civil ID numbers and case files, sit at the highest levels of the national data classification policy, while the ministry's directory stays on premises and will be connected to the cloud.

## Constraints

- Data at the highest classification levels must stay in the country, and the ministry must be able to show who can read it.
- The integrator's staff support the portal and the cloud environment remotely.
- The ministry's security team is small and new to the cloud.
- Citizens expect the portal to stay available, and incidents must be reported to the national authority.

## Your task

1. Draw the zones from the citizen's browser to the case files, including the provider and the integrator.
2. Decide where the encryption keys live, and who can use them.
3. Choose the patterns the design needs, and the control level for each one.
4. List the five threats you would model first.

## Try it in the advisor

Open the [design advisor with this scenario already filled in](https://bunyan.3li.info/?lang=en#design?s=digital&h=hybrid&x=public.vendors&d=regulated&o=national.privacy&a=high&m=outsourced&b=inhouse.saas&l=foundation), then compare its plan with your own drawing.

## A worked answer

### Zones

From the outside in: the edge, where citizens reach the portal through the WAF; the portal zone in the local cloud region; the SaaS case management tenant, connected to the portal through the API gateway; the key management zone, with keys held by the ministry; the link back to the ministry's data centre, where the directory stays; and the access paths of the provider and the integrator, which pass through a broker and are recorded. Administration reaches each zone only through the management zone and the privileged access gateway.

### Patterns

- Residency and keys, [P30](../../patterns/en/P30-sovereign-cloud.md) and [P08](../../patterns/en/P08-secrets-keys-workload-identity.md), because the ministry must keep regulated data in approved regions, hold its own keys, and approve every access by the provider's staff.
- The cloud and the SaaS tenant, [P06](../../patterns/en/P06-cloud-landing-zone.md) and [P25](../../patterns/en/P25-saas-guardrails.md), with guardrails that deny other regions, and a baseline for the case management tenant.
- Citizens and the directory, [P17](../../patterns/en/P17-customer-identity.md), [P02](../../patterns/en/P02-identity-control-plane.md), and [P31](../../patterns/en/P31-identity-threat-detection.md), because citizens need strong sign-in and safe recovery, and the directory on premises now reaches into the cloud.
- The integrator, [P01](../../patterns/en/P01-zero-trust-access.md) and [P03](../../patterns/en/P03-tiered-privileged-access.md), with brokered, recorded sessions and no standing access to production.
- Operations and delivery, [P24](../../patterns/en/P24-forensic-readiness.md), [P21](../../patterns/en/P21-exposure-management.md), and [P28](../../patterns/en/P28-secure-development.md), because incidents must be reported to the national authority with evidence, the portal is exposed, and the integrator's code must be checked before it ships.

### Key decisions

- Which data classes may live in the cloud at all, and which features are off limits because they copy data elsewhere.
- Where the keys live, and what happens to the portal if the key service is unavailable.
- How the integrator reaches the environment, and how that access ends when the contract ends.

### Threats to model first

- Takeover of citizen accounts through phishing and weak recovery.
- Access to regulated data by the staff of the provider or the integrator without approval.
- Exploitation of the exposed portal or its APIs.
- Takeover of the directory, which now controls access in the cloud as well.
- Ransomware that spreads from the ministry's network through the connection to the cloud.

### What people often miss

Teams check where the main database lives, but forget the backups, the logs, and the copies that support tickets and analytics features create. The integrator often keeps the broad access it had while building the portal, long after it goes live. And the directory on premises becomes the key to the cloud as well, so a compromise there reaches the case files without touching the cloud at all.

## Discussion questions

- What would the ministry need in order to leave this provider within six months?
- How would the design change if the case management system moved to the ministry's own data centre instead?
- Which evidence would you give the national authority to show that the keys are under the ministry's control?
