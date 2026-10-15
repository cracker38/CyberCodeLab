import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { YouTubePreview } from "../components/YouTubePreview";
import { AsyncState, PageHeader } from "../components/ui";
import {
  CHANNEL_NAME,
  CHANNEL_VIDEOS_URL,
  DEFAULT_PREVIEW_SECONDS,
  OFFICIAL_VIDEO,
  OFFICIAL_VIDEO_ID,
} from "../lib/youtube";
import { api } from "../services/api";
import type { VideoCard } from "../types";

export function YouTubePage() {
  const [channelUrl, setChannelUrl] = useState(CHANNEL_VIDEOS_URL);
  const [channelName, setChannelName] = useState(CHANNEL_NAME);
  const [previewSeconds, setPreviewSeconds] = useState(DEFAULT_PREVIEW_SECONDS);
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{
      channelUrl: string;
      channelName: string;
      previewSeconds?: number;
      videos: VideoCard[];
    }>("/api/youtube")
      .then((d) => {
        const official = (d.videos ?? []).filter((v) => v.embeddable && v.youtubeId === OFFICIAL_VIDEO_ID);
        setVideos(official.length > 0 ? official : [OFFICIAL_VIDEO]);
        setChannelUrl(CHANNEL_VIDEOS_URL);
        setChannelName(d.channelName || CHANNEL_NAME);
        setPreviewSeconds(
          d.previewSeconds && d.previewSeconds >= 15 ? d.previewSeconds : DEFAULT_PREVIEW_SECONDS,
        );
      })
      .catch(() => {
        setVideos([OFFICIAL_VIDEO]);
        setChannelUrl(CHANNEL_VIDEOS_URL);
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
            This page only plays videos from{" "}
            <a className="text-accent" href={CHANNEL_VIDEOS_URL} target="_blank" rel="noreferrer">
              youtube.com/@CyberCodeLab
            </a>
            . You get a short in-page preview; when the preview ends, you continue on the channel for the full video.
          </p>
        </PageHeader>
        <a href={channelUrl} className="btn-primary mt-6" target="_blank" rel="noreferrer">
          Open the channel
        </a>
        <AsyncState loading={loading} error="" hasItems={Boolean(video)} empty="No official channel videos yet">
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
                <a className="text-accent" href={CHANNEL_VIDEOS_URL} target="_blank" rel="noreferrer">
                  Full video on the channel
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
