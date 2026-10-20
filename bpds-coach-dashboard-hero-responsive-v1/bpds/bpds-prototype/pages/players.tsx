import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { AgeGroup, Player, PlayerSkillLevel } from '../data/types.js';
import { useStore } from '../store/store.js';
import { Avatar, Badge, Button, Card, Field, Input, Page, PageHead, SectionTitle, Select, Textarea } from '../ui/ui.js';

const AGE_GROUPS: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];
const SKILLS: PlayerSkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const COLORS = ['#e2571f', '#2563eb', '#1f9d63', '#7c3aed', '#d98a06', '#db2777'];

/** Player roster page with inline creation, editing and deletion. */
export function Players() {
  const navigate = useNavigate();
  const { players, teams, addPlayer, updatePlayer, deletePlayer } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '', dateOfBirth: '2010-01-01', ageGroup: 'U14' as AgeGroup, height: 175, weight: 65,
    position: 'Guard', dominantHand: 'Right' as 'Right' | 'Left', club: 'KK Partizan Youth',
    teamId: '', skillLevel: 'Intermediate' as PlayerSkillLevel, trainingFrequency: '3 sessions per week',
  });

  const create = () => {
    if (!form.fullName.trim()) return;
    const player: Player = {
      id: `p-${Date.now()}`,
      ...form,
      teamId: form.teamId || undefined,
      notes: [],
      active: true,
      photoColor: COLORS[players.length % COLORS.length],
      stats: { completedPractices: 0, totalMinutes: 0, completedDrills: 0 },
    };
    addPlayer(player);
    setOpen(false);
    setForm({ ...form, fullName: '' });
  };

  /** Opens the form prefilled with an existing player's editable fields. */
  const startEdit = (p: Player) => {
    setConfirmingId(null);
    setEditingId(p.id);
    setForm({
      fullName: p.fullName, dateOfBirth: p.dateOfBirth, ageGroup: p.ageGroup, height: p.height, weight: p.weight,
      position: p.position, dominantHand: p.dominantHand, club: p.club,
      teamId: p.teamId ?? '', skillLevel: p.skillLevel, trainingFrequency: p.trainingFrequency,
    });
    setOpen(true);
  };

  /** Cancels create or edit mode without changing anything. */
  const cancelForm = () => {
    setOpen(false);
    setEditingId(null);
  };

  /** Saves changes to the player being edited, preserving id and fields not on the form. */
  const saveEdit = () => {
    if (!editingId || !form.fullName.trim()) return;
    const existing = players.find((p) => p.id === editingId);
    if (!existing) return;
    updatePlayer({
      ...existing,
      ...form,
      id: existing.id,
      teamId: form.teamId || undefined,
    });
    setOpen(false);
    setEditingId(null);
  };

  return (
    <Page>
      <PageHead
        title="Players"
        sub="The player is the primary entity of BPDS. Every practice, drill and note belongs to a player."
        actions={(
          <Button
            variant="primary"
            onClick={() => (open ? cancelForm() : (setEditingId(null), setForm({
              fullName: '', dateOfBirth: '2010-01-01', ageGroup: 'U14' as AgeGroup, height: 175, weight: 65,
              position: 'Guard', dominantHand: 'Right' as 'Right' | 'Left', club: 'KK Partizan Youth',
              teamId: '', skillLevel: 'Intermediate' as PlayerSkillLevel, trainingFrequency: '3 sessions per week',
            }), setOpen(true)))}
          >
            {open ? 'Cancel' : '+ New Player'}
          </Button>
        )}
      />

      {open ? (
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>{editingId ? 'Edit Player Profile' : 'New Player Profile'}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
            <Field label="Full name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Player name" /></Field>
            <Field label="Date of birth"><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Field>
            <Field label="Age group">
              <Select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value as AgeGroup })}>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </Select>
            </Field>
            <Field label="Height (cm)"><Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} /></Field>
            <Field label="Weight (kg)"><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} /></Field>
            <Field label="Position">
              <Select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {['Point Guard', 'Shooting Guard', 'Combo Guard', 'Small Forward', 'Power Forward', 'Center'].map((p) => <option key={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Dominant hand">
              <Select value={form.dominantHand} onChange={(e) => setForm({ ...form, dominantHand: e.target.value as 'Right' | 'Left' })}>
                <option>Right</option><option>Left</option>
              </Select>
            </Field>
            <Field label="Club"><Input value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} /></Field>
            <Field label="Team (optional)">
              <Select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
                <option value="">No team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
            <Field label="Skill level">
              <Select value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value as PlayerSkillLevel })}>
                {SKILLS.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Training frequency">
              <Select value={form.trainingFrequency} onChange={(e) => setForm({ ...form, trainingFrequency: e.target.value })}>
                {['1 session per week', '2 sessions per week', '3 sessions per week', '4 sessions per week', '5 sessions per week', '6 sessions per week'].map((f) => <option key={f}>{f}</option>)}
              </Select>
            </Field>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Button variant="primary" onClick={editingId ? saveEdit : create}>{editingId ? 'Save Changes' : 'Create Player'}</Button>
            {editingId ? <Button onClick={cancelForm}>Cancel</Button> : null}
          </div>
        </Card>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {players.map((p) => (
          <Card key={p.id}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <Avatar name={p.fullName} color={p.photoColor} size={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 780 }}>{p.fullName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)' }}>{p.position} · {p.dominantHand} handed</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <Badge tone="orange">{p.ageGroup}</Badge>
              <Badge tone="blue">{p.skillLevel}</Badge>
              <Badge tone={p.active ? 'green' : 'gray'}>{p.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)', marginBottom: 12, lineHeight: 1.7 }}>
              {p.height} cm · {p.weight} kg · {p.trainingFrequency}
              <br />
              {p.stats.completedPractices} sessions · {p.stats.totalMinutes} min · {p.stats.completedDrills} drills
            </div>
            <Button size="sm" full onClick={() => navigate(`/players/${p.id}`)}>Open Profile</Button>
            {confirmingId === p.id ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)', marginBottom: 8 }}>Delete this player? This cannot be undone.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={(e) => { e.stopPropagation(); deletePlayer(p.id); setConfirmingId(null); if (editingId === p.id) cancelForm(); }}
                  >
                    Yes, delete
                  </Button>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); setConfirmingId(null); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button size="sm" full onClick={(e) => { e.stopPropagation(); startEdit(p); }}>Edit</Button>
                <Button size="sm" full variant="danger" onClick={(e) => { e.stopPropagation(); setConfirmingId(p.id); }}>Delete</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Page>
  );
}

