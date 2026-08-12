import { useNavigate } from 'react-router-dom';
import { DRILLS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { MODULES } from '@predrag-miletic/bpds-methodology.modules-catalog';
import { useStore } from '../store/store.js';
import { Button } from '../ui/ui.js';
import styles from './home.module.css';

const BENEFITS = [
  { icon: '⚙️', title: 'Smart Training Generator', text: 'Generate a structured practice based on age, skill level, time, players, equipment and training focus.' },
  { icon: '📚', title: 'Professional Drill Library', text: 'Every drill includes video, methodology, coaching points, mistakes, progressions and regressions.' },
  { icon: '📱', title: 'Mobile Practice Mode', text: 'Run the entire practice from a phone or tablet directly on the court.' },
  { icon: '📈', title: 'Player Development Tracking', text: 'Record completed sessions and follow each player\'s training history.' },
];

const STEPS = [
  'Warm-Up and Movement Preparation',
  'Individual Skill Activation',
  'Technical Skill Development',
  'Skill Application',
  'Decision Making',
  'Game Application',
  'Competitive Play',
  'Cool Down',
];

const SAMPLE = [
  ['10 min', 'Dynamic Warm-Up', 'WUP-001'],
  ['8 min', 'Ball Handling Activation', 'SBH-L1-001'],
  ['8 min', 'Form Shooting — 1 Hand', 'SH-L1-001'],
  ['12 min', 'Catch and Shoot', 'SH-L2-003'],
  ['12 min', 'One-Dribble Pull-Up', 'SH-L2-009'],
  ['12 min', 'Contested Shooting', 'SH-L3-011'],
  ['12 min', '3-on-3 Paint Touch', 'SSG-L3-002'],
];

/** Public marketing homepage for BPDS. */
export function Home() {
  const navigate = useNavigate();
  const { login } = useStore();

  const start = () => {
    login();
    void navigate('/dashboard');
  };

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <div className={styles.eyebrow}>🏀 Basketball Player Development System</div>
            <h1 className={styles.h1}>
              Develop Better Players.
              <br />
              <em>Build Better Basketball.</em>
            </h1>
            <p className={styles.lead}>
              BPDS helps basketball coaches generate structured, age-appropriate practices using
              professional methodology, video instruction and player development logic.
            </p>
            <div className={styles.ctaRow}>
              <Button variant="primary" size="lg" onClick={start}>Start as Coach</Button>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}><strong>{MODULES.length}</strong><span>Modules</span></div>
              <div className={styles.stat}><strong>{DRILLS.length}+</strong><span>Methodical Drills</span></div>
              <div className={styles.stat}><strong>3</strong><span>Skill Levels</span></div>
              <div className={styles.stat}><strong>8</strong><span>Age Groups</span></div>
            </div>
          </div>
          <div className={styles.heroCard}>
            <div className={styles.heroCardHead}>
              <span>U16 Advanced Shooting</span>
              <span>90 min</span>
            </div>
            {SAMPLE.map(([time, name, code]) => (
              <div key={code} className={styles.timelineRow}>
                <b>{code}</b>
                {name}
                <span>{time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.benefits}>
        {BENEFITS.map((b) => (
          <div key={b.title} className={styles.benefit}>
            <div className={styles.benefitIcon}>{b.icon}</div>
            <h3>{b.title}</h3>
            <p>{b.text}</p>
          </div>
        ))}
      </section>

      <section className={styles.methodBand}>
        <div className={styles.methodInner}>
          <h2 style={{ fontSize: 30, fontWeight: 900 }}>Not a random drill generator.</h2>
          <p style={{ color: 'var(--bpds-slate)', marginTop: 12, maxWidth: 680 }}>
            Every BPDS practice follows a methodological progression — from simple to complex,
            slow to fast, low pressure to game pressure. Prerequisite relationships between modules
            are respected automatically.
          </p>
          <div className={styles.methodSteps}>
            {STEPS.map((s, i) => (
              <div key={s} className={styles.methodStep}>
                <b>PHASE {i + 1}</b>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closer}>
        <h2>BPDS recommends a methodologically correct practice, while the coach keeps the final decision.</h2>
        <p>We develop championship players who build championship teams.</p>
        <Button variant="primary" size="lg" onClick={start}>Start as Coach</Button>
      </section>
    </div>
  );
}
