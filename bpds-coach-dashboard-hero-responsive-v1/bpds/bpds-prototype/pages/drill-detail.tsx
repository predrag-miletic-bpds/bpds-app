import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { DrillDiagramImage, DrillVideo, useDrills } from '../data/drill-media.js';
import { getModule } from '@predrag-miletic/bpds-methodology.modules-catalog';
import { COACH_PRESCRIPTION_AGE_GROUPS, coachPrescriptionForDrillV1, resolveCoachPrescriptionV1 } from '../../../bpds-methodology/practice-prescriptions/coach-prescriptions-v1.js';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Page, PageHead, SectionTitle, levelInfo } from '../ui/ui.js';

/** Render a bullet list block, skipping empty sections. */
function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Card style={{ marginBottom: 14 }}>
      <SectionTitle>{title}</SectionTitle>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: 'var(--bpds-ink)' }}>
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </Card>
  );
}

type StoredMediaMode = 'video' | 'diagram' | 'split';
type MediaMode = 'video' | 'diagram';
function MediaArea({ drill }: { drill: { videoUrl?: string; diagramUrl?: string; mediaMode?: StoredMediaMode; name?: string } }) {
  const hasVideo = Boolean(drill.videoUrl);
  const hasDiagram = Boolean(drill.diagramUrl);
  const MEDIA_TABS: MediaMode[] = ['video', 'diagram'];
  const preferred = drill.mediaMode;
  const [mode, setMode] = useState<MediaMode>(() => preferred === 'diagram' ? 'diagram' : 'video');
  useEffect(() => {
    setMode(preferred === 'diagram' ? 'diagram' : 'video');
  }, [preferred]);
  const selectedMode = mode;
  const frame = (kind: MediaMode) => (
    <div style={{ aspectRatio: '16 / 9', minHeight: 220, borderRadius: 14, overflow: 'hidden', background: '#111820' }}>
      {kind === 'video'
        ? hasVideo
          ? <DrillVideo drill={drill as any} />
          : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#05070a', color: 'var(--bpds-slate)' }}>No video uploaded yet.</div>
        : hasDiagram
          ? <DrillDiagramImage drill={drill as any} />
          : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#0b1016', color: 'var(--bpds-slate)' }}>No diagram uploaded yet.</div>}
    </div>
  );
  return (
    <div style={{ marginBottom: 14 }}>
      { <div role="tablist" aria-label="Drill media mode" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {MEDIA_TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={selectedMode === item}
            onClick={() => setMode(item)}
            style={{
              border: '1px solid ' + (selectedMode === item ? 'var(--bpds-orange)' : 'var(--bpds-line)'),
              borderRadius: 8,
              padding: '8px 14px',
              background: selectedMode === item ? 'var(--bpds-orange)' : 'transparent',
              color: selectedMode === item ? '#fff' : 'var(--bpds-ink)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>}
      {frame(selectedMode)}
    </div>
  );
}

/** Full drill detail page — video left, methodology right on desktop. */
export function DrillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const openedForAge = (location.state as { ageGroup?: string } | null)?.ageGroup;
  const drills = useDrills();
  const getDrill = (drillId: string) => drills.find((item) => item.id === drillId);
  const { draft, setDraft, markDrillViewed } = useStore();
  const [selectedAge, setSelectedAge] = useState(() => COACH_PRESCRIPTION_AGE_GROUPS.includes((openedForAge ?? draft?.ageGroup) as any) ? (openedForAge ?? draft?.ageGroup)! : 'U10');
  const [showAllAges, setShowAllAges] = useState(false);
  const drill = getDrill(id ?? '');

  const drillId = drill?.id;
  useEffect(() => {
    if (drillId) markDrillViewed(drillId);
  }, [drillId, markDrillViewed]);

  if (!drill) {
    
    return <Page><PageHead title="Drill not found" /><Button onClick={() => navigate('/library')}>Back to Library</Button></Page>;
  }

  const index = drills.findIndex((d) => d.id === drill.id);
  const prev = drills[index - 1];
  const next = drills[index + 1];
  const mod = getModule(drill.moduleCode);
  const li = levelInfo(drill.level);
  const coachDoses = coachPrescriptionForDrillV1(drill.id);
  const selectedCoachDose = resolveCoachPrescriptionV1(drill.id, selectedAge as any);

  const addToPractice = () => {
    if (!draft) { void navigate('/builder'); return; }
    const coachPrescription = resolveCoachPrescriptionV1(drill.id, draft.ageGroup);
    setDraft({
      ...draft,
      items: [...draft.items, { id: `i-${Date.now()}`, kind: 'drill', drillId: drill.id, duration: drill.duration, phase: 'Technical Skill Development', ...(coachPrescription ? { coachPrescription } : {}) }],
    });
    void navigate('/practice/draft');
  };

  const related = (ids: string[]) => ids.map(getDrill).filter(Boolean);

  return (
    <Page>
      <PageHead
        title={`${drill.code} — ${drill.name}`}
        sub={`${mod?.name} · ${drill.category}`}
        actions={(
          <>
            {returnTo ? <Button onClick={() => navigate(returnTo)}>← Back to Practice</Button> : null}
            <Button onClick={() => navigate(`/drill/${drill.id}/print`)}>Print Drill</Button>
              <Button disabled={!prev} onClick={() => prev && navigate(`/drill/${prev.id}`)}>← Previous</Button>
            <Button disabled={!next} onClick={() => next && navigate(`/drill/${next.id}`)}>Next →</Button>
            <Button variant="primary" onClick={addToPractice}>Add to Practice</Button>
          </>
        )}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <Badge tone={li.tone}>{li.label}</Badge>
        <Badge tone="gray">Typical introduction {drill.typicalIntroduction}</Badge>
        <Badge tone="blue">Suitable: {drill.suitableAges.join(', ')}</Badge>
        <Badge tone="gray">{drill.skillStatus}</Badge>
        <Badge tone="gray">{drill.intensity} intensity</Badge>
        <Badge tone={drill.withDefense ? 'amber' : 'gray'}>{drill.withDefense ? 'With defense' : 'Without defense'}</Badge>
        <Badge tone="gray">{drill.grouping}</Badge>
        {drill.bpdsOriginal ? <Badge tone="dark">BPDS Original</Badge> : null}
        <Badge tone={drill.published ? 'green' : 'gray'}>{drill.published ? 'Published' : 'Unpublished'}</Badge>
      </div>

            <style>{'.bpds-drill-detail-layout { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.85fr); gap: 20px; align-items: start; } @media (max-width: 820px) { .bpds-drill-detail-layout { grid-template-columns: minmax(0, 1fr); } }'}</style>
      <div className="bpds-drill-detail-layout">
          <div>
            <MediaArea drill={drill as any} />


          <Card style={{ marginBottom: 14 }}>
            <SectionTitle>Objective</SectionTitle>
            <p style={{ fontSize: 14.5 }}>{drill.objective}</p>
          </Card>

          <Card style={{ marginBottom: 14, borderLeft: '4px solid var(--bpds-orange)' }}>
            <SectionTitle>Why This Drill?</SectionTitle>
            <p style={{ fontSize: 14.5 }}>{drill.whyThisDrill}</p>
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <SectionTitle>Setup</SectionTitle>
            <p style={{ fontSize: 14.5 }}>{drill.setup}</p>
          </Card>

          <ListBlock title="Execution" items={drill.execution} />
          <ListBlock title="Coaching Points" items={drill.coachingPoints} />
          <ListBlock title="Common Mistakes" items={drill.commonMistakes} />
          <ListBlock title="Corrections" items={drill.corrections} />
        </div>

        <div>
          <Card style={{ marginBottom: 14 }}>
            <SectionTitle>Session Data</SectionTitle>
            <div style={{ display: 'grid', gap: 9, fontSize: 14 }}>
              <Row k="Equipment" v={drill.equipment.join(', ')} />
              <Row k="Players" v={`${drill.minPlayers}–${drill.maxPlayers}`} />
              <Row k="Court area" v={drill.courtArea.join(', ')} />
              {coachDoses.length ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <b>Coach dosage</b>
                    <button type="button" onClick={() => setShowAllAges((value) => !value)} style={{ border: 0, background: 'transparent', color: 'var(--bpds-orange)', fontWeight: 800, cursor: 'pointer' }}>{showAllAges ? 'Selected age' : 'View all ages'}</button>
                  </div>
                  {!showAllAges ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <label style={{ display: 'grid', gap: 4, fontSize: 12, fontWeight: 800, color: 'var(--bpds-slate)' }}>
                        Age group
                        <select value={selectedAge} onChange={(event) => setSelectedAge(event.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--bpds-line)', background: 'var(--bpds-surface)', color: 'var(--bpds-ink)', fontWeight: 700 }}>
                          {COACH_PRESCRIPTION_AGE_GROUPS.map((age) => <option key={age} value={age}>{age}</option>)}
                        </select>
                      </label>
                      {selectedCoachDose ? <Row k={selectedCoachDose.ageGroup} v={`${selectedCoachDose.workText}; ${selectedCoachDose.restText} rest; ${selectedCoachDose.allocationText}`} /> : null}
                    </div>
                  ) : null}
                  {showAllAges ? coachDoses.map((dose) => (
                    <Row key={dose.ageGroup} k={dose.ageGroup} v={`${dose.workText}; ${dose.restText} rest; ${dose.allocationText}`} />
                  )) : null}
                </>
              ) : (
                <>
                  <Row k="Repetitions" v={drill.repetitions} />
                  <Row k="Work time" v={drill.workTime} />
                  <Row k="Rest time" v={drill.restTime} />
                </>
              )}
              <Row k="Allocated group time" v={`${drill.duration} minutes`} />
            </div>
          </Card>

          <ListBlock title="Regression" items={drill.regression} />
          <ListBlock title="Progression" items={drill.progression} />
          <ListBlock title="Performance Options" items={drill.performanceOptions} />
          <ListBlock title="Variations" items={drill.variations} />
          <ListBlock title="Reads" items={drill.reads} />

          <Card style={{ marginBottom: 14 }}>
            <SectionTitle>Game Application</SectionTitle>
            <p style={{ fontSize: 14.5 }}>{drill.gameApplication}</p>
          </Card>

          {[
            ['Prerequisite Drills', drill.prerequisiteDrills],
            ['Follow-Up Drills', drill.followUpDrills],
            ['Related Drills', drill.relatedDrills],
          ].map(([title, ids]) => {
            const list = related(ids as string[]);
            if (!list.length) return null;
            return (
              <Card key={title as string} style={{ marginBottom: 14 }}>
                <SectionTitle>{title as string}</SectionTitle>
                <div style={{ display: 'grid', gap: 8 }}>
                  {list.map((d) => (
                    <button
                      key={d!.id}
                      type="button"
                      onClick={() => navigate(`/drill/${d!.id}`)}
                      style={{
                        display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--bpds-line)',
                        borderRadius: 10, padding: '9px 12px', background: 'var(--bpds-surface)', color: 'var(--bpds-ink)', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 850, color: 'var(--bpds-orange)' }}>{d!.code}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 650 }}>{d!.name}</span>
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}

          
                </div>{drill.tags.length ? (
            <Card>
              <SectionTitle>Tags</SectionTitle>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {drill.tags.map((t) => <Badge key={t} tone="gray">{t}</Badge>)}
              </div>
            </Card>
          ) : null}
        </div>
    
    </Page>
  );
}

/** Key/value row used in the session data card. */
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', borderBottom: '1px solid var(--bpds-line)', paddingBottom: 8 }}>
      <span style={{ color: 'var(--bpds-slate)', fontWeight: 650, flexShrink: 0 }}>{k}</span>
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{v}</span>
    </div>
  );
}
