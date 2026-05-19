import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, ExternalLink, ArrowRight } from "lucide-react";

interface SocialVideo {
  id: number;
  title: string;
  url: string;
  platform: string;
  isActive: string;
  createdAt: string;
}

function getYouTubeThumbnail(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
}

const PLATFORM_STYLES: Record<string, { bg: string; label: string; badge: string }> = {
  tiktok:    { bg: "bg-black",       label: "TikTok",    badge: "bg-white text-black" },
  youtube:   { bg: "bg-red-700",     label: "YouTube",   badge: "bg-white text-red-700" },
  instagram: { bg: "bg-purple-700",  label: "Instagram", badge: "bg-white text-purple-700" },
  direct:    { bg: "bg-sigma-charcoal", label: "Video",  badge: "bg-white text-gray-800" },
};

function VideoCard({ video }: { video: SocialVideo }) {
  const style = PLATFORM_STYLES[video.platform] ?? PLATFORM_STYLES.direct;
  const ytThumb = video.platform === "youtube" ? getYouTubeThumbnail(video.url) : null;

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Thumbnail / Placeholder */}
      <div className={`relative aspect-video flex items-center justify-center ${ytThumb ? "" : style.bg}`}>
        {ytThumb ? (
          <img src={ytThumb} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white opacity-70">
            <Play className="w-12 h-12" />
            <span className="text-sm font-medium">{style.label}</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-300">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3">
            <ExternalLink className="w-5 h-5 text-gray-800" />
          </div>
        </div>
        {/* Platform badge */}
        <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
          {style.label}
        </span>
      </div>
      {/* Title */}
      <div className="bg-white p-3">
        <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-sigma-emerald transition-colors">
          {video.title}
        </p>
      </div>
    </a>
  );
}

export default function SocHubTeaser() {
  const { data } = useQuery<{ success: boolean; videos: SocialVideo[] }>({
    queryKey: ["/api/social-videos"],
    queryFn: () => fetch("/api/social-videos").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const videos = (data?.videos ?? []).slice(0, 4);

  // Don't render the section at all if there are no videos yet
  if (videos.length === 0) return null;

  return (
    <section className="py-20 bg-sigma-charcoal">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 bg-sigma-emerald text-white text-sm rounded-full mb-4">
            Watch Our Work
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            See It Before You Sign It
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real jobs, real results. Follow along as we document every roof replacement, repair, and storm recovery in the OKC metro.
          </p>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/social">
            <Button className="bg-sigma-emerald hover:bg-emerald-600 text-white px-8 py-3 text-base font-semibold">
              See All Videos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/#contact">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-sigma-charcoal px-8 py-3 text-base font-semibold">
              Book a Free Inspection
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
