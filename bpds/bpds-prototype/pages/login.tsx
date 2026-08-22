import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store.js';
import { Button, Card, Field, Input } from '../ui/ui.js';

/** Real Supabase coach registration and login screen. */
export function Login() {
  const navigate = useNavigate();
  const { login, register, busy, error } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [club, setClub] = useState('');
  const [notice, setNotice] = useState<string>();

  const submit = async () => {
    setNotice(undefined);
    try {
      if (mode === 'register') {
        const confirmationRequired = await register(email.trim(), password, fullName.trim(), club.trim());
        if (confirmationRequired) { setNotice('Account created. Check your email and confirm the BPDS registration, then log in.'); setMode('login'); return; }
      } else await login(email.trim(), password);
      void navigate('/dashboard');
    } catch { /* The store exposes a safe error message below. */ }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '64px 20px', minHeight: '70vh' }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 30 }}>🏀</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>
            {mode === 'login' ? 'Coach Login' : 'Create Coach Account'}
          </h1>
          <p style={{ color: 'var(--bpds-slate)', fontSize: 13.5, marginTop: 6 }}>
            Basketball Player Development System
          </p>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {mode === 'register' ? (
            <Field label="Full name"><Input placeholder="Coach name" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          ) : null}
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </Field>
          <Field label="Password">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </Field>
          {mode === 'register' ? (
            <Field label="Club"><Input placeholder="Club name" value={club} onChange={(e) => setClub(e.target.value)} /></Field>
          ) : null}
          {error ? <p role="alert" style={{ color: '#ff786e', fontSize: 13, margin: 0 }}>{error}</p> : null}
          {notice ? <p role="status" style={{ color: '#62d394', fontSize: 13, margin: 0 }}>{notice}</p> : null}
          <Button variant="primary" size="lg" full onClick={() => void submit()} disabled={busy || !email || password.length < 6 || (mode === 'register' && !fullName)}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--bpds-slate)', fontSize: 13, cursor: 'pointer' }}
          >
            {mode === 'login' ? 'No account yet? Register as a coach' : 'Already have an account? Log in'}
          </button>
        </div>
      </Card>
    </div>
  );
}
