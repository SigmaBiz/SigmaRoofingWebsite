/**
 * turnstile.ts — server-side Cloudflare Turnstile verification (the bot wall for /api/estimate).
 *
 * The widget on the page is NOT the protection — THIS is: /api/estimate calls verifyTurnstile() with the
 * client's token BEFORE any Google call, so a bot hitting the API directly (no/invalid token) spends $0.
 *
 * Keys (.env): TURNSTILE_SECRET_KEY (server, here) + VITE_TURNSTILE_SITE_KEY (client widget). Antonio creates a
 * free Turnstile site for the real pair; dev falls back to Cloudflare's always-pass TEST keys.
 *
 * Failure policy (this is a money page):
 *  - secret UNSET            -> skip (don't block local dev / a fresh clone)
 *  - secret set, no/bad token -> REJECT (the bot case)
 *  - secret set, verify throws (Cloudflare unreachable, rare) -> FAIL OPEN so real customers aren't blocked during
 *    an outage; the 150/day app cap is the real cost ceiling behind it either way.
 */
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult = { ok: boolean; reason: "ok" | "skipped" | "missing" | "failed" | "degraded" };

export async function verifyTurnstile(token: unknown, ip?: string): Promise<TurnstileResult> {
  // DEV-ONLY escape hatch (.env: TURNSTILE_DEV_BYPASS=1) — skip the bot wall when testing on a phone over the LAN IP.
  // The Turnstile widget only trusts localhost + the registered domains, so a LAN-IP origin (e.g. 192.168.x.x via the
  // QR code) can't mint a valid token and every submit 403s. NEVER set this in production — oksigma.com keeps the wall.
  if (process.env.TURNSTILE_DEV_BYPASS === "1") return { ok: true, reason: "skipped" };
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, reason: "skipped" };
  if (typeof token !== "string" || !token) return { ok: false, reason: "missing" };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const r = await fetch(SITEVERIFY, { method: "POST", body });
    const d: any = await r.json();
    if (!d?.success) console.warn("⚠️  Turnstile verify rejected a token:", JSON.stringify(d?.["error-codes"] ?? d), "— note: 'hostname-mismatch' = add that domain to the widget's allowed hostnames; 'timeout-or-duplicate'/'invalid-input-response' = an expired/automated token (real browsers pass).");
    return d?.success ? { ok: true, reason: "ok" } : { ok: false, reason: "failed" };
  } catch {
    return { ok: true, reason: "degraded" };
  }
}
