import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COURT_SIZES, EQUIPMENT_OPTIONS, FOCUS_OPTIONS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { AgeGroup, GeneratorContext, PlayerSkillLevel } from '../data/types.js';
import { useStore } from '../store/store.js';
import { Avatar, Button, Card, Chip, ChipRow, Field, Page, PageHead, SectionTitle, Select } from '../ui/ui.js';
import { WeeklyPlan } from './weekly-plan.js';

const AGE_GROUPS: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];
const SKILL_LEVELS: PlayerSkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const DURATIONS = [30, 45, 60, 75, 90, 120];

/**
 * Training Generator entry point.
 *
 * Renders an isolated Single Practice | Weekly Plan toggle above the
 * existing single-practice form. Selecting "Weekly Plan" swaps in the
 * separate {@link WeeklyPlan} page without touching the single-practice
 * form or its generation logic below.
 */
export function Generate() {
  const [mode, setMode] = useState<'single' | 'weekly'>('single');

  return (
    <>
      <Page>
        <div style={{ maxWidth: 960, margin: '24px auto 0', padding: '0 20px' }}>
          <ChipRow>
            <Chip on={mode === 'single'} accentSelected onClick={() => setMode('single')}>Single Practice</Chip>
            <Chip on={mode === 'weekly'} accentSelected onClick={() => setMode('weekly')}>Weekly Plan</Chip>
          </ChipRow>
        </div>
      </Page>
      {mode === 'weekly' ? <WeeklyPlan /> : <SinglePracticeGenerator />}
    </>
  );
}

/** The original single-practice Training Generator form — unchanged. */
function SinglePracticeGenerator() {
  const navigate = useNavigate();
  const { players, teams, setDraft, services } = useStore();

  const [trainingType, setTrainingType] = useState<GeneratorContext['trainingType']>('Team');
  const [playerIds, setPlayerIds] = useState<string[]>(['p1', 'p2', 'p4']);
  const [teamId, setTeamId] = useState<string>('t1');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('U16');
  const [skillLevel, setSkillLevel] = useState<PlayerSkillLevel>('Advanced');
  const [duration, setDuration] = useState(90);
  const [playerCount, setPlayerCount] = useState(10);
  const [baskets, setBaskets] = useState(2);
  const [courtSize, setCourtSize] = useState('Full court');
  const [equipment, setEquipment] = useState<string[]>(['Basketballs', 'Cones', 'Contact pad', 'No additional equipment']);
  const [primaryFocus, setPrimaryFocus] = useState('Shooting');
  const [secondaryFocus, setSecondaryFocus] = useState('Decision Making');
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('High');
  const [withDefense, setWithDefense] = useState(true);
  const [competitive, setCompetitive] = useState(true);
  const [smallSidedGame, setSmallSidedGame] = useState(true);

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const run = () => {
    const ctx: GeneratorContext = {
      trainingType,
      playerIds: trainingType === 'Team' && teamId ? (teams.find((t) => t.id === teamId)?.playerIds ?? []) : playerIds,
      teamId: trainingType === 'Team' ? teamId : undefined,
      ageGroup,
      skillLevel,
      duration,
      playerCount,
      baskets,
      courtSize,
      equipment,
      primaryFocus,
      secondaryFocus,
      intensity,
      withDefense,
      competitive,
      smallSidedGame,
    };
    // Generation goes through the practice service — the draft stays unsaved
    // until the coach saves it from the plan view.
    const practice = services.practices.generate(ctx);
    setDraft(practice);
    void navigate('/practice/draft');
  };

  return (
    <Page>
      <PageHead
        title="Training Generator"
        sub="Enter the training context. BPDS builds a methodologically correct practice — you keep the final decision."
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
              <Field label="Team (optional)">
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {players.map((p) => {
                  const on = playerIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(playerIds, p.id, setPlayerIds)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: 10,
                        border: `1px solid ${on ? 'var(--bpds-orange)' : 'var(--bpds-line)'}`,
                        background: on ? 'var(--bpds-orange-soft)' : 'var(--bpds-surface)',
                        borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <Avatar name={p.fullName} color={p.photoColor} size={30} />
                      <span>
                        <b style={{ display: 'block', fontSize: 13.5 }}>{p.fullName}</b>
                        <span style={{ fontSize: 12, color: 'var(--bpds-slate)' }}>{p.ageGroup} · {p.skillLevel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <SectionTitle>2 · Context</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
            <Field label="Age group">
              <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Player skill level">
              <Select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value as PlayerSkillLevel)}>
                {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Training duration">
              <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </Select>
            </Field>
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
        </Card>

        <Card>
          <SectionTitle>3 · Available equipment</SectionTitle>
          <ChipRow>
            {EQUIPMENT_OPTIONS.map((e) => (
              <Chip key={e} on={equipment.includes(e)} onClick={() => toggle(equipment, e, setEquipment)} accentSelected>{e}</Chip>
            ))}
          </ChipRow>
        </Card>

        <Card>
          <SectionTitle>4 · Training focus</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
            <Field label="Primary focus">
              <Select value={primaryFocus} onChange={(e) => setPrimaryFocus(e.target.value)}>
                {FOCUS_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </Select>
            </Field>
            <Field label="Secondary focus">
              <Select value={secondaryFocus} onChange={(e) => setSecondaryFocus(e.target.value)}>
                {FOCUS_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </Select>
            </Field>
            <Field label="Training intensity">
              <Select value={intensity} onChange={(e) => setIntensity(e.target.value as 'Low' | 'Medium' | 'High')}>
                <option>Low</option><option>Medium</option><option>High</option>
              </Select>
            </Field>
          </div>
          <ChipRow>
            <Chip on={withDefense} onClick={() => setWithDefense(!withDefense)} accentSelected>
              {withDefense ? '✓ With defense' : 'Without defense'}
            </Chip>
            <Chip on={competitive} onClick={() => setCompetitive(!competitive)} accentSelected>
              {competitive ? '✓ Competitive section' : 'No competitive section'}
            </Chip>
            <Chip on={smallSidedGame} onClick={() => setSmallSidedGame(!smallSidedGame)} accentSelected>
              {smallSidedGame ? '✓ Small-sided game' : 'No small-sided game'}
            </Chip>
          </ChipRow>
        </Card>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button size="lg" onClick={() => navigate('/builder')}>Build Manually Instead</Button>
          <Button variant="primary" size="lg" onClick={run}>⚡ Generate Practice</Button>
        </div>
      </div>
    </Page>
  );
}
