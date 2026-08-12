import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store/store.js';
import { Avatar } from '../ui/ui.js';
import styles from './shell.module.css';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/generate', label: 'Generate' },
  { to: '/builder', label: 'Builder' },
  { to: '/library', label: 'Drill Library' },
  { to: '/players', label: 'Players' },
  { to: '/teams', label: 'Teams' },
  { to: '/practices', label: 'My Practices' },
  { to: '/history', label: 'History' },
  { to: '/admin', label: 'Admin' },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { loggedIn, coach } = useStore();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const bare = pathname.startsWith('/practice-mode');
  if (bare) return <>{children}</>;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={loggedIn ? '/dashboard' : '/'} className={styles.logo}>
            <span className={styles.logoMark}>🏀</span>
            <span>BPDS<span className={styles.logoSub}>Player Development</span></span>
          </Link>
          {loggedIn ? (
            <nav className={styles.nav}>
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}>{n.label}</NavLink>
              ))}
            </nav>
          ) : <div style={{ flex: 1 }} />}
          <div className={styles.headerRight}>
            {loggedIn ? (
              <>
                <Link to="/settings" className={styles.userChip}>
                  <Avatar name={coach.name} color="#e2571f" size={26} />
                  <span>{coach.name.split(' ')[0]}</span>
                </Link>
                <button type="button" className={styles.burger} onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
              </>
            ) : (
              <Link to="/login" className={styles.userChip}><span>Start as Coach</span>→</Link>
            )}
          </div>
        </div>
        {loggedIn ? (
          <div className={`${styles.mobileNav} ${open ? styles.mobileNavOpen : ''}`}>
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navActive : ''}`}>{n.label}</NavLink>
            ))}
          </div>
        ) : null}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>We develop championship players who build championship teams.</span>
        BPDS — Basketball Player Development System
      </footer>
    </div>
  );
}
