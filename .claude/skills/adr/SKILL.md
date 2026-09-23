---
name: adr
description: Write an Architecture Decision Record in docs/adr. Use when a significant technical decision is made or proposed.
argument-hint: <decision title>
---

Write an ADR for: $ARGUMENTS

1. List `docs/adr/` and pick the next 4-digit number.
2. Copy the structure of `docs/adr/0000-template.md` into `docs/adr/NNNN-kebab-case-title.md`.
3. Fill Context, Decision, Consequences (positive AND negative) and Alternatives considered,
   based on the conversation and the code. Status: "Proposed" unless the user says accepted.
4. Add the ADR to the list in `docs/adr/README.md`.
5. If it changes architecture, update the matching file in `docs/architecture/`.
