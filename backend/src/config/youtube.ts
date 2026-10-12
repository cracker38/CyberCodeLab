import { db, nowIso } from "./db.js";
import { env } from "./env.js";
import { id } from "../utils/ids.js";

/** Only videos from https://www.youtube.com/@CyberCodeLab/videos */
export const OFFICIAL_YOUTUBE_VIDEOS = [
  {
    youtubeId: "a23tvL8ytXs",
    title: "Cybersecurity Roadmap for Beginners in 2026 | Roadmap ya Cybersecurity ku Batangiye",
    description:
      "Official CyberCode Lab video. Watch a short preview here, then continue on the channel for the full lesson.",
    relatedCourseSlug: "cybersecurity-fundamentals",
    relatedLabSlug: null as string | null,
  },
] as const;

export function youtubeChannelVideosUrl(): string {
  const base = env.youtubeChannelUrl.replace(/\/$/, "");
  return base.endsWith("/videos") ? base : `${base}/videos`;
}

export function syncOfficialYoutubeVideos(): void {
  const ids = OFFICIAL_YOUTUBE_VIDEOS.map((v) => v.youtubeId);
  db.prepare(
    `DELETE FROM youtube_videos WHERE youtube_id NOT IN (${ids.map(() => "?").join(",")})`,
  ).run(...ids);

  const ts = nowIso();
  OFFICIAL_YOUTUBE_VIDEOS.forEach((video, index) => {
    const existing = db.prepare("SELECT id FROM youtube_videos WHERE youtube_id = ?").get(video.youtubeId) as
      | { id: string }
      | undefined;
    if (existing) {
      db.prepare(
        "UPDATE youtube_videos SET title = ?, description = ?, sort_order = ? WHERE youtube_id = ?",
      ).run(video.title, video.description, index, video.youtubeId);
      return;
    }
    db.prepare(
      "INSERT INTO youtube_videos (id, youtube_id, title, description, published_at, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id(), video.youtubeId, video.title, video.description, ts, index);
  });
}
