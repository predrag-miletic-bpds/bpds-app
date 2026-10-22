import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DRILLS, getDrill } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { CoachDoseOverrideV1 } from '@predrag-miletic/bpds-methodology.entities.methodology';
import { drillPhase } from '@predrag-miletic/bpds-methodology.practice-generator';
import { prescriptionIndividualElapsedDurationRangeSecondsV1, resolveCoachPrescriptionV1 } from '../../../bpds-methodology/practice-prescriptions/coach-prescriptions-v1.js';
import { AREAS, MODULES, getModule } from '@predrag-miletic/bpds-methodology.modules-catalog';
import type { Practice, PracticeItem } from '../data/types.js';
import { PlannedDoseEditor } from '../components/planned-dose-editor.js';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Field, Input, Page, PageHead, SectionTitle, Select, levelInfo } from '../ui/ui.js';

/** UI-only grouping: preserve canonical drill IDs, module codes and generator. */
const ATHLETIC_CODES = new Set([
  'WUP-ATH-REACT-001', 'WUP-ATH-REACT-002', 'WUP-ATH-REACT-003',
  'WUP-ATH-SPEED-001', 'WUP-ATH-DECEL-001', 'WUP-ATH-DECEL-002',
]);
const ATHLETIC_FILTER = '__ATH_LIBRARY_ONLY__';
const isAthleticDrill = (code: string) => ATHLETIC_CODES.has(code.toUpperCase());

const BLOCKS = [
  ['Water Break', 3], ['Coach Meeting', 5], ['Free Throws', 4], ['Team Talk', 5], ['Competition', 10],
] as const;

