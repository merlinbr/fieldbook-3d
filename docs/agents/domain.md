# Domain Docs

This is a single-context repo. Domain vocabulary lives in root `GLOSSARY.md`; architectural decisions live in `docs/adr/`.

## Before exploring

Read `GLOSSARY.md` and ADRs relevant to the area being explored.

If those files do not exist, proceed silently. Do not suggest creating them upfront. The domain-modeling skill creates them lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

Use domain terms as defined in `GLOSSARY.md` in issue titles, refactor proposals, hypotheses, and test names. Do not drift to synonyms the glossary explicitly avoids.

If a concept is missing, reconsider whether it belongs to the project's language or note a real gap for domain-modeling.

## Flag ADR conflicts

If a proposal contradicts an existing ADR, explicitly identify the ADR and explain why reopening the decision is warranted rather than silently overriding it.
