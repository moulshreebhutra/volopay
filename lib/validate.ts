import type { Config, Finding, Module, Policy, Person } from "./model";
import { MODULES, isUnresolved, unresolvedLabel, money } from "./model";
import { deriveDepartments, deriveLocations, isKnownRole, personByEmail } from "./people";
import { RULE_BY_ID } from "./rules";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const label = (m: Module) => MODULES.find((x) => x.id === m)?.label ?? m;
const who = (p: Person) => p.name || p.email || `row ${p.row}`;

function f(id: string, detail: string, fix: string, where: string[] = [], severity?: Finding["severity"]): Finding {
  const meta = RULE_BY_ID[id];
  return { id, severity: severity ?? meta.severity, basis: meta.basis, title: meta.title, detail, fix, where };
}

export function validate(cfg: Config): Finding[] {
  const out: Finding[] = [];
  const { people } = cfg;
  const departments = deriveDepartments(people);
  const locations = deriveLocations(people);

  // ---- people ----------------------------------------------------
  const missing = people.filter((p) => !p.email || !p.department || !p.location);
  if (missing.length) {
    out.push(f("invite-fields",
      `${missing.length} ${missing.length === 1 ? "person is" : "people are"} missing a field Volopay needs to send the invite: ${missing.map((p) => `${who(p)} (${[!p.email && "email", !p.department && "department", !p.location && "location"].filter(Boolean).join(", ")})`).join("; ")}.`,
      "Fill the blanks in the sheet before inviting. The invite form will not accept them.",
      missing.map((p) => `row ${p.row}`)));
  }

  const seen = new Map<string, Person[]>();
  for (const p of people) if (p.email) seen.set(p.email, [...(seen.get(p.email) ?? []), p]);
  const dups = [...seen.entries()].filter(([, v]) => v.length > 1);
  const badEmail = people.filter((p) => p.email && !EMAIL_RE.test(p.email));
  if (dups.length || badEmail.length) {
    const parts: string[] = [];
    if (dups.length) parts.push(`duplicate email: ${dups.map(([e, v]) => `${e} (rows ${v.map((p) => p.row).join(", ")})`).join("; ")}`);
    if (badEmail.length) parts.push(`not a valid email: ${badEmail.map((p) => `${p.email} (row ${p.row})`).join("; ")}`);
    out.push(f("email-valid", parts.join(". ") + ".", "Keep one row per person and correct the address.", [...dups.flatMap(([, v]) => v.map((p) => `row ${p.row}`)), ...badEmail.map((p) => `row ${p.row}`)]));
  }

  const custom = people.filter((p) => !isKnownRole(p.role));
  if (custom.length) {
    const roles = [...new Set(custom.map((p) => p.role))];
    out.push(f("custom-role",
      `${roles.map((r) => `"${r}"`).join(", ")} ${roles.length === 1 ? "is" : "are"} not a standard Volopay role (${custom.length} ${custom.length === 1 ? "person" : "people"}).`,
      "Create the custom role under Roles & Permissions first, then invite these people with it. Or map them to Member.",
      custom.map((p) => `row ${p.row}`)));
  }

  const admins = people.filter((p) => p.role === "Admin");
  if (people.length && admins.length === 0) {
    out.push(f("admin-count", "Nobody is marked Admin. Only Admins can invite users, issue cards, set limits and change company settings.", "Mark at least two people as Admin. Finance lead and a founder or CFO are the usual pair."));
  } else if (admins.length === 1) {
    out.push(f("admin-count", `${who(admins[0])} is the only Admin. If they are away, nobody can change settings or issue cards, and maker-checker has nobody to fall back to.`, "Add a second Admin.", [who(admins[0])], "warning"));
  }

  // ---- managers --------------------------------------------------
  const noMgr = departments.filter((d) => d.managers.length === 0);
  if (noMgr.length) {
    out.push(f("dept-manager", `No manager could be found for ${noMgr.map((d) => d.name).join(", ")}. Department managers are added when a department is created, and "manager approves" rules need them.`, "Add a manager title (Head / Director / Manager) in the sheet, or tick the dept_manager column for one person per department.", noMgr.map((d) => d.name)));
  }
  const badMgr = people.filter((p) => p.managerEmail && !personByEmail(people, p.managerEmail));
  if (badMgr.length) {
    out.push(f("manager-unknown", `${badMgr.length} ${badMgr.length === 1 ? "person's manager is" : "people's managers are"} not in the list: ${badMgr.slice(0, 5).map((p) => `${who(p)} → ${p.managerEmail}`).join("; ")}${badMgr.length > 5 ? "; …" : ""}.`, "Add the manager to the sheet or correct the address.", badMgr.map((p) => `row ${p.row}`)));
  }

  // ---- locations -------------------------------------------------
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const groups = new Map<string, Set<string>>();
  for (const l of people.map((p) => p.location).filter(Boolean)) {
    const k = norm(l);
    if (!groups.has(k)) groups.set(k, new Set());
    groups.get(k)!.add(l.trim());
  }
  const clashes = [...groups.values()].filter((s) => s.size > 1);
  if (clashes.length) {
    out.push(f("location-dup", `Spellings that differ only by case or spacing: ${clashes.map((s) => [...s].map((x) => `"${x}"`).join(" / ")).join("; ")}. Volopay rejects duplicate location names, so these would become one rejected entry or two near-identical ones.`, "Pick one spelling for each location.", clashes.flatMap((s) => [...s])));
  }
  void locations;

  // ---- policies --------------------------------------------------
  const roleAdminExists = admins.length > 0;
  for (const pol of cfg.policies) {
    const scopeLabel = pol.scope.type === "company" ? `${label(pol.module)}, company policy` : `${label(pol.module)}, ${pol.scope.department} department`;
    out.push(...checkPolicy(pol, scopeLabel, cfg));
  }

  // department policies: duplicates and missing managers
  const companyByModule = new Map<Module, Policy>();
  for (const p of cfg.policies) if (p.scope.type === "company") companyByModule.set(p.module, p);
  const needMgr = new Map<string, string[]>();
  for (const pol of cfg.policies) {
    if (pol.scope.type !== "department") continue;
    const dept = departments.find((d) => d.name === (pol.scope as { department: string }).department);
    const company = companyByModule.get(pol.module);
    const wantsManager = pol.ranges.some((r) => r.needsManager);
    if (dept && dept.managers.length === 0 && wantsManager) {
      needMgr.set(dept.name, [...(needMgr.get(dept.name) ?? []), label(pol.module)]);
    } else if (company && JSON.stringify(company.ranges.map((r) => r.levels)) === JSON.stringify(pol.ranges.map((r) => r.levels))) {
      out.push(f("dept-policy-dup", `${label(pol.module)} for ${dept?.name} is identical to the company policy.`, "Skip the department override; the company policy already applies.", [`${label(pol.module)} / ${dept?.name}`]));
    }
  }
  for (const [d, mods] of needMgr) {
    out.push(f("dept-policy-manager", `${d} has no manager, so its ${mods.join(" and ")} policy cannot include the "manager approves" level. Requests there skip straight to the next approver.`, `Give ${d} a manager, or accept that the first approver is more senior.`, [d]));
  }

  // maker-checker
  for (const m of MODULES.map((x) => x.id)) {
    const pols = cfg.policies.filter((p) => p.module === m);
    if (!pols.length) continue;
    const approvers = new Set(pols.flatMap((p) => p.ranges.flatMap((r) => r.levels)).filter((a) => !isUnresolved(a)));
    const people2 = [...approvers].map((e) => personByEmail(people, e)).filter(Boolean) as Person[];
    if (!people2.length) continue;
    if (cfg.makerChecker[m]) {
      if (!roleAdminExists) {
        out.push(f("maker-checker-admin", `Maker-checker is on for ${label(m)} but there is no Admin to take over when an approver submits their own request.`, "Add an Admin, or turn maker-checker off for this module.", [label(m)]));
      } else {
        out.push(f("maker-checker", `Maker-checker is on for ${label(m)}. When ${people2.slice(0, 4).map(who).join(", ")}${people2.length > 4 ? " or other approvers" : ""} submit their own requests, they drop out of the chain and an Admin gives the final approval.`, "Check the Simulator tab for the top approver: their own large requests land on an Admin, who may not be senior enough.", people2.map(who)));
      }
    } else {
      out.push(f("maker-checker", `Maker-checker is off for ${label(m)}. ${people2.slice(0, 4).map(who).join(", ")}${people2.length > 4 ? " and other approvers" : ""} can approve their own requests.`, "Turn maker-checker on for this module unless self-approval is intended.", people2.map(who), "warning"));
    }
  }

  // submission policy vs auto-approval
  for (const m of MODULES.map((x) => x.id)) {
    const company = companyByModule.get(m);
    if (!company || !company.ranges.length) continue;
    const auto = company.ranges[0].auto && company.ranges[0].levels.length === 0 ? company.ranges[0].to : 0;
    const r = cfg.submission.receiptAbove;
    if (auto && auto > 0 && (r === null || r > 0) && (r === null || r >= auto)) {
      const lowerCeiling = r === null ? "never" : `only above ${money(r, cfg.currency)}`;
      out.push(f("receipt-gap", `${label(m)} up to ${money(auto, cfg.currency)} needs no approver, and receipts are required ${lowerCeiling}. Spend in that band is paid with neither a second pair of eyes nor a receipt.`, `Require a receipt from ${money(0, cfg.currency)} on ${label(m)}, or lower the auto-approval ceiling.`, [label(m)]));
    }
  }
  if (cfg.currency === "INR" && cfg.policies.some((p) => p.module === "billpay") && cfg.submission.receiptAbove !== 0) {
    out.push(f("india-invoice", "Bill pay in India usually needs a valid tax invoice to claim GST input credit, and receipts are not required on every bill.", "Require a receipt or invoice on all bill-pay requests (receipt threshold 0)."));
  }

  // accounting
  if (cfg.accounting === "Other / not decided") {
    out.push(f("accounting-tool", "Accounting software is not chosen, or is not one of the integrations Volopay lists.", "Use Universal CSV to start, and ask the Customer Success Manager about a custom integration (it may cost extra)."));
  }

  return out.sort((a, b) => order(a.severity) - order(b.severity));
}

