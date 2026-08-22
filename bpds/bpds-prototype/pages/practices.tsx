import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Empty, Input, Page, PageHead, Select } from '../ui/ui.js';

/** Saved practice plans — My Practices. */
export function Practices() {
  const navigate = useNavigate();
  const { practices, teams, players, deletePractice, duplicatePractice } = useStore();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const list = useMemo(() => practices.filter((p) => {
    if (q && !`${p.name} ${p.primaryFocus}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && p.status !== status) return false;
    return true;
  }), [practices, q, status]);

  return (
    <Page>
      <PageHead
        title="My Practices"
        sub="Saved plans, drafts and scheduled sessions."
        actions={<Button variant="primary" onClick={() => navigate('/generate')}>⚡ Generate Practice</Button>}
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input placeholder="Search practices…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ width: 180 }}>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option>Draft</option><option>Scheduled</option><option>Completed</option>
          </Select>
        </div>
      </div>

      {list.length === 0 ? <Empty>No practices match your filters.</Empty> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((p) => {
            const team = teams.find((t) => t.id === p.teamId);
            const names = p.playerIds.map((id) => players.find((x) => x.id === id)?.fullName.split(' ')[0]).filter(Boolean);
            return (
              <Card key={p.id}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 17, fontWeight: 780 }}>{p.name}</span>
                      <Badge tone={p.status === 'Completed' ? 'green' : p.status === 'Scheduled' ? 'blue' : 'gray'}>{p.status}</Badge>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--bpds-slate)', lineHeight: 1.8 }}>
                      {p.date} · {p.duration} min · {p.items.filter((i) => i.kind === 'drill').length} drills · Last opened {p.lastOpened}
                      <br />
                      {team ? `${team.name} · ` : ''}{names.length ? names.join(', ') : 'No players assigned'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
                      <Badge tone="orange">{p.ageGroup}</Badge>
                      <Badge tone="blue">{p.skillLevel}</Badge>
                      <Badge tone="gray">{p.primaryFocus}</Badge>
                      <Badge tone="gray">{p.secondaryFocus}</Badge>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button size="sm" onClick={() => navigate(`/practice/${p.id}`)}>Edit</Button>
                    <Button size="sm" onClick={() => duplicatePractice(p.id)}>Duplicate</Button>
                    <Button size="sm" variant="primary" onClick={() => navigate(`/practice-mode/${p.id}`)}>▶ Start</Button>
                    <Button size="sm" variant="danger" onClick={() => deletePractice(p.id)}>Delete</Button>
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
