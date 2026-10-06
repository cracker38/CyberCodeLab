import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { AsyncState, PageHeader } from "../components/ui";
import { api } from "../services/api";
import type { VideoCard } from "../types";

export function YouTubePage() {
  const [channelUrl, setChannelUrl] = useState("");
  const [channelName, setChannelName] = useState("CyberCode Lab");
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ channelUrl: string; channelName: string; videos: VideoCard[] }>("/api/youtube")
      .then((d) => {
        setChannelUrl(d.channelUrl);
        setChannelName(d.channelName);
        setVideos(d.videos);
        setError("");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Seo
        title="YouTube"
        description="Latest from CyberCode Lab — cybersecurity education videos."
        path="/youtube"
      />
      <div className="page-wrap py-12">
        <PageHeader kicker="Learn · YouTube" title={`Latest from ${channelName}`}>
          <p>Watch the concept, then return here for the matching course or lab. Video is the briefing; practice is the work.</p>
        </PageHeader>
        {channelUrl && (
          <a
            href={channelUrl}
            className="btn-primary mt-6"
            target="_blank"
            rel="noreferrer"
          >
            Subscribe on YouTube
          </a>
        )}
        <AsyncState
          loading={loading}
          error={error}
          hasItems={videos.length > 0}
          empty="No videos in the catalog yet"
        >
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {videos.map((v) => (
              <article key={v.youtubeId} className="overflow-hidden rounded-xl border border-line bg-ink-900 shadow-card">
                {v.embeddable ? (
                  <iframe
                    title={v.title}
                    className="aspect-video w-full"
                    src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-ink-800 px-6 text-center">
                    <p className="font-mono text-xs uppercase tracking-wider text-accent">Watch on channel</p>
                    <p className="text-sm text-slate-400">
                      This catalog item points at {channelName}. Open YouTube for the full video.
                    </p>
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-semibold">{v.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">{v.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <a className="text-accent" href={v.watchUrl} target="_blank" rel="noreferrer">
                      Watch on YouTube
                    </a>
                    {v.relatedCourseSlug && (
                      <Link className="text-slate-300 hover:text-accent" to={`/courses/${v.relatedCourseSlug}`}>
                        Related course
                      </Link>
                    )}
                    {v.relatedLabSlug && (
                      <Link className="text-slate-300 hover:text-accent" to={`/labs/${v.relatedLabSlug}`}>
                        Practice lab
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AsyncState>
      </div>
    </>
  );
}