const order = (s: Finding["severity"]) => (s === "error" ? 0 : s === "warning" ? 1 : 2);

function checkPolicy(pol: Policy, scopeLabel: string, cfg: Config): Finding[] {
  const out: Finding[] = [];
  const where = [scopeLabel];
  const ranges = [...pol.ranges].sort((a, b) => a.from - b.from);
  if (!ranges.length) return out;

  if (ranges[0].from !== 0) {
    out.push(f("range-start", `${scopeLabel} starts at ${money(ranges[0].from, cfg.currency)}, so amounts below that have no rule.`, `Add a range from ${money(0, cfg.currency)} (it can be auto-approved).`, where));
  }
  for (let i = 1; i < ranges.length; i++) {
    const prev = ranges[i - 1];
    if (prev.to === null) {
      out.push(f("range-gap", `${scopeLabel}: a range with no upper limit is followed by another range that starts at ${money(ranges[i].from, cfg.currency)}.`, "Give the earlier range an upper limit.", where));
    } else if (ranges[i].from > prev.to) {
      out.push(f("range-gap", `${scopeLabel}: nothing covers ${money(prev.to, cfg.currency)} up to ${money(ranges[i].from, cfg.currency)}.`, `Extend one range so it meets the next, for example start the next range at ${money(prev.to, cfg.currency)}.`, where));
    } else if (ranges[i].from < prev.to) {
      out.push(f("range-gap", `${scopeLabel}: ranges overlap between ${money(ranges[i].from, cfg.currency)} and ${money(prev.to, cfg.currency)}.`, "Make each range start where the previous one ends.", where));
    }
  }
  if (ranges[ranges.length - 1].to !== null) {
    out.push(f("range-open", `${scopeLabel}: the highest range stops at ${money(ranges[ranges.length - 1].to as number, cfg.currency)}. Anything above has no rule.`, "Add a final range with no upper limit, usually for the most senior approver.", where));
  }
  if (ranges.length > 5) {
    out.push(f("range-limit", `${scopeLabel} has ${ranges.length} ranges. Volopay's reimbursement guide allows up to 5.`, "Merge neighbouring ranges, or confirm the limit for this module with your Customer Success Manager.", where));
  }
  for (const r of ranges) {
    if (r.levels.length > 5) out.push(f("level-limit", `${scopeLabel}: a range has ${r.levels.length} approval levels; the matrix goes up to 5.`, "Drop the least senior levels.", where));
    for (const a of r.levels) {
      if (isUnresolved(a)) out.push(f("approver-unknown", `${scopeLabel}: "${unresolvedLabel(a)}" does not match anyone in the people list.`, `Add that person (with a matching title) to the sheet, or write their name or email in the policy text.`, where));
      else if (!personByEmail(cfg.people, a)) out.push(f("approver-unknown", `${scopeLabel}: approver ${a} is not in the people list.`, "Add the person to the sheet.", where));
    }
  }
  // single approver on the highest range (reported once, at company scope)
  const top = ranges[ranges.length - 1];
  if (pol.scope.type === "company" && top.levels.length === 1 && !isUnresolved(top.levels[0])) {
    const p = personByEmail(cfg.people, top.levels[0]);
    out.push(f("single-approver", `${scopeLabel}: ${p ? who(p) : top.levels[0]} is the only approver above ${money(top.from, cfg.currency)}. If they are away, those requests wait.`, "Add a second person at that level, or confirm that skipping or moving on an absent approver is enabled (the India approvals page describes it).", where));
  }
  // de-duplicate identical findings
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x.id + x.detail) ? false : (seen.add(x.id + x.detail), true)));
}

export interface Readiness {
  score: number; // 0-100
  errors: number;
  warnings: number;
  infos: number;
  counts: { people: number; departments: number; locations: number; policies: number; ranges: number };
}

export function readiness(cfg: Config, findings: Finding[]): Readiness {
  const errors = findings.filter((x) => x.severity === "error").length;
  const warnings = findings.filter((x) => x.severity === "warning").length;
  const infos = findings.filter((x) => x.severity === "info").length;
  const score = Math.max(0, Math.round(100 - errors * 10 - warnings * 3));
  return {
    score,
    errors, warnings, infos,
    counts: {
      people: cfg.people.length,
      departments: deriveDepartments(cfg.people).length,
      locations: deriveLocations(cfg.people).length,
      policies: cfg.policies.length,
      ranges: cfg.policies.reduce((n, p) => n + p.ranges.length, 0),
    },
  };
}
