# context/

This folder is the written record of the project. It is meant to be read in
order by someone who has to change something in six months, and to be updated
in the same commit as the code it describes.

| File | Answers |
|---|---|
| [00-product-brief.md](./00-product-brief.md) | What was asked, what was built, what is out of scope |
| [01-functional-spec.md](./01-functional-spec.md) | Exact behaviour: flows, rules, edge cases, acceptance criteria |
| [02-architecture.md](./02-architecture.md) | Stack, layers, rendering model, data flow, deployment |
| [03-data-model.md](./03-data-model.md) | Tables, relationships, constraints, invariants |
| [04-api-contract.md](./04-api-contract.md) | Server actions, inputs, outputs, error codes |
| [05-design-system.md](./05-design-system.md) | Tokens, type, spacing, components, accessibility |
| [06-decisions.md](./06-decisions.md) | ADRs: what we chose, why, what it costs |
| [07-milestones.md](./07-milestones.md) | Build order and completion evidence |
| [08-testing.md](./08-testing.md) | Unit + E2E matrix, how to run, what is not covered |
| [09-runbook.md](./09-runbook.md) | Setup, migrations, seed, deploy, rollback, incidents |
| [10-known-limits.md](./10-known-limits.md) | Honest scope cuts and security notes |

## Conventions

- **Spec first.** `01-functional-spec.md` is the source of truth for behaviour.
  If code and spec disagree, that is a bug in one of them — fix it in the same
  commit.
- **Decisions are append-only.** `06-decisions.md` never gets rewritten to look
  smarter in hindsight. Superseded decisions get a status change and a link.
- **Milestones are checkpoints, not marketing.** Each one lists the artefact
  that proves it exists.
- Dates are stored as calendar dates (`date`), carried as `YYYY-MM-DD` strings,
  and never converted to a timestamp. Timestamps exist only for audit fields.
- All money is integer cents. No floats anywhere in the pricing path.
