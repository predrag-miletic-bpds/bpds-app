import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AgeGroup, PlayerSkillLevel, Team } from '../data/types.js';
import { useStore } from '../store/store.js';
import { Avatar, Badge, Button, Card, Field, Input, Page, PageHead, SectionTitle, Select } from '../ui/ui.js';

const AGE_GROUPS: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];
const SKILLS: PlayerSkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

/** Teams page. Teams are an optional grouping — practices can be generated without one. */
export function Teams() {
  const navigate = useNavigate();
  const { teams, players, history, practices, addTeam, deleteTeam } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', club: 'KK Partizan Youth', ageGroup: 'U14' as AgeGroup, skillLevel: 'Intermediate' as PlayerSkillLevel });
  const [picked, setPicked] = useState<string[]>([]);

  const create = () => {
    if (!form.name.trim()) return;
    const team: Team = { id: `t-${Date.now()}`, ...form, coach: 'Coach Predrag', playerIds: picked, notes: [] };
    addTeam(team);
    setOpen(false);
    setForm({ ...form, name: '' });
    setPicked([]);
  };

  /** Opens the form prefilled with an existing team's editable fields and roster. */
  const startEdit = (t: Team) => {
    setConfirmingId(null);
    setEditingId(t.id);
    setForm({ name: t.name, club: t.club, ageGroup: t.ageGroup, skillLevel: t.skillLevel });
    setPicked(t.playerIds);
    setOpen(true);
  };

  /** Cancels create or edit mode without changing anything. */
  const cancelForm = () => {
    setOpen(false);
    setEditingId(null);
    setPicked([]);
  };

  /** Saves changes to the team being edited via addTeam's existing-id update branch. */
  const saveEdit = () => {
    if (!editingId || !form.name.trim()) return;
    const existing = teams.find((t) => t.id === editingId);
    if (!existing) return;
    addTeam({ ...existing, ...form, id: existing.id, playerIds: picked });
    setOpen(false);
    setEditingId(null);
    setPicked([]);
  };

  return (
    <Page>
      <PageHead
        title="Teams"
        sub="Teams are optional. You can generate individual or small-group practices without creating one."
        actions={(
          <Button
            variant="primary"
            onClick={() => (open ? cancelForm() : (setEditingId(null), setForm({ name: '', club: 'KK Partizan Youth', ageGroup: 'U14' as AgeGroup, skillLevel: 'Intermediate' as PlayerSkillLevel }), setPicked([]), setOpen(true)))}
          >
            {open ? 'Cancel' : '+ New Team'}
          </Button>
        )}
      />

      {open ? (
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>{editingId ? 'Edit Team' : 'New Team'}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
            <Field label="Team name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Partizan U14 Red" /></Field>
            <Field label="Club"><Input value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} /></Field>
            <Field label="Age group">
              <Select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value as AgeGroup })}>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Skill level">
              <Select value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value as PlayerSkillLevel })}>
                {SKILLS.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--bpds-slate)', marginBottom: 9 }}>Assign players</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPicked((x) => (x.includes(p.id) ? x.filter((y) => y !== p.id) : [...x, p.id]))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999,
                  border: `1px solid ${picked.includes(p.id) ? 'var(--bpds-orange)' : 'var(--bpds-line)'}`,
                  background: picked.includes(p.id) ? 'var(--bpds-orange-soft)' : 'var(--bpds-surface)', cursor: 'pointer', fontSize: 13, fontWeight: 620,
                }}
              >
                <Avatar name={p.fullName} color={p.photoColor} size={22} />
                {p.fullName}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" onClick={editingId ? saveEdit : create}>{editingId ? 'Save Changes' : 'Create Team'}</Button>
            {editingId ? <Button onClick={cancelForm}>Cancel</Button> : null}
          </div>
        </Card>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {teams.map((t) => {
          const roster = players.filter((p) => t.playerIds.includes(p.id));
          const teamHistory = history.filter((h) => h.teamId === t.id);
          const teamPractices = practices.filter((p) => p.teamId === t.id);
          return (
            <Card key={t.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{t.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)', marginTop: 3 }}>{t.club} · {t.coach}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge tone="orange">{t.ageGroup}</Badge>
                  <Badge tone="blue">{t.skillLevel}</Badge>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {roster.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/players/${p.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bpds-surface-2)', border: 'none', borderRadius: 999, padding: '5px 11px 5px 5px', fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}
                  >
                    <Avatar name={p.fullName} color={p.photoColor} size={20} />
                    {p.fullName.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)', marginBottom: 12 }}>
                {teamHistory.length} sessions in history · {teamPractices.length} saved practices
              </div>
              {t.notes.map((n) => (
                <div key={n} style={{ borderLeft: '3px solid var(--bpds-orange)', paddingLeft: 11, fontSize: 13, marginBottom: 10 }}>{n}</div>
              ))}
              <Button size="sm" full variant="primary" onClick={() => navigate('/generate')}>Generate Team Practice</Button>
              {confirmingId === t.id ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)', marginBottom: 8 }}>Delete this team? This cannot be undone.</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => { e.stopPropagation(); deleteTeam(t.id); setConfirmingId(null); if (editingId === t.id) cancelForm(); }}
                    >
                      Yes, delete
                    </Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setConfirmingId(null); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Button size="sm" full onClick={(e) => { e.stopPropagation(); startEdit(t); }}>Edit</Button>
                  <Button size="sm" full variant="danger" onClick={(e) => { e.stopPropagation(); setConfirmingId(t.id); }}>Delete</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
