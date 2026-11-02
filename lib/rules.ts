import type { Basis, Severity } from "./model";

/** The help-centre pages every "sourced" rule points to. */
export const SOURCES = {
  admin: { label: "Volopay Admin Guide", url: "https://help.volopay.co/en/articles/9546161-volopay-admin-guide" },
  approval: { label: "Setting up Approval Policy", url: "https://help.volopay.co/en/articles/9223187-setting-up-approval-policy" },
  reimbursement: { label: "Settings for reimbursements", url: "https://help.volopay.co/en/articles/5344555-settings-for-reimbursements" },
  roles: { label: "Understanding Volopay roles", url: "https://help.volopay.co/en/articles/9223814-understanding-volopay-roles" },
  matrix: { label: "Multi level approval workflow (Volopay blog)", url: "https://www.volopay.com/blog/multi-level-approval-for-reimbursement/" },
  invite: { label: "Inviting a user to Volopay", url: "https://help.volopay.co/en/articles/9223798-inviting-a-user-to-volopay" },
} as const;

export interface RuleMeta {
  id: string;
  title: string;
  severity: Severity;
  basis: Basis;
  /** What the rule checks, in a sentence. */
  checks: string;
  source?: keyof typeof SOURCES;
}

/** Every check the validator runs. `sourced` = a Volopay page says it; `inferred` = our reasoning
 *  about what goes wrong, which the CSM or admin should confirm. */
export const RULES: RuleMeta[] = [
  { id: "invite-fields", title: "Invite needs email, department and location", severity: "error", basis: "sourced", checks: "Every person has the three fields Volopay requires to invite them.", source: "admin" },
  { id: "email-valid", title: "Valid, unique email", severity: "error", basis: "inferred", checks: "Emails look valid and appear once (an invite is sent by email)." },
  { id: "custom-role", title: "Role is not one of the three standard roles", severity: "warning", basis: "sourced", checks: "Admin, Member and External Accountant are standard; any other role has to be created as a custom role before inviting.", source: "roles" },
  { id: "admin-count", title: "Admins who can run the workspace", severity: "error", basis: "sourced", checks: "At least one Admin exists. Only Admins invite users, issue cards, set limits and edit company settings; one lone Admin is a single point of failure.", source: "roles" },
  { id: "dept-manager", title: "Department has a manager", severity: "warning", basis: "sourced", checks: "Each department has at least one manager to add when the department is created.", source: "admin" },
  { id: "manager-unknown", title: "Manager is in the people list", severity: "warning", basis: "inferred", checks: "A person's manager email belongs to someone in the list." },
  { id: "location-dup", title: "Unique location names", severity: "error", basis: "sourced", checks: "Volopay rejects duplicate location names, so spellings that differ only by case or spaces collide.", source: "admin" },
  { id: "range-start", title: "Policy starts at zero", severity: "error", basis: "sourced", checks: "The first amount range starts at 0; Volopay's default policy covers 0 to no limit.", source: "reimbursement" },
  { id: "range-gap", title: "No gaps or overlaps between ranges", severity: "error", basis: "inferred", checks: "Each range starts where the previous one ends, so every amount has exactly one rule." },
  { id: "range-open", title: "Top range has no upper limit", severity: "warning", basis: "inferred", checks: "The highest range is open-ended so nothing above it is left without a rule." },
  { id: "range-limit", title: "At most 5 ranges", severity: "warning", basis: "sourced", checks: "Volopay's reimbursement guide allows up to 5 range limits per policy; confirm the limit for other modules.", source: "reimbursement" },
  { id: "level-limit", title: "At most 5 approval levels", severity: "error", basis: "sourced", checks: "Volopay's approval matrix goes up to 5 levels.", source: "matrix" },
  { id: "approver-unknown", title: "Approver exists", severity: "error", basis: "sourced", checks: "Approvers are individual users, so every approver must be a person in the workspace.", source: "approval" },
  { id: "dept-policy-manager", title: "Department policy has its manager", severity: "warning", basis: "inferred", checks: "A department policy that needs a manager level can only be filled if that department has a manager." },
  { id: "maker-checker", title: "Approvers who submit their own requests", severity: "info", basis: "sourced", checks: "With maker-checker on, a requester who is in the chain is removed and any Admin gives final approval; with it off they can approve themselves.", source: "approval" },
  { id: "maker-checker-admin", title: "Maker-checker needs an Admin to fall back to", severity: "warning", basis: "sourced", checks: "The docs do not say what happens if the only approver is the requester and no Admin is available.", source: "approval" },
  { id: "single-approver", title: "One person is the only approver for a range", severity: "info", basis: "inferred", checks: "A range whose only approver is one person stalls when they are away. Volopay's India approvals page says requests can be skipped or moved on when an approver is absent; confirm that is switched on." },
  { id: "dept-policy-dup", title: "Department policy repeats the company policy", severity: "info", basis: "inferred", checks: "A department override that matches the company policy adds upkeep and no control." },
  { id: "receipt-gap", title: "Receipts required only above the auto-approval limit", severity: "warning", basis: "inferred", checks: "Spend below the receipt threshold and below the auto-approval limit can be paid with no approver and no receipt." },
  { id: "india-invoice", title: "Tax invoices on bills (India)", severity: "info", basis: "inferred", checks: "For Indian companies, claiming GST input credit needs a valid tax invoice, so requiring a receipt on bill pay is safer." },
  { id: "accounting-tool", title: "Accounting software is supported", severity: "info", basis: "sourced", checks: "Xero, MYOB, QuickBooks, NetSuite, Tally, ZohoBooks and Universal CSV are listed; anything else needs Universal CSV or a custom integration.", source: "admin" },
];

export const RULE_BY_ID: Record<string, RuleMeta> = Object.fromEntries(RULES.map((r) => [r.id, r]));
