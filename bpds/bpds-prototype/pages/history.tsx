import { useState } from 'react';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Empty, Page, PageHead, SectionTitle } from '../ui/ui.js';

/** Training history — completed sessions across players and teams. */
export function History() {
  const { history, players, teams, deleteHistoryEntry } = useStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const totalMinutes = history.reduce((a, h) => a + h.duration, 0);
  const totalDrills = history.reduce((a, h) => a + h.completedDrills, 0);

  const focusCounts = history.reduce<Record<string, number>>((acc, h) => {
    acc[h.focus] = (acc[h.focus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Page>
      <PageHead title="Training History" sub="Every completed session is recorded to player and team history." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 22 }}>
        {[
          [history.length, 'Sessions'],
          [totalMinutes, 'Minutes'],
          [totalDrills, 'Drills Completed'],
          [Object.keys(focusCounts).length, 'Focus Areas'],
        ].map(([v, l]) => (
          <Card key={l as string}>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{v}</div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--bpds-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 22 }}>
        <SectionTitle>Recent Training Focus</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(focusCounts).map(([f, c]) => <Badge key={f} tone="orange">{f} · {c}</Badge>)}
        </div>
      </Card>

      {history.length === 0 ? <Empty>No completed sessions yet. Run a practice in Practice Mode.</Empty> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {history.map((h) => {
            const team = teams.find((t) => t.id === h.teamId);
            const names = h.playerIds.map((id) => players.find((p) => p.id === id)?.fullName).filter(Boolean);
            const pct = Math.round((h.completedDrills / Math.max(1, h.totalDrills)) * 100);
            return (
              <Card key={h.id}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 780 }}>{h.practiceName}</div>
                    <div style={{ fontSize: 13, color: 'var(--bpds-slate)', marginTop: 5 }}>
                      {h.date} · {h.duration} min · {h.focus} · {h.completedDrills}/{h.totalDrills} drills
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
                      {team ? <Badge tone="dark">{team.name}</Badge> : null}
                      {names.map((n) => <Badge key={n} tone="gray">{n}</Badge>)}
                    </div>
                    {h.notes ? (
                      <div style={{ borderLeft: '3px solid var(--bpds-orange)', paddingLeft: 12, marginTop: 12, fontSize: 13.5, color: 'var(--bpds-slate)' }}>
                        {h.notes}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 90 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: pct === 100 ? 'var(--bpds-green)' : 'var(--bpds-ink)' }}>{pct}%</div>
                    <div style={{ fontSize: 11, fontWeight: 750, color: 'var(--bpds-slate)', textTransform: 'uppercase' }}>Completion</div>
                  </div>
          <div style={{ minWidth: 120 }}>
            {confirmingId === h.id ? (
              <div style={{ display: 'grid', gap: 7 }}>
                <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--bpds-slate)' }}>Delete this entry?</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size='sm' variant='secondary' onClick={() => setConfirmingId(null)}>Cancel</Button>
                  <Button size='sm' variant='danger' onClick={() => { deleteHistoryEntry(h.id); setConfirmingId(null); }}>Delete</Button>
                </div>
              </div>
            ) : (
              <Button size='sm' full variant='danger' onClick={() => setConfirmingId(h.id)}>Delete</Button>
            )}
          </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}

/** Account settings placeholder with roles and subscription tiers from the data model. */
export function Settings() {
  const { coach, logout } = useStore();
  return (
    <Page>
      <PageHead title="Account Settings" sub="Roles and subscription tiers exist in the data model from day one." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        <Card>
          <SectionTitle>Coach Account</SectionTitle>
          <div style={{ fontSize: 14, lineHeight: 2, color: 'var(--bpds-slate)' }}>
            <div><b style={{ color: 'var(--bpds-ink)' }}>{coach.name}</b></div>
            <div>{coach.email}</div>
            <div>{coach.club}</div>
          </div>
          <div style={{ marginTop: 14 }}><Button variant="danger" onClick={() => void logout()}>Log Out</Button></div>
        </Card>
        <Card>
          <SectionTitle>Role</SectionTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Admin', 'Coach', 'Parent', 'Club Admin', 'Academy Admin', 'Federation Admin'].map((r) => (
              <Badge key={r} tone={r === coach.role ? 'dark' : 'gray'}>{r}</Badge>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--bpds-slate)', marginTop: 12 }}>
            Admin and Coach have full Version 1 interfaces. Other roles are reserved for future releases.
          </p>
        </Card>
        <Card>
          <SectionTitle>Subscription</SectionTitle>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Free Preview', 'Monthly', 'Annual', 'Club', 'Academy', 'Federation'].map((s) => (
              <Badge key={s} tone={s === coach.subscription ? 'orange' : 'gray'}>{s}</Badge>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--bpds-slate)', marginTop: 12 }}>
            Payment processing is not part of Version 1.
          </p>
        </Card>
      </div>
    </Page>
  );
}
