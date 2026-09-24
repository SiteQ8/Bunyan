[العربية](../ar/K06-payment-hub.md)

# A bank's payment hub

A design exercise. Read the brief, do the task on paper or in a document, and only then read the worked answer.

## The brief

A bank is building a payment hub that receives payment instructions from its channels and its corporate customers, exchanges payment files with other banks and payment processors, and sends SWIFT messages. The hub runs on containers in the bank's data centre and in a cloud region, and hands card payments to a separate card environment. Corporate customers upload payment files through a portal and an SFTP service, and the central bank's switch is one of the partners.

## Constraints

- A payment that is changed in transit or sent twice is a direct loss that the bank must explain to the regulator.
- The hub must process payments around the clock, with no more than minutes of downtime.
- SWIFT messages and card data must stay inside their own environments.
- The bank has a mature security team that can run detection engineering and red teaming.

## Your task

1. Draw the path of a payment file, from a corporate customer's upload to a SWIFT message.
2. Decide where payment instructions are signed, and where the signatures are checked.
3. Choose the patterns the design needs, and the control level for each one.
4. List the five threats you would model first.

## Try it in the advisor

Open the [design advisor with this scenario already filled in](https://bunyan.3li.info/?lang=en#design?s=api&h=hybrid&x=partners&d=regulated&o=pci.swift.bank.national&a=critical&m=large&b=inhouse.containers&l=advanced), then compare its plan with your own drawing.

## A worked answer

### Zones

From the outside in: the partner edge, where corporate customers, other banks, and processors connect through the API gateway and the managed file exchange; the quarantine zone, where every file is scanned and checked before release; the hub zone, where the payment services run on containers in both sites; the SWIFT and card enclaves, which accept only named services; and the core banking zone. Administration reaches each zone only through the management zone and the privileged access gateway.

### Patterns

- The exchange and the edge, [P26](../../patterns/en/P26-partner-data-exchange.md) and [P07](../../patterns/en/P07-api-security.md), because every file and instruction enters through one managed exchange that authenticates each partner and quarantines what arrives.
- Payment integrity, [P32](../../patterns/en/P32-transaction-signing.md) and [P23](../../patterns/en/P23-crypto-agility.md), so that payment instructions are signed on their details and verified before release, with cryptography the bank can change when it must.
- The enclaves, [P15](../../patterns/en/P15-regulated-enclave.md) and [P04](../../patterns/en/P04-segmentation.md), because SWIFT messages and card data stay inside their own zones, reached only by named services.
- Availability and recovery, [P22](../../patterns/en/P22-resilient-availability.md) and [P12](../../patterns/en/P12-resilient-recovery.md), because the hub runs active in two sites, and a destroyed or encrypted site must not stop payments.
- Build and identity, [P28](../../patterns/en/P28-secure-development.md), [P16](../../patterns/en/P16-container-platform-guardrails.md), and [P31](../../patterns/en/P31-identity-threat-detection.md), because the hub is built in house on containers, and the directory that controls its administrators is a prime target.

### Key decisions

- Which payment files and instructions must be signed, by whom, and where the signatures are checked.
- How the hub fails over between sites without sending a payment twice.
- Which partners use APIs and which use files, and how each one is brought on board and removed.

### Threats to model first

- A payment file changed between the corporate customer and the hub, or inside the hub.
- Fraudulent SWIFT messages sent with stolen operator credentials.
- A compromised partner sending malicious or fraudulent files.
- Takeover of the directory, followed by ransomware across both sites.
- Exploitation of the exposed file service or the APIs.

### What people often miss

Designs protect the SWIFT enclave carefully, but the file that becomes a SWIFT message passes through several systems before it gets there, and each of them can change it. Failover is tested for speed but not for duplicates, so a payment can be sent twice when a site comes back. And the SFTP service for corporate customers often keeps shared accounts and old keys long after the bank moved everything else to strong authentication.

## Discussion questions

- What would you log to prove, months later, that a payment was sent exactly as the customer approved it?
- How would the design change if the hub also offered instant payments?
- Which exercise would best test that the hub keeps running when one site is lost during an attack?
