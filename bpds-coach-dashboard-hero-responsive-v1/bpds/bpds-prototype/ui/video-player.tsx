export function youtubeVideoId(value: string): string | undefined {
  const input = value.trim();
  if (!input) return undefined;
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0];
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v') ?? undefined;
      const parts = url.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1];
    }
  } catch { return undefined; }
  return undefined;
}

export function isSupportedVideoUrl(value: string): boolean {
  if (!value.trim()) return true;
  if (value.startsWith('supabase://bpds-videos/')) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && (Boolean(youtubeVideoId(value)) || /\.(mp4|webm|ogg)(?:$|\?)/i.test(url.href));
  } catch { return false; }
}

/** Return a preview image for a drill video without loading the video player. */
export function videoThumbnailUrl(videoUrl: string, customThumbnail = ''): string | undefined {
  if (customThumbnail.trim()) return customThumbnail.trim();
  const id = youtubeVideoId(videoUrl);
  return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : undefined;
}

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const [playbackUrl, setPlaybackUrl] = useState(url.startsWith('supabase://') ? '' : url);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    void resolvePrivateVideoUrl(url).then((resolved) => { if (active) setPlaybackUrl(resolved); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [url]);
  const id = youtubeVideoId(playbackUrl);
  const style = { width: '100%', height: '100%', border: 0, borderRadius: 14 };
  if (id) return <iframe style={style} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  if (playbackUrl) return <video style={style} src={playbackUrl} controls preload="metadata" />;
  if (failed) return <span style={{ fontSize: 14 }}>Video could not be loaded.</span>;
  if (url) return <span style={{ fontSize: 14 }}>Loading video…</span>;
  return <span aria-label="No video">▶</span>;
}
import { useEffect, useState } from 'react';
import { resolvePrivateVideoUrl } from '@predrag-miletic/bpds-storage.supabase';
