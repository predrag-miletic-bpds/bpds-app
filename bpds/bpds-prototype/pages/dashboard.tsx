import { Link, useNavigate } from 'react-router-dom';
import { getDrill } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { getModule } from '@predrag-miletic/bpds-methodology.modules-catalog';
import { useStore } from '../store/store.js';
import { Avatar, Badge, Button, Card, Page, SectionTitle, levelInfo } from '../ui/ui.js';
import styles from './dashboard.module.css';

const QUICK = [
  { to: '/builder', icon: '🧩', title: 'Build Your Own Practice', sub: 'Manual practice builder' },
  { to: '/library', icon: '📚', title: 'Browse Drill Library', sub: '26 modules, 3 levels' },
  { to: '/players', icon: '👥', title: 'Players', sub: 'Profiles and progress' },
  { to: '/teams', icon: '🛡️', title: 'Teams', sub: 'Optional groupings' },
  { to: '/practices', icon: '📋', title: 'Saved Practice Plans', sub: 'Drafts and scheduled' },
  { to: '/history', icon: '🕘', title: 'Training History', sub: 'Completed sessions' },
];

/** Coach dashboard — the hub of the BPDS workflow. */
export function Dashboard() {
  const navigate = useNavigate();
  const { coach, players, teams, practices, history, recentDrills } = useStore();
  const lastPractice = practices[0];
  const totalMinutes = history.reduce((a, h) => a + h.duration, 0);
  const totalDrills = history.reduce((a, h) => a + h.completedDrills, 0);

  const focusCounts = history.reduce<Record<string, number>>((acc, h) => {
    acc[h.focus] = (acc[h.focus] ?? 0) + 1;
    return acc;
  }, {});
  const maxFocus = Math.max(1, ...Object.values(focusCounts));

  return (
    <Page>
      <div className={styles.hero}>
        <div>
          <h1>Welcome back, {coach.name.split(' ')[0]}</h1>
          <p>
            {players.length} players · {teams.length} teams · {history.length} completed sessions.
            Generate a methodologically correct practice in under a minute.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Button variant="primary" size="lg" onClick={() => navigate('/generate')}>⚡ Generate Practice</Button>
          {lastPractice ? (
            <Button
              size="lg"
              onClick={() => navigate(`/practice/${lastPractice.id}`)}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Continue Last Practice
            </Button>
          ) : null}
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.stat}><strong>{history.length}</strong><span>Practices</span></div>
        <div className={styles.stat}><strong>{totalMinutes}</strong><span>Training Minutes</span></div>
        <div className={styles.stat}><strong>{totalDrills}</strong><span>Drills Completed</span></div>
        <div className={styles.stat}><strong>{players.filter((p) => p.active).length}</strong><span>Active Players</span></div>
      </div>

      <div className={styles.quickGrid}>
        {QUICK.map((q) => (
          <button key={q.to} type="button" className={styles.quick} onClick={() => navigate(q.to)}>
            <span className={styles.quickIcon}>{q.icon}</span>
            <span>
              <b>{q.title}</b>
              <span>{q.sub}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.cols}>
        <div style={{ display: 'grid', gap: 20 }}>
          <Card>
            <SectionTitle>Recent Practices</SectionTitle>
            {practices.slice(0, 4).map((p) => (
              <div key={p.id} className={styles.listRow}>
                <div>
                  <b>{p.name}</b>
                  <small>{p.date} · {p.duration} min · {p.primaryFocus} · {p.items.length} blocks</small>
                </div>
                <div className={styles.rowRight}>
                  <Badge tone={p.status === 'Completed' ? 'green' : p.status === 'Scheduled' ? 'blue' : 'gray'}>{p.status}</Badge>
                  <Button size="sm" onClick={() => navigate(`/practice/${p.id}`)}>Open</Button>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <SectionTitle>Players</SectionTitle>
            {players.slice(0, 5).map((p) => (
              <div key={p.id} className={styles.listRow}>
                <Avatar name={p.fullName} color={p.photoColor} size={34} />
                <div>
                  <b>{p.fullName}</b>
                  <small>{p.ageGroup} · {p.position} · {p.skillLevel}</small>
                </div>
                <div className={styles.rowRight}>
                  <Badge tone="gray">{p.stats.completedPractices} sessions</Badge>
                  <Button size="sm" onClick={() => navigate(`/players/${p.id}`)}>View</Button>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <SectionTitle>Recently Viewed Drills</SectionTitle>
            {recentDrills.map((id) => {
              const d = getDrill(id);
              if (!d) return null;
              const li = levelInfo(d.level);
              return (
                <div key={id} className={styles.listRow}>
                  <div>
                    <b>{d.code} — {d.name}</b>
                    <small>{getModule(d.moduleCode)?.name}</small>
                  </div>
                  <div className={styles.rowRight}>
                    <Badge tone={li.tone}>{li.label}</Badge>
                    <Button size="sm" onClick={() => navigate(`/drill/${d.id}`)}>Open</Button>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <Card>
            <SectionTitle>Progress Overview</SectionTitle>
            {Object.entries(focusCounts).map(([focus, count]) => (
              <div key={focus} className={styles.distRow}>
                <div><span>{focus}</span><span>{count}</span></div>
                <div className={styles.bar}><div className={styles.barFill} style={{ width: `${(count / maxFocus) * 100}%` }} /></div>
              </div>
            ))}
            <Link to="/history" style={{ fontSize: 13, fontWeight: 700, color: 'var(--bpds-orange)' }}>View full history →</Link>
          </Card>

          <Card>
            <SectionTitle>Coach Notes</SectionTitle>
            {players.filter((p) => p.notes.length).slice(0, 4).map((p) => (
              <div key={p.id} className={styles.noteItem}>
                {p.notes[0]}
                <small>{p.fullName} · private</small>
              </div>
            ))}
          </Card>

          <Card>
            <SectionTitle>Account</SectionTitle>
            <div style={{ fontSize: 13.5, lineHeight: 1.9, color: 'var(--bpds-slate)' }}>
              <div><b style={{ color: 'var(--bpds-ink)' }}>{coach.name}</b></div>
              <div>{coach.email}</div>
              <div>{coach.club}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Badge tone="dark">{coach.role}</Badge>
                <Badge tone="amber">{coach.subscription}</Badge>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <Button size="sm" onClick={() => navigate('/settings')}>Account Settings</Button>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