/** Individual player profile with history, progress and private coach notes. */
export function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { players, teams, history, updatePlayer } = useStore();
  const player = players.find((p) => p.id === id);
  const [note, setNote] = useState('');

  if (!player) return <Page><PageHead title="Player not found" /></Page>;

  const team = teams.find((t) => t.id === player.teamId);
  const sessions = history.filter((h) => h.playerIds.includes(player.id));

  const addNote = () => {
    if (!note.trim()) return;
    updatePlayer({ ...player, notes: [note.trim(), ...player.notes] });
    setNote('');
  };

  return (
    <Page>
      <PageHead
        title={player.fullName}
        sub={`${player.ageGroup} · ${player.position} · ${player.club}`}
        actions={(
          <>
            <Button onClick={() => navigate('/generate')}>Generate Practice</Button>
            <Button variant={player.active ? 'danger' : 'primary'} onClick={() => updatePlayer({ ...player, active: !player.active })}>
              {player.active ? 'Set Inactive' : 'Set Active'}
            </Button>
          </>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Card>
            <SectionTitle>Profile</SectionTitle>
            <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
              {[
                ['Player ID', player.id],
                ['Date of birth', player.dateOfBirth],
                ['Age group', player.ageGroup],
                ['Height', `${player.height} cm`],
                ['Weight', `${player.weight} kg`],
                ['Position', player.position],
                ['Dominant hand', player.dominantHand],
                ['Club', player.club],
                ['Team', team?.name ?? 'No team'],
                ['Skill level', player.skillLevel],
                ['Training frequency', player.trainingFrequency],
                ['Status', player.active ? 'Active' : 'Inactive'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bpds-line)', paddingBottom: 7 }}>
                  <span style={{ color: 'var(--bpds-slate)', fontWeight: 650 }}>{k}</span>
                  <span style={{ fontWeight: 620 }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Progress</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
              <div><div style={{ fontSize: 24, fontWeight: 900 }}>{player.stats.completedPractices}</div><div style={{ fontSize: 11.5, color: 'var(--bpds-slate)', fontWeight: 700 }}>PRACTICES</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 900 }}>{player.stats.totalMinutes}</div><div style={{ fontSize: 11.5, color: 'var(--bpds-slate)', fontWeight: 700 }}>MINUTES</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 900 }}>{player.stats.completedDrills}</div><div style={{ fontSize: 11.5, color: 'var(--bpds-slate)', fontWeight: 700 }}>DRILLS</div></div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <Card>
            <SectionTitle>Training History</SectionTitle>
            {sessions.length === 0 ? <p style={{ color: 'var(--bpds-slate)', fontSize: 14 }}>No sessions recorded yet.</p> : sessions.map((s) => (
              <div key={s.id} style={{ borderBottom: '1px solid var(--bpds-line)', padding: '11px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 720 }}>{s.practiceName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)', marginTop: 3 }}>
                  {s.date} · {s.duration} min · {s.focus} · {s.completedDrills}/{s.totalDrills} drills
                </div>
                {s.notes ? <div style={{ fontSize: 13, color: 'var(--bpds-slate)', marginTop: 5, fontStyle: 'italic' }}>{s.notes}</div> : null}
              </div>
            ))}
          </Card>

          <Card>
            <SectionTitle>Coach Notes · Private</SectionTitle>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note, visible only to you…" />
            <div style={{ margin: '10px 0 16px' }}><Button size="sm" variant="primary" onClick={addNote}>Add Note</Button></div>
            {player.notes.map((n) => (
              <div key={n} style={{ borderLeft: '3px solid var(--bpds-orange)', paddingLeft: 12, marginBottom: 11, fontSize: 13.5 }}>{n}</div>
            ))}
          </Card>
        </div>
      </div>
    </Page>
  );
}
