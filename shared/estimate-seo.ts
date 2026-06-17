/**
 * estimate-seo.ts — SINGLE SOURCE OF TRUTH for the /estimate page's SEO.
 *
 * Imported by BOTH:
 *   • server/seo.ts        → injects the JSON-LD + meta into the SERVED HTML (the site is a CSR SPA, so without this the
 *                            answer copy + schema aren't in the HTML Google fetches — the "neutrino" that kneecaps ranking).
 *   • client/.../estimate.tsx → renders the SAME FAQ + intro VISIBLY on the page.
 * Schema must mirror visible content (Google's structured-data policy), so they share this module. PURE DATA — no node/
 * browser APIs — so it's safe to import on both sides. Business facts are lifted from the live home page (footer/about):
 * LIC#80006734 · 16612 N Western Ave, Edmond OK 73012 · (405) 902-5266 · 5.0★ Google · @sigmaroofing405.
 */

export const BIZ = {
  name: "Sigma Roofing LLC",
  url: "https://oksigma.com",
  origin: "https://oksigma.com",
  telephone: "+14059025266",
  telephoneDisplay: "(405) 902-5266",
  email: "aescalante@oksigma.com",
  street: "16612 N Western Avenue",
  city: "Edmond",
  region: "OK",
  postal: "73012",
  country: "US",
  lat: 35.6529,
  lng: -97.4779,
  license: "LIC#80006734",
  logo: "https://oksigma.com/sigma-logo.png",
  sameAs: ["https://www.tiktok.com/@sigmaroofing405", "https://www.instagram.com/sigmaroofing405"],
  areaServed: ["Edmond", "Oklahoma City", "Norman", "Moore", "Yukon", "Mustang", "Bethany", "Del City", "Midwest City", "Piedmont", "Deer Creek", "Nichols Hills"],
  priceRange: "$$",
} as const;

export const ESTIMATE_SEO = {
  title: "Roof Replacement Cost: 2,200 Sq Ft House in OKC | Sigma Roofing",
  description:
    "Roof replacement on a 2,200 sq ft house runs about $10,500–$13,000 in the OKC metro. Get an instant, address-measured estimate from Sigma Roofing — free, no phone call.",
  canonical: "https://oksigma.com/estimate",
  h1: "How much does it cost to replace a roof on a 2,200 sq ft house?",
  intro:
    "In the Oklahoma City metro, replacing the roof on a typical 2,200 sq ft single-story home runs about $10,500–$13,000 for a full architectural-shingle tear-off — roughly 24 squares of roof. The same floor area spread over two stories has a smaller roof footprint and costs less. Because “2,200 sq ft” is your floor area, not your roof area, the real number depends on your roof's footprint, pitch, and shape. Enter your address and Sigma Roofing measures your actual roof from aerial data in seconds.",
} as const;

// Cost-intent Q&As — rendered visibly on the page AND emitted as FAQPage schema (kept identical for policy parity).
export const ESTIMATE_FAQ: { q: string; a: string }[] = [
  {
    q: "How much does it cost to replace a roof on a 2,200 sq ft house?",
    a: "In the Oklahoma City metro, a 2,200 sq ft single-story home has about 24 squares of roof and typically runs $10,500–$13,000 for a full architectural-shingle replacement with tear-off. A two-story home with the same floor area has a smaller roof footprint and usually costs less. Enter your address for an exact measured estimate.",
  },
  {
    q: "How many squares is a 2,200 square foot roof?",
    a: "A “square” is 100 sq ft of roof surface. A 2,200 sq ft single-story home covers roughly 2,400 sq ft of roof — about 24 squares — once pitch and overhangs are included. The same floor area over two stories is closer to 13 squares.",
  },
  {
    q: "How much does a new roof cost in Oklahoma City?",
    a: "Most full architectural-shingle replacements in the OKC metro fall between about $4.50 and $7.00 per square foot of roof — roughly $9,000 to $20,000+ depending on the roof's size, pitch, number of facets, and complexity.",
  },
  {
    q: "What's included in a roof replacement estimate?",
    a: "A full tear-off (no re-decking), underlayment, architectural shingles, starter strip, drip edge, hip and ridge cap, ridge ventilation, and pipe-jack and gas-vent flashing. Decking replacement, chimney and skylight flashing, and gutters are priced separately at the inspection.",
  },
  {
    q: "Does the price depend on roof pitch and shape?",
    a: "Yes. Steeper pitches add material and labor, and more facets, hips, and valleys add cut waste and flashing. That's why two same-size houses can differ by thousands of dollars — and why Sigma measures your actual roof from aerial data instead of guessing from floor area.",
  },
  {
    q: "Is the instant roof estimate a real quote?",
    a: "It's an accurate ballpark built from Google aerial measurements and real Oklahoma City material and labor prices, meant to set expectations. The exact, guaranteed number comes from a free on-site inspection.",
  },
];

/** Live Google rating passed in by the server (client never builds LD). Structurally compatible with server BusinessReviews. */
export type LiveRating = {
  ratingValue: number;
  reviewCount: number;
  reviews?: { name: string; rating: number; review: string }[];
};

/** RoofingContractor / LocalBusiness entity — NAP, license, service area, socials, + live Google rating when provided. */
export function roofingContractorLd(rating?: LiveRating | null) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["RoofingContractor", "LocalBusiness"],
    "@id": `${BIZ.origin}/#business`,
    name: BIZ.name,
    url: BIZ.url,
    telephone: BIZ.telephone,
    email: BIZ.email,
    image: BIZ.logo,
    logo: BIZ.logo,
    description:
      "Licensed, insured roofing contractor in Edmond and the Oklahoma City metro — roof replacement, storm-damage restoration, and free roof inspections.",
    priceRange: BIZ.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: BIZ.street,
      addressLocality: BIZ.city,
      addressRegion: BIZ.region,
      postalCode: BIZ.postal,
      addressCountry: BIZ.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: BIZ.lat, longitude: BIZ.lng },
    areaServed: BIZ.areaServed.map((c) => ({ "@type": "City", name: c })),
    sameAs: [...BIZ.sameAs],
    identifier: { "@type": "PropertyValue", propertyID: "Oklahoma Contractor License", value: BIZ.license },
    knowsAbout: ["Roof replacement", "Storm damage restoration", "Architectural shingles", "Roof inspection", "Roofing cost estimate"],
  };
  // Live Google rating → aggregateRating + up to 3 Review objects (backed by the reviews shown on the page). Omitted on cold/failed cache.
  if (rating && rating.ratingValue > 0 && rating.reviewCount > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.ratingValue,
      reviewCount: rating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
    if (rating.reviews?.length) {
      ld.review = rating.reviews.slice(0, 3).map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.name },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        reviewBody: r.review,
      }));
    }
  }
  return ld;
}

/** FAQPage built from ESTIMATE_FAQ (the same Q&As shown on the page). */
export function faqPageLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ESTIMATE_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** All JSON-LD blocks for /estimate. Pass the live Google rating to enrich the business entity with aggregateRating + reviews. */
export function estimateJsonLd(rating?: LiveRating | null) {
  return [roofingContractorLd(rating), faqPageLd()];
}
