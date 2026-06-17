/**
 * reviews.ts — Sigma's live Google reviews, fetched once and cached.
 *
 * One source for BOTH:
 *   • GET /api/reviews  (home testimonials + the /estimate reviews strip)
 *   • server/seo.ts     (the RoofingContractor `aggregateRating` injected into the served /estimate HTML — that path is
 *                        SYNCHRONOUS, so it reads the cache via getCachedReviews(), never an async fetch).
 * Google Places Details is a paid call and returns ≤5 reviews; `rating` + `user_ratings_total` are the true aggregate.
 * Cache ~6h so neither a page view nor a crawler hit re-pays per request (the old inline handler fetched every time).
 */

export interface ReviewItem {
  name: string;
  role: string;
  rating: number;
  review: string;
  date: string;
  initials: string;
}
export interface BusinessReviews {
  ratingValue: number;
  reviewCount: number;
  reviews: ReviewItem[];
  businessName?: string;
}

const TTL_MS = 1000 * 60 * 60 * 6; // 6h
let cache: { data: BusinessReviews; ts: number } | null = null;
let inflight: Promise<void> | null = null;

const initialsOf = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

async function findPlaceId(apiKey: string): Promise<string> {
  const find = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent("SIGMA ROOFING LLC Edmond OK")}&inputtype=textquery&fields=place_id,name&key=${apiKey}`,
  );
  const fd: any = await find.json();
  if (fd.status === "OK" && fd.candidates?.length) return fd.candidates[0].place_id;
  // broader fallback search
  const text = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent("SIGMA ROOFING LLC Edmond Oklahoma")}&key=${apiKey}`,
  );
  const td: any = await text.json();
  if (td.status === "OK" && td.results?.length) return td.results[0].place_id;
  throw new Error(`Business not found in Google Places (find=${fd.status}, text=${td.status})`);
}

/** Fetch from Google Places + replace the cache. Coalesces concurrent calls. Throws on failure (callers swallow). */
export async function refreshReviews(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");
    const placeId = await findPlaceId(apiKey);
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`,
    );
    const data: any = await res.json();
    if (data.status !== "OK") throw new Error(`Places details status ${data.status}`);
    const raw: any[] = data.result.reviews || [];
    const reviews: ReviewItem[] = raw.map((r) => ({
      name: r.author_name,
      role: "Verified Customer",
      rating: r.rating,
      review: r.text,
      date: new Date(r.time * 1000).toLocaleDateString(),
      initials: initialsOf(r.author_name),
    }));
    cache = {
      data: {
        ratingValue: data.result.rating || 5.0,
        reviewCount: data.result.user_ratings_total || reviews.length,
        reviews,
        businessName: data.result.name,
      },
      ts: Date.now(),
    };
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** SYNC read for the SEO injector — returns the cache (maybe stale/null) and kicks a non-blocking refresh if needed. */
export function getCachedReviews(): BusinessReviews | null {
  if (!cache || Date.now() - cache.ts > TTL_MS) {
    refreshReviews().catch((e) => console.error("reviews refresh failed:", e?.message || e));
  }
  return cache?.data ?? null;
}

/** ASYNC read for the /api/reviews endpoint — awaits a fetch on a cold cache so the client gets data on first load. */
export async function getReviews(): Promise<BusinessReviews | null> {
  if (!cache || Date.now() - cache.ts > TTL_MS) {
    try {
      await refreshReviews();
    } catch (e: any) {
      console.error("reviews fetch failed:", e?.message || e);
    }
  }
  return cache?.data ?? null;
}
