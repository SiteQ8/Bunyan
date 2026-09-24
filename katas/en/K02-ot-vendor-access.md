[العربية](../ar/K02-ot-vendor-access.md)

# Vendor access to a water utility

A design exercise. Read the brief, do the task on paper or in a document, and only then read the worked answer.

## The brief

A water utility runs treatment plants and pumping stations that a SCADA system controls. Two vendors maintain the controllers and the SCADA software, and today they connect through remote access tools installed on engineering workstations. The utility's IT network and the plant network are connected, and engineers use the same laptops for email and for configuring controllers. The national cybersecurity controls apply, and a disruption would affect the public water supply.

## Constraints

- Nothing may interrupt the treatment process, and every change needs approval from operations.
- Many controllers cannot be patched, and some run software that is no longer supported.
- During a breakdown, vendors need access within hours.
- The security team is small, and it has no specialists in operational technology yet.

## Your task

1. Draw the zones and conduits, from the internet to the controllers.
2. Design vendor access that works at night without staying open all the time.
3. Write the three decisions you would record first.
4. List the threats you would model first.

## Try it in the advisor

Open the [design advisor with this scenario already filled in](https://bunyan.3li.info/?lang=en#design?s=ot&h=onprem&x=vendors&d=internal&o=national&a=critical&m=outsourced&b=&l=foundation), then compare its plan with your own drawing.

## A worked answer

### Zones

Follow the Purdue levels: enterprise IT; an industrial DMZ that holds the historian replica, the patch staging server, and the jump host; site operations with the SCADA servers; the control level with the controllers and operator screens; and the safety systems, kept apart from everything else. Every connection between IT and the plant ends in the DMZ.

### Patterns

- [P13](../../patterns/en/P13-ot-zones-and-conduits.md) zones and conduits as the backbone of the design.
- [P01](../../patterns/en/P01-zero-trust-access.md) and [P03](../../patterns/en/P03-tiered-privileged-access.md) for vendor access: a brokered, recorded session through the DMZ jump host, approved for each job and switched off afterwards.
- [P04](../../patterns/en/P04-segmentation.md) segmentation inside the plant, so that one compromised workstation cannot reach every controller.
- [P10](../../patterns/en/P10-detection-telemetry.md) passive monitoring that understands industrial protocols, with alerts that reach someone who can act.
- [P12](../../patterns/en/P12-resilient-recovery.md) recovery, including controller configurations and the ability to run the process by hand.

### Key decisions

- Which data must leave the plant, and whether it can leave through a unidirectional gateway.
- How a vendor session is requested, approved, recorded, and closed, including at night.
- Which engineering workstations are dedicated to the plant, and how files reach them.

### Threats to model first

- Remote access into control systems through a vendor tool or a stolen vendor account.
- Ransomware spreading from the IT network into the plant.
- Malicious or careless changes to controller logic.
- Loss of visibility, because nobody monitors the plant network.

### What people often miss

The laptop used for both email and controllers is the most dangerous device in the utility, because it bridges the two worlds. Vendor remote access tools are often installed by the vendor and then forgotten by the utility. And recovery plans tend to assume that systems work, when the real test is running the plant by hand while the systems are rebuilt.

## Discussion questions

- How would you give a vendor access at night, within an hour, without leaving access open all the time?
- What would you monitor first, if you could afford only one sensor?
- Which parts of this design also apply to a building management system?
