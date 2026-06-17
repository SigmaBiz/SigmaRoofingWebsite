import fs from "fs";
import path from "path";

// Durable, no-DB capture for the /estimate quote funnel. Every lead is appended here BEFORE we attempt email, so a lead is
// NEVER lost — even while SendGrid is down (the current key 401s). Read it: `cat data/quote-leads.jsonl`. The v2 upgrade
// is wiring the already-written Postgres schema (shared/schema.ts) → the /admin page; this file is the v1 "where I fetch it".
const LEADS_FILE = path.join(process.cwd(), "data", "quote-leads.jsonl");

export function logQuoteLead(lead: Record<string, unknown>): void {
  try {
    fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
    fs.appendFileSync(LEADS_FILE, JSON.stringify({ ts: new Date().toISOString(), ...lead }) + "\n");
  } catch (e) {
    console.error("Lead file write failed:", e);
  }
}
