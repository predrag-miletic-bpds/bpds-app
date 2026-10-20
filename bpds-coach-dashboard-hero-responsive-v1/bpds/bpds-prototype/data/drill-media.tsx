export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_DIAGRAM_BYTES = 10 * 1024 * 1024;
export type DrillMediaMode = 'video' | 'diagram' | 'split';



import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { DRILLS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { getSupabaseClient } from '@predrag-miletic/bpds-storage.supabase';

export type AppDrill = (typeof DRILLS)[number] & {
  videoUrl?: string;
  diagramUrl?: string;
  diagram?: unknown;
  mediaMode?: DrillMediaMode;
};

type SupabaseJson = string | number | boolean | null | { [key: string]: SupabaseJson | undefined } | SupabaseJson[];

type StoredDrill = {
  id: string;
  code: string;
  name: string;
  module_code: string;
  data: Partial<AppDrill> & { video_url?: string; diagram_url?: string };
  published: boolean;
};

const STORAGE_BUCKET = 'bpds-videos';
const DIAGRAM_BUCKET = 'bpds-diagrams';
const DIAGRAM_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const listeners = new Set<() => void>();
const storedVideoUrls = new Map<string, string>();
const storedDiagramUrls = new Map<string, string>();
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

async function resolveDiagramUrl(url: string) {
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
  const storedDiagramUrl = String(data.diagramUrl ?? data.diagram_url ?? (base as AppDrill & { diagramUrl?: string | null }).diagramUrl ?? '');
  if (storedDiagramUrl) storedDiagramUrls.set(base.id, storedDiagramUrl);

  let videoUrl = storedUrl;
  let diagramUrl = storedDiagramUrl;
  if (storedUrl.startsWith('supabase://')) {
    try {
      videoUrl = await resolveVideoUrl(storedUrl);
    } catch (error) {
      console.error(`Unable to load video for ${base.code}`, error);
      videoUrl = '';
    }
  }
  if (storedDiagramUrl.startsWith('supabase://')) {
    try {
      diagramUrl = await resolveDiagramUrl(storedDiagramUrl);
    } catch (error) {
      console.error(`Unable to load diagram for ${base.code}`, error);
      diagramUrl = '';
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
    diagramUrl,
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
function updateDiagram(id: string, storedUrl: string, playableUrl: string) {
  if (storedUrl) storedDiagramUrls.set(id, storedUrl);
  else storedDiagramUrls.delete(id);
  drills = drills.map((drill) => drill.id === id ? { ...drill, diagramUrl: playableUrl } : drill);
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
    data: drillData as unknown as SupabaseJson,
    published: drill.published,
  }, { onConflict: 'owner_id,id' });
  if (error) throw error;

  const playableUrl = await resolveVideoUrl(storedUrl);
  updateVideo(drill.id, storedUrl, playableUrl);
  return playableUrl;
}

export async function saveDrillVideoUrl(drill: AppDrill, url: string) {
  const trimmed = url.trim();
  if (!trimmed) return persistVideo(drill, '');
  return persistVideo(drill, trimmed);
}


export async function saveDrillMediaSettings(
  drill: AppDrill,
  patch: { diagram?: unknown | null; diagramUrl?: string | null; mediaMode?: DrillMediaMode },
) {
  const client = getSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error('You must be signed in to save drill media.');
  const { data: existing, error: readError } = await client.from('drills').select('data').eq('owner_id', authData.user.id).eq('id', drill.id).maybeSingle();
  if (readError) throw readError;
  const nextData: Record<string, unknown> = { ...((existing?.data as Record<string, unknown> | null) ?? {}) };
  if (Object.prototype.hasOwnProperty.call(patch, 'diagram')) {
    if (patch.diagram === null) delete nextData.diagram;
    else nextData.diagram = patch.diagram;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'diagramUrl')) {
    if (patch.diagramUrl === null) delete nextData.diagramUrl;
    else nextData.diagramUrl = patch.diagramUrl;
  }
  if (patch.mediaMode) nextData.mediaMode = patch.mediaMode;
  const { error } = await client.from('drills').upsert({ owner_id: authData.user.id, id: drill.id, code: drill.code, name: drill.name, module_code: drill.moduleCode, data: nextData as unknown as SupabaseJson, published: drill.published }, { onConflict: 'owner_id,id' });
  if (error) throw error;
  return nextData;
}

async function uploadWithStorage(file: File, objectPath: string) {
  const client = getSupabaseClient();
  const { error } = await client.storage.from('bpds-videos').upload(objectPath, file, { contentType: file.type, cacheControl: '3600', upsert: false });
  if (error) throw new Error('STORAGE_UPLOAD: ' + error.message);
}

function diagramExtension(file: File) {
  const byMime: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const candidate = file.name.split('.').pop()?.toLowerCase();
  if (candidate === 'png' || candidate === 'jpg' || candidate === 'jpeg' || candidate === 'webp') return candidate === 'jpeg' ? 'jpg' : candidate;
  return byMime[file.type] ?? '';
}
export async function uploadDrillDiagram(drill: AppDrill, file: File) {
  if (!DIAGRAM_MIME_TYPES.includes(file.type)) throw new Error('Please choose a PNG, JPG, JPEG, or WebP diagram image.');
  if (file.size > MAX_DIAGRAM_BYTES) throw new Error('Diagram image must be smaller than 10 MiB.');
  const client = getSupabaseClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('You must be signed in to upload a diagram image.');
  const extension = diagramExtension(file);
  if (!extension) throw new Error('Could not determine the diagram image format.');
  const objectPath = auth.user.id + '/' + drill.id + '/' + crypto.randomUUID() + '.' + extension;
  const previousStoredUrl = storedDiagramUrl(drill);
  const { error: uploadError } = await client.storage.from(DIAGRAM_BUCKET).upload(objectPath, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) throw new Error('DIAGRAM_STORAGE_UPLOAD: ' + uploadError.message);
  const nextStoredUrl = 'supabase://' + DIAGRAM_BUCKET + '/' + objectPath;
  try {
    await saveDrillMediaSettings(drill, { diagramUrl: nextStoredUrl });
  } catch (error) {
    await client.storage.from(DIAGRAM_BUCKET).remove([objectPath]);
    throw error;
  }
  const previous = previousStoredUrl ? parseStorageUrl(previousStoredUrl) : null;
  if (previous?.bucket === DIAGRAM_BUCKET && previous.path !== objectPath) {
    const { error: cleanupError } = await client.storage.from(DIAGRAM_BUCKET).remove([previous.path]);
    if (cleanupError) console.warn('Unable to remove replaced diagram image', cleanupError);
  }
  const playableUrl = await resolveDiagramUrl(nextStoredUrl);
  updateDiagram(drill.id, nextStoredUrl, playableUrl);
  return playableUrl;
}
export async function removeDrillDiagram(drill: AppDrill) {
  const storedUrl = storedDiagramUrl(drill);
  await saveDrillMediaSettings(drill, { diagramUrl: null });
  updateDiagram(drill.id, '', '');
  const storage = storedUrl ? parseStorageUrl(storedUrl) : null;
  if (storage?.bucket === DIAGRAM_BUCKET) {
    const client = getSupabaseClient();
    const { error } = await client.storage.from(DIAGRAM_BUCKET).remove([storage.path]);
    if (error) console.warn('Diagram reference removed but object cleanup failed', error);
  }
}
export async function uploadDrillVideo(drill: AppDrill, file: File) {
  if (!['video/mp4','video/quicktime','video/webm'].includes(file.type)) throw new Error('Please choose an MP4, QuickTime, or WebM video.');
  if (file.size > MAX_VIDEO_BYTES) throw new Error('Video must be smaller than 50 MiB.');
  const client = getSupabaseClient();
  const {data:auth,error:authError}=await client.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('You must be signed in to upload a video.');
  const {data:sessionData}=await client.auth.getSession();
  const token=sessionData.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const extension=file.type==='video/webm'?'webm':file.type==='video/quicktime'?'mov':'mp4';
  const objectPath=auth.user.id + '/' + drill.id + '/' + crypto.randomUUID() + '.' + extension;
  await uploadWithStorage(file, objectPath);
  const storedUrl='supabase://bpds-videos/' + objectPath;
  await persistVideo(drill, storedUrl);
  const playableUrl=await resolveVideoUrl(storedUrl);
  updateVideo(drill.id, storedUrl, playableUrl);
  return playableUrl;
}
export function storedVideoUrl(drill: AppDrill) {
  return storedVideoUrls.get(drill.id) ?? drill.videoUrl ?? '';
}
export function storedDiagramUrl(drill: AppDrill) {
  return storedDiagramUrls.get(drill.id) ?? drill.diagramUrl ?? '';
}
export function DrillDiagramImage({ drill, className, style }: { drill: AppDrill; className?: string; style?: CSSProperties }) {
  const url = drill.diagramUrl;
  if (!url) {
    return <div className={className} style={{ ...style, width: '100%', height: '100%', background: '#0b1016', display: 'grid', placeItems: 'center', color: 'var(--bpds-slate)' }}>No diagram available</div>;
  }
  return (
    <div className={className} style={{ ...style, width: '100%', height: '100%', background: '#0b1016', display: 'grid', placeItems: 'center' }}>
      <img src={url} alt={'Diagram for ' + drill.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
    </div>
  );
}


export function DrillVideo({ drill, preview = false, className, style }: { drill: AppDrill; preview?: boolean; className?: string; style?: React.CSSProperties }) {
  const url = drill.videoUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!url) {
    return <div className={className} style={{ ...style, width: '100%', height: '100%', background: '#05070a', display: 'grid', placeItems: 'center' }}>Video unavailable</div>;
  }

  const playVideo = () => {
    const video = videoRef.current;
    if (video) void video.play().catch(() => undefined);
  };

  return (
    <div className={className} style={{ ...style, position: 'relative', width: '100%', height: '100%', background: '#05070a', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        src={preview ? url + '#t=0.001' : url}
        controls={!preview}
        muted={preview}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      {!preview && !isPlaying && (
        <button
          type="button"
          aria-label="Play video"
          onClick={playVideo}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.9)',
            background: 'rgba(249, 92, 35, 0.95)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            zIndex: 2,
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1, marginLeft: 4 }}>▶</span>
        </button>
      )}
    </div>
  );
}
