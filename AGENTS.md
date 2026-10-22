# Project Rules

## Git Rules
- **NEVER add or commit `HANDOFF.md` or `handoff.md` to git.** This file is strictly for local documentation and handoffs. It is added to `.gitignore` and must never be staged or committed.
- Always ask the user before pushing changes to remote git branches.

## Product & Enhancement Assessment Rules
- **Critical Pragmatism:** Whenever the user asks for changes or enhancements, **do NOT be blindly optimistic**.
- **Real-World Implementation Assessment:** Rigorously evaluate the feature against real-world hardware trading realities (cluttered vendor price sheets, imperfect Excel/CSV headers, offline durability, duplicate SKUs, partial inputs, calculation round-offs, counter speed).
- **Proactive Clarification & Better Architecture:** Ask targeted questions, challenge edge cases, uncover operational pitfalls, and propose a superior, resilient implementation plan before touching code.
