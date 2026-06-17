/**
 * seo.ts — server-side SEO injection for crawlable routes.
 *
 * The site is a client-rendered Vite SPA: the served HTML is just the shell, so a crawler that doesn't run our JS sees
 * no page-specific title, description, content, or schema. For routes we want to rank (e.g. /estimate), `injectSeo`
 * rewrites the served HTML — per-route <title> + meta description + canonical + Open Graph + JSON-LD into <head>, plus a
 * <noscript> mirror of the answer copy + FAQ into <body>. Called from server/vite.ts for BOTH dev (transformIndexHtml)
 * and prod (static index.html). The React app still boots into #root and takes over for humans.
 */
import { ESTIMATE_SEO, ESTIMATE_FAQ, estimateJsonLd } from "../shared/estimate-seo";
import { getCachedReviews } from "./reviews";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type RouteSeo = { title: string; description: string; canonical: string; jsonLd: () => object[]; noscript: string };

const ROUTES: Record<string, RouteSeo> = {
  "/estimate": {
    title: ESTIMATE_SEO.title,
    description: ESTIMATE_SEO.description,
    canonical: ESTIMATE_SEO.canonical,
    jsonLd: () => estimateJsonLd(getCachedReviews()),
    // Mirrors what the React page renders visibly (parity = not cloaking); the only crawlable copy if JS never runs.
    noscript:
      `<h1>${esc(ESTIMATE_SEO.h1)}</h1><p>${esc(ESTIMATE_SEO.intro)}</p>` +
      ESTIMATE_FAQ.map((f) => `<h2>${esc(f.q)}</h2><p>${esc(f.a)}</p>`).join(""),
  },
};

/** Rewrite the shell HTML with per-route SEO. Unknown routes pass through untouched. */
export function injectSeo(originalUrl: string, html: string): string {
  const pathname = (originalUrl || "/").split("?")[0].replace(/\/+$/, "") || "/";
  const r = ROUTES[pathname];
  if (!r) return html;

  if (/<title>[\s\S]*?<\/title>/.test(html)) html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`);
  if (/<meta\s+name="description"[^>]*>/.test(html)) html = html.replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${esc(r.description)}" />`);

  const head =
    [
      `<link rel="canonical" href="${r.canonical}" />`,
      `<meta property="og:title" content="${esc(r.title)}" />`,
      `<meta property="og:description" content="${esc(r.description)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${r.canonical}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      ...r.jsonLd().map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`),
    ].join("\n") + "\n";
  html = html.replace("</head>", `${head}</head>`);
  html = html.replace(/<body([^>]*)>/, `<body$1><noscript>${r.noscript}</noscript>`);
  return html;
}