/** Manual practice builder — Build Your Own Practice. */
export function Builder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { savePractice, setDraft, teams, draft, services } = useStore();
  const editPracticeId = (location.state as { practiceId?: string } | null)?.practiceId;
  const [source] = useState<Practice | undefined>(
    () => editPracticeId && draft?.id === editPracticeId ? draft : undefined,
  );
  const [practiceId] = useState(() => source?.id ?? `pr-${Date.now()}`);
  const [name, setName] = useState(source?.name ?? 'New Practice');
  const [teamId, setTeamId] = useState(source?.teamId ?? '');
  const [target, setTarget] = useState(source?.duration ?? 60);
  const [items, setItems] = useState<PracticeItem[]>(() => source?.items ?? []);
  const [q, setQ] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [level, setLevel] = useState('');
  const [doseErrors, setDoseErrors] = useState<Record<string, string | undefined>>({});

  const results = useMemo(() => DRILLS.filter((d) => {
    if (q && !`${d.code} ${d.name} ${d.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (moduleCode && !(moduleCode === ATHLETIC_FILTER ? isAthleticDrill(d.code) : moduleCode === 'WUP' ? d.moduleCode === 'WUP' && !isAthleticDrill(d.code) : d.moduleCode === moduleCode)) return false;
    if (level && d.level !== Number(level)) return false;
    return true;
  }).slice(0, 40), [q, moduleCode, level]);

  const total = items.reduce((a, i) => a + i.duration, 0);

  const addDrill = (drillId: string) => {
    const d = getDrill(drillId);
    if (!d) return;
    const ageGroup = selectedTeam?.ageGroup ?? source?.ageGroup ?? 'U16';
    const coachPrescription = resolveCoachPrescriptionV1(drillId, ageGroup);
    setItems((prev) => [...prev, { id: `i-${Date.now()}-${prev.length}`, kind: 'drill', drillId, duration: d.duration, phase: drillPhase(d), ...(coachPrescription ? { coachPrescription } : {}) }]);
  };

  const addBlock = (label: string, duration: number) => {
    setItems((prev) => [...prev, { id: `b-${Date.now()}-${prev.length}`, kind: 'break', label, duration, phase: 'Cool Down' }]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    setItems(next);
  };

  const selectedTeam = teams.find((team) => team.id === teamId);
  const ageGroup = selectedTeam?.ageGroup ?? source?.ageGroup ?? 'U16';
  const today = new Date().toISOString().slice(0, 10);

  const build = (): Practice => ({
    ...source,
    id: practiceId,
    name,
    date: source?.date ?? today,
    playerIds: teamId ? (selectedTeam?.playerIds ?? []) : (source?.playerIds ?? []),
    teamId: teamId || undefined,
    ageGroup: selectedTeam?.ageGroup ?? source?.ageGroup ?? 'U16',
    skillLevel: selectedTeam?.skillLevel ?? source?.skillLevel ?? 'Intermediate',
    duration: target,
    primaryFocus: source?.primaryFocus ?? 'Complete Player Development',
    secondaryFocus: source?.secondaryFocus ?? 'Decision Making',
    equipment: source?.equipment ?? ['Basketballs', 'Cones', 'Contact pad', 'No additional equipment'],
    courtSize: source?.courtSize ?? 'Full court',
    objective: source?.objective ?? 'Coach-built practice.',
    items,
    status: source?.status ?? 'Draft',
    lastOpened: today,
  });

  const applyDoseOverride = (itemId: string, override: CoachDoseOverrideV1) => {
    try {
      services.practices.savePractice(build());
      const updated = services.practices.applyItemCoachDoseOverride(practiceId, itemId, override);
      if (!updated) return;
      setItems(updated.items);
      setDraft(updated);
      setDoseErrors((current) => ({ ...current, [itemId]: undefined }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Invalid coach override.';
      setDoseErrors((current) => ({ ...current, [itemId]: message }));
    }
  };

  const removeDoseOverride = (itemId: string) => {
    try {
      services.practices.savePractice(build());
      const updated = services.practices.removeItemCoachDoseOverride(practiceId, itemId);
      if (!updated) return;
      setItems(updated.items);
      setDraft(updated);
      setDoseErrors((current) => ({ ...current, [itemId]: undefined }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not remove coach override.';
      setDoseErrors((current) => ({ ...current, [itemId]: message }));
    }
  };

  const save = () => {
    const p = build();
    savePractice(p);
    setDraft(p);
    void navigate(`/practice/${p.id}`);
  };

  return (
    <Page>
      <PageHead
        title="Build Your Own Practice"
        sub="Browse modules, search drills and assemble the session yourself. Total duration updates automatically."
        actions={(
          <>
            <Button onClick={() => navigate('/generate')}>Use Generator Instead</Button>
            <Button variant="primary" onClick={save} disabled={!items.length}>Save Practice</Button>
          </>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 20, alignItems: 'start' }}>
        <div>
          <Card style={{ marginBottom: 14 }}>
            <SectionTitle>Find Drills</SectionTitle>
            <div style={{ display: 'grid', gap: 11 }}>
              <Input placeholder="Search drills…" value={q} onChange={(e) => setQ(e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}>
                <Select value={moduleCode} onChange={(e) => setModuleCode(e.target.value)}>
                  <option value="">All modules</option>
                  <optgroup label="Athletic & Skill Foundation">
                    <option value="WUP">Warm-Up &amp; Movement Preparation</option>
                    <option value={ATHLETIC_FILTER}>Athletic Development</option>
                  </optgroup>
                  {AREAS.map((area) => (
                    <optgroup key={area} label={area}>
                      {MODULES.filter((m) => m.area === area && m.code !== 'WUP').map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
                    </optgroup>
                  ))}
                </Select>
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">All levels</option>
                  <option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option>
                </Select>
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gap: 9, maxHeight: 620, overflow: 'auto', paddingRight: 4 }}>
            {results.map((d) => {
              const li = levelInfo(d.level);
              return (
                <Card key={d.id} style={{ padding: 13 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 850, color: 'var(--bpds-orange)', letterSpacing: '0.05em' }}>{d.code}</div>
                      <div style={{ fontSize: 14.5, fontWeight: 730, marginTop: 2 }}>{d.name}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                        <Badge tone={li.tone}>{li.label}</Badge>
                        <Badge tone="gray">{getModule(d.moduleCode)?.name}</Badge>
                        <Badge tone="gray">{d.duration} min</Badge>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <Button size="sm" variant="primary" onClick={() => addDrill(d.id)}>Add</Button>
                      <Button size="sm" onClick={() => navigate(`/drill/${d.id}`)}>View</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <Card style={{ marginBottom: 14 }}>
            <SectionTitle>Practice Settings</SectionTitle>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="Practice name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Team (optional)">
                  <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                    <option value="">No team</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </Field>
                <Field label="Target duration">
                  <Select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                    {[30, 45, 60, 75, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
                  </Select>
                </Field>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <SectionTitle>Practice ({items.length} blocks)</SectionTitle>
              <span style={{ fontSize: 15, fontWeight: 850, color: total > target ? '#c2440f' : 'var(--bpds-ink)' }}>
                {total} / {target} min
              </span>
            </div>
            {total > target ? (
              <div style={{ background: 'var(--bpds-orange-soft)', border: '1px solid #5e311f', color: 'var(--bpds-amber)', borderRadius: 9, padding: '9px 12px', fontSize: 13, fontWeight: 650, marginBottom: 12 }}>
                ⚠ {total - target} minutes over target.
              </div>
            ) : null}
            {items.length === 0 ? (
              <p style={{ color: 'var(--bpds-slate)', fontSize: 14 }}>Add drills from the left to build the session.</p>
            ) : items.map((it, i) => {
              const d = it.drillId ? getDrill(it.drillId) : undefined;
              return (
                <div key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--bpds-line)', padding: '10px 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 850, color: 'var(--bpds-slate)', width: 20 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{d ? `${d.code} — ${d.name}` : it.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--bpds-slate)' }}>{it.phase}</div>
                    {d ? (() => { const dose = it.coachPrescription ?? resolveCoachPrescriptionV1(d.id, ageGroup); if (!dose) return null; const elapsed = prescriptionIndividualElapsedDurationRangeSecondsV1(dose); return <div style={{ fontSize: 11.5, color: 'var(--bpds-ink-2)', marginTop: 3 }}>Coach {dose.ageGroup}: {dose.workText}; {dose.restText} rest · individual {elapsed.min}–{elapsed.max} s · group allocation {dose.allocatedMinutes} min</div>; })() : null}
                    {it.plannedDose ? (
                      <PlannedDoseEditor
                        item={it}
                        error={doseErrors[it.id]}
                        onApply={(override) => applyDoseOverride(it.id, override)}
                        onRemove={() => removeDoseOverride(it.id)}
                      />
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {it.plannedDose ? (
                      <span style={{ fontSize: 12.5, fontWeight: 750, minWidth: 76, textAlign: 'center' }}>
                        {it.duration}m effective
                      </span>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => setItems(items.map((x) => (x.id === it.id ? { ...x, duration: Math.max(2, x.duration - 1) } : x)))}>−</Button>
                        <span style={{ fontSize: 12.5, fontWeight: 750, width: 44, textAlign: 'center' }}>{it.duration}m</span>
                        <Button size="sm" onClick={() => setItems(items.map((x) => (x.id === it.id ? { ...x, duration: x.duration + 1 } : x)))}>+</Button>
                      </>
                    )}
                    <Button size="sm" onClick={() => move(i, -1)}>↑</Button>
                    <Button size="sm" onClick={() => move(i, 1)}>↓</Button>
                    <Button size="sm" variant="danger" onClick={() => setItems(items.filter((x) => x.id !== it.id))}>✕</Button>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <SectionTitle>Add Session Blocks</SectionTitle>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BLOCKS.map(([label, dur]) => (
                <Button key={label} size="sm" onClick={() => addBlock(label, dur)}>+ {label}</Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
