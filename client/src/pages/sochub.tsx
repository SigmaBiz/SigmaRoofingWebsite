import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, ExternalLink, ArrowRight } from "lucide-react";
import { FaTiktok, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

interface SocialVideo {
  id: number;
  title: string;
  url: string;
  platform: string;
  isActive: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getTikTokVideoId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return match ? match[1] : null;
}

// ─── Embed components ─────────────────────────────────────────────────────────

function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return <FallbackCard url={url} title={title} platform="youtube" />;
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

function TikTokEmbed({ url, title }: { url: string; title: string }) {
  const videoId = getTikTokVideoId(url);
  if (!videoId) return <FallbackCard url={url} title={title} platform="tiktok" />;
  // TikTok embed requires their script — we use a simple blockquote embed
  return (
    <div className="flex justify-center">
      <blockquote
        className="tiktok-embed rounded-xl overflow-hidden"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: "325px", minWidth: "325px" }}
      >
        <section>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500">
            {title}
          </a>
        </section>
      </blockquote>
    </div>
  );
}

function DirectVideoEmbed({ url, title }: { url: string; title: string }) {
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black">
      <video
        src={url}
        title={title}
        controls
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
}

function FallbackCard({ url, title, platform }: { url: string; title: string; platform: string }) {
  const STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
    tiktok:    { bg: "bg-black",      icon: <FaTiktok className="w-10 h-10 text-white" /> },
    youtube:   { bg: "bg-red-700",    icon: <FaYoutube className="w-10 h-10 text-white" /> },
    instagram: { bg: "bg-purple-700", icon: <FaInstagram className="w-10 h-10 text-white" /> },
    direct:    { bg: "bg-gray-800",   icon: <Play className="w-10 h-10 text-white" /> },
  };
  const s = STYLES[platform] ?? STYLES.direct;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`aspect-video w-full rounded-xl flex flex-col items-center justify-center gap-3 ${s.bg} hover:opacity-90 transition-opacity shadow-lg`}
    >
      {s.icon}
      <span className="text-white text-sm font-medium flex items-center gap-1">
        Watch on {platform.charAt(0).toUpperCase() + platform.slice(1)}
        <ExternalLink className="w-3 h-3" />
      </span>
    </a>
  );
}

function VideoCard({ video }: { video: SocialVideo }) {
  return (
    <div className="flex flex-col gap-3">
      {video.platform === "youtube" && <YouTubeEmbed url={video.url} title={video.title} />}
      {video.platform === "tiktok" && <TikTokEmbed url={video.url} title={video.title} />}
      {video.platform === "direct" && <DirectVideoEmbed url={video.url} title={video.title} />}
      {video.platform === "instagram" && <FallbackCard url={video.url} title={video.title} platform="instagram" />}
      <p className="text-sm font-semibold text-white">{video.title}</p>
    </div>
  );
}

// ─── Social profile links ──────────────────────────────────────────────────────

const SOCIAL_PROFILES = [
  {
    label: "TikTok",
    handle: "@sigmaroofing405",
    url: "https://www.tiktok.com/@sigmaroofing405",
    icon: <FaTiktok className="w-6 h-6" />,
    bg: "bg-black hover:bg-gray-900",
  },
  {
    label: "Instagram",
    handle: "@sigmaroofing405",
    url: "https://www.instagram.com/sigmaroofing405",
    icon: <FaInstagram className="w-6 h-6" />,
    bg: "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600",
  },
  {
    label: "Facebook",
    handle: "Sigma Roofing LLC",
    url: "https://www.facebook.com/search/top?q=Sigma%20Roofing%20LLC",
    icon: <FaFacebook className="w-6 h-6" />,
    bg: "bg-blue-700 hover:bg-blue-800",
  },
];

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
      {/* Hero header */}
      <div className="py-16 text-center px-4">
        <div className="inline-flex items-center px-3 py-1 bg-sigma-emerald text-white text-sm rounded-full mb-4">
          SocHub
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Watch Us Work
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Real roofs. Real results. Follow Sigma Roofing for job walkthroughs, storm damage tips, and everything in between.
        </p>

        {/* Social profile buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {SOCIAL_PROFILES.map(p => (
            <a
              key={p.label}
              href={p.url}
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
          <Button className="bg-sigma-emerald hover:bg-emerald-600 text-white px-8 py-3 text-base font-semibold mt-2">
            Book a Free Inspection
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Video grid */}
      <div className="container mx-auto px-4 max-w-6xl pb-20">
        {isLoading && (
          <p className="text-center text-gray-400 py-12">Loading videos...</p>
        )}

        {!isLoading && videos.length === 0 && (
          <div className="text-center py-20">
            <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Videos coming soon.</p>
            <p className="text-gray-500 text-sm mt-1">Check back after Antonio posts his first job walkthrough.</p>
          </div>
        )}

        {videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {videos.length > 0 && (
          <div className="text-center mt-16 p-8 border border-gray-700 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-3">
              Like what you see?
            </h3>
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
        )}
      </div>
    </div>
  );
}
