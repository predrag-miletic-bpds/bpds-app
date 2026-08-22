import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DrillVideo, useDrills } from '../data/drill-media.js';
import { findAlternatives } from '@predrag-miletic/bpds-methodology.practice-generator';
import { getModule } from '@predrag-miletic/bpds-methodology.modules-catalog';
import type { Practice, PracticeItem } from '../data/types.js';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Page, PageHead, levelInfo } from '../ui/ui.js';
import styles from './practice.module.css';

/** Generated / saved practice plan view with full customization. */
export function PracticeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromWeeklyPlan = (location.state as { from?: string } | null)?.from === '/weekly-plan';
  const drills = useDrills();
  const getDrill = (drillId: string) => drills.find((drill) => drill.id === drillId);
  const { practices, draft, setDraft, savePractice, players, teams } = useStore();

  const source = id === 'draft' ? draft : practices.find((p) => p.id === id);
  const [plan, setPlan] = useState<Practice | undefined>(source);
  const [replacing, setReplacing] = useState<PracticeItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const total = useMemo(() => plan?.items.reduce((a, i) => a + i.duration, 0) ?? 0, [plan]);

  if (!plan) {
    return (
      <Page>
        <PageHead title="Practice not found" />
        <Button variant="primary" onClick={() => navigate('/generate')}>Generate a practice</Button>
      </Page>
    );
  }

  const update = (items: PracticeItem[]) => {
    const next = { ...plan, items };
    setPlan(next);
    if (id === 'draft') setDraft(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const items = [...plan.items];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    update(items);
  };

  const remove = (itemId: string) => update(plan.items.filter((i) => i.id !== itemId));

  const setDuration = (itemId: string, delta: number) => update(plan.items.map(
    (i) => (i.id === itemId ? { ...i, duration: Math.max(2, i.duration + delta) } : i),
  ));

  const addBreak = (label: string, duration: number) => update([
    ...plan.items,
    { id: `b-${Date.now()}`, kind: 'break', label, duration, phase: 'Cool Down' },
  ]);

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const items = [...plan.items];
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    update(items);
    setDragId(null);
    setOverId(null);
  };

  const doReplace = (newDrillId: string) => {
    if (!replacing) return;
    const nd = getDrill(newDrillId);
    update(plan.items.map((i) => (i.id === replacing.id
      ? { ...i, drillId: newDrillId, duration: nd?.duration ?? i.duration }
      : i)));
    setReplacing(null);
  };

  /** Persist the plan and return the saved record (with a stable id). */
  const save = (): Practice => {
    const saved = { ...plan, id: plan.id.startsWith('gen-') ? `pr-${Date.now()}` : plan.id };
    savePractice(saved);
    setPlan(saved);
    setDraft(saved);
    return saved;
  };

  const saveAndStay = () => {
    const saved = save();
    void navigate(`/practice/${saved.id}`, fromWeeklyPlan ? { state: { from: '/weekly-plan' } } : undefined);
  };

  const saveAndRun = () => {
    const saved = save();
    void navigate(`/practice-mode/${saved.id}`, fromWeeklyPlan ? { state: { from: '/weekly-plan' } } : undefined);
  };

  const overtime = total > plan.duration;
  const team = teams.find((t) => t.id === plan.teamId);
  const named = plan.playerIds.map((pid) => players.find((p) => p.id === pid)?.fullName).filter(Boolean);

  let lastPhase = '';

  return (
    <Page>
      {fromWeeklyPlan ? (
        <div style={{ marginBottom: 12 }}>
          <Button size="sm" onClick={() => navigate('/weekly-plan')}>← Back to Weekly Plan</Button>
        </div>
      ) : null}
      <PageHead
        title={plan.name}
        sub={plan.objective}
        actions={(
          <>
            <Button variant="primary" onClick={() => navigate('/builder')}>Edit in Builder</Button>
            <Button variant="primary" onClick={saveAndStay}>Save Practice</Button>
            <Button variant="primary" onClick={saveAndRun}>▶ Start Practice</Button>
          </>
        )}
      />

      <Card style={{ marginBottom: 18 }}>
        <div className={styles.summary}>
          <div className={styles.sumItem}><span>Date</span><b>{plan.date}</b></div>
          <div className={styles.sumItem}><span>Age group</span><b>{plan.ageGroup}</b></div>
          <div className={styles.sumItem}><span>Skill level</span><b>{plan.skillLevel}</b></div>
          <div className={styles.sumItem}><span>Planned</span><b>{plan.duration} min</b></div>
          <div className={styles.sumItem}><span>Primary focus</span><b>{plan.primaryFocus}</b></div>
          <div className={styles.sumItem}><span>Secondary focus</span><b>{plan.secondaryFocus}</b></div>
          <div className={styles.sumItem}><span>Court</span><b>{plan.courtSize}</b></div>
          <div className={styles.sumItem}><span>Team</span><b>{team?.name ?? 'Individual / group'}</b></div>
        </div>
        <div style={{ borderTop: '1px solid var(--bpds-line)', paddingTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {named.map((n) => <Badge key={n} tone="gray">{n}</Badge>)}
          {plan.equipment.map((e) => <Badge key={e} tone="blue">{e}</Badge>)}
        </div>
      </Card>

      {overtime ? (
        <div className={styles.warn}>
          ⚠ Session is {total - plan.duration} minutes over the selected {plan.duration} minute duration.
          Reduce drill durations or remove a block.
        </div>
      ) : null}

      {plan.items.map((item, index) => {
        const drill = item.drillId ? getDrill(item.drillId) : undefined;
        const showPhase = item.phase !== lastPhase;
        lastPhase = item.phase;
        const li = drill ? levelInfo(drill.level) : null;

        return (
          <div key={item.id}>
            {showPhase ? (
              <div className={styles.phaseTag}>
                <b>{item.phase}</b>
                <i />
              </div>
            ) : null}
            <div
              className={`${styles.item} ${item.kind === 'break' ? styles.breakItem : ''} ${overId === item.id ? styles.dragOver : ''}`}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragOver={(e) => { e.preventDefault(); setOverId(item.id); }}
              onDragLeave={() => setOverId(null)}
              onDrop={() => onDrop(item.id)}
            >
              <div className={styles.itemDrag}>⠿</div>
              <div className={styles.itemBody}>
              {drill ? <div className={styles.thumb}><DrillVideo drill={drill} preview className={styles.thumbVideo} /></div> : null}
                <div style={{ minWidth: 0 }}>
                  {drill ? (
                    <>
                      <div className={styles.itemCode}>{drill.code}</div>
                      <div className={styles.itemName}>{drill.name}</div>
                      <div className={styles.itemMeta}>
                        <Badge tone="gray">{getModule(drill.moduleCode)?.name}</Badge>
                        {li ? <Badge tone={li.tone}>{li.label}</Badge> : null}
                        <Badge tone="gray">{drill.suitableAges.slice(0, 3).join(', ')}+</Badge>
                        <Badge tone="gray">{drill.intensity} intensity</Badge>
                      </div>
                      <div className={styles.why}><b>Objective.</b> {drill.objective}</div>
                      <div className={styles.why}><b>Why this drill?</b> {drill.whyThisDrill}</div>
                      <div className={styles.why}><b>Equipment.</b> {drill.equipment.join(', ')}</div>
                    </>
                  ) : (
                    <>
                      <div className={styles.itemCode}>SESSION BLOCK</div>
                      <div className={styles.itemName}>{item.label}</div>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.itemSide}>
                <div className={styles.durBox}>
                  <button type="button" onClick={() => setDuration(item.id, -1)}>−</button>
                  <span>{item.duration} min</span>
                  <button type="button" onClick={() => setDuration(item.id, 1)}>+</button>
                </div>
                <div className={styles.actions}>
                  {drill ? <Button size="sm" onClick={() => navigate(`/drill/${drill.id}`)}>View Drill</Button> : null}
                  {drill ? <Button size="sm" onClick={() => setReplacing(item)}>Replace</Button> : null}
                  <Button size="sm" onClick={() => move(index, -1)}>↑</Button>
                  <Button size="sm" onClick={() => move(index, 1)}>↓</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(item.id)}>Remove</Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        <Button size="sm" onClick={() => addBreak('Water Break', 3)}>+ Water Break</Button>
        <Button size="sm" onClick={() => addBreak('Coach Meeting', 5)}>+ Coach Meeting</Button>
        <Button size="sm" onClick={() => addBreak('Free Throws', 4)}>+ Free Throws</Button>
        <Button size="sm" onClick={() => addBreak('Team Talk', 5)}>+ Team Talk</Button>
      </div>

      <div className={styles.totalBar}>
        <div>
          <strong>{total} min</strong>
          <small>Total session · target {plan.duration} min</small>
        </div>
        <div>
          <strong>{plan.items.filter((i) => i.kind === 'drill').length}</strong>
          <small>Drills</small>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button onClick={saveAndStay} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
            Save Practice
          </Button>
          <Button variant="primary" onClick={saveAndRun}>▶ Start Practice Mode</Button>
        </div>
      </div>

      {replacing ? (
        <ReplaceModal
          item={replacing}
          plan={plan}
          onClose={() => setReplacing(null)}
          onPick={doReplace}
        />
      ) : null}
    </Page>
  );
}

/** Modal listing methodologically valid replacement drills with reasons. */
function ReplaceModal({ item, plan, onClose, onPick }: {
  item: PracticeItem;
  plan: Practice;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const drills = useDrills();
  const getDrill = (drillId: string) => drills.find((drill) => drill.id === drillId);
  const current = item.drillId ? getDrill(item.drillId) : undefined;
  if (!current) return null;
  const alts = findAlternatives(current, plan);

  return (
    <div className={styles.modalBack} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="presentation">
        <div className={styles.modalHead}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 850 }}>Replace {current.code}</h2>
            <p style={{ color: 'var(--bpds-slate)', fontSize: 13.5, marginTop: 6 }}>
              Alternatives keep the same methodological phase and position in the progression.
              The rest of the practice stays unchanged.
            </p>
          </div>
          <Button size="sm" onClick={onClose}>✕</Button>
        </div>
        {alts.length === 0 ? (
          <p style={{ color: 'var(--bpds-slate)', fontSize: 14 }}>
            No suitable alternatives found for this phase with the current equipment and court setup.
          </p>
        ) : alts.map(({ drill, reason }) => {
          const li = levelInfo(drill.level);
          return (
            <div key={drill.id} className={styles.altRow}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className={styles.itemCode}>{drill.code}</div>
                  <div className={styles.itemName}>{drill.name}</div>
                  <div className={styles.itemMeta}>
                    <Badge tone="gray">{getModule(drill.moduleCode)?.name}</Badge>
                    <Badge tone={li.tone}>{li.label}</Badge>
                    <Badge tone="gray">{drill.duration} min</Badge>
                  </div>
                  <div className={styles.why}>{drill.whyThisDrill}</div>
                  <div className={styles.altReason}>✓ {reason}</div>
                </div>
                <Button variant="primary" size="sm" onClick={() => onPick(drill.id)}>Use This Drill</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
