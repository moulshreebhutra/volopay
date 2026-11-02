# Setup Studio: Moulshree × Volopay

Built by Moulshree Bhutra for her application to Volopay's Founder's Office, Product role. An independent prototype, not affiliated with or endorsed by Volopay.

## The problem
Volopay's help centre describes a setup with six areas: users and roles, departments, locations, approval and submission policies, module settings and accounting. A new customer's policy usually exists as a document or a conversation ("manager approves small amounts, finance head then CFO above that"). Approvers in Volopay are individual people, so that has to be translated, department by department. G2 reviewers score Volopay's "Complex Approval Workflow" lowest of its features (7.1 from 28 reviews), and review averages put implementation at about two months. The idea is a tool that shortens that translation and catches mistakes before go-live.

## What it does
| Page | What it does |
|---|---|
| `/` | The application: why hire me, what I noticed (with sources), what I built, how I'd measure it, 30/60/90 plan. |
| `/studio` | Paste a team list (CSV) and an approval policy in plain English. Get a Volopay-shaped setup, 21 checks, an approval simulator and a setup pack. |
| `/method` | Every check with its basis (sourced or inferred), what is not covered, and everything I read. |

## How it works
- `lib/people.ts`: CSV parsing, header synonyms, departments and managers from titles.
- `lib/policy.ts`: reads policy sentences (₹, k, lakh, crore, "up to", "above", "A to B", "then") and resolves approvers to people. "Manager" becomes one department policy per department.
- `lib/validate.ts` and `lib/rules.ts`: the 21 checks, each tagged **sourced** (a Volopay page says it, with a link) or **inferred** (my reasoning).
- `lib/simulate.ts`: who approves an amount, including the maker-checker rule (requester drops out; an Admin steps in).
- `lib/export.ts`: invite CSV, departments, policies (CSV and JSON), and a checklist in the Admin Guide's order.
- `app/api/interpret`: optional AI re-reading of the policy text. Output is validated with zod and goes through the same checks.

## Honesty
- Volopay has no public import or API that I found, so the output is files and a checklist for a person to key in. Nothing is written to Volopay.
- Not covered: approval conditions by category, project or merchant, delegation, budgets, card and bill-pay settings, payroll, flag rules.
- The sample company is invented. I have not seen Volopay's admin screens or customer data.

## Run it
```bash
npm install
npm run dev       # http://localhost:3000
npm test          # parser, checks and simulator tests
```
Optional environment variables (host settings only, never committed): `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`. Without a key the built-in parser is used and the AI button is disabled. Pushes to `main` deploy automatically once the repo is connected to the host.
