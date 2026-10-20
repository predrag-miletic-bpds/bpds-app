import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { normalizePracticeItems } from '@predrag-miletic/bpds-methodology.practice-generator';
import { DrillDiagramImage, DrillVideo, useDrills } from '../data/drill-media.js';
import { useStore } from '../store/store.js';
import styles from './practice-mode.module.generated.js';
import { adjustSessionDuration, blockSessionDuration, formatPracticeSeconds, practiceSessionDuration, sessionDurationSeconds, withPracticeBlocks } from '../data/practice-blocks.js';
import type { PracticeBlock, PracticeDrillItem } from '../data/practice-blocks.js';
import { prescriptionExactTimerSecondsV1, prescriptionIndividualElapsedDurationRangeSecondsV1, resolveCoachPrescriptionV1 } from '@predrag-miletic/bpds-methodology.practice-prescriptions';

/** Format seconds as mm:ss. */
function fmt(sec: number): string {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  return `${sec < 0 ? '-' : ''}${m}:${String(s).padStart(2, '0')}`;
}

/** Mobile-first Practice Mode — one drill at a time, big buttons, live timer. */
export function PracticeMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromWeeklyPlan = (location.state as { from?: string } | null)?.from === '/weekly-plan';
  const drills = useDrills();
  const getDrill = (drillId: string) => drills.find((item) => item.id === drillId);
  const { practices, draft, savePractice, completePractice } = useStore();
  const plan = id === 'draft' ? draft : practices.find((p) => p.id === id);
  useEffect(() => {
    if (plan && plan.status !== 'Completed' && plan.status !== 'In Progress') savePractice({ ...plan, status: 'In Progress', lastOpened: new Date().toISOString() });
  }, [plan?.id]);
  const normalizedPractice = useMemo(() => {
    if (!plan) return null;
    const sourceItems = Array.isArray(plan.items) ? plan.items : [];
    const normalizedItems = normalizePracticeItems(sourceItems, drills);
    return withPracticeBlocks(plan, normalizedItems, drills);
  }, [drills, plan]);
  const allItems = Array.isArray(normalizedPractice?.items) ? normalizedPractice.items : [];
  const drillItems = allItems.filter((candidate): candidate is PracticeDrillItem => candidate.kind === 'drill' && Boolean(candidate.drillId));
  const blocks = normalizedPractice?.blocks ?? [];

  const [index, setIndex] = useState(() => {
    const requested = Number(new URLSearchParams(location.search).get('drill') ?? '0');
    return Number.isInteger(requested) && requested >= 0 ? requested : 0;
  });
  useEffect(() => {
    setIndex((current) => (drillItems.length ? Math.min(Math.max(0, current), drillItems.length - 1) : 0));
  }, [drillItems.length]);

  const [done, setDone] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [mediaMode, setMediaMode] = useState<'video' | 'diagram'>('video');
  const [left, setLeft] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [noteText, setNoteText] = useState('');
  const [ending, setEnding] = useState(false);
  const [finalNote, setFinalNote] = useState('');

  const [sessionOverrides, setSessionOverrides] = useState<Record<string, number>>({});
  const item = drillItems[index];
  const itemPrescription = item?.coachPrescription ?? (item?.drillId ? resolveCoachPrescriptionV1(item.drillId, plan?.ageGroup) : undefined);
  const prescriptionTimerSeconds = itemPrescription ? prescriptionExactTimerSecondsV1(itemPrescription) : undefined;
  const timerConfigured = !itemPrescription || prescriptionTimerSeconds !== undefined;
  const currentSessionSeconds = prescriptionTimerSeconds ?? (itemPrescription ? 0 : sessionDurationSeconds(item, sessionOverrides));

  useEffect(() => {
    setLeft(currentSessionSeconds);
    setRunning(false);
    setMediaMode('video');
  }, [index, item?.id, currentSessionSeconds]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => {
      setLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const go = useCallback((dir: number) => {
    if (!plan) return;
    setIndex((i) => Math.min(drillItems.length - 1, Math.max(0, i + dir)));
  }, [drillItems.length, plan]);

  const adjustTime = (deltaSeconds: number) => {
    if (!item) return;
    const result = adjustSessionDuration(item, sessionOverrides, deltaSeconds);
    setSessionOverrides(result.overrides);
    setLeft(result.durationSeconds);
  };
  const selectBlock = (block: PracticeBlock) => {
    const firstIndex = drillItems.findIndex((candidate) => block.drills.some((blockDrill) => blockDrill.id === candidate.id));
    if (firstIndex >= 0) setIndex(firstIndex);
  };

  if (!plan) {
    return (
      <div className={styles.wrap}>1
      
        <div className={styles.body}>
          <h1 className={styles.name}>No practice loaded</h1>
          <button type="button" className={styles.mainBtn} onClick={() => navigate('/practices')}>Back to My Practices</button>
        </div>
      </div>
    );
  }

  const drill = item?.drillId ? getDrill(item.drillId) : undefined;
  const coachPrescription = itemPrescription;
  const individualElapsedRange = coachPrescription ? prescriptionIndividualElapsedDurationRangeSecondsV1(coachPrescription) : undefined;
  const hasVideo = Boolean((drill as any)?.videoUrl);
  const hasDiagram = Boolean((drill as any)?.diagramUrl);
  const MEDIA_TABS = ['video', 'diagram'] as const;
  const selectedMediaMode = mediaMode;
  const activeBlock = blocks.find((block) => block.drills.some((candidate) => candidate.id === item?.id));
  const activeBlockIndex = activeBlock ? blocks.findIndex((block) => block.id === activeBlock.id) : -1;
  const blockDrillIndex = activeBlock ? activeBlock.drills.findIndex((candidate) => candidate.id === item?.id) : -1;
  const visibleItems = activeBlock?.drills ?? drillItems;
  const currentBlockSeconds = activeBlock ? blockSessionDuration(activeBlock, sessionOverrides) : 0;
  const currentPracticeSeconds = practiceSessionDuration(blocks, sessionOverrides);
  const drillCount = drillItems.length;
  const progress = ((index + 1) / drillItems.length) * 100;

  const markDone = () => {
    if (!item) return;
    setDone((d) => (d.includes(item.id) ? d : [...d, item.id]));
    if (index < drillItems.length - 1) go(1);
    else setEnding(true);
  };

  const finish = () => {
    // The store marks exactly these slots done, so the history entry counts the
    // drills the coach actually completed rather than a bare number.
    completePractice(plan, [...notes, finalNote].filter(Boolean).join(' · '), done);
    void navigate('/history');
  };

  if (drillItems.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.block}>
          <h1>No drills in this practice</h1>
          <p>This practice does not contain any valid drills yet.</p>
          <button type="button" className={styles.navBtn} onClick={() => navigate(fromWeeklyPlan ? '/weekly-plan' : '/history')}>Back</button>
        </div>
      </div>
    );
  }

  if (ending) {
    return (
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div className={styles.topTitle}>
            End Practice
            <small>{plan.name}</small>
          </div>
        </div>
        <div className={styles.endPanel}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>Session Summary</div>
            <p>{done.length} of {drillCount} drills completed.</p>
            <p>{formatPracticeSeconds(currentPracticeSeconds)} planned · {plan.primaryFocus} focus.</p>
            <div className={styles.pills}>
              {plan.playerIds.length ? <span className={styles.pill}>{plan.playerIds.length} players</span> : null}
              <span className={styles.pill}>{Math.round((done.length / Math.max(1, drillCount)) * 100)}% completion</span>
            </div>
          </div>
          <div className={styles.block}>
            <div className={styles.blockTitle}>Coach Notes</div>
            {notes.map((n) => <p key={n} style={{ marginBottom: 6 }}>• {n}</p>)}
            <textarea
              className={styles.noteInput}
              placeholder="Add a note about this session…"
              value={finalNote}
              onChange={(e) => setFinalNote(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className={styles.navBtn} style={{ flex: 1 }} onClick={() => setEnding(false)}>Back</button>
            <button type="button" className={`${styles.mainBtn} ${styles.doneBtn}`} onClick={finish}>
              Save to Training History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.top}>
        {fromWeeklyPlan ? (
          <button type="button" className={styles.exit} onClick={() => navigate('/weekly-plan')}>← Plan</button>
        ) : null}
        <div className={styles.topTitle}>
          {plan.name}
          <small>Block {activeBlockIndex + 1} of {blocks.length} · Drill {blockDrillIndex + 1} of {activeBlock?.drills.length ?? drillCount} · {done.length} completed</small>
        </div>
        <button type="button" className={styles.exit} onClick={() => setEnding(true)}>End</button>
      </div>
      <div className={styles.progress}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>

      <div className={styles.blockNav} aria-label="Practice blocks">
          {blocks.map((block) => (
            <button key={block.id} type="button" className={activeBlock?.id === block.id ? styles.blockButtonActive : styles.blockButton} onClick={() => selectBlock(block)}>
              <span className={styles.blockName}>{block.name}</span>
              <span className={styles.blockDuration}>{formatPracticeSeconds(blockSessionDuration(block, sessionOverrides))}</span>
            </button>
          ))}
        </div>
        <div className={styles.strip}>
        {visibleItems.map((it) => {
          const d = it.drillId ? getDrill(it.drillId) : undefined;
          const globalIndex = drillItems.findIndex((candidate) => candidate.id === it.id);
        const cls = globalIndex === index ? styles.stripActive : done.includes(it.id) ? styles.stripDone : '';
          return (
            <button key={it.id} type="button" className={`${styles.stripItem} ${cls}`} onClick={() => setIndex(globalIndex)}>
              {d?.code ?? it.label}
            </button>
          );
        })}
      </div>

      <div className={styles.body}>
        <div className={styles.code}>{drill?.code ?? 'SESSION BLOCK'}</div>
        <div className={styles.name}>{drill?.name ?? item?.label}</div>
        <div className={styles.pills}>
          {drill ? <span className={styles.pill}>Level {drill.level}</span> : null}
          {drill ? <span className={styles.pill}>{drill.intensity} intensity</span> : null}
          <span className={styles.pill}>{formatPracticeSeconds(currentSessionSeconds)}</span>
          <span className={styles.pill}>{item?.phase}</span>
          <span className={styles.pill}>Block {formatPracticeSeconds(currentBlockSeconds)}</span>
          <span className={styles.pill}>Total {formatPracticeSeconds(currentPracticeSeconds)}</span>
        </div>
        {coachPrescription ? (
          <div style={{ marginTop: 10, color: '#c9d2e3', lineHeight: 1.35, display: 'grid', gap: 3 }}>
            <b>Coach dosage · {coachPrescription.ageGroup}</b>
            <span>{coachPrescription.workText} · {coachPrescription.restText} rest between bouts</span>
            <span>Active work: {coachPrescription.bouts.min === coachPrescription.bouts.max ? `${coachPrescription.bouts.min}` : `${coachPrescription.bouts.min}–${coachPrescription.bouts.max}`} bouts · {coachPrescription.workSeconds.min}–{coachPrescription.workSeconds.max} s each</span>
            <span>Individual elapsed: {individualElapsedRange?.min}–{individualElapsedRange?.max} s · Group allocation: {coachPrescription.allocatedMinutes} min</span>
            {!timerConfigured ? <span style={{ color: '#ffb36b' }}>Timer configuration remains a range; no exact value is selected automatically.</span> : null}
          </div>
        ) : null}
        {drill ? (
          <div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 10 }} aria-label="Practice media">
                {MEDIA_TABS.map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    className={`${styles.tbtn} ${selectedMediaMode === candidate ? styles.tbtnPrimary : ''}`}
                    aria-pressed={selectedMediaMode === candidate}
                    onClick={() => setMediaMode(candidate)}
                  >
                    {candidate === 'video' ? 'Video' : 'Diagram'}
                  </button>
                ))}
              </div>
      {selectedMediaMode === 'diagram'
        ? hasDiagram
          ? <DrillDiagramImage drill={drill as any} className={styles.video} />
          : <div className={styles.video} style={{ display: 'grid', placeItems: 'center', background: '#0b1016', color: 'var(--bpds-slate)' }}>No diagram uploaded yet.</div>
        : hasVideo
          ? <DrillVideo drill={drill} className={styles.video} />
          : <div className={styles.video} style={{ display: 'grid', placeItems: 'center', background: '#05070a', color: 'var(--bpds-slate)' }}>No video uploaded yet.</div>}
          </div>
        ) : null}

        <div className={styles.timeAdjust}>
          <button type="button" onClick={() => adjustTime(-15)} disabled={!item || !timerConfigured || currentSessionSeconds <= 0}>−15 sec</button>
          <span>{timerConfigured ? formatPracticeSeconds(currentSessionSeconds) : 'Range only'}</span>
          <button type="button" onClick={() => adjustTime(15)} disabled={!item || !timerConfigured}>+15 sec</button>
        </div>
        <div className={styles.timer}>
          <div className={styles.time} style={{ color: left < 0 ? '#ff7a5c' : '#fff' }}>{timerConfigured ? fmt(left) : '—:—'}</div>
          <div className={styles.timerActions}>
            <button type="button" disabled={!timerConfigured} className={`${styles.tbtn} ${running ? '' : styles.tbtnPrimary}`} onClick={() => setRunning((r) => !r)}>
              {timerConfigured ? (running ? '⏸ Pause' : left > 0 && left < currentSessionSeconds ? '▶ Resume' : '▶ Start') : 'Configure exact timer'}
            </button>
            <button type="button" disabled={!timerConfigured} className={styles.tbtn} onClick={() => { setRunning(false); setLeft(currentSessionSeconds); }}>↻ Reset</button>
          </div>
        </div>

        <div className={styles.secondaryRow}>
          <button type="button" className={styles.sbtn} onClick={() => setNoteOpen((o) => !o)}>📝 Quick Note</button>
          <button type="button" className={styles.sbtn} onClick={() => go(1)}>⤼ Skip Drill</button>
          {drill ? <button type="button" className={styles.sbtn} onClick={() => navigate(`/drill/${drill.id}`, { state: { returnTo: `/practice-mode/${id}?drill=${index}`, ageGroup: plan.ageGroup } })}>↗ Full Detail</button> : null}
        </div>

        {noteOpen ? (
          <div className={styles.block}>
            <div className={styles.blockTitle}>Quick Note</div>
            <textarea
              className={styles.noteInput}
              value={noteText}
              placeholder="e.g. Luka's left hand crossover much tighter today"
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button
              type="button"
              className={styles.sbtn}
              style={{ marginTop: 10 }}
              onClick={() => { if (noteText.trim()) setNotes((n) => [...n, noteText.trim()]); setNoteText(''); setNoteOpen(false); }}
            >
              Save Note
            </button>
          </div>
        ) : null}

        {drill ? (
          <>
            <div className={styles.block}>
              <div className={styles.blockTitle}>Objective</div>
              <p>{drill.objective}</p>
            </div>
            <div className={styles.block}>
              <div className={styles.blockTitle}>Why This Drill?</div>
              <p>{drill.whyThisDrill}</p>
            </div>
            <div className={styles.block}>
              <div className={styles.blockTitle}>Coaching Points</div>
              <ul>{drill.coachingPoints.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
            <div className={styles.block}>
              <div className={styles.blockTitle}>Common Mistakes</div>
              <ul>{(drill.commonMistakes ?? []).slice(0, 4).map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          </>
        ) : null}
      </div>

      <div className={styles.bottom}>
        <button type="button" className={styles.navBtn} disabled={index === 0} onClick={() => go(-1)}>←</button>
        <button
          type="button"
          className={`${styles.mainBtn} ${item && done.includes(item.id) ? styles.doneBtn : ''}`}
          onClick={markDone}
        >
          {item && done.includes(item.id) ? '✓ Completed' : 'Mark as Completed'}
        </button>
        <button type="button" className={styles.navBtn} disabled={index === drillItems.length - 1} onClick={() => go(1)}>→</button>
      </div>
    </div>
  );
}
