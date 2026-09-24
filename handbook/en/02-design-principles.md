[العربية](../ar/02-design-principles.md)

# Design principles

Principles are what good designs have in common. The first eight come from Saltzer and Schroeder, who described them in 1975, and they still hold. The others come from the decades of incidents since. None of them is a rule to apply blindly: each one is a question to ask of your design.

## The principles

### 1. Least privilege

Give every identity, person or workload, only the access it needs, for only as long as it needs it. Standing administrator rights are the most common way a small compromise becomes a large one. In practice this means role-based access, just-in-time elevation, and regular reviews, as in [P03](../../patterns/en/P03-tiered-privileged-access.md).

### 2. Fail-safe defaults

Deny unless something explicitly allows. When a rule is missing, a service is unreachable, or a check fails with an error, the answer should be no. Firewalls, authorization code, and cloud policies should all start from deny, as in [P04](../../patterns/en/P04-segmentation.md).

### 3. Complete mediation

Check every access, every time, at a point the caller cannot bypass. Caching a decision for too long, or checking only at the front door, lets requests slip past. Object level authorization in APIs is complete mediation applied to data, as in [P07](../../patterns/en/P07-api-security.md).

### 4. Economy of mechanism

Keep security mechanisms small and simple enough to review and test. Complexity hides flaws and makes controls fragile. One identity provider that everyone understands beats three that are partly integrated, as in [P02](../../patterns/en/P02-identity-control-plane.md).

### 5. Open design

Security should not depend on keeping the design secret. Assume that attackers know how the system works, and protect only the keys and credentials. Standard protocols and algorithms that others have reviewed are safer than custom ones.

### 6. Separation of privilege

Require more than one condition, or more than one person, for the most sensitive actions. Two-person approval for destructive key operations, or MFA in addition to a password, means that one failure is not enough, as in [P08](../../patterns/en/P08-secrets-keys-workload-identity.md).

### 7. Least common mechanism

Avoid sharing mechanisms between parts of the system that trust each other differently. A shared admin account, a shared service account, or a shared management network connects trust levels that should stay apart, as in [P03](../../patterns/en/P03-tiered-privileged-access.md).

### 8. Psychological acceptability

Make the secure way the easy way. Controls that slow people down get bypassed, so design them around how people work. Passkeys are both safer and faster than passwords with one-time codes, as in [P02](../../patterns/en/P02-identity-control-plane.md).

### 9. Defense in depth

Layer independent controls so that the failure of one does not expose the asset. The layers must fail independently, because two controls that share the same credential or the same misconfiguration count as one.

### 10. Assume breach

Design as if an attacker is already inside. Limit what one foothold can reach, protect the logs the attacker would want to erase, and keep a way to recover that they cannot destroy, as in [P12](../../patterns/en/P12-resilient-recovery.md).

### 11. Explicit trust boundaries

Know where trust changes, and draw it. Every point where data or control crosses from one trust level to another needs authentication, authorization, validation, and logging. Boundaries that nobody drew are boundaries that nobody checks.

### 12. Minimise the attack surface

Remove what you do not need: services, ports, accounts, features, and data. Every exposed interface is something to defend, patch, and monitor. The safest interface is the one that does not exist, as in [P05](../../patterns/en/P05-internet-edge-and-egress.md).

### 13. Secure by default

Ship systems in their secure configuration, so that security does not depend on someone remembering to switch it on. Defaults are what most systems run with for their whole life, as in [P06](../../patterns/en/P06-cloud-landing-zone.md).

### 14. Protect the control plane first

Identity providers, key management, administration tools, pipelines, and backup systems control everything else. They need the strongest protection in the design, because compromising any one of them compromises everything it controls, as in [P03](../../patterns/en/P03-tiered-privileged-access.md) and [P11](../../patterns/en/P11-software-supply-chain.md).

### 15. Design for recovery

Every control fails eventually. Decide in advance how the system will be restored, in what order, and how quickly, then prove it with tests, as in [P12](../../patterns/en/P12-resilient-recovery.md).

### 16. Make it observable

You cannot defend what you cannot see. Design telemetry in from the start, protect it from the people it watches, and tie it to the detections you need, as in [P10](../../patterns/en/P10-detection-telemetry.md).

## Principles in tension

Principles pull against each other, and a design is a set of choices about which one wins where.

| Tension | How to decide |
| --- | --- |
| Defense in depth and economy of mechanism | Add layers that fail independently, and remove layers that share the same cause of failure. |
| Least privilege and speed of operations | Use just-in-time elevation instead of standing rights, so that urgent work stays fast. |
| Secure by default and user acceptance | Make the secure path the easiest one, and watch how often people ask for exceptions. |
| Open design and exposure | Publish how the design works, and never publish the secrets it depends on. |
| Assume breach and cost | Spend first on the paths that lead to your most valuable assets. |

## Using the principles in reviews

Use the principles as questions, not slogans. In a design review, ask of each important component:

- What is the least access it needs, and does it have more?
- What happens when it fails, and does it fail closed?
- Can a request reach it without passing a check?
- If an attacker controlled it, what else could they reach?

## Further reading

- [Saltzer and Schroeder, The Protection of Information in Computer Systems, 1975](https://www.cs.virginia.edu/~evans/cs551/saltzer/)
- [NIST SP 800-160 Vol 1 Rev 1, Engineering Trustworthy Secure Systems](https://csrc.nist.gov/pubs/sp/800/160/v1/r1/final)
- [CISA, Secure by Design](https://www.cisa.gov/securebydesign)
