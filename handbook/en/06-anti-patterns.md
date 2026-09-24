[العربية](../ar/06-anti-patterns.md)

# Anti-patterns

Anti-patterns are designs that look reasonable, are common, and fail in predictable ways. Each one below describes the design, why it fails, and what to do instead.

## A hard shell with a soft centre

A strong perimeter protects a flat internal network where everything can reach everything. It fails because attackers get inside through phishing, a vendor, or a stolen VPN account, and then nothing stops them from moving to the systems that matter.

Instead, divide the network into zones with default deny between them, and grant access per application rather than per network, as in [P04](../../patterns/en/P04-segmentation.md) and [P01](../../patterns/en/P01-zero-trust-access.md).

## Security by product

The design is a list of products bought one problem at a time: a firewall, a SIEM, an endpoint agent, a data loss prevention tool. It fails because products without a design leave gaps between them, overlap in places, and run with their default settings.

Instead, start from threats and requirements, choose patterns, and only then choose the products that implement them, as [the design method](05-design-method.md) describes.

## One admin account for everything

The same privileged accounts administer servers, workstations, the directory, and the cloud, often from ordinary laptops. It fails because one stolen credential anywhere gives an attacker everything.

Instead, separate administration into tiers, use dedicated workstations and just-in-time access, and protect the control plane first, as in [P03](../../patterns/en/P03-tiered-privileged-access.md).

## Backups inside the blast radius

Backups share the domain, the credentials, and the network with production. It fails because ransomware operators delete or encrypt the backups before they encrypt everything else.

Instead, give backups their own trust domain, keep an immutable copy, and test full restores, as in [P12](../../patterns/en/P12-resilient-recovery.md).

## Secrets in the code

Passwords, keys, and tokens live in repositories, configuration files, and pipeline variables. It fails because they are copied everywhere, rarely rotated, and eventually leaked.

Instead, use workload identity and a secrets manager, and scan every change for secrets, as in [P08](../../patterns/en/P08-secrets-keys-workload-identity.md) and [P11](../../patterns/en/P11-software-supply-chain.md).

## Trusting the client

Security decisions are made in the mobile app or the browser: hidden buttons, checks that run on the client, and identifiers that the server trusts. It fails because attackers control the client and call the API directly.

Instead, authorize every request on the server, for every object and every function, as in [P07](../../patterns/en/P07-api-security.md).

## Logging everything, detecting nothing

Large volumes of logs flow into a SIEM that runs only its default rules, and alerts reach nobody at night. It fails because nobody decided which attacks must be detected, so none of them is detected reliably.

Instead, start from detection questions, write and test detections, and give each one a playbook and an owner, as in [P10](../../patterns/en/P10-detection-telemetry.md).

## Compliance as the architecture

The design is a checklist that satisfies the auditor. It fails because controls chosen to pass an audit are not arranged to stop an attack, and the gaps between checklist items are where attacks happen.

Instead, design from the threats, then map the design to the obligations, as the [framework map](03-frameworks-map.md) suggests.

## The permanent exception

A temporary firewall rule, a service account with extra rights, or an unpatched system is approved for a month and still exists years later. It fails because exceptions accumulate until they are the real design.

Instead, give every exception an owner, a reason, and an expiry date in a decision record, and review expired exceptions every month.

## An agent with the keys to everything

An assistant built on a language model is connected to a service account that can read every document and call powerful tools. It fails because anyone who can put text in front of the model can steer it.

Instead, retrieve with the user's own permissions, expose only narrow tools, and ask a person to approve actions with consequences, as in [P14](../../patterns/en/P14-llm-application-guardrails.md).

## Vendor access that never closes

Vendors connect through permanent VPN accounts or remote access tools that are always on. It fails because a compromised vendor becomes a compromise of your own systems, at any hour.

Instead, broker every vendor session, approve it, record it, and switch access off when the session ends, as in [P01](../../patterns/en/P01-zero-trust-access.md) and [P13](../../patterns/en/P13-ot-zones-and-conduits.md).

## Segmentation on paper

The diagram shows separate zones, but nobody has tested whether traffic between them is really blocked. It fails because a forgotten rule or a flat management network quietly joins what the diagram separates.

Instead, test segmentation regularly from each zone, and compare the rules with the documented flows, as in [P04](../../patterns/en/P04-segmentation.md) and [P15](../../patterns/en/P15-regulated-enclave.md).
