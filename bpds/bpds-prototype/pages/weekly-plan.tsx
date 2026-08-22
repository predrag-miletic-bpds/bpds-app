import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COURT_SIZES, EQUIPMENT_OPTIONS, FOCUS_OPTIONS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { AgeGroup } from '../data/types.js';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Chip, ChipRow, Field, Page, PageHead, SectionTitle, Select } from '../ui/ui.js';
import {
  createDaySlot,
  generateWeeklyPlan,
  regenerateSession,
  regenerateWeek,
  SEASON_PHASES,
  toggleSessionLock,
} from '../data/weekly-plan-generator.js';
import { WEEKDAYS } from '../data/weekly-plan-types.js';
import type { SeasonPhase, WeekDay, WeeklyDaySlot, WeeklyPlan, WeeklyPlanContext, WeeklyTrainingType } from '../data/weekly-plan-types.js';
import styles from './weekly-plan.module.css';

const AGE_GROUPS: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];
const BPDS_LEVELS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: 'Level 1 · Foundation' },
  { value: 2, label: 'Level 2 · Development' },
  { value: 3, label: 'Level 3 · Performance' },
];
const DURATIONS = [30, 45, 60, 75, 90, 105, 120];
const WEEKLY_PLAN_STORAGE_KEY = 'bpds.weekly-plan-methodical-v4';

