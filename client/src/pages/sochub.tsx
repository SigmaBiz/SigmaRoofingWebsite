import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, ExternalLink, ArrowRight, Star } from "lucide-react";
import { FaTiktok, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

interface SocialVideo {
  id: number;
  title: string;
  url: string;
  platform: string;
  isActive: string;
  createdAt: string;
}

const GOOGLE_REVIEW_URL = "https://g.page/r/Cb5K5psSE9E3EBM/review";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok:    "TikTok",
  youtube:   "YouTube",
  instagram: "Instagram",
  facebook:  "Facebook",
  direct:    "Video",
};

const PLATFORM_BG: Record<string, string> = {
  tiktok:    "bg-black",
  youtube:   "bg-red-700",
  instagram: "bg-gradient-to-br from-purple-600 to-pink-500",
  facebook:  "bg-blue-700",
  direct:    "bg-gray-800",
};

const PLATFORM_BADGE: Record<string, string> = {
  tiktok:    "bg-black text-white",
  youtube:   "bg-red-600 text-white",
  instagram: "bg-purple-600 text-white",
  facebook:  "bg-blue-700 text-white",
  direct:    "bg-gray-700 text-white",
};

// ─── Single video card ─────────────────────────────────────────────────────────

function VideoCard({ video }: { video: SocialVideo }) {
  const [playing, setPlaying] = useState(false);

  const ytId = video.platform === "youtube" ? getYouTubeVideoId(video.url) : null;
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  const { data: ttData } = useQuery<{ thumbnail_url: string | null }>({
    queryKey: ["/api/tiktok-thumbnail", video.url],
    queryFn: () =>
      fetch(`/api/tiktok-thumbnail?url=${encodeURIComponent(video.url)}`).then(r => r.json()),
    enabled: video.platform === "tiktok",
    staleTime: 24 * 60 * 60 * 1000,
  });

  const thumbnail = ytThumb ?? (video.platform === "tiktok" ? (ttData?.thumbnail_url ?? null) : null);

  // TikTok and Instagram open in their own apps — embed UX is better there
  const opensExternally = video.platform === "tiktok" || video.platform === "instagram";

  function handleClick() {
    if (opensExternally) {
      window.open(video.url, "_blank", "noopener,noreferrer");
    } else {
      setPlaying(true);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
        onClick={handleClick}
      >
        {/* ── YouTube inline player ── */}
        {playing && video.platform === "youtube" && ytId && (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}

        {/* ── Facebook inline player ── */}
        {playing && video.platform === "facebook" && (
          <iframe
            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=false&autoplay=true`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            style={{ border: "none", overflow: "hidden" }}
          />
        )}

        {/* ── Direct video inline player ── */}
        {playing && video.platform === "direct" && (
          <video
            src={video.url}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        )}

        {/* ── Thumbnail (before playing) ── */}
        {!playing && thumbnail && (
          <>
            <img
              src={thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/95 rounded-full p-4 shadow-xl">
                {opensExternally
                  ? <ExternalLink className="w-6 h-6 text-gray-900" />
                  : <Play className="w-7 h-7 text-gray-900 fill-gray-900" />}
              </div>
            </div>
          </>
        )}

        {/* ── Branded placeholder (no thumbnail available) ── */}
        {!playing && !thumbnail && (
          <>
            <div className={`w-full h-full flex flex-col items-center justify-center gap-3 ${PLATFORM_BG[video.platform] ?? "bg-gray-800"}`}>
              <Play className="w-12 h-12 text-white/60" />
              <span className="text-white/70 text-sm font-medium">{PLATFORM_LABELS[video.platform]}</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 rounded-full p-4 shadow-xl">
                {opensExternally
                  ? <ExternalLink className="w-6 h-6 text-gray-900" />
                  : <Play className="w-7 h-7 text-gray-900 fill-gray-900" />}
              </div>
            </div>
          </>
        )}

        {/* Platform badge */}
        {!playing && (
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${PLATFORM_BADGE[video.platform] ?? "bg-gray-700 text-white"}`}>
            {PLATFORM_LABELS[video.platform]}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-white leading-snug px-1">{video.title}</p>
    </div>
  );
}

// ─── Social profile links ──────────────────────────────────────────────────────

const SOCIAL_PROFILES = [
  {
    label: "TikTok",
    handle: "@sigmaroofing405",
    followCopy: "Follow on TikTok",
    url: "https://www.tiktok.com/@sigmaroofing405",
    icon: <FaTiktok className="w-5 h-5" />,
    bg: "bg-black hover:bg-gray-900",
  },
  {
    label: "Instagram",
    handle: "@sigmaroofing405",
    followCopy: "Follow on Instagram",
    url: "https://www.instagram.com/sigmaroofing405",
    icon: <FaInstagram className="w-5 h-5" />,
    bg: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
  },
  {
    label: "Facebook",
    handle: "Sigma Roofing LLC",
    followCopy: "Follow on Facebook",
    url: "https://www.facebook.com/search/top?q=Sigma%20Roofing%20LLC",
    icon: <FaFacebook className="w-5 h-5" />,
    bg: "bg-blue-700 hover:bg-blue-800",
  },
  {
    label: "YouTube",
    handle: "Coming soon",
    followCopy: "Subscribe on YouTube",
    url: null,
    icon: <FaYoutube className="w-5 h-5" />,
    bg: "bg-red-600 hover:bg-red-700",
  },
];

// ─── Reviews + follows section ─────────────────────────────────────────────────

function GrowSection() {
  return (
    <div className="mt-16 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Google review CTA */}
      <div className="bg-gray-800/60 px-8 py-10 text-center">
        <div className="flex justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Enjoyed the content?</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          A 5-star review takes 30 seconds and helps homeowners in your neighborhood find a roofer they can trust.
        </p>
        <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
          <Button className="bg-sigma-emerald hover:bg-emerald-600 text-white px-8 py-3 text-base font-semibold">
            Leave a Google Review
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </a>
      </div>

      {/* Social follow CTA */}
      <div className="bg-gray-900/60 px-8 py-8 text-center border-t border-gray-700">
        <p className="text-gray-400 text-sm mb-4">
          Follow along — new job walkthroughs posted every week.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {SOCIAL_PROFILES.filter(p => p.url).map(p => (
            <a
              key={p.label}
              href={p.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors ${p.bg}`}
            >
              {p.icon}
              {p.followCopy}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SocHub() {
  const { data, isLoading } = useQuery<{ success: boolean; videos: SocialVideo[] }>({
    queryKey: ["/api/social-videos"],
    queryFn: () => fetch("/api/social-videos").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const videos = data?.videos ?? [];

  return (
    <div className="min-h-screen bg-sigma-charcoal">
      {/* Header */}
      <div className="py-16 text-center px-4">
        <div className="inline-flex items-center px-3 py-1 bg-sigma-emerald text-white text-sm rounded-full mb-4">
          SocHub
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">Watch Us Work</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Real roofs. Real results. Follow Sigma Roofing for job walkthroughs, storm damage tips, and everything in between.
        </p>

        {/* Social profile buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {SOCIAL_PROFILES.filter(p => p.url).map(p => (
            <a
              key={p.label}
              href={p.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors ${p.bg}`}
            >
              {p.icon}
              {p.handle}
            </a>
          ))}
        </div>

        <Link href="/#contact">
          <Button className="bg-sigma-emerald hover:bg-emerald-600 text-white px-8 py-3 text-base font-semibold">
            Book a Free Inspection
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-6xl pb-20">
        {isLoading && (
          <p className="text-center text-gray-400 py-12">Loading videos...</p>
        )}

        {!isLoading && videos.length === 0 && (
          <div className="text-center py-20">
            <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Videos coming soon.</p>
            <p className="text-gray-500 text-sm mt-1">
              Check back after Antonio posts his first job walkthrough.
            </p>
          </div>
        )}

        {/* Video grid */}
        {videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Reviews + follows section — always shown */}
        <GrowSection />

        {/* Bottom booking CTA */}
        <div className="text-center mt-8 p-8 border border-gray-700 rounded-2xl">
          <h3 className="text-2xl font-bold text-white mb-3">Ready to get started?</h3>
          <p className="text-gray-400 mb-6">
            Book a free roof inspection. No pressure — just answers.
          </p>
          <Link href="/#contact">
            <Button className="bg-sigma-emerald hover:bg-emerald-600 text-white px-10 py-3 text-base font-semibold">
              Book My Inspection
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
