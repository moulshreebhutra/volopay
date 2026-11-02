import type { Department, Person } from "./model";
import { KNOWN_ROLES } from "./model";

/** Minimal CSV/TSV parser: quotes, escaped quotes, CRLF, and tab or comma delimiter. */
export function parseTable(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  if (!src.trim()) return [];
  const firstLine = src.split(/\r?\n/, 1)[0];
  const delim = firstLine.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const HEADER_SYNONYMS: Record<string, string[]> = {
  name: ["name", "full name", "fullname", "employee", "employee name", "person"],
  email: ["email", "email id", "email address", "work email", "mail"],
  title: ["title", "job title", "designation", "position", "role title"],
  department: ["department", "dept", "team", "function", "cost centre", "cost center"],
  location: ["location", "city", "office", "branch", "site"],
  role: ["role", "volopay role", "access", "access level", "permission"],
  managerEmail: ["manager", "manager email", "reports to", "reporting manager", "line manager"],
  isDeptManager: ["dept manager", "department manager", "is dept manager", "is department manager", "dept_manager"],
};

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}

export function mapHeaders(header: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  header.forEach((h, idx) => {
    const n = normHeader(h);
    for (const [key, syns] of Object.entries(HEADER_SYNONYMS)) {
      if (out[key] === undefined && syns.includes(n)) out[key] = idx;
    }
  });
  return out;
}

export function normaliseRole(raw: string): string {
  const r = raw.trim().toLowerCase();
  if (!r) return "Member";
  if (["admin", "administrator", "owner", "super admin"].includes(r)) return "Admin";
  if (["member", "employee", "user", "staff", "standard"].includes(r)) return "Member";
  if (["external accountant", "accountant", "ca", "auditor", "external"].includes(r)) return "External Accountant";
  return raw.trim();
}

const truthy = (s: string) => ["y", "yes", "true", "1", "x"].includes(s.trim().toLowerCase());

export interface PeopleParse {
  people: Person[];
  /** Columns we could not find; the people are still returned with blanks. */
  missingColumns: string[];
  unknownHeaders: string[];
}

export function parsePeople(text: string): PeopleParse {
  const table = parseTable(text);
  if (table.length === 0) return { people: [], missingColumns: [], unknownHeaders: [] };
  const header = table[0];
  const map = mapHeaders(header);
  const used = new Set(Object.values(map));
  const unknownHeaders = header.filter((_, i) => !used.has(i)).map((h) => h.trim()).filter(Boolean);
  const required = ["email", "department", "location"];
  const missingColumns = required.filter((k) => map[k] === undefined);
  const get = (r: string[], k: string) => (map[k] === undefined ? "" : (r[map[k]] ?? "").trim());
  const people: Person[] = table.slice(1).map((r, i) => ({
    name: get(r, "name"),
    email: get(r, "email").toLowerCase(),
    title: get(r, "title"),
    department: get(r, "department"),
    location: get(r, "location"),
    role: normaliseRole(get(r, "role")),
    managerEmail: get(r, "managerEmail").toLowerCase(),
    isDeptManager: truthy(get(r, "isDeptManager")),
    row: i + 2,
  }));
  return { people, missingColumns, unknownHeaders };
}

const SENIORITY: [RegExp, number][] = [
  [/\b(chief|ceo|cfo|cto|coo|cmo|president|founder|co-founder)\b/i, 5],
  [/\b(vp|vice president|svp|evp)\b/i, 4],
  [/\bhead\b/i, 4],
  [/\bdirector\b/i, 3],
  [/\b(senior manager|sr\.? manager)\b/i, 2.5],
  [/\bmanager\b/i, 2],
  [/\bcontroller\b/i, 2],
  [/\b(lead|team lead)\b/i, 1.5],
];

export function seniority(title: string): number {
  for (const [re, score] of SENIORITY) if (re.test(title)) return score;
  return 0;
}

/** Departments come from the people list. Managers: people marked as department manager,
 *  otherwise the most senior titled person in the department who is at least "manager" level
 *  (excluding C-level, who sit above departments). The source is recorded so it can be shown as inferred. */
export function deriveDepartments(people: Person[]): Department[] {
  const names: string[] = [];
  for (const p of people) if (p.department && !names.some((n) => n.toLowerCase() === p.department.toLowerCase())) names.push(p.department);
  return names.map((name) => {
    const inDept = people.filter((p) => p.department.toLowerCase() === name.toLowerCase() && p.email);
    const marked = inDept.filter((p) => p.isDeptManager);
    if (marked.length) return { name, managers: marked.map((p) => p.email), managerSource: "marked" as const };
    const ranked = inDept
      .map((p) => ({ p, s: seniority(p.title) }))
      .filter((x) => x.s >= 2 && x.s < 5)
      .sort((a, b) => b.s - a.s);
    if (ranked.length) {
      const top = ranked[0].s;
      return { name, managers: ranked.filter((x) => x.s === top).slice(0, 2).map((x) => x.p.email), managerSource: "title" as const };
    }
    // a department led by a C-level person (Finance by the CFO, Leadership by the CEO)
    const execs = inDept.filter((p) => seniority(p.title) >= 5);
    if (execs.length) return { name, managers: execs.slice(0, 1).map((p) => p.email), managerSource: "title" as const };
    return { name, managers: [], managerSource: "none" as const };
  });
}

export function deriveLocations(people: Person[]): string[] {
  const out: string[] = [];
  for (const p of people) if (p.location && !out.some((l) => l.toLowerCase() === p.location.toLowerCase())) out.push(p.location);
  return out;
}

export const isKnownRole = (r: string) => (KNOWN_ROLES as string[]).includes(r);

export function personByEmail(people: Person[], email: string): Person | undefined {
  const e = email.trim().toLowerCase();
  return people.find((p) => p.email === e);
}
