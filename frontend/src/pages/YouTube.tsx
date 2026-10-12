import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { YouTubePreview } from "../components/YouTubePreview";
import { AsyncState, PageHeader } from "../components/ui";
import { api } from "../services/api";
import type { VideoCard } from "../types";

const CHANNEL_VIDEOS_URL = "https://www.youtube.com/@CyberCodeLab/videos";
const OFFICIAL_VIDEO_ID = "a23tvL8ytXs";

const FALLBACK_VIDEO: VideoCard = {
  youtubeId: OFFICIAL_VIDEO_ID,
  title: "Cybersecurity Roadmap for Beginners in 2026 | Roadmap ya Cybersecurity ku Batangiye",
  description:
    "Official CyberCode Lab video. Watch a short preview here, then continue on the channel for the full lesson.",
  embeddable: true,
  watchUrl: `https://youtu.be/${OFFICIAL_VIDEO_ID}`,
  thumbnailUrl: `https://i.ytimg.com/vi/${OFFICIAL_VIDEO_ID}/hqdefault.jpg`,
  relatedCourseSlug: "cybersecurity-fundamentals",
};

export function YouTubePage() {
  const [channelUrl, setChannelUrl] = useState(CHANNEL_VIDEOS_URL);
  const [channelName, setChannelName] = useState("CyberCode Lab");
  const [previewSeconds, setPreviewSeconds] = useState(45);
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{
      channelUrl: string;
      channelName: string;
      previewSeconds?: number;
      videos: VideoCard[];
    }>("/api/youtube")
      .then((d) => {
        const official = (d.videos ?? []).filter((v) => v.youtubeId === OFFICIAL_VIDEO_ID && v.embeddable);
        setVideos(official.length > 0 ? official : [FALLBACK_VIDEO]);
        setChannelUrl(d.channelUrl?.includes("youtube.com") ? d.channelUrl : CHANNEL_VIDEOS_URL);
        setChannelName(d.channelName || "CyberCode Lab");
        setPreviewSeconds(d.previewSeconds && d.previewSeconds >= 15 ? d.previewSeconds : 45);
        setError("");
      })
      .catch(() => {
        setVideos([FALLBACK_VIDEO]);
        setChannelUrl(CHANNEL_VIDEOS_URL);
        setError("");
      })
      .finally(() => setLoading(false));
  }, []);

  const video = videos[0];

  return (
    <>
      <Seo
        title="YouTube"
        description="Watch CyberCode Lab on YouTube — cybersecurity education from the official channel."
        path="/youtube"
      />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn · YouTube" title={`Latest from ${channelName}`}>
          <p>
            Only videos from{" "}
            <a className="text-accent" href={CHANNEL_VIDEOS_URL} target="_blank" rel="noreferrer">
              @CyberCodeLab
            </a>
            . Play a short on-site preview, then you are sent to the channel for the full video.
          </p>
        </PageHeader>
        <a href={channelUrl} className="btn-primary mt-6" target="_blank" rel="noreferrer">
          Open the channel
        </a>
        <AsyncState loading={loading} error={error} hasItems={Boolean(video)} empty="No official channel videos yet">
          {video && (
            <article className="mx-auto mt-8 max-w-4xl">
              <YouTubePreview
                videoId={video.youtubeId}
                title={video.title}
                previewSeconds={previewSeconds}
                channelUrl={channelUrl}
              />
              <h2 className="mt-5 text-xl font-semibold">{video.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{video.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <a className="text-accent" href={video.watchUrl} target="_blank" rel="noreferrer">
                  Watch the full video on YouTube
                </a>
                {video.relatedCourseSlug && (
                  <Link className="text-slate-300 hover:text-accent" to={`/courses/${video.relatedCourseSlug}`}>
                    Related course
                  </Link>
                )}
              </div>
            </article>
          )}
        </AsyncState>
      </div>
    </>
  );
}
