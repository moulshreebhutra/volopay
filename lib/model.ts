/** Data model for a Volopay workspace setup, shaped after Volopay's own help-centre
 *  description of the admin setup (see lib/rules.ts for sources). */

export type Role = "Admin" | "Member" | "External Accountant";
export const KNOWN_ROLES: Role[] = ["Admin", "Member", "External Accountant"];

export type Module = "reimbursement" | "billpay" | "cards" | "payroll";
export const MODULES: { id: Module; label: string }[] = [
  { id: "reimbursement", label: "Reimbursements" },
  { id: "billpay", label: "Bill pay (vendor bills)" },
  { id: "cards", label: "Cards (new card requests, limit changes)" },
  { id: "payroll", label: "Payroll" },
];

export const CURRENCIES = ["INR", "SGD", "AUD", "IDR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Accounting integrations listed in Volopay's admin guide. */
export const ACCOUNTING_TOOLS = ["Tally", "Xero", "QuickBooks", "NetSuite", "MYOB", "ZohoBooks", "Universal CSV", "Other / not decided"] as const;
export type AccountingTool = (typeof ACCOUNTING_TOOLS)[number];

export interface Person {
  name: string;
  email: string;
  title: string;
  department: string;
  location: string;
  /** A known role, or any other text (treated as a custom role that must be created first). */
  role: string;
  managerEmail: string;
  /** Explicitly marked department manager in the input, if any. */
  isDeptManager: boolean;
  /** 1-based row in the input, for error messages. */
  row: number;
}

export interface Department {
  name: string;
  managers: string[]; // emails
  /** How the managers were found. */
  managerSource: "marked" | "title" | "none";
}

export interface Range {
  /** Inclusive lower bound. */
  from: number;
  /** Exclusive upper bound; null = no upper limit. */
  to: number | null;
  /** One approver (email or an unresolved marker) per level, in order. Empty = auto-approved. */
  levels: string[];
  /** The policy text said "auto-approved" for this range (as opposed to a level that could not be filled). */
  auto?: boolean;
  /** The policy text asked for the department manager at one level. */
  needsManager?: boolean;
}

export interface Policy {
  module: Module;
  scope: { type: "company" } | { type: "department"; department: string };
  ranges: Range[];
}

export interface SubmissionPolicy {
  /** Receipt required above this amount; 0 = always; null = never required. */
  receiptAbove: number | null;
  memoRequired: boolean;
}

export interface Config {
  company: string;
  currency: Currency;
  accounting: AccountingTool;
  people: Person[];
  /** Maker-checker per module: requester is removed from the chain and an Admin takes over. */
  makerChecker: Record<Module, boolean>;
  submission: SubmissionPolicy;
  policies: Policy[];
}

export const UNRESOLVED_PREFIX = "?unresolved:";
export const isUnresolved = (a: string) => a.startsWith(UNRESOLVED_PREFIX);
export const unresolvedLabel = (a: string) => a.slice(UNRESOLVED_PREFIX.length);

export type Severity = "error" | "warning" | "info";
/** How we know a rule: from Volopay's documentation, or our own reasoning. */
export type Basis = "sourced" | "inferred";

export interface Finding {
  id: string;
  severity: Severity;
  basis: Basis;
  title: string;
  detail: string;
  fix: string;
  /** Rows / names the finding is about. */
  where: string[];
}

export function money(n: number, currency: Currency): string {
  const sym: Record<Currency, string> = { INR: "₹", SGD: "S$", AUD: "A$", IDR: "Rp", USD: "$" };
  if (currency === "INR") return `${sym.INR}${n.toLocaleString("en-IN")}`;
  return `${sym[currency]}${n.toLocaleString("en-US")}`;
}
