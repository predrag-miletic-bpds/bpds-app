import { Navigate, Route, Routes } from 'react-router-dom';
import { Admin } from './pages/admin.js';
import { Builder } from './pages/builder.js';
import { Dashboard } from './pages/dashboard.js';
import { DrillDetail } from './pages/drill-detail.js';
import { Generate } from './pages/generate.js';
import { History, Settings } from './pages/history.js';
import { Home } from './pages/home.js';
import { Library } from './pages/library.js';
import { Login } from './pages/login.js';
import { PracticeMode } from './pages/practice-mode.js';
import { PracticeView } from './pages/practice.js';
import { Practices } from './pages/practices.js';
import { PlayerDetail, Players } from './pages/players.js';
import { Teams } from './pages/teams.js';
import { Shell } from './shell/shell.js';
import { StoreProvider, useStore } from './store/store.js';
import './theme/global.module.css';

function Protected({ children }: { children: React.ReactNode }) {
  const { loggedIn } = useStore();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function BpdsPrototype() {
  return (
    <StoreProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/generate" element={<Protected><Generate /></Protected>} />
          <Route path="/builder" element={<Protected><Builder /></Protected>} />
          <Route path="/library" element={<Protected><Library /></Protected>} />
          <Route path="/drill/:id" element={<Protected><DrillDetail /></Protected>} />
          <Route path="/players" element={<Protected><Players /></Protected>} />
          <Route path="/players/:id" element={<Protected><PlayerDetail /></Protected>} />
          <Route path="/teams" element={<Protected><Teams /></Protected>} />
          <Route path="/practices" element={<Protected><Practices /></Protected>} />
          <Route path="/practice/:id" element={<Protected><PracticeView /></Protected>} />
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
