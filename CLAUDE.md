# Sigma Roofing Website — oksigma.com

## Why This Website Exists

Antonio is the owner-operator of Sigma Roofing LLC in the OKC metro. He is a one-man show. His core function is signing contracts and putting meat on the table. Every minute he spends on technical work is a minute not spent closing deals. This website exists to do the work he can't be doing while he's knocking doors and signing contracts.

The website is a machine with one job: turn strangers into booked inspections. Everything on this site either moves someone closer to booking or it doesn't belong.

## How the Machine Works

**The funnel has three layers:**

1. **SocHub (Social Media Hub)** — the top of the funnel. Short-form videos, social proof, personality, expertise. This is what makes someone think "this isn't just another roofing company" or "this guy actually knows what he's talking about" or "I didn't expect this level of detail from a roofer." The SocHub draws people in. It builds trust before a single word is exchanged. It answers their questions before they ask. It entertains, informs, and impresses. It needs to be prominent — this is the creative engine that drives everything downstream.

2. **Google Reviews** — social proof from real customers. Reinforces what the videos started. Someone watching a video thinks "this seems legit" and then sees 5-star reviews confirming it. Removes doubt. These must auto-update — Antonio will never manually post reviews.

3. **The Appointment Form** — the conversion point. This is where all the marketing effort either pays off or doesn't. Name, phone, address, service type, book an inspection. The form captures the lead (SendGrid or equivalent) even if they bail before booking on Calendly. The Calendly integration books the appointment and syncs to Antonio's calendar. Every piece upstream exists to get someone to this form.

**The SocHub must link to the funnel.** If a video draws someone in, there must be a clear path from "I'm watching this" to "I'm booking an appointment." The SocHub is not a dead end — it's the entrance.

## Design Principles

- **Delete, don't master.** Antonio should not have to learn how anything technical works. If a task can be automated, automate it. If it requires Antonio's participation, minimize it to the absolute smallest action — drag and drop a video, type a title, done. No code touching. No terminal commands. No remembering how something works.

- **Document everything.** Because Antonio is not going to remember how this was built six months from now. Every integration, every API key, every service — document what it is, why it's there, how it connects, and how to fix it if it breaks. Write it for someone who has never seen the codebase. This documentation is what lets a future Claude Code session (or a future human) pick up immediately without detective work.

- **Automate where possible.** Reviews pull automatically. Videos upload via drag and drop. Form submissions trigger emails and calendar bookings without intervention. The less Antonio has to touch, the more time he has for his actual job.

- **Streamline uploads.** The SocHub needs a dead-simple upload workflow. There is already a drag-and-drop image system on the site — extend that pattern to video. Antonio records a video on his phone, uploads it somewhere simple, it appears on the site. That's the bar.

## Current Priorities

Priority 1: Fix the funnel (form, Calendly, email capture) — mostly done
Priority 2: Google Reviews auto-displaying on site
Priority 3: SocHub — video showcase, social links, upload workflow, funnel integration

## Context Preservation Protocol

### The Two Files in .context/

**STATE.md** — a short snapshot of where we are right now. What's done, what's next, what's broken, what's been tried. Updated at the end of every session. Any fresh session reads this first so it never starts blind.

**PLAN.md** — the current feature plan with checkboxes. One active plan at a time. When a feature is done, archive it (rename to plan-feature-name-done.md) and start a new one.

### Session Rules

**At session start (do this automatically without being asked):**
1. Read .context/STATE.md
2. Read .context/PLAN.md
3. Briefly confirm current state

**During work:**
- Offload research, log analysis, docs, and codebase exploration to subagents with a WHY
- If stuck in a loop, stop. Log what was tried and why to STATE.md. Suggest starting fresh.

**At session end (do this automatically without being asked):**
1. Update STATE.md
2. Update PLAN.md
3. Note any architectural decisions or new documentation needs

**When a feature is completed:**
- Archive the plan
- Document how it works, what services it uses, what credentials it depends on, and how to troubleshoot it — write this for someone who has never seen the codebase
