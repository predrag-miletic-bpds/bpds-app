import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { currentUser, getSupabaseClient, loadProfile, loadSnapshot, removePlayerRemote, removePracticeRemote, removeTeamRemote, saveCoachState, saveHistory, savePlayer, savePracticeRemote, saveTeam, signIn, signOut, signUp, subscribeToCoach } from '@predrag-miletic/bpds-storage.supabase';
import type { Coach, HistoryEntry, Player, Practice, Team } from '../data/types.js';
import type { BpdsServices } from './services.js';
import { createServices, readLocal, SESSION_KEYS, writeLocal } from './services.js';

type Store = {
  coach: Coach;
  loggedIn: boolean;
  authReady: boolean;
  busy: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, club: string) => Promise<boolean>;
  logout: () => Promise<void>;
  players: Player[];
  teams: Team[];
  practices: Practice[];
  history: HistoryEntry[];
  recentDrills: string[];
  addPlayer: (p: Player) => void;
  updatePlayer: (p: Player) => void;
  deletePlayer: (id: string) => void;
  addTeam: (t: Team) => void;
  deleteTeam: (id: string) => void;
  savePractice: (p: Practice) => void;
  deletePractice: (id: string) => void;
  deleteHistoryEntry: (id: string) => void;
  duplicatePractice: (id: string) => void;
  /**
   * Finish a session: store the practice, write history and credit players.
   *
   * @param practice the practice that was run.
   * @param notes combined coach notes for the session.
   * @param completedItemIds ids of the timeline slots the coach marked done.
   */
  completePractice: (practice: Practice, notes: string, completedItemIds: string[]) => void;
  markDrillViewed: (id: string) => void;
  draft?: Practice;
  setDraft: (p?: Practice) => void;
  /** The domain services behind the store, for pages that need the full API. */
  services: BpdsServices;
};

const StoreContext = createContext<Store | null>(null);

