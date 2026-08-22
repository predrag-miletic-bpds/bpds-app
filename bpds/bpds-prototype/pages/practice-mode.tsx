import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DrillVideo, useDrills } from '../data/drill-media.js';
import { useStore } from '../store/store.js';
import styles from './practice-mode.module.css';

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
  const { practices, draft, completePractice } = useStore();
  const plan = id === 'draft' ? draft : practices.find((p) => p.id === id);

  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [noteText, setNoteText] = useState('');
  const [ending, setEnding] = useState(false);
  const [finalNote, setFinalNote] = useState('');

  const item = plan?.items[index];

  useEffect(() => {
    if (item) setLeft(item.duration * 60);
    setRunning(false);
  }, [index, item?.id, item]);

  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const go = useCallback((dir: number) => {
    if (!plan) return;
    setIndex((i) => Math.min(plan.items.length - 1, Math.max(0, i + dir)));
  }, [plan]);

  if (!plan) {
    return (
      <div className={styles.wrap}>
        <div className={styles.body}>
          <h1 className={styles.name}>No practice loaded</h1>
          <button type="button" className={styles.mainBtn} onClick={() => navigate('/practices')}>Back to My Practices</button>
        </div>
      </div>
    );
  }

  const drill = item?.drillId ? getDrill(item.drillId) : undefined;
  const drillCount = plan.items.filter((i) => i.kind === 'drill').length;
  const progress = ((index + 1) / plan.items.length) * 100;

  const markDone = () => {
    if (!item) return;
    setDone((d) => (d.includes(item.id) ? d : [...d, item.id]));
    if (index < plan.items.length - 1) go(1);
    else setEnding(true);
  };

  const finish = () => {
    // The store marks exactly these slots done, so the history entry counts the
    // drills the coach actually completed rather than a bare number.
    completePractice(plan, [...notes, finalNote].filter(Boolean).join(' · '), done);
    void navigate('/history');
  };

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
            <p>{plan.items.reduce((a, i) => a + i.duration, 0)} minutes planned · {plan.primaryFocus} focus.</p>
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
          <small>Block {index + 1} of {plan.items.length} · {done.length} completed</small>
        </div>
        <button type="button" className={styles.exit} onClick={() => setEnding(true)}>End</button>
      </div>
      <div className={styles.progress}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>

      <div className={styles.strip}>
        {plan.items.map((it, i) => {
          const d = it.drillId ? getDrill(it.drillId) : undefined;
          const cls = i === index ? styles.stripActive : done.includes(it.id) ? styles.stripDone : '';
          return (
            <button key={it.id} type="button" className={`${styles.stripItem} ${cls}`} onClick={() => setIndex(i)}>
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
          <span className={styles.pill}>{item?.duration} min</span>
          <span className={styles.pill}>{item?.phase}</span>
        </div>

      {drill ? <DrillVideo drill={drill} className={styles.video} /> : null}

        <div className={styles.timer}>
          <div className={styles.time} style={{ color: left < 0 ? '#ff7a5c' : '#fff' }}>{fmt(left)}</div>
          <div className={styles.timerActions}>
            <button type="button" className={`${styles.tbtn} ${running ? '' : styles.tbtnPrimary}`} onClick={() => setRunning((r) => !r)}>
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button type="button" className={styles.tbtn} onClick={() => setLeft((item?.duration ?? 0) * 60)}>↺ Reset</button>
          </div>
        </div>

        <div className={styles.secondaryRow}>
          <button type="button" className={styles.sbtn} onClick={() => setNoteOpen((o) => !o)}>📝 Quick Note</button>
          <button type="button" className={styles.sbtn} onClick={() => go(1)}>⤼ Skip Drill</button>
          {drill ? <button type="button" className={styles.sbtn} onClick={() => navigate(`/drill/${drill.id}`)}>ℹ Full Detail</button> : null}
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
              <ul>{drill.commonMistakes.slice(0, 4).map((c) => <li key={c}>{c}</li>)}</ul>
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
        <button type="button" className={styles.navBtn} disabled={index === plan.items.length - 1} onClick={() => go(1)}>→</button>
      </div>
    </div>
  );
}
