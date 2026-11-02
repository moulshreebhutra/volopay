"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountingTool, Currency, Module, Severity } from "@/lib/model";
import { ACCOUNTING_TOOLS, CURRENCIES, MODULES, isUnresolved, money, unresolvedLabel } from "@/lib/model";
import { build, type Inputs } from "@/lib/build";
import { simulate } from "@/lib/simulate";
import { checklistMd, departmentsCsv, peopleInviteCsv, policiesCsv, policiesJson } from "@/lib/export";
import { deriveDepartments, personByEmail } from "@/lib/people";
import { EMPTY_PEOPLE_TEMPLATE, SAMPLE_COMPANY, SAMPLE_PEOPLE, SAMPLE_POLICY } from "@/lib/sample";
import type { PolicyParse } from "@/lib/policy";
import { SOURCES, RULE_BY_ID } from "@/lib/rules";

type Tab = "findings" | "policies" | "simulate" | "pack";

const DEFAULT_MC: Record<Module, boolean> = { reimbursement: true, billpay: true, cards: true, payroll: false };

function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Studio() {
  const [company, setCompany] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [accounting, setAccounting] = useState<AccountingTool>("Tally");
  const [peopleText, setPeopleText] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [mc, setMc] = useState<Record<Module, boolean>>(DEFAULT_MC);
  const [receiptMode, setReceiptMode] = useState<"never" | "always" | "above">("above");
  const [receiptAmount, setReceiptAmount] = useState(5000);
  const [memo, setMemo] = useState(false);
  const [tab, setTab] = useState<Tab>("findings");
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [ai, setAi] = useState<{ text: string; parse: PolicyParse } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((j) => setAiAvailable(!!j.ai)).catch(() => setAiAvailable(false));
  }, []);

  const inputs: Inputs = useMemo(() => ({
    company: company || "Your company",
    currency,
    accounting,
    peopleText,
    policyText,
    makerChecker: mc,
    submission: { receiptAbove: receiptMode === "never" ? null : receiptMode === "always" ? 0 : receiptAmount, memoRequired: memo },
    aiParse: ai && ai.text === policyText ? ai.parse : null,
  }), [company, currency, accounting, peopleText, policyText, mc, receiptMode, receiptAmount, memo, ai]);

  const built = useMemo(() => build(inputs), [inputs]);
  const { config, findings, readiness, peopleParse, policyNotes } = built;
  const departments = useMemo(() => deriveDepartments(config.people), [config.people]);

  function loadSample() {
    setCompany(SAMPLE_COMPANY);
    setCurrency("INR");
    setAccounting("Tally");
    setPeopleText(SAMPLE_PEOPLE);
    setPolicyText(SAMPLE_POLICY);
    setMc({ reimbursement: true, billpay: false, cards: true, payroll: false });
    setReceiptMode("above");
    setReceiptAmount(25000);
    setMemo(false);
    setAi(null);
    setTab("findings");
  }
  function clearAll() {
    setCompany(""); setPeopleText(""); setPolicyText(""); setAi(null); setAiError("");
  }

  async function runAi() {
    setAiBusy(true);
    setAiError("");
    try {
      const titles = [...new Set(config.people.map((p) => p.title).filter(Boolean))].slice(0, 60);
      const res = await fetch("/api/interpret", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: policyText, titles, currency }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "The AI pass failed");
      setAi({ text: policyText, parse: j.parse as PolicyParse });
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "The AI pass failed");
    } finally {
      setAiBusy(false);
    }
  }

  const usingAi = !!(ai && ai.text === policyText);
  const rangeCount = built.policyParse.modules.reduce((n, m) => n + m.ranges.length, 0);

  return (
    <div className="app">
      <aside className="rail" aria-label="Studio sections">
        {([["findings", "Checks", "M9 11l3 3 8-8M4 12v7a1 1 0 001 1h14"], ["policies", "Policies", "M4 6h16M4 12h16M4 18h10"], ["simulate", "Who approves?", "M4 12h4l3-7 4 14 3-7h2"], ["pack", "Setup pack", "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"]] as [Tab, string, string][]).map(([k, l, d]) => (
          <button key={k} aria-label={l} title={l} aria-current={tab === k} onClick={() => setTab(k)}><svg viewBox="0 0 24 24"><path d={d} /></svg></button>
        ))}
        <span className="sp" />
        <Link href="/method" aria-label="Method" title="Method" style={{ color: "var(--label)", display: "grid", placeItems: "center", width: 40, height: 40 }}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></svg></Link>
      </aside>
      <div className="appmain">
        <div className="topbar">
          <span className="badge">Concept · independent prototype, not affiliated with Volopay · sample data is invented</span>
          <span className="right">
            <Link href="/method" className="helppill">Quick help</Link>
            <span className="dot" aria-hidden><svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 004 0" /></svg></span>
            <span className="avatar"><b>MB</b>Moulshree</span>
          </span>
        </div>
        <div className="content">
          <p className="crumb">Setup Studio</p>
          <h1 className="pagetitle">Approval policy</h1>
          <p className="pagesub">Paste a team list and a policy in plain English. The studio builds a Volopay-shaped setup, checks it against rules from Volopay&apos;s own help pages, and lets you test any request before go-live. Your data stays in this browser.</p>
      <div className="appgrid">
        {/* ------------------------- inputs ------------------------- */}
        <div className="a-inputs">
          <div className="panel">
            <div className="row">
              <button className="btn" onClick={loadSample}>Load the sample company</button>
              <button className="btn ghost fixed" onClick={clearAll}>Clear</button>
            </div>
            <p className="status">Everything here runs in your browser. Nothing is stored. The sample is a made-up company with deliberate mistakes.</p>
          </div>

          <div className="panel">
            <h3>Company <span className="step">1</span></h3>
            <label htmlFor="co">Name</label>
            <input id="co" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Pvt Ltd" />
            <div className="row">
              <div>
                <label htmlFor="cur">Currency</label>
                <select id="cur" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label htmlFor="acc">Accounting software</label>
                <select id="acc" value={accounting} onChange={(e) => setAccounting(e.target.value as AccountingTool)}>{ACCOUNTING_TOOLS.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>People <span className="step">2</span></h3>
            <p className="small muted">Paste a sheet or upload a CSV. Needs <code>email</code>, <code>department</code>, <code>location</code>; <code>name</code>, <code>title</code>, <code>role</code>, <code>manager_email</code>, <code>dept_manager</code> help.</p>
            <label htmlFor="ppl">Team list (CSV or tab-separated)</label>
            <textarea id="ppl" value={peopleText} onChange={(e) => setPeopleText(e.target.value)} spellCheck={false} placeholder={EMPTY_PEOPLE_TEMPLATE} />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn ghost sm fixed" onClick={() => fileRef.current?.click()}>Upload CSV</button>
              <button className="btn ghost sm fixed" onClick={() => download("people-template.csv", EMPTY_PEOPLE_TEMPLATE, "text/csv")}>Download template</button>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPeopleText(await f.text()); e.target.value = ""; }} />
            </div>
            <div className="status">
              <b>{config.people.length}</b> people · <b>{departments.length}</b> departments
              {peopleParse.missingColumns.length > 0 && <> · <span className="bad">missing columns: {peopleParse.missingColumns.join(", ")}</span></>}
              {peopleParse.unknownHeaders.length > 0 && <> · ignored: {peopleParse.unknownHeaders.join(", ")}</>}
            </div>
          </div>

          <div className="panel">
            <h3>Approval policy, in plain English <span className="step">3</span></h3>
            <p className="small muted">One module per line, or start a line with the module name. Amounts like <code>₹5,000</code>, <code>25k</code>, <code>2 lakh</code>. Levels go in order: <code>finance controller then CFO</code>.</p>
            <label htmlFor="pol">Policy</label>
            <textarea id="pol" className="prose" value={policyText} onChange={(e) => setPolicyText(e.target.value)} placeholder={"Reimbursements: up to ₹5,000 manager approves; above ₹5,000 CFO.\nVendor bills: up to ₹25,000 auto-approved; above ₹25,000 finance controller then CFO."} />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn ghost sm fixed" disabled={!aiAvailable || aiBusy || !policyText.trim()} onClick={runAi} title={aiAvailable ? "Re-read the policy with an AI model" : "No AI key is set on this deployment; the built-in parser is used"}>
                {aiBusy ? "Reading…" : "Re-read with AI"}
              </button>
              {usingAi && <button className="btn ghost sm fixed" onClick={() => setAi(null)}>Back to built-in parser</button>}
            </div>
            <div className="status">
              {usingAi ? <>Using the <b>AI reading</b> (titles and your policy text were sent to a model; names and emails were not). </> : <>Using the <b>built-in parser</b> (offline). </>}
              Found <b>{rangeCount}</b> {rangeCount === 1 ? "rule" : "rules"} across <b>{built.policyParse.modules.length}</b> {built.policyParse.modules.length === 1 ? "module" : "modules"}.
              {!aiAvailable && <> AI reading is off on this deployment.</>}
            </div>
            {aiError && <p className="status bad">{aiError}</p>}
            {policyNotes.length > 0 && (
              <ul className="small muted" style={{ paddingLeft: 18, margin: "8px 0 0" }}>{policyNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            )}
          </div>

          <div className="panel">
            <h3>Controls <span className="step">4</span></h3>
            <label>Maker-checker (requester drops out of their own approval chain; an Admin steps in)</label>
            {MODULES.map((m) => (
              <label key={m.id} className="check"><input type="checkbox" checked={mc[m.id]} onChange={(e) => setMc({ ...mc, [m.id]: e.target.checked })} /> {m.label}</label>
            ))}
            <label htmlFor="rcpt">Receipt required</label>
            <div className="row">
              <select id="rcpt" value={receiptMode} onChange={(e) => setReceiptMode(e.target.value as typeof receiptMode)}>
                <option value="always">On every transaction</option>
                <option value="above">Above an amount</option>
                <option value="never">Never</option>
              </select>
              {receiptMode === "above" && <input type="number" min={0} value={receiptAmount} onChange={(e) => setReceiptAmount(Math.max(0, Number(e.target.value) || 0))} aria-label="Receipt threshold" />}
            </div>
            <label className="check"><input type="checkbox" checked={memo} onChange={(e) => setMemo(e.target.checked)} /> Memo required</label>
          </div>
        </div>

        {/* ------------------------- quick access + pending action ------------------------- */}
        <aside className="a-rail panel" aria-label="Quick access and pending checks">
          <h3 style={{ margin: 0 }}>Quick access</h3>
          <div className="qa">
            <button onClick={loadSample}><i className="g"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" /></svg></i>Load sample</button>
            <button onClick={() => fileRef.current?.click()}><i className="y"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0l-4 4m4-4l4 4M5 20h14" /></svg></i>Upload CSV</button>
            <button onClick={() => download("people-template.csv", EMPTY_PEOPLE_TEMPLATE, "text/csv")}><i className="p"><svg viewBox="0 0 24 24"><path d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" /></svg></i>Template</button>
            <button onClick={clearAll}><i className="k"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" /></svg></i>Clear</button>
          </div>
          <Link href="/method" className="viewall">View all checks</Link>
          <div className="pend">
            <h3>Pending action <em>{readiness.errors + readiness.warnings}</em></h3>
            {([["error", "Fix before inviting", readiness.errors], ["warning", "Review", readiness.warnings], ["info", "Notes", readiness.infos]] as [Severity, string, number][]).map(([sev, l, n]) => (
              <button key={sev} className={n === 0 ? "zero" : ""} onClick={() => { setFilter(sev); setTab("findings"); }}>
                <svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8M4 12v7a1 1 0 001 1h14" /></svg><span>{l}</span><b>{n}</b>
              </button>
            ))}
          </div>
        </aside>

        {/* ------------------------- results ------------------------- */}
        <div className="a-results">
          <div className="panel lg">
            <div className="score">
              <div className="ring" style={{ ["--p" as string]: readiness.score, ["--c" as string]: readiness.score >= 80 ? "var(--ok)" : readiness.score >= 50 ? "#d98a00" : "var(--err)" }}>
                <i>{readiness.score}</i>
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Setup readiness</h3>
                <p className="small muted" style={{ margin: "2px 0 6px" }}>
                  {readiness.errors} to fix before inviting · {readiness.warnings} to review · {readiness.infos} notes
                </p>
                <p className="small" style={{ margin: 0 }}>
                  To enter in Volopay: <b>{readiness.counts.people}</b> people, <b>{readiness.counts.departments}</b> departments, <b>{readiness.counts.locations}</b> locations, <b>{readiness.counts.policies}</b> policies (<b>{readiness.counts.ranges}</b> ranges).
                </p>
              </div>
            </div>
            <div className="tabs" role="tablist">
              {([["findings", `Checks (${findings.length})`], ["policies", "Policies"], ["simulate", "Who approves?"], ["pack", "Setup pack"]] as [Tab, string][]).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>

            {tab === "findings" && <Findings findings={findings} empty={config.people.length === 0} filter={filter} setFilter={setFilter} />}
            {tab === "policies" && <Policies built={built} />}
            {tab === "simulate" && <Simulator built={built} />}
            {tab === "pack" && <Pack built={built} />}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Findings({ findings, empty, filter, setFilter }: { findings: ReturnType<typeof build>["findings"]; empty: boolean; filter: Severity | "all"; setFilter: (f: Severity | "all") => void }) {
  if (empty) return <p className="muted">Load the sample company, or paste your team list, to see the checks.</p>;
  const shown = findings.filter((f) => filter === "all" || f.severity === filter);
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;
  return (
    <div>
      <div className="chips" role="group" aria-label="Filter checks">
        {([["all", `All ${findings.length}`], ["error", `Fix ${count("error")}`], ["warning", `Review ${count("warning")}`], ["info", `Notes ${count("info")}`]] as [Severity | "all", string][]).map(([k, l]) => (
          <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">Nothing here.</p>}
      {shown.map((f, i) => {
        const meta = RULE_BY_ID[f.id];
        const src = meta?.source ? SOURCES[meta.source] : null;
        return (
          <div key={i} className={`finding ${f.severity}`}>
            <span className={`tag ${f.severity}`}>{f.severity === "error" ? "fix" : f.severity === "warning" ? "review" : "note"}</span>{" "}
            <span className={`tag ${f.basis}`} title={f.basis === "sourced" ? "A Volopay page says this" : "Our reasoning; confirm with Volopay"}>{f.basis}</span>
            <h4>{f.title}</h4>
            <p>{f.detail}</p>
            <p className="fix"><b>Fix:</b> {f.fix}</p>
            {src && <p className="src">Source: <a href={src.url} target="_blank" rel="noreferrer">{src.label}</a></p>}
          </div>
        );
      })}
    </div>
  );
}

function who(cfg: ReturnType<typeof build>["config"], a: string) {
  if (isUnresolved(a)) return null;
  const p = personByEmail(cfg.people, a);
  return p ? p.name || p.email : a;
}

function Policies({ built }: { built: ReturnType<typeof build> }) {
  const { config } = built;
  if (!config.policies.length) return <p className="muted">No approval rules found yet. Write the policy in step 3.</p>;
  const mods = MODULES.filter((m) => config.policies.some((p) => p.module === m.id));
  return (
    <div>
      <p className="small muted">This is what would be keyed into Volopay under Manage › Settings, one policy per module, with department policies where a "manager" level is used.</p>
      {mods.map((m) => {
        const pols = config.policies.filter((p) => p.module === m.id);
        const company = pols.find((p) => p.scope.type === "company");
        const depts = pols.filter((p) => p.scope.type === "department");
        return (
          <div key={m.id} style={{ marginBottom: 18 }}>
            <h3>{m.label}</h3>
            {company && <PolicyBlock title="Company policy (default)" policy={company} cfg={config} open />}
            {depts.length > 0 && (
              <details>
                <summary>{depts.length} department {depts.length === 1 ? "policy" : "policies"}</summary>
                {depts.map((p, i) => <PolicyBlock key={i} title={p.scope.type === "department" ? p.scope.department : ""} policy={p} cfg={config} />)}
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PolicyBlock({ title, policy, cfg, open }: { title: string; policy: ReturnType<typeof build>["config"]["policies"][number]; cfg: ReturnType<typeof build>["config"]; open?: boolean }) {
  const body = (
    <div>
      {[...policy.ranges].sort((a, b) => a.from - b.from).map((r, i) => (
        <div className="range" key={i}>
          <div>{money(r.from, cfg.currency)} to {r.to === null ? "no limit" : money(r.to, cfg.currency)}</div>
          <div>
            {r.levels.length === 0 ? <span className="lvl">auto-approved</span> : r.levels.map((a, j) =>
              isUnresolved(a)
                ? <span key={j} className="lvl bad">L{j + 1} ? {unresolvedLabel(a)}</span>
                : <span key={j} className="lvl">L{j + 1} {who(cfg, a)}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
  if (open) return <div><p className="small" style={{ margin: "4px 0", fontWeight: 600 }}>{title}</p>{body}</div>;
  return <div style={{ marginTop: 8 }}><p className="small" style={{ margin: "4px 0", fontWeight: 600 }}>{title}</p>{body}</div>;
}

function Simulator({ built }: { built: ReturnType<typeof build> }) {
  const { config } = built;
  const [module, setModule] = useState<Module>("billpay");
  const [requester, setRequester] = useState("");
  const [amount, setAmount] = useState(80000);
  const people = config.people.filter((p) => p.email);
  const req = requester && personByEmail(config.people, requester) ? requester : people[0]?.email ?? "";
  if (!people.length) return <p className="muted">Add people first.</p>;
  const res = simulate(config, module, req, amount);
  const presets = [1000, 5000, 25000, 80000, 250000, 1000000];
  return (
    <div>
      <div className="row">
        <div><label htmlFor="sm">Module</label><select id="sm" value={module} onChange={(e) => setModule(e.target.value as Module)}>{MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></div>
        <div><label htmlFor="sr">Who submits it</label><select id="sr" value={req} onChange={(e) => setRequester(e.target.value)}>{people.map((p) => <option key={p.email} value={p.email}>{p.name || p.email}{p.title ? `, ${p.title}` : ""}</option>)}</select></div>
        <div><label htmlFor="sa">Amount ({config.currency})</label><input id="sa" type="number" min={0} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} /></div>
      </div>
      <div className="chips" style={{ marginTop: 8 }}>
        {presets.map((p) => <button key={p} className="chip" aria-pressed={amount === p} onClick={() => setAmount(p)}>{money(p, config.currency)}</button>)}
      </div>
      <div className="sim" aria-live="polite">
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
          {res.uncovered ? "No rule covers this" : res.autoApproved ? "Approved automatically" : `${res.steps.length} ${res.steps.length === 1 ? "approval" : "approvals"} needed`}
        </p>
        {res.steps.map((s) => (
          <div className="step-row" key={s.level}>
            <span className={`n ${s.kind === "admin-fallback" ? "admin" : s.kind === "unresolved" ? "bad" : ""}`}>{s.level}</span>
            <div><div>{s.label}</div>{s.note && <div className="small muted">{s.note}</div>}</div>
          </div>
        ))}
        <details style={{ marginTop: 10, background: "transparent" }}>
          <summary>Why</summary>
          <ol className="small" style={{ paddingLeft: 18 }}>{res.trace.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </details>
        <p className="small muted" style={{ margin: "8px 0 0" }}>A range includes its lower limit and excludes its upper limit. Volopay's docs say "above X" without saying whether X itself counts; check this with a test request.</p>
      </div>
    </div>
  );
}

function Pack({ built }: { built: ReturnType<typeof build> }) {
  const { config, findings } = built;
  const md = useMemo(() => checklistMd(config, findings), [config, findings]);
  const [copied, setCopied] = useState(false);
  if (!config.people.length) return <p className="muted">Add people first.</p>;
  const blockers = findings.filter((f) => f.severity === "error").length;
  return (
    <div>
      {blockers > 0 && <div className="note warn">{blockers} blocking {blockers === 1 ? "issue is" : "issues are"} still open. The pack is a draft until they are fixed.</div>}
      <p className="small muted" style={{ marginTop: 10 }}>
        Volopay has no public import for this, so the pack is what an Admin or a Customer Success Manager keys in (the Admin Guide mentions a "Red Carpet Onboarding" service for this). The checklist follows the order of the <a href={SOURCES.admin.url} target="_blank" rel="noreferrer">Admin Guide</a>.
      </p>
      <div className="dl">
        <button className="btn sm" onClick={() => download("people-invites.csv", peopleInviteCsv(config), "text/csv")}>people-invites.csv</button>
        <button className="btn sm" onClick={() => download("departments.csv", departmentsCsv(config), "text/csv")}>departments.csv</button>
        <button className="btn sm" onClick={() => download("approval-policies.csv", policiesCsv(config), "text/csv")}>approval-policies.csv</button>
        <button className="btn sm" onClick={() => download("approval-policies.json", policiesJson(config), "application/json")}>approval-policies.json</button>
        <button className="btn sm" onClick={() => download("setup-checklist.md", md, "text/markdown")}>setup-checklist.md</button>
        <button className="btn ghost sm" onClick={async () => { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy checklist"}</button>
      </div>
      <pre className="out">{md}</pre>
    </div>
  );
}
