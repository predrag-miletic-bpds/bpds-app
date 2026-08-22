import { useEffect, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { DRILLS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { getSupabaseClient } from '@predrag-miletic/bpds-storage.supabase';

export type AppDrill = (typeof DRILLS)[number];

type StoredDrill = {
  id: string;
  code: string;
  name: string;
  module_code: string;
  data: Partial<AppDrill> & { video_url?: string };
  published: boolean;
};

const STORAGE_BUCKET = 'bpds-videos';
const listeners = new Set<() => void>();
const storedVideoUrls = new Map<string, string>();
let drills: AppDrill[] = [...DRILLS];
let loaded = false;
let hydrated = false;
let pendingLoad: Promise<void> | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function youtubeId(url?: string) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match?.[1] ?? '';
}

function parseStorageUrl(url: string) {
  const match = url.match(/^supabase:\/\/([^/]+)\/(.+)$/);
  return match ? { bucket: match[1], path: match[2] } : null;
}

async function resolveVideoUrl(url: string) {
  const storage = parseStorageUrl(url);
  if (!storage) return url;
  const client = getSupabaseClient();
  const { data, error } = await client.storage.from(storage.bucket).createSignedUrl(storage.path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

async function hydrateDrill(row: StoredDrill): Promise<AppDrill | undefined> {
  const base = DRILLS.find((drill) => drill.id === row.id || drill.code === row.code);
  if (!base) return undefined;
  const data = row.data ?? {};
  const storedUrl = String(data.videoUrl ?? data.video_url ?? base.videoUrl ?? '');
  if (storedUrl) storedVideoUrls.set(base.id, storedUrl);

  let videoUrl = storedUrl;
  if (storedUrl.startsWith('supabase://')) {
    try {
      videoUrl = await resolveVideoUrl(storedUrl);
    } catch (error) {
      console.error(`Unable to load video for ${base.code}`, error);
      videoUrl = '';
    }
  }

  return {
    ...base,
    ...data,
    id: row.id,
    code: row.code,
    name: row.name,
    moduleCode: row.module_code,
    published: row.published,
    videoUrl,
  } as AppDrill;
}

export async function loadDrills(force = false) {
  if (loaded && !force) return;
  if (pendingLoad) return pendingLoad;

  pendingLoad = (async () => {
    const client = getSupabaseClient();
    const { data, error } = await client.from('drills').select('id, code, name, module_code, data, published');
    if (error) throw error;

    const remote = new Map<string, AppDrill>();
    const rows = (data ?? []) as unknown as StoredDrill[];
    const hydratedRows = await Promise.all(rows.map(hydrateDrill));
    hydratedRows.forEach((drill) => {
      if (drill) remote.set(drill.id, drill);
    });

    drills = DRILLS.map((drill) => remote.get(drill.id) ?? drill);
    loaded = true;
    notify();
  })()
    .catch((error) => {
      console.error('Unable to load drill videos from Supabase', error);
    })
    .finally(() => {
      pendingLoad = null;
      // Mark hydration attempted (success or failure) so consumers stop
      // showing the loading skeleton and render whatever is now resolved.
      hydrated = true;
      notify();
    });

  return pendingLoad;
}

export function useDrills() {
  useEffect(() => {
    void loadDrills();
  }, []);
  return useSyncExternalStore(subscribe, () => drills, () => DRILLS);
}

/** Whether the initial Supabase drill-video load has completed (success or failure). */
function useHydrated() {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function useDrill(id?: string) {
  const allDrills = useDrills();
  return allDrills.find((drill) => drill.id === id || drill.code === id);
}

function updateVideo(id: string, storedUrl: string, playableUrl: string) {
  storedVideoUrls.set(id, storedUrl);
  drills = drills.map((drill) => drill.id === id ? { ...drill, videoUrl: playableUrl } : drill);
  notify();
}

async function persistVideo(drill: AppDrill, storedUrl: string) {
  const client = getSupabaseClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('You must be signed in to save a drill video.');

  const drillData = { ...drill, videoUrl: storedUrl };
  const { error } = await client.from('drills').upsert({
    owner_id: auth.user.id,
    id: drill.id,
    code: drill.code,
    name: drill.name,
    module_code: drill.moduleCode,
    data: drillData,
    published: drill.published,
  }, { onConflict: 'id' });
  if (error) throw error;

  const playableUrl = await resolveVideoUrl(storedUrl);
  updateVideo(drill.id, storedUrl, playableUrl);
  return playableUrl;
}

export async function saveDrillVideoUrl(drill: AppDrill, url: string) {
  const trimmed = url.trim();
  if (!trimmed) throw new Error('Enter a video URL or upload a video file.');
  return persistVideo(drill, trimmed);
}

export async function uploadDrillVideo(drill: AppDrill, file: File) {
  if (!file.type.startsWith('video/')) throw new Error('Please choose a video file.');
  const client = getSupabaseClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('You must be signed in to upload a video.');

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const path = `${auth.user.id}/${drill.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'video/mp4',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  return persistVideo(drill, `supabase://${STORAGE_BUCKET}/${path}`);
}

export function storedVideoUrl(drill: AppDrill) {
  return storedVideoUrls.get(drill.id) ?? drill.videoUrl ?? '';
}

export function DrillVideo({
  drill,
  preview = false,
  className,
  style,
}: {
  drill: AppDrill;
  preview?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const isHydrated = useHydrated();
  const url = drill.videoUrl;
  const yt = youtubeId(url);
  const mediaStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    objectFit: 'cover',
    background: '#111820',
    ...style,
  };

  if (!isHydrated) {
    // Avoid flashing the static catalog's sample/fallback video while the
    // drill's persisted media source is still loading from Supabase.
    return <div className={className} style={mediaStyle} />;
  }

  if (!url) {
    return <div className={className} style={{ ...mediaStyle, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.65)' }}>Video unavailable</div>;
  }

  if (yt) {
    if (preview) {
      return <img className={className} style={mediaStyle} src={`https://img.youtube.com/vi/${yt}/hqdefault.jpg`} alt="" />;
    }
    return (
      <iframe
        className={className}
        style={{ ...mediaStyle, border: 0 }}
        src={`https://www.youtube.com/embed/${yt}`}
        title={`${drill.code} video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      className={className}
      style={mediaStyle}
      src={preview ? `${url}#t=0.001` : url}
      poster={drill.thumbnail || undefined}
      muted={preview}
      controls={!preview}
      playsInline
      preload="metadata"
      aria-hidden={preview || undefined}
    />
  );
}
