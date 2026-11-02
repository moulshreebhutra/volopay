import type { Metadata } from "next";
import { RULES, SOURCES } from "@/lib/rules";

export const metadata: Metadata = { title: "Method · Moulshree × Volopay", description: "What the studio checks, how sure each check is, what was read, and what it does not cover." };

const READ: [string, string][] = [
  ["Volopay India home and feature pages", "https://www.volopay.com/in/"],
  ["India multi-level approvals", "https://www.volopay.com/in/multi-level-approvals/"],
  ["India reimbursements", "https://www.volopay.com/in/employee-reimbursement/"],
  ["India expense policy", "https://www.volopay.com/in/expense-policy/"],
  ["India accounting automation and Tally", "https://www.volopay.com/in/accounting-automation/"],
  ["India UPI payments", "https://www.volopay.com/in/product/upi-payments/"],
  ["Reimbursements under GST", "https://www.volopay.com/in/expense-management/manage-employee-reimbursements-under-gst-rule/"],
  ["Pricing page (custom plans, no public prices)", "https://www.volopay.com/in/pricing/"],
  ["Urban Company case study", "https://www.volopay.com/in/customer/urban-company/"],
  ["Help centre: Admin Guide", SOURCES.admin.url],
  ["Help centre: Setting up Approval Policy", SOURCES.approval.url],
  ["Help centre: Settings for reimbursements", SOURCES.reimbursement.url],
  ["Help centre: Understanding Volopay roles", SOURCES.roles.url],
  ["Help centre: Expense Management collection (23 articles)", "https://help.volopay.co/en/collections/9878145-expense-management"],
  ["Help centre: Volopay Assistant (support access, not AI)", "https://help.volopay.co/en/articles/9656898-volopay-assistant-feature"],
  ["Volopay blog: multi-level approval", SOURCES.matrix.url],
  ["G2: Volopay reviews", "https://www.g2.com/products/Volopay/reviews"],
  ["G2: Happay, Volopay vs Zoho Expense", "https://www.g2.com/it/compare/happay-vs-volopay-vs-zoho-expense"],
  ["G2: Brex, Volopay vs SAP Concur", "https://www.g2.com/compare/brex-vs-volopay-vs-sap-concur"],
  ["Capterra: Volopay reviews", "https://www.capterra.co.uk/software/1015865/volopay"],
  ["Statrys: Volopay review", "https://statrys.com/reviews/volopay-business-account"],
];

export default function Method() {
  return (
    <div className="wrap narrow" style={{ padding: "48px 24px 72px" }}>
      <p className="eyebrow">Method</p>
      <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>What the studio checks, and how sure it is.</h1>
      <p className="lede">Read on 2 November 2026. Pages change, so each check points to the page it came from.</p>

      <h2 style={{ marginTop: 32 }}>Two kinds of check</h2>
      <p><span className="tag sourced">sourced</span> a Volopay page says it. <span className="tag inferred">inferred</span> my reasoning about what goes wrong; confirm it with Volopay before treating it as a rule. The studio shows the tag on every finding.</p>

      <h2 style={{ marginTop: 28 }}>The {RULES.length} checks</h2>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Check</th><th>What it looks for</th><th>Basis</th></tr></thead>
          <tbody>
            {RULES.map((r) => (
              <tr key={r.id}>
                <td><b>{r.title}</b></td>
                <td>{r.checks}{r.source && <> <a href={SOURCES[r.source].url} target="_blank" rel="noreferrer">[{SOURCES[r.source].label}]</a></>}</td>
                <td><span className={`tag ${r.basis}`}>{r.basis}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 32 }}>How the policy text is read</h2>
      <p>A built-in parser runs in the browser: it finds amounts (₹5,000, 25k, 2 lakh, 1 crore), reads &quot;up to&quot;, &quot;above&quot; and &quot;A to B&quot;, and takes approvers in order after &quot;then&quot;. It matches titles such as CFO or finance controller to people in the sheet. &quot;Manager&quot; is expanded into one department policy per department. If a server key is set, an optional AI pass re-reads the text; it sends only the policy text and job titles, and its output goes through the same checks. The AI pass is off on deployments without a key.</p>

      <h2 style={{ marginTop: 28 }}>What it does not cover</h2>
      <ul>
        <li>Approval conditions by category, project or merchant, delegation when an approver is absent, and Volopay&apos;s auto-decline rules for merchants. The India approvals page describes them; the studio models amount ranges and departments only.</li>
        <li>Budgets, card limits, bill-pay and reimbursement settings, payroll, expense review and flag rules, accounting field mapping.</li>
        <li>Whether levels are sequential or parallel, and the exact meaning of a range boundary (the guide says &quot;above X&quot;). The studio treats levels as sequential and a range as including its lower limit.</li>
        <li>Bulk invite. I did not find a bulk-invite article in the help centre; that is not proof there is none.</li>
        <li>Any link to a real Volopay workspace. I found no public API or import, so the output is a checklist and files for a person to key in.</li>
      </ul>

      <h2 style={{ marginTop: 28 }}>Honest limits of the evidence</h2>
      <ul>
        <li>The 7.1 approval score is from 28 reviews. G2&apos;s &quot;time to implement&quot; and &quot;ROI&quot; figures are review-based averages, not Volopay&apos;s numbers.</li>
        <li>The pain I describe in setup is a hypothesis from public pages. I have not talked to customers or seen the admin product.</li>
        <li>The sample company, people and amounts are invented.</li>
      </ul>

      <h2 style={{ marginTop: 28 }}>Privacy</h2>
      <p>The studio computes in your browser and stores nothing. The page never asks for credentials. Only the optional AI pass sends data (policy text and job titles, never names or emails).</p>

      <h2 style={{ marginTop: 28 }}>What I read</h2>
      <ul className="small">{READ.map(([l, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{l}</a></li>)}</ul>
    </div>
  );
}
