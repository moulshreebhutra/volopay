import type { Department, Module, Person, Policy, Range } from "./model";
import { UNRESOLVED_PREFIX } from "./model";
import { seniority } from "./people";

/* ------------------------------------------------------------------ *
 * 1. Plain-English approval policy  ->  structured ranges
 *    Deterministic and offline. An optional AI pass (app/api/interpret)
 *    can produce the same structure; both go through the same checks.
 * ------------------------------------------------------------------ */

export interface ParsedRange {
  from: number;
  to: number | null;
  auto: boolean;
  /** Approver descriptions in order, one per level, as written (lower-cased). */
  tokens: string[];
  source: string;
}
export interface ParsedModule {
  module: Module | null;
  ranges: ParsedRange[];
}
export interface PolicyParse {
  modules: ParsedModule[];
  notes: string[];
}

const MULT: Record<string, number> = {
  k: 1e3,
  l: 1e5, lac: 1e5, lacs: 1e5, lakh: 1e5, lakhs: 1e5,
  cr: 1e7, crore: 1e7, crores: 1e7,
  m: 1e6, mn: 1e6, million: 1e6,
};

const MONEY_SRC =
  "(?:(?:₹|rs\\.?|inr|s\\$|a\\$|\\$|sgd|aud|usd|idr|rp\\.?)\\s*)?(\\d[\\d,]*(?:\\.\\d+)?)\\s*(lakhs?|lacs?|crores?|cr|mn|million|k|l|m)?(?![a-z0-9])";

interface Amount { value: number; start: number; end: number }

function findAmounts(clause: string): Amount[] {
  const re = new RegExp(MONEY_SRC, "gi");
  const out: Amount[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clause))) {
    const after = clause.slice(m.index + m[0].length);
    const before = clause.slice(0, m.index);
    // "level 2", "2 levels", "30 days", "10%" are not amounts
    if (/^\s*(levels?|days?|%|percent|approvers?|steps?|stages?)\b/i.test(after)) continue;
    if (/\b(level|l|step|stage|tier)\s*$/i.test(before) && !m[2]) continue;
    const num = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(num)) continue;
    const mult = m[2] ? MULT[m[2].toLowerCase()] ?? 1 : 1;
    out.push({ value: Math.round(num * mult), start: m.index, end: m.index + m[0].length });
  }
  return out;
}

const UPTO = /\b(up ?to|upto|under|below|less than|within|not exceeding|no more than|maximum|max|till|upper limit)\b|<=?/i;
const OR_LESS = /^\s*(?:or|and)\s+(?:less|below|under|lower|fewer)\b/i;
const ABOVE = /\b(above|over|more than|greater than|exceed(?:s|ing)?|beyond|at least|minimum|min)\b|>=?|\+\s*($|[\s,;])/i;
const OR_MORE = /\b(and|or)\s+(above|more|over|higher|greater|up)\b/i;
const ANY = /\b(any amount|all amounts|all (?:claims|bills|requests|payments)|every (?:claim|bill|request|payment)|everything|regardless of amount)\b/i;
const AUTO = /\b(auto[- ]?approv\w*|automatic(?:ally)?(?: approv\w*)?|no approval|without approval|self[- ]?approv\w*|no sign-?off|not required|none needed)\b/i;

const MODULE_WORDS: [Module, RegExp][] = [
  ["reimbursement", /\b(reimburs\w*|expense claims?|claims?|out[- ]of[- ]pocket)\b/i],
  ["billpay", /\b(bills?|bill ?pay|vendors?|invoices?|payables?|accounts payable|ap|suppliers?|payouts?)\b/i],
  ["cards", /\bcards?\b/i],
  ["payroll", /\b(payroll|salary|salaries)\b/i],
];

function moduleIn(text: string): Module | null {
  let best: { m: Module; at: number } | null = null;
  for (const [m, re] of MODULE_WORDS) {
    const match = re.exec(text);
    if (match && (best === null || match.index < best.at)) best = { m, at: match.index };
  }
  return best ? best.m : null;
}

const FILLER =
  /\b(approves?|approval|approvals|approved|approver|approvers|needs?|requires?|required|goes to|go to|sent to|routed to|routes? to|signs? off|sign-?off|by|from|the|a|an|is|are|will|must|should|to|for|each|per|claims?|bills?|requests?|expenses?|reimbursements?|reimbursed|payments?|payouts?|spends?|amounts?|anything|rs|inr|then only|only|new|also|plus|first|second|third|final|finally|level|levels)\b/gi;

function splitClauses(text: string): string[] {
  return text
    .split(/\r?\n|;|•|(?<=[a-z)]\.)\s+(?=[A-Z])/)
    .map((s) => s.replace(/^\s*[-*•\d.)]+\s+/, "").trim())
    .filter(Boolean);
}

