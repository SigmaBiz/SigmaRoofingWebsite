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
    a: "The difference the details make on the cost of a roof make a generalized estimate of little use. That is why we created our tool which will give you the cost (with the products we know and trust) of what is required on all roofs including edge metal, underlayment, shingles, hip and ridge caps, ventilation, standard flashing components, and additional supplies and labors necessary to get the job done.",
  },
  {
    q: "How long will it take to replace my roof?",
    a: "Medium (30 SQ) to medium-large (45 SQ) roofs can generally be done in a day since for these jobs more crew members work together. A roofing square (SQ) is 100 square feet. When roofs are more complex such as having multiple roofing layers, multiple felt layers, steep, multi-story, hard access, severe wear and tear (non walkable surface), etc. will add to that time frame.",
  },
  {
    q: "When is it time to replace my roof?",
    a: "In Oklahoma the lifecycle of a roof will be affected by our intense weather and the elements. Around the 10-15 year mark a roof will be heavily degraded from the sun, severe wind and hail, rainfall, and sometimes improper installation can speed up this degradation of the roof. It's a good plan to budget for roof repairs long before planning to do major repairs on a roof.",
  },
  {
    q: "What's included in this website's roof replacement estimate?",
    a: "Our roof estimate includes what is required and common to all roofs and excludes the following which require physical verification: roof steepness, number of stories, how many layers of shingles, how many layers of underlayment, chimney present, skylight present, custom components present, wall flashing, gutters detach and reset, gutter replacement, roof redeck, deck repairs, among others. All these factors can drive up the cost on top of the base cost.",
  },
  {
    q: "What if I need an estimate after severe hail or wind storm damaged my roof?",
    a: "When an event such as hail or windstorm affects a home it can adversely impact or void warranties with your roofing contractor and by extension with the roofing material manufacturers for the material installed on your home. That means it is on the homeowner to address the damage assessment and repairs of the roof and consult a professional. Our online estimate is a good starting point however we recommend you seek a consult to fully assess the scope of the damage. The estimator has built in options to facilitate getting an agent to help you precisely with these types of situations.",
  },
  {
    q: "Is the instant roof estimate a real quote?",
    a: "Yes, it is for many roofs in Oklahoma our instant estimate will be spot on as most roofs don't necessarily have multiple layers or steep slopes nor any of the other “details” which add on to the price. So odds are that our instant estimator will be in line with the final quote you get especially if you get it from us.",
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
