import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SocialVideo {
  id: number;
  title: string;
  url: string;
  platform: string;
  isActive: string;
  createdAt: string;
}

function detectPlatform(url: string): string {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook";
  if (url.includes("cloudinary.com") || url.match(/\.(mp4|mov|webm)$/i)) return "direct";
  return "direct";
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  direct: "Direct Video",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  youtube: "bg-red-600 text-white",
  instagram: "bg-purple-600 text-white",
  facebook: "bg-blue-700 text-white",
  direct: "bg-blue-600 text-white",
};

export default function SocialVideoManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { data, isLoading } = useQuery<{ success: boolean; videos: SocialVideo[] }>({
    queryKey: ["/api/social-videos"],
    queryFn: () => fetch("/api/social-videos").then(r => r.json()),
  });

  const videos = data?.videos ?? [];

  const addMutation = useMutation({
    mutationFn: (payload: { title: string; url: string; platform: string }) =>
      apiRequest("POST", "/api/social-videos", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-videos"] });
      setTitle("");
      setUrl("");
      toast({ title: "Video added", description: "It will appear on the SocHub page." });
    },
    onError: () => {
      toast({ title: "Failed to add video", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/social-videos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-videos"] });
      toast({ title: "Video removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove video", variant: "destructive" });
    },
  });

  function handleAdd() {
    if (!title.trim() || !url.trim()) {
      toast({ title: "Title and URL are required", variant: "destructive" });
      return;
    }
    const platform = detectPlatform(url.trim());
    addMutation.mutate({ title: title.trim(), url: url.trim(), platform });
  }

  return (
    <div className="space-y-6">
      {/* Add video form */}
      <Card>
        <CardHeader className="bg-emerald-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add a Video
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-gray-500">
            Paste a TikTok, YouTube, Instagram, or direct video URL. The platform is detected automatically.
          </p>
          <div className="space-y-2">
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              placeholder="e.g. Roof replacement in Edmond, OK"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video-url">URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.tiktok.com/@sigmaroofing405/video/..."
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
            {url && (
              <p className="text-xs text-gray-500">
                Detected platform: <span className="font-medium">{PLATFORM_LABELS[detectPlatform(url)] ?? "Unknown"}</span>
              </p>
            )}
          </div>
          <Button
            onClick={handleAdd}
            disabled={addMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addMutation.isPending ? "Adding..." : "Add Video"}
          </Button>
        </CardContent>
      </Card>

      {/* Video list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Active Videos ({videos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
          {!isLoading && videos.length === 0 && (
            <p className="text-gray-500 text-sm">No videos yet. Add your first one above.</p>
          )}
          <div className="space-y-3">
            {videos.map(video => (
              <div
                key={video.id}
                className="flex items-start justify-between gap-4 p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLATFORM_COLORS[video.platform] ?? "bg-gray-400 text-white"}`}
                    >
                      {PLATFORM_LABELS[video.platform] ?? video.platform}
                    </span>
                    <span className="font-medium text-sm truncate">{video.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{video.url}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(video.id)}
                  disabled={deleteMutation.isPending}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
