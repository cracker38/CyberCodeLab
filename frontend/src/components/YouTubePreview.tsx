import { useEffect, useRef, useState } from "react";

type YTPlayer = {
  getCurrentTime: () => number;
  getPlayerState: () => number;
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
        onError?: () => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { UNSTARTED: number; ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("YouTube player timed out.")), 12000);
    const finish = () => {
      window.clearTimeout(timer);
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player unavailable."));
    };
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      finish();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("Could not load YouTube."));
      };
      document.body.appendChild(script);
    }
    if (window.YT?.Player) finish();
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
  const boxRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const redirected = useRef(false);
  const [remaining, setRemaining] = useState(previewSeconds);
  const [playing, setPlaying] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setRemaining(previewSeconds);
    setFailed(false);
    setLeaving(false);
    redirected.current = false;
  }, [previewSeconds, videoId]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    let cancelled = false;
    let poll: number | undefined;
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    box.replaceChildren(mount);

    const goToChannel = () => {
      if (redirected.current || cancelled) return;
      redirected.current = true;
      setLeaving(true);
      try {
        playerRef.current?.pauseVideo();
      } catch {
        /* ignore */
      }
      window.setTimeout(() => {
        window.location.assign(channelUrl);
      }, 800);
    };

    void loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0,
            disablekb: 1,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event) => {
              const playingNow = event.data === YT.PlayerState.PLAYING;
              setPlaying(playingNow);
              if (event.data === YT.PlayerState.ENDED) goToChannel();
            },
            onError: () => setFailed(true),
          },
        });
        poll = window.setInterval(() => {
          const player = playerRef.current;
          if (!player || redirected.current) return;
          try {
            const t = player.getCurrentTime();
            setRemaining(previewSeconds - t);
            if (t >= previewSeconds) goToChannel();
          } catch {
            /* player not ready */
          }
        }, 250);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
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
      box.replaceChildren();
    };
  }, [videoId, previewSeconds, channelUrl]);

  if (failed) {
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-ink-900">
        <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-ink-800 px-6 text-center">
          <p className="text-sm text-slate-300">The in-page preview could not start. Continue on the official channel.</p>
          <a className="btn-primary" href={channelUrl} target="_blank" rel="noreferrer">
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-ink-900">
      <div className="youtube-frame aspect-video w-full" ref={boxRef} title={title} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          {leaving
            ? "Opening the full video on YouTube…"
            : playing
              ? `Preview ${formatSeconds(remaining)} remaining`
              : `${formatSeconds(previewSeconds)} preview · then continue on @CyberCodeLab`}
        </p>
        <a className="text-accent" href={channelUrl} target="_blank" rel="noreferrer">
          Continue on channel
        </a>
      </div>
      {leaving && (
        <div className="absolute inset-0 grid place-items-center bg-ink-950/80 text-center">
          <p className="px-6 text-sm text-slate-200">Preview finished. Redirecting to the CyberCode Lab channel…</p>
        </div>
      )}
    </div>
  );
}