export function parsePolicyText(text: string): PolicyParse {
  const notes: string[] = [];
  const byModule = new Map<string, ParsedModule>();
  let current: Module | null = null;
  let anyModuleSeen = false;

  for (const rawClause of splitClauses(text)) {
    let clause = rawClause;
    // "Reimbursements: ..." style label
    const label = /^([^:\d₹$]{2,40}):\s*(.*)$/.exec(clause);
    if (label) {
      const m = moduleIn(label[1]);
      if (m) { current = m; anyModuleSeen = true; clause = label[2]; if (!clause.trim()) continue; }
    } else {
      const m = moduleIn(clause);
      if (m) { current = m; anyModuleSeen = true; }
    }

    const amounts = findAmounts(clause);
    let from: number | null = null;
    let to: number | null = null;
    let ok = true;
    if (amounts.length >= 2) {
      const a = amounts[0].value, b = amounts[1].value;
      from = Math.min(a, b);
      to = Math.max(a, b);
    } else if (amounts.length === 1) {
      const v = amounts[0].value;
      const before = clause.slice(0, amounts[0].start);
      const after = clause.slice(amounts[0].end);
      const near = before.slice(-24) + " " + after.slice(0, 24);
      if (OR_LESS.test(after)) { from = 0; to = v; }
      else if (OR_MORE.test(after.slice(0, 24)) || /^\s*\+/.test(after) || ABOVE.test(before.slice(-22))) { from = v; to = null; }
      else if (UPTO.test(before.slice(-22)) || UPTO.test(near)) { from = 0; to = v; }
      else if (ABOVE.test(near)) { from = v; to = null; }
      else { ok = false; notes.push(`Could not tell whether "${rawClause}" means up to, or above, ${v}. Rewrite with "up to", "above" or "A to B".`); }
    } else if (ANY.test(clause)) { from = 0; to = null; }
    else if (AUTO.test(clause) || /\b(approv|manager|head|cfo|ceo|director)\b/i.test(clause)) {
      ok = false;
      notes.push(`No amount found in "${rawClause}", so it was skipped.`);
    } else ok = false;
    if (!ok || from === null) continue;

    // approver part
    const auto = AUTO.test(clause);
    let rest = clause.toLowerCase();
    rest = rest.replace(new RegExp(MONEY_SRC, "gi"), " ");
    rest = rest.replace(new RegExp(UPTO.source, "gi"), " ").replace(new RegExp(ABOVE.source, "gi"), " ");
    rest = rest.replace(OR_MORE, " ").replace(/\b(?:or|and)\s+(?:less|below|under|lower|fewer)\b/gi, " ").replace(ANY, " ").replace(AUTO, " ");
    rest = rest.replace(/[:()]/g, " ");
    for (const [, re] of MODULE_WORDS) rest = rest.replace(new RegExp(re.source, "gi"), " ");
    rest = rest.replace(FILLER, " ");
    const tokens = auto
      ? []
      : rest
          .split(/\s*(?:\bthen\b|→|->|=>|>|\+|&|\band\b|,|\/|\bfollowed by\b)\s*/i)
          .map((t) => t.replace(/[^a-z0-9@.' _-]/gi, " ").replace(/\s+/g, " ").replace(/^[\s\-–—._]+|[\s\-–—._]+$/g, ""))
          .filter((t) => t.length > 1);
    if (!auto && tokens.length === 0) notes.push(`No approver found in "${rawClause}".`);

    const key = current ?? "__none__";
    if (!byModule.has(key)) byModule.set(key, { module: current, ranges: [] });
    byModule.get(key)!.ranges.push({ from, to, auto: auto || tokens.length === 0, tokens, source: rawClause });
  }

  const modules = [...byModule.values()];
  for (const m of modules) m.ranges.sort((a, b) => a.from - b.from);
  if (!anyModuleSeen && modules.length) notes.push("No module (reimbursements, bills, cards) was named, so the rules apply to both reimbursements and bill pay.");
  return { modules, notes };
}

/* ------------------------------------------------------------------ *
 * 2. Approver descriptions  ->  real people
 * ------------------------------------------------------------------ */

export const DEPT_MANAGER = "@dept-manager";

const TITLE_GROUPS: { keys: string[]; match: RegExp }[] = [
  { keys: ["cfo", "finance head", "head of finance", "finance director", "vp finance", "chief financial officer", "head finance"], match: /\b(cfo|chief financial|head of finance|finance head|finance director|vp,? finance|vice president,? finance)\b/i },
  { keys: ["ceo", "chief executive", "managing director", "md"], match: /\b(ceo|chief executive|managing director)\b/i },
  { keys: ["cto", "chief technology", "head of engineering", "engineering head", "vp engineering"], match: /\b(cto|chief technology|head of engineering|engineering head|vp,? engineering)\b/i },
  { keys: ["coo", "chief operating", "head of operations", "operations head", "ops head"], match: /\b(coo|chief operating|head of operations|operations head)\b/i },
  { keys: ["controller", "finance controller", "financial controller"], match: /\b(financial |finance )?controller\b/i },
  { keys: ["hr head", "head of hr", "chro", "people head", "head of people"], match: /\b(chro|hr head|head of hr|head of people|people head|hr director)\b/i },
  { keys: ["founder", "co-founder", "cofounder"], match: /\b(co-?founder|founder)\b/i },
];

const DEPT_MANAGER_WORDS = /^(?:(?:the )?(?:dept|department|team|line|reporting|direct) )?(?:manager|lead|head|owner|budget owner)$/i;

export type Resolution =
  | { kind: "person"; email: string; note?: string }
  | { kind: "dept-manager" }
  | { kind: "unresolved"; label: string };

export function resolveToken(token: string, people: Person[]): Resolution {
  const t = token.trim().toLowerCase();
  if (!t) return { kind: "unresolved", label: token };
  if (DEPT_MANAGER_WORDS.test(t) || /^(dept|department|team|line|reporting) (manager|head|lead)$/.test(t)) return { kind: "dept-manager" };

  const byEmail = people.find((p) => p.email && p.email === t);
  if (byEmail) return { kind: "person", email: byEmail.email };

  const byName = people.filter((p) => p.name && (p.name.toLowerCase() === t || (t.length >= 4 && p.name.toLowerCase().includes(t))));
  if (byName.length === 1) return { kind: "person", email: byName[0].email };

  for (const g of TITLE_GROUPS) {
    if (g.keys.includes(t) || g.match.test(t)) {
      const hits = people.filter((p) => g.match.test(p.title));
      if (hits.length) return pick(hits, token);
    }
  }

  // generic: every meaningful word of the token appears in someone's title or department
  const stop = new Set(["head", "of", "the", "senior", "sr", "chief", "officer", "vp", "director", "manager", "lead"]);
  const words = t.split(/\s+/).filter((w) => !stop.has(w));
  if (words.length) {
    const wantsSenior = /\b(head|director|vp|chief|lead|manager)\b/.test(t);
    const hits = people.filter((p) => {
      const hay = `${p.title} ${p.department}`.toLowerCase();
      return words.every((w) => hay.includes(w)) && (!wantsSenior || seniority(p.title) >= 2);
    });
    if (hits.length) return pick(hits, token);
  }
  return { kind: "unresolved", label: token };
}

function pick(hits: Person[], token: string): Resolution {
  const ranked = [...hits].sort((a, b) => seniority(b.title) - seniority(a.title));
  if (ranked.length > 1 && seniority(ranked[0].title) === seniority(ranked[1].title)) {
    return { kind: "person", email: ranked[0].email, note: `"${token}" matched ${ranked.length} people (${ranked.map((p) => p.name || p.email).join(", ")}); the first was used. Confirm who it should be.` };
  }
  return { kind: "person", email: ranked[0].email };
}

/* ------------------------------------------------------------------ *
 * 3. Parsed rules  ->  Volopay-shaped policies
 *    Volopay approvers are individual users, so "department manager" is
 *    expanded into one department-specific policy per department.
 * ------------------------------------------------------------------ */

export interface BuildResult {
  policies: Policy[];
  notes: string[];
}

export function buildPolicies(parse: PolicyParse, people: Person[], departments: Department[]): BuildResult {
  const notes: string[] = [...parse.notes];
  const policies: Policy[] = [];
  const reported = new Set<string>();

  for (const pm of parse.modules) {
    const modules: Module[] = pm.module ? [pm.module] : ["reimbursement", "billpay"];
    for (const module of modules) {
      const resolved = pm.ranges.map((r) =>
        r.auto ? { r, res: [] as Resolution[] } : { r, res: r.tokens.map((t) => resolveToken(t, people)) },
      );
      for (const { res } of resolved)
        for (const x of res) if (x.kind === "person" && x.note && !reported.has(x.note)) { reported.add(x.note); notes.push(x.note); }

      const usesDeptManager = resolved.some(({ res }) => res.some((x) => x.kind === "dept-manager"));

      const toRange = (r: ParsedRange, res: Resolution[], dept?: Department): Range => {
        const levels: string[] = [];
        for (const x of res) {
          if (x.kind === "person") levels.push(x.email);
          else if (x.kind === "unresolved") levels.push(UNRESOLVED_PREFIX + x.label);
          else if (dept) {
            if (dept.managers[0]) levels.push(dept.managers[0]);
            // a department without a manager gets no manager level; the validator reports it
          }
          // company-level default: no manager level (individual approvers cannot be dynamic)
        }
        return { from: r.from, to: r.to, levels: dedupe(levels), auto: r.auto && r.tokens.length === 0, needsManager: res.some((x) => x.kind === "dept-manager") };
      };

      policies.push({ module, scope: { type: "company" }, ranges: resolved.map(({ r, res }) => toRange(r, res)) });
      if (usesDeptManager) {
        for (const d of departments) {
          policies.push({ module, scope: { type: "department", department: d.name }, ranges: resolved.map(({ r, res }) => toRange(r, res, d)) });
        }
        const key = `dm-${module}`;
        if (!reported.has(key)) {
          reported.add(key);
          notes.push(`"Manager" is not a fixed person in Volopay, so ${module === "billpay" ? "bill pay" : module} gets one department policy per department, each pointing at that department's manager. The company-level default leaves the manager level out.`);
        }
      }
    }
  }
  return { policies, notes };
}

function dedupe(levels: string[]): string[] {
  const out: string[] = [];
  for (const l of levels) if (out[out.length - 1] !== l) out.push(l);
  return out;
}
