import { useEffect, useRef, useState } from "react";

type YTPlayer = {
  getCurrentTime: () => number;
  pauseVideo: () => void;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
    if (window.YT?.Player) resolve(window.YT);
  });
}

function formatSeconds(value: number): string {
  const s = Math.max(0, Math.ceil(value));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function YouTubePreview({
  videoId,
  title,
  previewSeconds,
  channelUrl,
}: {
  videoId: string;
  title: string;
  previewSeconds: number;
  channelUrl: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const redirected = useRef(false);
  const [remaining, setRemaining] = useState(previewSeconds);
  const [playing, setPlaying] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setRemaining(previewSeconds);
  }, [previewSeconds]);

  useEffect(() => {
    let cancelled = false;
    let poll: number | undefined;
    const host = hostRef.current;
    if (!host) return;

    const goToChannel = () => {
      if (redirected.current) return;
      redirected.current = true;
      setLeaving(true);
      try {
        playerRef.current?.pauseVideo();
      } catch {
        /* player may already be gone */
      }
      window.setTimeout(() => {
        window.location.assign(channelUrl);
      }, 900);
    };

    void loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (event) => {
            const isPlaying = event.data === YT.PlayerState.PLAYING;
            setPlaying(isPlaying);
            if (event.data === YT.PlayerState.ENDED) goToChannel();
          },
        },
      });
      poll = window.setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        let t = 0;
        try {
          t = player.getCurrentTime();
        } catch {
          return;
        }
        const left = previewSeconds - t;
        setRemaining(left);
        if (t >= previewSeconds) goToChannel();
      }, 250);
    });

    return () => {
      cancelled = true;
      if (poll) window.clearInterval(poll);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, previewSeconds, channelUrl]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-ink-900">
      <div className="aspect-video w-full">
        <div ref={hostRef} title={title} className="h-full w-full" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          {leaving
            ? "Opening the full video on YouTube…"
            : playing
              ? `Preview ${formatSeconds(remaining)} remaining`
              : `${formatSeconds(previewSeconds)} preview · full video on YouTube`}
        </p>
        <a className="text-accent" href={channelUrl} target="_blank" rel="noreferrer">
          Continue on channel
        </a>
      </div>
      {leaving && (
        <div className="absolute inset-0 grid place-items-center bg-ink-950/80 text-center">
          <p className="px-6 text-sm text-slate-200">Preview finished. Redirecting to @CyberCodeLab…</p>
        </div>
      )}
    </div>
  );
}
