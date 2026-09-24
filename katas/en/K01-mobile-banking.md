[العربية](../ar/K01-mobile-banking.md)

# Mobile banking platform

A design exercise. Read the brief, do the task on paper or in a document, and only then read the worked answer.

## The brief

A retail bank in the Gulf is launching a new mobile banking app. Customers will check balances, transfer money, and pay bills. The app talks to a set of APIs, which call the core banking system in the bank's data centre. Two fintech partners will use the same APIs to start payments on behalf of customers. The APIs run on containers in a public cloud, and the core banking system stays on premises. The central bank supervises the bank, the bank holds card data, and the national cybersecurity controls apply.

## Constraints

- The app must be available around the clock, and a long outage must be reported to the regulator.
- Card numbers must never leave the payment environment.
- The operations team is large, and an outsourced vendor provides part of the support.
- The security team is established, but it has limited engineering capacity.

## Your task

1. Draw the zones and the trust boundaries, from the phone to the core banking system.
2. Choose the patterns the design needs, and the control level for each one.
3. Write the three decisions you would record first.
4. List the five threats you would model first.

## Try it in the advisor

Open the [design advisor with this scenario already filled in](https://siteq8.github.io/Bunyan/?lang=en#design?s=digital&h=hybrid&x=public.partners&d=regulated&o=pci.bank.national&a=critical&m=outsourced&b=inhouse.containers&l=enhanced), then compare its plan with your own drawing.

## A worked answer

### Zones

From the outside in: the internet edge with the CDN, the WAF, and the API gateway; the application zone in the cloud, where the API services run on containers; the integration link that connects the cloud to the data centre; the core banking zone on premises; and a separate enclave for card data. Administration reaches each zone only through the management zone and the privileged access gateway.

### Patterns

- The edge and the APIs, [P05](../../patterns/en/P05-internet-edge-and-egress.md) and [P07](../../patterns/en/P07-api-security.md), because every customer and partner request arrives there, and object level authorization decides whose account a request can touch.
- Identity and administration, [P02](../../patterns/en/P02-identity-control-plane.md), [P03](../../patterns/en/P03-tiered-privileged-access.md), and [P01](../../patterns/en/P01-zero-trust-access.md), with phishing-resistant MFA for staff and brokered, recorded sessions for the vendor.
- The platform, [P06](../../patterns/en/P06-cloud-landing-zone.md), [P16](../../patterns/en/P16-container-platform-guardrails.md), [P08](../../patterns/en/P08-secrets-keys-workload-identity.md), and [P11](../../patterns/en/P11-software-supply-chain.md), because the APIs are built in house and run on containers in the cloud.
- Data and the enclave, [P09](../../patterns/en/P09-data-centric-protection.md) and [P15](../../patterns/en/P15-regulated-enclave.md), so that card numbers stay inside the enclave and the rest of the system handles tokens.
- Operations, [P04](../../patterns/en/P04-segmentation.md), [P10](../../patterns/en/P10-detection-telemetry.md), and [P12](../../patterns/en/P12-resilient-recovery.md), because an outage must be reported and ransomware is the most likely way to cause one.

### Key decisions

- Where card data is tokenized, and which systems may ever see a real card number.
- How partners authenticate, with mutual TLS and certificate-bound tokens, and how they are onboarded and offboarded.
- How the cloud connects to the data centre, and which flows may cross that link.

### Threats to model first

- Takeover of customer accounts, through phishing and through SIM swaps that intercept one-time codes.
- Reading or changing another customer's accounts through the APIs.
- Abuse of partner access to start fraudulent payments.
- Theft of administrator credentials, especially those the vendor uses.
- Ransomware that reaches the core banking system from the corporate network.

### What people often miss

The partner APIs usually get less attention than the app, yet they move the same money with fewer people watching them. The integration link between the cloud and the data centre is often a flat, trusted path straight into core banking. And the vendor's access tends to be permanent and broad, when it should be brokered, limited in time, and recorded.

## Discussion questions

- What changes if the regulator requires customer data to stay in the country?
- Which controls would you add first if the bank moved the core banking system to the cloud?
- How would you prove to an auditor that card numbers never leave the enclave?
