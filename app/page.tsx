import Link from "next/link";
import { ABOUT } from "@/lib/about";
import Typewriter from "@/components/Typewriter";

const SRC = {
  india: "https://www.volopay.com/in/",
  multi: "https://www.volopay.com/in/multi-level-approvals/",
  admin: "https://help.volopay.co/en/articles/9546161-volopay-admin-guide",
  approval: "https://help.volopay.co/en/articles/9223187-setting-up-approval-policy",
  expColl: "https://help.volopay.co/en/collections/9878145-expense-management",
  g2: "https://www.g2.com/products/Volopay/reviews",
  g2cmp: "https://www.g2.com/it/compare/happay-vs-volopay-vs-zoho-expense",
  g2cmp2: "https://www.g2.com/compare/brex-vs-volopay-vs-sap-concur",
  capterra: "https://www.capterra.co.uk/software/1015865/volopay",
  job: "https://www.linkedin.com/jobs/",
};

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Application · Founder&apos;s Office, Product · Bengaluru</p>
          <h1 style={{ maxWidth: "18ch" }}>
            Hey Volopay, I&apos;d love to help you make setup the fast part.
            <Typewriter phrases={["Write the approval policy.", "See who approves what.", "Catch mistakes before go-live.", "Hand off a setup pack."]} />
          </h1>
          <p className="lede">
            I&apos;m Moulshree, an AI-native PM with a strong design sense. I&apos;ve spent 3+ years building and scaling 0→1 B2B SaaS products at a startup. I like figuring out what&apos;s worth solving, then building the first version myself.
          </p>
          <p className="lede" style={{ marginTop: 10 }}>
            Along with applying, I read your India site, help centre and reviews, found one problem worth solving, and built a working prototype for it.
          </p>
          <div className="actions">
            <Link href="/studio" className="btn">Try the Setup Studio →</Link>
            <a href="#noticed" className="btn ghost">What I noticed</a>
            <a href="#plan" className="btn ghost">My 30/60/90 plan</a>
          </div>
          <div className="toc" aria-label="On this page">
            <a href="#why">Why hire me</a><a href="#noticed">What I noticed</a><a href="#built">What I built</a><a href="#measure">How I&apos;d measure it</a><a href="#plan">30/60/90</a><a href="#talk">Let&apos;s talk</a>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- why */}
      <section id="why" className="sect alt">
        <div className="wrap">
          <p className="eyebrow">Why hire me</p>
          <h2>The job post describes how I already work.</h2>
          <p className="lede">
            You want someone who speaks to users, makes the product call, builds the first version with AI tools, connects the systems and takes it live. At Vudio.ai I did that with a founder, across product, customer success and design.
          </p>
          <div className="stats">
            <div className="stat"><b>30x</b><span>ARR growth in two years, $10K to $300K</span></div>
            <div className="stat"><b>~74%</b><span>activation lift from self-serve onboarding</span></div>
            <div className="stat"><b>13 → 4 days</b><span>turnaround, about 69% faster</span></div>
            <div className="stat"><b>1,000+</b><span>clients, including Shoppers Stop and Godrej</span></div>
          </div>
          <p className="small muted">I contributed to these as a founding APM. Four zero-to-one launches: AI Studio, Content Library, Social Media Posting, DM Automation.</p>

          <div className="grid2" style={{ marginTop: 20 }}>
            <div className="card"><h3>Find problems worth solving</h3><p className="small">I found AI Studio&apos;s problem in customer calls, then cut scope and shipped. I was also on feedback and reviews, so I heard merchants first hand.</p></div>
            <div className="card"><h3>Make the product call</h3><p className="small">I wrote problem-first specs, decided what belonged in version one, and launched with A/B tests and staged rollouts. AI Studio became the most-used feature within 60 days.</p></div>
            <div className="card"><h3>Build it myself</h3><p className="small">I prototype with Claude Code, Cursor and n8n, and I&apos;m comfortable with Django and React, SQL and REST APIs. At Vudio I built internal AI workflows for feedback analysis and automated client emails.</p></div>
            <div className="card"><h3>Take it live and track it</h3><p className="small">I owned onboarding end to end: I rebuilt self-serve onboarding and the core widgets module in four weeks, and built the analytics dashboard that lifted free-to-paid conversion by about 10%.</p></div>
          </div>

          <div className="note" style={{ marginTop: 20 }}>
            <b>What I&apos;ll need to learn fast.</b> I haven&apos;t worked in payments or cards before, and the post says fintech experience is a plus, not a requirement. I&apos;d rather say that up front. My first weeks would go on how spend, approvals and accounting sync work in India: GST invoices, Tally, UPI and bank rails, by setting up a test account end to end and sitting in on onboarding calls.
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- noticed */}
      <section id="noticed" className="sect">
        <div className="wrap">
          <p className="eyebrow">What I noticed</p>
          <h2>Setup is heavy, and approvals are where reviewers score you lowest.</h2>
          <p className="lede">
            I read the India site and its feature pages, the help centre (Admin Guide, approvals, roles, reimbursements, accounting), the case studies, and public reviews. This is an outsider&apos;s read, so please correct me where I&apos;m wrong.
          </p>

          <h3 style={{ marginTop: 26 }}>What Volopay is, as I understand it</h3>
          <p>
            A spend platform for Indian businesses: physical and unlimited virtual cards (including UPI-enabled ones), vendor payouts by NEFT, RTGS, IMPS and UPI, reimbursements with OCR, multi-level approvals, and accounting sync to Tally, NetSuite, Xero, QuickBooks, Zoho Books and others. Pricing is custom, with no public plans. <a href={SRC.india} target="_blank" rel="noreferrer">volopay.com/in</a>
          </p>

          <div className="grid2" style={{ marginTop: 16 }}>
            <div className="card">
              <span className="tag sourced">sourced</span>
              <h3 style={{ marginTop: 8 }}>1. Setup has a lot of moving parts, and a person usually does it</h3>
              <p className="small">
                The <a href={SRC.admin} target="_blank" rel="noreferrer">Admin Guide</a> walks through six areas: users and roles, departments, locations, approval and submission policies, module settings, and accounting. It mentions a &quot;Red Carpet Onboarding&quot; service you request through your Customer Success Manager. On <a href={SRC.g2} target="_blank" rel="noreferrer">G2</a>, review-based averages show about 2 months to implement and 12 months to ROI, which sits oddly beside the &quot;fastest implementation&quot; badge.
              </p>
              <p className="small muted">Hypothesis: much of those weeks is gathering and deciding policy, not clicking.</p>
            </div>
            <div className="card">
              <span className="tag sourced">sourced</span>
              <h3 style={{ marginTop: 8 }}>2. Approvals are the lowest-scoring feature on G2</h3>
              <p className="small">
                &quot;Complex Approval Workflow&quot; scores <b>7.1</b> from 28 Volopay reviews, against <a href={SRC.g2cmp} target="_blank" rel="noreferrer">8.8 for Happay and 7.9 for Zoho Expense</a>, and <a href={SRC.g2cmp2} target="_blank" rel="noreferrer">8.7 for Brex and 8.1 for SAP Concur</a>. It is a small sample, so I read it as a pointer, not a verdict.
              </p>
              <p className="small muted">The <a href={SRC.expColl} target="_blank" rel="noreferrer">help centre</a> has 23 articles just on approval, submission and review policies, flag rules and alerts. That is a lot to configure.</p>
            </div>
            <div className="card">
              <span className="tag sourced">sourced</span>
              <h3 style={{ marginTop: 8 }}>3. Approvers are individual people, so &quot;the manager approves&quot; has to be spelled out per department</h3>
              <p className="small">
                The <a href={SRC.approval} target="_blank" rel="noreferrer">approval policy guide</a> picks users as approvers, per amount range, per module, with department or project overrides, and a maker-checker toggle that swaps the requester for an Admin. A company that thinks in roles (&quot;manager, then finance head, then CFO&quot;) has to translate that by hand.
              </p>
            </div>
            <div className="card">
              <span className="tag inferred">inferred</span>
              <h3 style={{ marginTop: 8 }}>4. AI is thin in public</h3>
              <p className="small">
                The only AI I could find named is OCR on receipts and invoices. Competitors such as Weel advertise AI GST extraction and GL auto-categorisation, and Spentro pitches GST-native AI for India. I may be missing roadmap work.
              </p>
            </div>
          </div>
          <p className="src" style={{ marginTop: 14 }}>
            Also read: <a href={SRC.multi} target="_blank" rel="noreferrer">India multi-level approvals</a>, <a href={SRC.capterra} target="_blank" rel="noreferrer">Capterra</a> (reviewers mention manual fields such as receipt upload and GL code, and a confusing new interface), plus the UPI, reimbursement, GST and accounting pages. Full list on the <Link href="/method">method page</Link>.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- built */}
      <section id="built" className="sect alt">
        <div className="wrap">
          <p className="eyebrow">What I built</p>
          <h2>Setup Studio: write the approval policy, see who approves what before go-live.</h2>
          <p className="lede">
            A new customer pastes their team list and their policy in plain English. The studio turns it into a Volopay-shaped setup, checks it against rules from your own help pages, and lets anyone test a request before it exists.
          </p>
          <div className="grid2" style={{ marginTop: 18 }}>
            <div className="card"><h3>1. Read</h3><p className="small">A team sheet (CSV) and sentences like &quot;up to ₹5,000 manager approves; above that, finance controller then CFO&quot;. Lakh, crore and k are understood. &quot;Manager&quot; becomes one department policy per department, because Volopay approvers are individual people.</p></div>
            <div className="card"><h3>2. Check</h3><p className="small">21 checks, each tagged <span className="tag sourced">sourced</span> (a Volopay page says it) or <span className="tag inferred">inferred</span> (my reasoning). Gaps between amount ranges, approvers who are not in the workspace, departments without a manager, duplicate locations, a lone Admin, receipts not required where nobody approves.</p></div>
            <div className="card"><h3>3. Simulate</h3><p className="small">Pick a requester, module and amount. See the chain, including the maker-checker twist: a CFO&apos;s own large bill falls to an Admin, who may be her.</p></div>
            <div className="card"><h3>4. Hand off</h3><p className="small">A setup pack in the order of the Admin Guide: invite sheet, departments, policies, and a checklist a Customer Success Manager or Admin can key in. There is no public import, so I did not pretend to write to Volopay.</p></div>
          </div>
          <div className="actions" style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/studio" className="btn">Open the studio and load the sample company →</Link>
            <a className="btn ghost" href={ABOUT.repo} target="_blank" rel="noreferrer">Source on GitHub</a>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            The sample company is invented and has mistakes on purpose. I have not seen Volopay&apos;s admin screens or any customer data. See the <Link href="/method">method page</Link> for what is sourced, what is a guess, and what the studio does not cover.
          </p>

          <h3 style={{ marginTop: 28 }}>Other ideas I looked at</h3>
          <p className="small">I picked this one because it attacks the lowest-scoring feature and the slowest part of onboarding, and I can show it working today. The others, in the order I would try them:</p>
          <ul className="small">
            <li><b>Receipt chaser over WhatsApp or Telegram:</b> asks cardholders for missing receipts, reads the photo, proposes GL code and GST, and sends low-confidence items to finance.</li>
            <li><b>Rules that learn:</b> turns coding history into suggested accounting rules, and shows the share of transactions auto-coded.</li>
            <li><b>Voice-of-customer and competitor radar:</b> a weekly digest for the founders from reviews, tickets and competitor changelogs.</li>
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- measure */}
      <section id="measure" className="sect">
        <div className="wrap">
          <p className="eyebrow">How I&apos;d measure it</p>
          <h2>One number, three inputs, two guardrails.</h2>
          <div className="grid2">
            <div className="card"><h3>North star</h3><p className="small"><b>Days from signed contract to the first approved payment.</b> I don&apos;t know today&apos;s number; the first job is to measure it on recent accounts.</p></div>
            <div className="card"><h3>Inputs</h3><ul className="small"><li>Share of setup packs a Customer Success Manager accepts without edits</li><li>Blocking issues found per setup, and how many are fixed before go-live</li><li>Approval-policy changes in the first 30 days (rework)</li></ul></div>
            <div className="card"><h3>Guardrails</h3><ul className="small"><li>No increase in wrongly routed or stuck approvals</li><li>Customer Success Manager hours per setup go down, not just move</li></ul></div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- plan */}
      <section id="plan" className="sect alt">
        <div className="wrap">
          <p className="eyebrow">My 30/60/90 day plan</p>
          <h2>Learn like a customer, ship small, then own an outcome.</h2>
          <div className="plan">
            <div className="card">
              <b className="big">30</b><h3>Listen and map</h3>
              <ul>
                <li>Shadow Red Carpet Onboarding and Customer Success calls on a handful of accounts; time each step and note where weeks go</li>
                <li>Read recent support tickets on approvals and policies, and rank the problems with evidence</li>
                <li>Set up a test workspace end to end, including Tally</li>
                <li>Walk the admin flows with engineering: data model, APIs, what can be imported</li>
                <li>Ship one small thing for the founders: the setup pack, used on real accounts</li>
              </ul>
              <p className="small muted">Output: a map of where onboarding time goes, and a pack the team uses.</p>
            </div>
            <div className="card">
              <b className="big">60</b><h3>Prove</h3>
              <ul>
                <li>Turn the top friction into a prototype inside the admin flow, for example policy templates by company size and a &quot;who approves this?&quot; preview</li>
                <li>Test it with 5 customers or Customer Success Managers; fix what they trip on</li>
                <li>Instrument time to first card and first approved payment</li>
                <li>Build one automation the founders asked for, with the team that uses it</li>
              </ul>
              <p className="small muted">Output: one measured improvement and a first onboarding dashboard.</p>
            </div>
            <div className="card">
              <b className="big">90</b><h3>Own an outcome</h3>
              <ul>
                <li>Take one metric, for example setup finished within 7 days, and run two experiments on it</li>
                <li>Work with engineering on an import or API so the pack goes in without re-keying</li>
                <li>Write up what worked and what didn&apos;t</li>
                <li>Propose next quarter&apos;s bets, with a clear &quot;not now&quot; list</li>
              </ul>
              <p className="small muted">Output: a measured result on something I own, and a roadmap proposal.</p>
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>This will change once I see real data. The approach stays the same.</p>
        </div>
      </section>

      {/* ---------------------------------------------------------- talk */}
      <section id="talk" className="sect">
        <div className="wrap narrow">
          <p className="eyebrow">Let&apos;s talk</p>
          <h2>I&apos;d love to build with your founders.</h2>
          <p>Thanks for reading all the way down. I&apos;d be glad to walk you through the studio, or to be told where I got Volopay wrong.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn" href={`mailto:${ABOUT.email}?subject=Founder%27s%20Office%2C%20Product%20%C2%B7%20Moulshree%20Bhutra`}>Say hello</a>
            <a className="btn ghost" href={ABOUT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="btn ghost" href={ABOUT.portfolio} target="_blank" rel="noreferrer">Portfolio</a>
            <a className="btn ghost" href={ABOUT.resume} target="_blank" rel="noreferrer">Resume</a>
          </div>
        </div>
      </section>
    </>
  );
}
