import type { AccountingTool, Config, Currency, Finding, Module, SubmissionPolicy } from "./model";
import { deriveDepartments } from "./people";
import { parsePeople, type PeopleParse } from "./people";
import { buildPolicies, parsePolicyText, type PolicyParse } from "./policy";
import { readiness, validate, type Readiness } from "./validate";

export interface Inputs {
  company: string;
  currency: Currency;
  accounting: AccountingTool;
  peopleText: string;
  policyText: string;
  makerChecker: Record<Module, boolean>;
  submission: SubmissionPolicy;
  /** Result of the optional AI pass, if it was run on the current policy text. */
  aiParse?: PolicyParse | null;
}

export interface Built {
  config: Config;
  peopleParse: PeopleParse;
  policyParse: PolicyParse;
  policyNotes: string[];
  findings: Finding[];
  readiness: Readiness;
  usedAi: boolean;
}

export function build(i: Inputs): Built {
  const peopleParse = parsePeople(i.peopleText);
  const departments = deriveDepartments(peopleParse.people);
  const policyParse = i.aiParse ?? parsePolicyText(i.policyText);
  const { policies, notes } = buildPolicies(policyParse, peopleParse.people, departments);
  const config: Config = {
    company: i.company,
    currency: i.currency,
    accounting: i.accounting,
    people: peopleParse.people,
    makerChecker: i.makerChecker,
    submission: i.submission,
    policies,
  };
  const findings = validate(config);
  return { config, peopleParse, policyParse, policyNotes: notes, findings, readiness: readiness(config, findings), usedAi: !!i.aiParse };
}