/**
 * Provides BPDS state to the whole app, backed by persistent storage.
 *
 * Storage is opened once per session and every read below starts from what is
 * already stored, so a browser reload restores exactly what the coach left.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const servicesRef = useRef<BpdsServices | undefined>(undefined);
  if (!servicesRef.current) servicesRef.current = createServices();
  const services = servicesRef.current;
  const { people, practices: practiceApi, storage } = services;

  const [loggedIn, setLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [coach, setCoach] = useState<Coach>(services.coach);
  const [players, setPlayers] = useState<Player[]>(() => people.listPlayers());
  const [teams, setTeams] = useState<Team[]>(() => people.listTeams());
  const [practices, setPractices] = useState<Practice[]>(() => practiceApi.listPractices());
  const [history, setHistory] = useState<HistoryEntry[]>(() => practiceApi.listHistory());
  const [recentDrills, setRecentDrills] = useState<string[]>(() => storage.readRecentDrills());
  const [draft, setDraftState] = useState<Practice | undefined>(() => readLocal<Practice>(SESSION_KEYS.draft));

  const loadRemote = useCallback(async (userId: string) => {
    const snapshot = await loadSnapshot(userId);
    storage.players.replaceAll(snapshot.players); storage.teams.replaceAll(snapshot.teams);
    storage.practices.replaceAll(snapshot.practices); storage.history.replaceAll(snapshot.history);
    storage.writeRecentDrills(snapshot.recentDrills);
    setPlayers(snapshot.players); setTeams(snapshot.teams); setPractices(snapshot.practices);
    setHistory(snapshot.history); setRecentDrills(snapshot.recentDrills); setDraftState(snapshot.draft);
  }, [storage]);

  const applyUser = useCallback(async (user: Awaited<ReturnType<typeof currentUser>>) => {
    if (!user) { setLoggedIn(false); setAuthReady(true); return; }
    const profile = await loadProfile(user);
    setCoach({ id: user.id, name: profile.fullName, email: profile.email, role: 'Coach', club: profile.club, subscription: 'Free Preview' });
    await loadRemote(user.id);
    setLoggedIn(true); setAuthReady(true);
  }, [loadRemote]);

  useEffect(() => {
    let active = true;
    void currentUser().then((user) => { if (active) return applyUser(user); return undefined; }).catch((cause: unknown) => {
      if (active) { setError(cause instanceof Error ? cause.message : 'Could not connect to BPDS.'); setAuthReady(true); }
    });
    const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => { if (active) void applyUser(session?.user ?? null); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [applyUser]);

  useEffect(() => loggedIn ? subscribeToCoach(coach.id, () => { void loadRemote(coach.id); }) : undefined, [coach.id, loadRemote, loggedIn]);

  /** Refresh players and teams from storage. */
  const syncPeople = useCallback(() => {
    setPlayers(people.listPlayers());
    setTeams(people.listTeams());
  }, [people]);

  /** Refresh practices and history from storage. */
  const syncPractices = useCallback(() => {
    setPractices(practiceApi.listPractices());
    setHistory(practiceApi.listHistory());
  }, [practiceApi]);

  /** Replace the unsaved draft, keeping it across a reload. */
  const setDraft = useCallback((p?: Practice) => {
    setDraftState(p);
    writeLocal(SESSION_KEYS.draft, p);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setBusy(true); setError(undefined);
    try { await applyUser(await signIn(email, password)); }
    catch (cause) { const message = cause instanceof Error ? cause.message : 'Login failed.'; setError(message); throw cause; }
    finally { setBusy(false); }
  }, [applyUser]);

  const register = useCallback(async (email: string, password: string, fullName: string, club: string) => {
    setBusy(true); setError(undefined);
    try { const result = await signUp(email, password, fullName, club); if (!result.confirmationRequired) await applyUser(result.user); return result.confirmationRequired; }
    catch (cause) { const message = cause instanceof Error ? cause.message : 'Registration failed.'; setError(message); throw cause; }
    finally { setBusy(false); }
  }, [applyUser]);

  const logout = useCallback(async () => {
    setBusy(true);
    try { await signOut(); setLoggedIn(false); }
    finally { setBusy(false); }
  }, []);

  const savePractice = useCallback((p: Practice) => {
    practiceApi.savePractice(p);
    syncPractices();
    void savePracticeRemote(p, coach.id).catch((cause: Error) => setError(cause.message));
  }, [coach.id, practiceApi, syncPractices]);

  const markDrillViewed = useCallback((id: string) => {
    setRecentDrills((prev) => {
      if (prev[0] === id) return prev;
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8);
      storage.writeRecentDrills(next);
      void saveCoachState(coach.id, next, draft).catch((cause: Error) => setError(cause.message));
      return next;
    });
  }, [coach.id, draft, storage]);

  /**
   * Create a player profile through the people service.
   *
   * Pages hand over a fully built profile, but the service owns id generation
   * and defaults, so a genuinely new profile is created rather than updated.
   */
  const addPlayer = useCallback((p: Player) => {
    if (people.getPlayer(p.id)) people.updatePlayer(p);
    else {
      const created = people.createPlayer({
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth,
        ageGroup: p.ageGroup,
        height: p.height,
        weight: p.weight,
        position: p.position,
        dominantHand: p.dominantHand,
        club: p.club,
        skillLevel: p.skillLevel,
        trainingFrequency: p.trainingFrequency,
        teamId: p.teamId,
        photoColor: p.photoColor,
      });
      // Keep any notes the page collected up front.
      if (p.notes.length) people.updatePlayer({ ...created, notes: p.notes });
    }
    syncPeople();
    const saved = people.listPlayers().find((item) => item.id === p.id) ?? p;
    void savePlayer(saved, coach.id).catch((cause: Error) => setError(cause.message));
  }, [coach.id, people, syncPeople]);

  /** Replace an existing player profile. */
  const updatePlayer = useCallback((p: Player) => {
    if (!people.getPlayer(p.id)) return;
    people.updatePlayer(p);
    syncPeople();
    void savePlayer(p, coach.id).catch((cause: Error) => setError(cause.message));
  }, [coach.id, people, syncPeople]);

  /**
   * Delete a player profile.
   *
   * The player id is first removed from every team's roster so no team keeps
   * a dangling reference, then the profile itself is removed. Training
   * history and saved practices are left untouched — they are historical
   * records, not live references to the profile.
   */
  const deletePlayer = useCallback((id: string) => {
    const affectedTeams = people.listTeams().filter((t) => t.playerIds.includes(id));
    for (const team of affectedTeams) {
      const updated = people.updateTeam({ ...team, playerIds: team.playerIds.filter((pid) => pid !== id) });
      void saveTeam(updated, coach.id).catch((cause: Error) => setError(cause.message));
    }
    people.removePlayer(id);
    syncPeople();
    void removePlayerRemote(id, coach.id).catch((cause: Error) => setError(cause.message));
  }, [coach.id, people, syncPeople]);

  /** Create a team through the people service. */
  const addTeam = useCallback((t: Team) => {
    if (people.getTeam(t.id)) people.updateTeam(t);
    else {
      people.createTeam({
        name: t.name,
        club: t.club,
        ageGroup: t.ageGroup,
        skillLevel: t.skillLevel,
        coach: t.coach,
        playerIds: t.playerIds,
      });
    }
    syncPeople();
    const saved = people.listTeams().find((item) => item.id === t.id) ?? t;
    void saveTeam(saved, coach.id).catch((cause: Error) => setError(cause.message));
  }, [coach.id, people, syncPeople]);

  /**
   * Delete a team.
   *
   * Players on the roster are unassigned rather than deleted, then the team
   * itself is removed. Historical and saved practice records are untouched.
   */
  const deleteTeam = useCallback((id: string) => {
    const affectedPlayers = people.listPlayers().filter((p) => p.teamId === id);
    for (const player of affectedPlayers) {
      const updated = people.updatePlayer({ ...player, teamId: undefined });
      void savePlayer(updated, coach.id).catch((cause: Error) => setError(cause.message));
    }
    people.removeTeam(id);
    syncPeople();
    void removeTeamRemote(id, coach.id).catch((cause: Error) => setError(cause.message));
  }, [coach.id, people, syncPeople]);

  /**
   * Finish a session in Practice Mode.
   *
   * The practice is stored first — a session run straight from a draft would
   * otherwise have nothing for history to point at — then the practice service
   * writes history and every player who trained is credited exactly once.
   *
   * @param practice the practice that was run.
   * @param notes combined coach notes for the session.
   * @param completedItemIds ids of the timeline slots the coach marked done.
   */
  const completePractice = useCallback((practice: Practice, notes: string, completedItemIds: string[]) => {
    const saved = practiceApi.savePractice({
      ...practice,
      items: practice.items.map((item) => ({ ...item, completed: completedItemIds.includes(item.id) })),
    });
    const result = practiceApi.completePractice(saved.id, notes);
    if (result) people.creditSession(saved.playerIds, result.entry.duration, result.entry.completedDrills);
    void savePracticeRemote(saved, coach.id).catch((cause: Error) => setError(cause.message));
    if (result) void saveHistory(result.entry, coach.id, saved.id).catch((cause: Error) => setError(cause.message));
    for (const player of people.listPlayers().filter((item) => saved.playerIds.includes(item.id))) void savePlayer(player, coach.id).catch((cause: Error) => setError(cause.message));
    setDraft(undefined);
    syncPractices();
    syncPeople();
  }, [coach.id, practiceApi, people, setDraft, syncPractices, syncPeople]);

  const value = useMemo<Store>(() => ({
    coach,
    loggedIn,
    authReady,
    busy,
    error,
    login,
    register,
    logout,
    players,
    teams,
    practices,
    history,
    recentDrills,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addTeam,
    deleteTeam,
    savePractice,
    deletePractice: (id) => { practiceApi.removePractice(id); syncPractices(); void removePracticeRemote(id, coach.id).catch((cause: Error) => setError(cause.message)); },
      deleteHistoryEntry: (id) => { practiceApi.removeHistoryEntry(id); syncPractices(); },
    duplicatePractice: (id) => { practiceApi.duplicatePractice(id); syncPractices(); },
    completePractice,
    markDrillViewed,
    draft,
    setDraft,
    services,
  }), [
    services, coach, loggedIn, authReady, busy, error, login, register, logout, players, teams, practices, history, recentDrills,
    addPlayer, updatePlayer, deletePlayer, addTeam, deleteTeam, savePractice, practiceApi, syncPractices,
    completePractice, markDrillViewed, draft, setDraft,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Access the BPDS prototype store. */
export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
