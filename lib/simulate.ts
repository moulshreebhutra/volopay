import type { Config, Module, Policy, Range } from "./model";
import { MODULES, isUnresolved, unresolvedLabel, money } from "./model";
import { personByEmail } from "./people";

export interface SimStep {
  level: number;
  label: string; // who
  email?: string;
  note?: string;
  kind: "approver" | "admin-fallback" | "unresolved";
}

export interface SimResult {
  module: Module;
  amount: number;
  /** Which policy matched. */
  policy: "department" | "company" | "none";
  policyLabel: string;
  range: Range | null;
  autoApproved: boolean;
  steps: SimStep[];
  /** Plain-language explanation, one line per decision. */
  trace: string[];
  /** True when no rule covers this amount. */
  uncovered: boolean;
}

function findPolicy(cfg: Config, module: Module, department: string): { policy: Policy | null; kind: SimResult["policy"] } {
  const dept = cfg.policies.find((p) => p.module === module && p.scope.type === "department" && p.scope.department.toLowerCase() === department.toLowerCase());
  if (dept) return { policy: dept, kind: "department" };
  const company = cfg.policies.find((p) => p.module === module && p.scope.type === "company");
  return company ? { policy: company, kind: "company" } : { policy: null, kind: "none" };
}

export function rangeFor(policy: Policy, amount: number): Range | null {
  return [...policy.ranges].sort((a, b) => a.from - b.from).find((r) => amount >= r.from && (r.to === null || amount < r.to)) ?? null;
}

/** Who has to approve `amount` of `module` submitted by `requesterEmail`?
 *  Boundaries: a range includes its lower limit and excludes its upper limit. Volopay's docs say
 *  "above X"; whether X itself is inside is not documented, so this is flagged in the UI. */
export function simulate(cfg: Config, module: Module, requesterEmail: string, amount: number): SimResult {
  const requester = personByEmail(cfg.people, requesterEmail);
  const trace: string[] = [];
  const modLabel = MODULES.find((m) => m.id === module)?.label ?? module;
  const base = { module, amount, steps: [] as SimStep[], trace };

  if (!requester) {
    trace.push("Choose a requester from the people list.");
    return { ...base, policy: "none", policyLabel: "–", range: null, autoApproved: false, uncovered: true };
  }

  const { policy, kind } = findPolicy(cfg, module, requester.department);
  if (!policy) {
    trace.push(`No ${modLabel} policy has been defined, so there is nothing to simulate.`);
    return { ...base, policy: "none", policyLabel: "none", range: null, autoApproved: false, uncovered: true };
  }
  const policyLabel = kind === "department" ? `${modLabel}, ${requester.department} department policy` : `${modLabel}, company policy`;
  trace.push(`${requester.name || requester.email} is in ${requester.department || "no department"}, so the ${kind === "department" ? `${requester.department} department` : "company"} ${modLabel.toLowerCase()} policy applies${kind === "company" ? " (no department override exists)" : ""}.`);

  const range = rangeFor(policy, amount);
  if (!range) {
    trace.push(`${money(amount, cfg.currency)} falls in no range of that policy. Volopay's behaviour for uncovered amounts is not documented; fix the gap.`);
    return { ...base, policy: kind, policyLabel, range: null, autoApproved: false, uncovered: true };
  }
  trace.push(`${money(amount, cfg.currency)} falls in the ${money(range.from, cfg.currency)} to ${range.to === null ? "no limit" : money(range.to, cfg.currency)} range.`);

  if (range.levels.length === 0) {
    trace.push("That range has no approver, so the request is approved automatically.");
    return { ...base, policy: kind, policyLabel, range, autoApproved: true, uncovered: false };
  }

  const steps: SimStep[] = [];
  let level = 0;
  let removedRequester = false;
  for (const a of range.levels) {
    if (isUnresolved(a)) {
      level++;
      steps.push({ level, label: `"${unresolvedLabel(a)}" (not matched to anyone)`, kind: "unresolved", note: "Fix this in the people list or policy text." });
      continue;
    }
    if (cfg.makerChecker[module] && a === requester.email) {
      removedRequester = true;
      trace.push(`${requester.name || requester.email} is an approver in this range but also the requester. Maker-checker is on, so they are removed from the chain.`);
      continue;
    }
    const p = personByEmail(cfg.people, a);
    level++;
    steps.push({ level, label: p ? `${p.name || p.email}${p.title ? `, ${p.title}` : ""}` : a, email: a, kind: "approver" });
  }
  if (removedRequester) {
    const admins = cfg.people.filter((p) => p.role === "Admin" && p.email !== requester.email);
    level++;
    steps.push({
      level,
      label: admins.length ? `Any Admin (${admins.slice(0, 3).map((p) => p.name || p.email).join(", ")}${admins.length > 3 ? ", …" : ""})` : "Any Admin (there is none besides the requester)",
      kind: "admin-fallback",
      note: admins.length ? "Per Volopay's docs, Admin approvers take the requester's place and give the final approval." : "The docs do not say what happens here.",
    });
    trace.push("An Admin gives the final approval in their place.");
  }
  steps.forEach((s) => trace.push(`Level ${s.level}: ${s.label}.`));
  return { ...base, steps, policy: kind, policyLabel, range, autoApproved: steps.length === 0, uncovered: false };
}
