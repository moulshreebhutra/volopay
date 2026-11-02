import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTable, parsePeople, deriveDepartments } from "../lib/people";
import { parsePolicyText, buildPolicies } from "../lib/policy";
import { build } from "../lib/build";
import { simulate } from "../lib/simulate";
import { SAMPLE_PEOPLE, SAMPLE_POLICY } from "../lib/sample";
import type { Inputs } from "../lib/build";

const base: Inputs = {
  company: "Test", currency: "INR", accounting: "Tally",
  peopleText: SAMPLE_PEOPLE, policyText: SAMPLE_POLICY,
  makerChecker: { reimbursement: true, billpay: false, cards: true, payroll: false },
  submission: { receiptAbove: 25000, memoRequired: false },
};

test("csv: quotes, CRLF and tabs", () => {
  assert.deepEqual(parseTable('a,b\r\n"x, y",z\r\n'), [["a", "b"], ["x, y", "z"]]);
  assert.deepEqual(parseTable("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
});

test("people: headers are matched by synonym", () => {
  const r = parsePeople("Full Name,Email Address,Dept,City\nA B,a@x.co,Sales,Pune");
  assert.equal(r.people[0].department, "Sales");
  assert.equal(r.people[0].location, "Pune");
  assert.deepEqual(r.missingColumns, []);
});

test("policy: amounts with lakh, k and crore", () => {
  const p = parsePolicyText("Bills: up to 25k auto-approved; 25k to 2 lakh CFO; above 1 crore CEO");
  const r = p.modules[0].ranges;
  assert.equal(p.modules[0].module, "billpay");
  assert.deepEqual([r[0].from, r[0].to, r[0].auto], [0, 25000, true]);
  assert.deepEqual([r[1].from, r[1].to], [25000, 200000]);
  assert.deepEqual([r[2].from, r[2].to], [10000000, null]);
});

test("policy: 'and above', 'or less', ranges with dashes", () => {
  const p = parsePolicyText("Reimbursements: ₹5,000 or less manager; ₹5,000 - ₹50,000 finance controller; ₹50,000 and above CFO");
  const r = p.modules[0].ranges;
  assert.deepEqual([r[0].from, r[0].to], [0, 5000]);
  assert.deepEqual([r[1].from, r[1].to], [5000, 50000]);
  assert.deepEqual([r[2].from, r[2].to], [50000, null]);
  assert.deepEqual(r[1].tokens, ["finance controller"]);
});

test("policy: levels in order and not mistaken for amounts", () => {
  const p = parsePolicyText("Vendor bills above ₹2 lakh need level 2 approval: finance controller then CFO then CEO");
  assert.equal(p.modules[0].ranges.length, 1);
  assert.deepEqual(p.modules[0].ranges[0].tokens, ["finance controller", "cfo", "ceo"]);
});

test("sample: people, departments and managers", () => {
  const { people } = parsePeople(SAMPLE_PEOPLE);
  assert.equal(people.length, 21);
  const d = Object.fromEntries(deriveDepartments(people).map((x) => [x.name, x.managers]));
  assert.deepEqual(d["Engineering"], ["vikram@northwind.example"]);
  assert.deepEqual(d["Finance"], ["rohan@northwind.example"]);
  assert.deepEqual(d["Marketing"], []);
});

test("sample: department managers expand into department policies", () => {
  const b = build(base);
  const reimb = b.config.policies.filter((p) => p.module === "reimbursement");
  assert.equal(reimb.filter((p) => p.scope.type === "company").length, 1);
  assert.ok(reimb.filter((p) => p.scope.type === "department").length >= 6);
  const eng = reimb.find((p) => p.scope.type === "department" && p.scope.department === "Engineering")!;
  assert.deepEqual(eng.ranges[0].levels, ["vikram@northwind.example"]);
  const company = reimb.find((p) => p.scope.type === "company")!;
  assert.deepEqual(company.ranges[0].levels, []);
});

test("sample: the planted mistakes are found", () => {
  const ids = build(base).findings.map((f) => f.id);
  for (const id of ["invite-fields", "email-valid", "custom-role", "admin-count", "dept-manager", "manager-unknown", "location-dup", "range-gap", "range-start", "approver-unknown", "receipt-gap"]) {
    assert.ok(ids.includes(id), `missing finding ${id}`);
  }
});

test("clean input has no errors", () => {
  const people = `name,email,title,department,location,role
A One,a@x.co,CFO,Finance,Pune,Admin
B Two,b@x.co,CEO,Leadership,Pune,Admin
C Three,c@x.co,Engineering Manager,Engineering,Pune,Member`;
  const b = build({ ...base, peopleText: people, policyText: "Reimbursements: up to 5000 auto-approved; above 5000 CFO", submission: { receiptAbove: 0, memoRequired: false } });
  assert.deepEqual(b.findings.filter((f) => f.severity === "error"), []);
});

test("simulate: department override, then maker-checker fallback", () => {
  const b = build(base);
  const r = simulate(b.config, "reimbursement", "ananya@northwind.example", 3000);
  assert.equal(r.policy, "department");
  assert.equal(r.steps[0].email, "vikram@northwind.example");
  // CFO submitting a large claim: she is the only approver in the range, maker-checker removes her
  const cfo = simulate(b.config, "reimbursement", "priya@northwind.example", 80000);
  assert.equal(cfo.steps.length, 1);
  assert.equal(cfo.steps[0].kind, "admin-fallback");
  assert.match(cfo.steps[0].label, /no Admin|none besides/i);
});

test("simulate: an uncovered amount is reported", () => {
  const b = build(base);
  const r = simulate(b.config, "billpay", "rohan@northwind.example", 225000);
  assert.equal(r.uncovered, true);
});
