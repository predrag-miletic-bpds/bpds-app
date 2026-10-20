import type { User } from '@supabase/supabase-js';
import type { HistoryEntry, Practice } from '@predrag-miletic/bpds-practices.entities.practice';
import type { Player, Team } from '@predrag-miletic/bpds-people.entities.people';
import { getSupabaseClient } from './supabase-client.js';
import { historyToRow, playerToRow, practiceToRow, rowToHistory, rowToPlayer, rowToPractice, rowToTeam, teamToRow } from './supabase-mappers.js';
import type { Json } from './supabase-schema.js';

export type CoachProfile = { id: string; fullName: string; club: string; accountRole: string; email: string };
export type RemoteSnapshot = { players: Player[]; teams: Team[]; practices: Practice[]; history: HistoryEntry[]; recentDrills: string[]; draft?: Practice };

function requiredUser(user: User | null): User {
  if (!user) throw new Error('You must be signed in.');
  return user;
}

export async function currentUser(): Promise<User | null> {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return requiredUser(data.user);
}

export async function signUp(email: string, password: string, fullName: string, club: string): Promise<{ user: User; confirmationRequired: boolean }> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: fullName, club, account_role: 'coach' } } });
  if (error) throw error;
  const user = requiredUser(data.user);
  if (data.session) {
    const { error: profileError } = await client.from('profiles').upsert({ id: user.id, full_name: fullName, club, account_role: 'coach', updated_at: new Date().toISOString() });
    if (profileError) throw profileError;
  }
  return { user, confirmationRequired: !data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

export async function loadProfile(user: User): Promise<CoachProfile> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return { id: user.id, fullName: data?.full_name ?? String(user.user_metadata.full_name ?? 'Coach'),
    club: data?.club ?? String(user.user_metadata.club ?? ''), accountRole: data?.account_role ?? 'coach', email: user.email ?? '' };
}

export async function loadSnapshot(coachId: string): Promise<RemoteSnapshot> {
  const client = getSupabaseClient();
  const [players, teams, practices, history, state] = await Promise.all([
    client.from('players').select('*').eq('coach_id', coachId), client.from('teams').select('*').eq('coach_id', coachId),
    client.from('practices').select('*').eq('coach_id', coachId), client.from('training_history').select('*').eq('coach_id', coachId),
    client.from('coach_state').select('*').eq('coach_id', coachId).maybeSingle(),
  ]);
  const error = players.error ?? teams.error ?? practices.error ?? history.error ?? state.error;
  if (error) throw error;
  return { players: (players.data ?? []).map(rowToPlayer), teams: (teams.data ?? []).map(rowToTeam),
    practices: (practices.data ?? []).map(rowToPractice), history: (history.data ?? []).map(rowToHistory),
    recentDrills: state.data?.recent_drills ?? [], draft: state.data?.draft ? rowToPractice(state.data.draft as never) : undefined };
}

export async function savePlayer(player: Player, coachId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('players').upsert(playerToRow(player, coachId));
  if (error) throw error;
}
export async function saveTeam(team: Team, coachId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('teams').upsert(teamToRow(team, coachId));
  if (error) throw error;
}
export async function savePracticeRemote(practice: Practice, coachId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('practices').upsert(practiceToRow(practice, coachId));
  if (error) throw error;
}
export async function removePracticeRemote(id: string, coachId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('practices').delete().eq('coach_id', coachId).eq('id', id);
  if (error) throw error;
}
export async function removePlayerRemote(id: string, coachId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('players').delete().eq('coach_id', coachId).eq('id', id);
  if (error) throw error;
}
export async function removeTeamRemote(id: string, coachId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('teams').delete().eq('coach_id', coachId).eq('id', id);
  if (error) throw error;
}
export async function saveHistory(entry: HistoryEntry, coachId: string, practiceId?: string): Promise<void> {
  const { error } = await getSupabaseClient().from('training_history').upsert(historyToRow(entry, coachId, practiceId));
  if (error) throw error;
}
export async function saveCoachState(coachId: string, recentDrills: string[], draft?: Practice): Promise<void> {
  const { error } = await getSupabaseClient().from('coach_state').upsert({ coach_id: coachId, recent_drills: recentDrills,
    draft: draft ? practiceToRow(draft, coachId) as unknown as Json : null, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function subscribeToCoach(coachId: string, reload: () => void): () => void {
  const client = getSupabaseClient();
  const channel = client.channel(`bpds:${coachId}`);
  for (const table of ['players', 'teams', 'practices', 'training_history', 'coach_state'] as const) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `coach_id=eq.${coachId}` }, reload);
  }
  channel.subscribe();
  return () => { void client.removeChannel(channel); };
}
