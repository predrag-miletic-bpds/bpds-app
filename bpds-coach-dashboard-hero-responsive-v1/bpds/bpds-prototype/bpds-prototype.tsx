import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { Admin } from './pages/admin.js';
import { Builder } from './pages/builder.js';
import { Dashboard } from './pages/dashboard.js';
import { DrillDetail } from './pages/drill-detail.js';
import { Generate } from './pages/generate.js';
import { History, Settings } from './pages/history.js';
import { Home, ParentHome } from './pages/home.js';
import { Library } from './pages/library.js';
import { Login } from './pages/login.js';
import { PracticeMode } from './pages/practice-mode.js';
import { PracticeView } from './pages/practice.js';
import { PracticePrint } from './pages/practice-print.js';
import { DrillPrint } from './pages/drill-print.js';
import { Practices } from './pages/practices.js';
import { PlayerDetail, Players } from './pages/players.js';
import { Teams } from './pages/teams.js';
import { WeeklyPlan } from './pages/weekly-plan.js';
import { Shell } from './shell/shell.js';
import { StoreProvider, useStore } from './store/store.js';
import './theme/current-production.css';

/** Redirects to the login page when the coach is not authenticated. */
function Protected({ children }: { children: React.ReactNode }) {
  const { loggedIn, authReady } = useStore();
  const location = useLocation();
  if (!authReady) return <div style={{ padding: 48, textAlign: 'center' }}>Connecting to BPDS…</div>;
  if (!loggedIn) {
    const target = `${location.pathname}${location.search}${location.hash}`;
    const isQrTarget = /^\/(?:practice|drill)\/[^/?#]+$/.test(location.pathname);
    return <Navigate to={isQrTarget ? `/login?returnTo=${encodeURIComponent(target)}` : '/login'} replace state={{ returnTo: isQrTarget ? target : undefined }} />;
  }
  return <>{children}</>;
}

/**
 * Start newly opened pages at the top without overriding browser Back/Forward
 * restoration. Active Practice owns its own contextual return behavior.
 */
function RouteScrollManager() {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const firstRender = useRef(true);

  useEffect(() => {
    const isInitialRender = firstRender.current;
    firstRender.current = false;

    if (!isInitialRender && navigationType === 'POP') return;
    if (pathname.startsWith('/practice-mode/')) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [navigationType, pathname, search]);

  return null;
}
/** BPDS — Basketball Player Development System. */
export function BpdsPrototype() {
  return (
    <StoreProvider>
      <Shell>
        <RouteScrollManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<ParentHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/generate" element={<Protected><Generate /></Protected>} />
          <Route path="/weekly-plan" element={<Protected><WeeklyPlan /></Protected>} />
          <Route path="/builder" element={<Protected><Builder /></Protected>} />
          <Route path="/library" element={<Protected><Library /></Protected>} />
          <Route path="/drill/:id" element={<Protected><DrillDetail /></Protected>} />
          <Route path="/drill/:id/print" element={<Protected><DrillPrint /></Protected>} />
          <Route path="/players" element={<Protected><Players /></Protected>} />
          <Route path="/players/:id" element={<Protected><PlayerDetail /></Protected>} />
          <Route path="/teams" element={<Protected><Teams /></Protected>} />
          <Route path="/practices" element={<Protected><Practices /></Protected>} />
          <Route path="/practice/:id" element={<Protected><PracticeView /></Protected>} />
          <Route path="/practice/:id/print" element={<Protected><PracticePrint /></Protected>} />
          <Route path="/practice-mode/:id" element={<Protected><PracticeMode /></Protected>} />
          <Route path="/history" element={<Protected><History /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </StoreProvider>
  );
}
