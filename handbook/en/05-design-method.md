[العربية](../ar/05-design-method.md)

# The design method

The method below turns the core loop from chapter one into six steps. Each step has a question to answer and an output to keep, and together the outputs make up the security architecture document in the templates.

## Step one: frame the context

Understand what the system is for before deciding how to protect it. Talk to the business owner, not only to the engineers.

- What does the system do for the business, and what happens if it stops?
- Who uses it, from where, and on which devices?
- What data does it hold, and who owns that data?
- Which laws, regulations, and contracts apply to it?

The output is the context section of the architecture document, with a context diagram.

## Step two: classify and set requirements

Turn the context into requirements. Classify the data, set the availability objectives, and list the obligations that apply. Each requirement should say what must be true, not which product to buy.

- Classify the most sensitive data that the system handles.
- Agree the recovery time and recovery point objectives with the business.
- List the regulatory controls that apply, with their identifiers.

The output is a numbered list of security requirements, each with its source.

## Step three: model the threats

Use chapter four to find what can go wrong. Start from the threats that the design advisor suggests, then add what is specific to the system.

- Draw the data flows and the trust boundaries.
- Walk through every boundary with STRIDE.
- Record a decision for every threat.

The output is a threat model with decisions and owners.

## Step four: choose patterns and controls

Match the requirements and threats to patterns. The [design advisor](https://bunyan.3li.info/?lang=en) gives a quick first pass. Then choose the control level each pattern needs: the foundation level everywhere first, then enhanced and advanced where the risk justifies them.

- Map each requirement and each threat to at least one control.
- Record every significant choice in an architecture decision record.
- Name an owner for every control.

The output is the design, drawn in the views from chapter one, with its decision records.

## Step five: verify

A control that has not been tested is an assumption. Decide how each important control will be verified before it is built, so that verification is part of the design rather than something added later. The patterns list verification steps that you can reuse.

- Write the test for each essential control: who runs it, how, and how often.
- Review the design with someone who was not involved in it, using the [review checklist](../../templates/en/design-review-checklist.md).
- Keep the evidence where an auditor can find it.

The output is a verification plan and the results of the first review.

## Step six: hand over and keep it true

Security architecture does not end at go-live. Hand the design to the people who will run it, and agree with them what will trigger a review.

- Record the residual risk, and have it accepted by someone with the authority to accept it.
- Agree the review triggers, such as a major change, a new integration, a new obligation, or an incident.
- Keep the architecture document where the operations team works, and keep it current.

The output is an accepted design with an owner and a review date.

## Decision records

An architecture decision record captures one decision on one page: the context, the options considered, the decision, and its consequences. Records are cheap to write and very valuable a year later, when someone asks why the design is the way it is. Give each record a status, such as proposed, accepted, or superseded, and never delete old records: supersede them with new ones. The [template](../../templates/en/architecture-decision-record.md) shows the format.

## Working with delivery teams

- Join early, while a design review can still change the design.
- Prefer guardrails that make the secure path automatic over gates that stop delivery.
- Offer paved roads, such as a standard pipeline or landing zone, that meet the requirements by default.
- Review at each milestone, not only at the end.

## When the design is done

A design is done for now when every requirement maps to a control with an owner, every threat has a decision, every essential control has a test, and the residual risk has been accepted. It is never done for good, because the next change starts the loop again.