function loadStoredWeeklyPlan(): WeeklyPlan | undefined {
  try {
    const raw = window.sessionStorage.getItem(WEEKLY_PLAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) as WeeklyPlan : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Weekly Plan generator — builds a full week of BPDS-methodology sessions.
 *
 * Each session is generated through the same `services.practices.generate`
 * call the single-practice generator uses; this page only decides scheduling
 * (days, roles, focus split and intensity) and lets the coach lock, review,
 * regenerate, view or start each resulting session.
 */
export function WeeklyPlan() {
  const navigate = useNavigate();
  const { players, teams, setDraft, services } = useStore();

  const [trainingType, setTrainingType] = useState<WeeklyTrainingType>('Team');
  const [playerIds, setPlayerIds] = useState<string[]>(['p1', 'p2', 'p4']);
  const [teamId, setTeamId] = useState<string>('t1');
  const [weekStart, setWeekStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('U16');
  const [bpdsLevel, setBpdsLevel] = useState<1 | 2 | 3>(2);
  const [days, setDays] = useState<WeeklyDaySlot[]>([
    createDaySlot('Monday', 60),
    createDaySlot('Wednesday', 60),
    createDaySlot('Friday', 60),
  ]);
  const [primaryFocus, setPrimaryFocus] = useState('Shooting');
  const [secondaryFocus, setSecondaryFocus] = useState('Decision Making');
  const [hasMaintenance, setHasMaintenance] = useState(false);
  const [maintenanceFocus, setMaintenanceFocus] = useState('Ball Handling');
  const [gameDay, setGameDay] = useState<WeekDay | ''>('');
  const [seasonPhase, setSeasonPhase] = useState<SeasonPhase>(SEASON_PHASES[1]);
  const [playerCount, setPlayerCount] = useState(10);
  const [baskets, setBaskets] = useState(2);
  const [courtSize, setCourtSize] = useState('Full court');
  const [equipment, setEquipment] = useState<string[]>(['Basketballs', 'Cones', 'No additional equipment']);
  const [withDefense, setWithDefense] = useState(true);

  const [plan, setPlan] = useState<WeeklyPlan | undefined>(loadStoredWeeklyPlan);

  useEffect(() => {
    try {
      if (plan) window.sessionStorage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(plan));
      else window.sessionStorage.removeItem(WEEKLY_PLAN_STORAGE_KEY);
    } catch {
      // The plan still works in memory when browser storage is unavailable.
    }
  }, [plan]);

  const toggleEquipment = (v: string) => {
    setEquipment((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));
  };

  const addDay = () => {
    if (days.length >= 4) return;
    const used = new Set(days.map((d) => d.dayOfWeek));
    const nextDay = WEEKDAYS.find((d) => !used.has(d)) ?? WEEKDAYS[days.length % 7];
    setDays((arr) => [...arr, createDaySlot(nextDay, 60)]);
  };

  const removeDay = (id: string) => setDays((arr) => (arr.length > 1 ? arr.filter((d) => d.id !== id) : arr));

  const updateDay = (id: string, patch: Partial<WeeklyDaySlot>) => {
    setDays((arr) => arr.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const buildContext = (): WeeklyPlanContext => ({
    trainingType,
    playerIds: trainingType === 'Team' && teamId ? (teams.find((t) => t.id === teamId)?.playerIds ?? []) : playerIds,
    teamId: trainingType === 'Team' ? teamId : undefined,
    weekStart,
    ageGroup,
    bpdsLevel,
    days,
    primaryFocus,
    secondaryFocus,
    maintenanceFocus: hasMaintenance ? maintenanceFocus : undefined,
    gameDay: gameDay || undefined,
    seasonPhase,
    playerCount,
    baskets,
    courtSize,
    equipment,
    withDefense,
  });

  const generate = () => setPlan(generateWeeklyPlan(buildContext(), services.practices.generate));

  const regenAll = () => {
    if (plan) setPlan(regenerateWeek(plan, services.practices.generate));
  };

  const regenOne = (sessionId: string) => {
    if (plan) setPlan(regenerateSession(plan, sessionId, services.practices.generate));
  };

  const toggleLock = (sessionId: string) => {
    if (plan) setPlan(toggleSessionLock(plan, sessionId));
  };

  const view = (sessionId: string) => {
    const session = plan?.sessions.find((s) => s.id === sessionId);
    if (!session?.practice) return;
    setDraft(session.practice);
    void navigate('/practice/draft', { state: { from: '/weekly-plan' } });
  };

  const start = (sessionId: string) => {
    const session = plan?.sessions.find((s) => s.id === sessionId);
    if (!session?.practice) return;
    setDraft(session.practice);
    void navigate('/practice-mode/draft', { state: { from: '/weekly-plan' } });
  };

  return (
    <Page>
      <PageHead
        title="Weekly Plan"
        sub="Schedule the week once — BPDS generates every session through the same methodology-correct generator, following a Learn → Develop → Decide → Apply/Compete progression."
      />

      <div style={{ display: 'grid', gap: 18 }}>
        <Card>
          <SectionTitle>1 · Who is training</SectionTitle>
          <ChipRow>
            {(['Individual', 'Small group', 'Team'] as const).map((t) => (
              <Chip key={t} on={trainingType === t} onClick={() => setTrainingType(t)} accentSelected>{t}</Chip>
            ))}
          </ChipRow>

          {trainingType === 'Team' ? (
            <div style={{ marginTop: 16, maxWidth: 320 }}>
              <Field label="Team">
                <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                  <option value="">No team — select players below</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
            </div>
          ) : null}

          {(trainingType !== 'Team' || !teamId) ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--bpds-slate)', marginBottom: 9 }}>
                Select players
              </div>
              <ChipRow>
                {players.map((p) => (
                  <Chip key={p.id} on={playerIds.includes(p.id)} accentSelected onClick={() => setPlayerIds((arr) => (arr.includes(p.id) ? arr.filter((x) => x !== p.id) : [...arr, p.id]))}>
                    {p.fullName}
                  </Chip>
                ))}
              </ChipRow>
            </div>
          ) : null}
        </Card>

        <Card>
          <SectionTitle>2 · Week context</SectionTitle>
          <div className={styles.formGrid}>
            <Field label="Week start (Monday)">
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--bpds-line)', background: 'var(--bpds-surface)', color: 'inherit' }}
              />
            </Field>
            <Field label="Age group">
              <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="BPDS level">
              <Select value={bpdsLevel} onChange={(e) => setBpdsLevel(Number(e.target.value) as 1 | 2 | 3)}>
                {BPDS_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </Select>
            </Field>
            <Field label="Season phase">
              <Select value={seasonPhase} onChange={(e) => setSeasonPhase(e.target.value as SeasonPhase)}>
                {SEASON_PHASES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Next game day (optional)">
              <Select value={gameDay} onChange={(e) => setGameDay(e.target.value as WeekDay | '')}>
                <option value="">No game this week</option>
                {WEEKDAYS.map((d) => <option key={d}>{d}</option>)}
              </Select>
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle>3 · Sessions this week ({days.length}/4)</SectionTitle>
          <div className={styles.daysList}>
            {days.map((d) => (
              <div key={d.id} className={styles.dayRow}>
                <Field label="Day">
                  <Select value={d.dayOfWeek} onChange={(e) => updateDay(d.id, { dayOfWeek: e.target.value as WeekDay })}>
                    {WEEKDAYS.map((w) => <option key={w}>{w}</option>)}
                  </Select>
                </Field>
                <Field label="Duration">
                  <Select value={d.duration} onChange={(e) => updateDay(d.id, { duration: Number(e.target.value) })}>
                    {DURATIONS.map((n) => <option key={n} value={n}>{n} minutes</option>)}
                  </Select>
                </Field>
                <Button variant="danger" size="sm" onClick={() => removeDay(d.id)} disabled={days.length <= 1}>Remove</Button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Button size="sm" onClick={addDay} disabled={days.length >= 4}>+ Add session (max 4)</Button>
          </div>
        </Card>

        <Card>
          <SectionTitle>4 · Weekly focus</SectionTitle>
          <div className={styles.formGrid}>
            <Field label="Primary focus (55%, or 65% without maintenance)">
              <Select value={primaryFocus} onChange={(e) => setPrimaryFocus(e.target.value)}>
                {FOCUS_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </Select>
            </Field>
            <Field label="Secondary focus (30%, or 35% without maintenance)">
              <Select value={secondaryFocus} onChange={(e) => setSecondaryFocus(e.target.value)}>
                {FOCUS_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </Select>
            </Field>
          </div>
          <ChipRow>
            <Chip on={hasMaintenance} accentSelected onClick={() => setHasMaintenance((v) => !v)}>
              {hasMaintenance ? '✓ Maintenance focus (15%)' : '+ Add maintenance focus'}
            </Chip>
          </ChipRow>
          {hasMaintenance ? (
            <div style={{ marginTop: 14, maxWidth: 320 }}>
              <Field label="Maintenance focus">
                <Select value={maintenanceFocus} onChange={(e) => setMaintenanceFocus(e.target.value)}>
                  {FOCUS_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </Select>
              </Field>
            </div>
          ) : null}
        </Card>

        <Card>
          <SectionTitle>5 · Context</SectionTitle>
          <div className={styles.formGrid}>
            <Field label="Number of players">
              <Select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
            <Field label="Number of baskets">
              <Select value={baskets} onChange={(e) => setBaskets(Number(e.target.value))}>
                {[0, 1, 2, 4, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
            <Field label="Court size">
              <Select value={courtSize} onChange={(e) => setCourtSize(e.target.value)}>
                {COURT_SIZES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--bpds-slate)', marginBottom: 9 }}>Available equipment</div>
            <ChipRow>
              {EQUIPMENT_OPTIONS.map((e) => (
                <Chip key={e} on={equipment.includes(e)} onClick={() => toggleEquipment(e)} accentSelected>{e}</Chip>
              ))}
            </ChipRow>
          </div>
          <ChipRow>
            <Chip on={withDefense} onClick={() => setWithDefense(!withDefense)} accentSelected>
              {withDefense ? '✓ With defense' : 'Without defense'}
            </Chip>
          </ChipRow>
        </Card>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="primary" size="lg" onClick={generate}>⚡ Generate Weekly Plan</Button>
        </div>

        {plan ? (
          <>
            {plan.ageGuidanceWarning ? (
              <div className={styles.warning}>
                <span>⚠️</span>
                <span>{plan.ageGuidanceWarning} This is guidance only — the plan above is still fully generated.</span>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <SectionTitle>Generated sessions</SectionTitle>
              <Button onClick={regenAll}>↻ Regenerate Week (keeps locked sessions)</Button>
            </div>

            <div className={styles.weekGrid}>
              {plan.sessions.map((session) => {
                const drillCount = session.practice?.items.filter((i) => i.kind === 'drill').length ?? 0;
                return (
                  <Card key={session.id} className={`${styles.sessionCard} ${session.locked ? styles.locked : ''}`}>
                    <div className={styles.sessionHead}>
                      <div>
                        <div className={styles.sessionDate}>{session.dayOfWeek} · {session.date}</div>
                        <div className={styles.sessionRole}>{session.role}</div>
                      </div>
                      <Badge tone={session.locked ? 'orange' : 'gray'}>{session.locked ? '🔒 Locked' : 'Unlocked'}</Badge>
                    </div>

                    <div className={styles.sessionMeta}>
                      <Badge tone="blue">{session.duration} min</Badge>
                      <Badge tone="amber">Intensity {session.intensityLabel}</Badge>
                      <Badge tone="gray">{session.focusMode} focus</Badge>
                      <Badge tone="gray">{drillCount} drills</Badge>
                    </div>

                    <div className={styles.sessionFocus}>
                      <b>Primary:</b> {session.ctx.primaryFocus} · <b>Secondary:</b> {session.ctx.secondaryFocus}
                    </div>

                    <div className={styles.sessionActions}>
                      <Button size="sm" onClick={() => toggleLock(session.id)}>{session.locked ? 'Unlock' : 'Lock'}</Button>
                      <Button size="sm" onClick={() => regenOne(session.id)} disabled={session.locked}>↻ Regenerate</Button>
                      <Button size="sm" onClick={() => view(session.id)}>View</Button>
                      <Button variant="primary" size="sm" onClick={() => start(session.id)}>▶ Start</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </Page>
  );
}
