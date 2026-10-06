import { useEffect, useState } from "react";
import { Seo } from "../components/Seo";
import { api } from "../services/api";

type Video = { youtube_id: string; title: string; description: string };

export function YouTubePage() {
  const [channelUrl, setChannelUrl] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  useEffect(() => {
    api<{ channelUrl: string; videos: Video[] }>("/api/youtube").then((d) => {
      setChannelUrl(d.channelUrl);
      setVideos(d.videos);
    });
  }, []);
  return (
    <>
      <Seo
        title="YouTube"
        description="Latest from CyberCode Lab — cybersecurity education videos."
        path="/youtube"
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Latest from CyberCode Lab</h1>
        <p className="mt-2 text-slate-400">Watch on YouTube, then come back and practice in the labs.</p>
        {channelUrl && (
          <a
            href={channelUrl}
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950"
            target="_blank"
            rel="noreferrer"
          >
            Subscribe on YouTube
          </a>
        )}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {videos.map((v) => (
            <article key={v.youtube_id} className="overflow-hidden rounded-xl border border-line bg-ink-900 shadow-card">
              <div className="flex aspect-video items-center justify-center bg-ink-800 font-mono text-xs text-slate-500">
                Thumbnail · {v.youtube_id}
              </div>
              <div className="p-5">
                <h2 className="font-semibold">{v.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{v.description}</p>
                <a
                  className="mt-3 inline-block text-sm text-accent"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.title + " CyberCode Lab")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch on YouTube
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
