import { useState } from 'react';
import { saveDrillVideoUrl, storedVideoUrl, uploadDrillVideo, useDrills } from '../data/drill-media.js';
import { AREAS, MODULES, getModule } from '@predrag-miletic/bpds-methodology.modules-catalog';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Field, Input, Page, PageHead, SectionTitle, Select, Textarea, levelInfo } from '../ui/ui.js';

type Tab = 'overview' | 'drills' | 'modules' | 'users';

/** Admin panel for managing drills, modules, users and platform statistics. */
export function Admin() {
  const { players, teams, practices, history } = useStore();
  const drills = useDrills();
  const [tab, setTab] = useState<Tab>('overview');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);

  const tabs: [Tab, string][] = [['overview', 'Overview'], ['drills', 'Drills'], ['modules', 'Modules'], ['users', 'Users']];
  const filtered = drills.filter((d) => !q || `${d.code} ${d.name}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Page>
      <PageHead title="Admin Panel" sub="Manage the BPDS drill library, modules, content and users." />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(([k, label]) => (
          <Button key={k} variant={tab === k ? 'secondary' : 'ghost'} onClick={() => setTab(k)}>{label}</Button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          {[
            [drills.length, 'Drills'],
            [drills.filter((d) => d.published).length, 'Published'],
            [MODULES.length, 'Modules'],
            [players.length, 'Players'],
            [teams.length, 'Teams'],
            [practices.length, 'Practice Plans'],
            [history.length, 'Sessions Logged'],
            [drills.filter((d) => d.bpdsOriginal).length, 'BPDS Originals'],
          ].map(([v, l]) => (
            <Card key={l as string}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{v}</div>
              <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--bpds-slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === 'drills' ? (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}><Input placeholder="Search drills…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Button variant="primary" onClick={() => setEditing('new')}>+ Add Drill</Button>
          </div>

          {editing ? <DrillForm onClose={() => setEditing(null)} drillId={editing === 'new' ? undefined : editing} /> : null}

          <Card pad={false}>
            {filtered.map((d) => {
              const li = levelInfo(d.level);
              return (
                <div key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--bpds-line)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 850, color: 'var(--bpds-orange)', width: 100 }}>{d.code}</span>
                  <span style={{ flex: 1, minWidth: 160, fontSize: 14, fontWeight: 680 }}>{d.name}</span>
                  <Badge tone="gray">{getModule(d.moduleCode)?.name}</Badge>
                  <Badge tone={li.tone}>{li.label}</Badge>
                  <Badge tone={d.published ? 'green' : 'gray'}>{d.published ? 'Published' : 'Draft'}</Badge>
                  <Button size="sm" onClick={() => setEditing(d.id)}>Edit</Button>
                  <Button size="sm" variant="danger">Delete</Button>
                </div>
              );
            })}
          </Card>
        </>
      ) : null}

      {tab === 'modules' ? (
        <div style={{ display: 'grid', gap: 18 }}>
          {AREAS.map((area) => (
            <Card key={area}>
              <SectionTitle>{area}</SectionTitle>
              {MODULES.filter((m) => m.area === area).map((m) => (
                <div key={m.code} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid var(--bpds-line)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 720 }}>{m.code} — {m.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)', marginTop: 3 }}>{m.purpose}</div>
                    {m.prerequisites.length ? (
                      <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11.5, color: 'var(--bpds-slate)', fontWeight: 700 }}>Prerequisites:</span>
                        {m.prerequisites.map((p) => <Badge key={p} tone="amber">{p}</Badge>)}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Badge tone="gray">{drills.filter((d) => d.moduleCode === m.code).length} drills</Badge>
                    <Button size="sm">Edit</Button>
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      ) : null}

      {tab === 'users' ? (
        <Card pad={false}>
          {[
            ['Predrag Miletić', 'coach@bpds.app', 'Coach', 'Free Preview'],
            ['BPDS Admin', 'admin@bpds.app', 'Admin', 'Federation'],
            ['Marija Petrović', 'parent@bpds.app', 'Parent', 'Free Preview'],
          ].map(([name, email, role, sub]) => (
            <div key={email} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid var(--bpds-line)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--bpds-slate)' }}>{email}</div>
              </div>
              <Badge tone="dark">{role}</Badge>
              <Badge tone="amber">{sub}</Badge>
              <Button size="sm">Manage</Button>
            </div>
          ))}
        </Card>
      ) : null}
    </Page>
  );
}

/** Admin drill editor form covering the full BPDS drill metadata schema. */
function DrillForm({ drillId, onClose }: { drillId?: string; onClose: () => void }) {
  const drills = useDrills();
  const drill = drills.find((d) => d.id === drillId);
  const [videoUrl, setVideoUrl] = useState(drill ? storedVideoUrl(drill) : '');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const save = async () => {
    if (drill === undefined || (videoFile === null && videoUrl.trim() === '')) { onClose(); return; }
    setSaving(true);
    setStatus('');
    try {
      if (videoFile) await uploadDrillVideo(drill, videoFile);
      else await saveDrillVideoUrl(drill, videoUrl);
      onClose();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save video.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionTitle>{drill ? `Edit ${drill.code}` : 'New Drill'}</SectionTitle>
        <Button size="sm" onClick={onClose}>✕</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Field label="Drill code"><Input defaultValue={drill?.code} placeholder="COD-L3-016" /></Field>
        <Field label="Drill name"><Input defaultValue={drill?.name} placeholder="Hesitation to Crossover" /></Field>
        <Field label="Module">
          <Select defaultValue={drill?.moduleCode}>
            {MODULES.map((m) => <option key={m.code} value={m.code}>{m.code} — {m.name}</option>)}
          </Select>
        </Field>
        <Field label="Category"><Input defaultValue={drill?.category} /></Field>
        <Field label="Skill level">
          <Select defaultValue={drill?.level}>
            <option value={1}>Level 1 — Foundation</option>
            <option value={2}>Level 2 — Development</option>
            <option value={3}>Level 3 — Performance</option>
          </Select>
        </Field>
        <Field label="Typical introduction"><Input defaultValue={drill?.typicalIntroduction} placeholder="U13+" /></Field>
        <Field label="Suitable ages"><Input defaultValue={drill?.suitableAges.join(', ')} /></Field>
        <Field label="Min players"><Input type="number" defaultValue={drill?.minPlayers ?? 1} /></Field>
        <Field label="Max players"><Input type="number" defaultValue={drill?.maxPlayers ?? 12} /></Field>
        <Field label="Estimated duration"><Input type="number" defaultValue={drill?.duration ?? 6} /></Field>
        <Field label="Intensity">
          <Select defaultValue={drill?.intensity}><option>Low</option><option>Medium</option><option>High</option></Select>
        </Field>
        <Field label="Video URL"><Input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://…" /></Field>
        <Field label="Upload video from computer">
          <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} />
          <small style={{ display: 'block', color: 'var(--bpds-slate)', marginTop: 6 }}>The selected file is uploaded to Supabase when you save.</small>
        </Field>
      </div>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="Objective"><Textarea defaultValue={drill?.objective} /></Field>
        <Field label="Why This Drill? (mandatory)"><Textarea defaultValue={drill?.whyThisDrill} /></Field>
        <Field label="Setup"><Textarea defaultValue={drill?.setup} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Field label="Execution (one per line)"><Textarea defaultValue={drill?.execution.join('\n')} /></Field>
          <Field label="Coaching points"><Textarea defaultValue={drill?.coachingPoints.join('\n')} /></Field>
          <Field label="Common mistakes"><Textarea defaultValue={drill?.commonMistakes.join('\n')} /></Field>
          <Field label="Corrections"><Textarea defaultValue={drill?.corrections.join('\n')} /></Field>
          <Field label="Regression"><Textarea defaultValue={drill?.regression.join('\n')} /></Field>
          <Field label="Progression"><Textarea defaultValue={drill?.progression.join('\n')} /></Field>
          <Field label="Performance options"><Textarea defaultValue={drill?.performanceOptions.join('\n')} /></Field>
          <Field label="Variations"><Textarea defaultValue={drill?.variations.join('\n')} /></Field>
          <Field label="Reads"><Textarea defaultValue={drill?.reads.join('\n')} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <Field label="Repetitions"><Input defaultValue={drill?.repetitions} /></Field>
          <Field label="Work time"><Input defaultValue={drill?.workTime} /></Field>
          <Field label="Rest time"><Input defaultValue={drill?.restTime} /></Field>
          <Field label="Tags"><Input defaultValue={drill?.tags.join(', ')} /></Field>
          <Field label="Related drills"><Input defaultValue={drill?.relatedDrills.join(', ')} /></Field>
          <Field label="Prerequisite drills"><Input defaultValue={drill?.prerequisiteDrills.join(', ')} /></Field>
          <Field label="Follow-up drills"><Input defaultValue={drill?.followUpDrills.join(', ')} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13.5, fontWeight: 650 }}>
          <label style={{ display: 'flex', gap: 7, alignItems: 'center' }}><input type="checkbox" defaultChecked={drill?.bpdsOriginal} /> BPDS Original</label>
          <label style={{ display: 'flex', gap: 7, alignItems: 'center' }}><input type="checkbox" defaultChecked={drill?.published} /> Published</label>
          <label style={{ display: 'flex', gap: 7, alignItems: 'center' }}><input type="checkbox" defaultChecked={drill?.withDefense} /> With defense</label>
        </div>
      {status ? <div style={{ color: '#ff786e', fontSize: 13, marginBottom: 10 }}>{status}</div> : null}
        <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" disabled={saving} onClick={() => void save()}>{saving ? 'Uploading…' : 'Save Drill'}</Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Card>
  );
}
