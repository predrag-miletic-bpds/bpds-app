import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getDrill } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { useStore } from '../store/store.js';
import { DrillCard, PrintField, PrintList, PrintSection, PrintToolbar, QrCode } from './print-shared.js';
import { resolveCoachPrescriptionV1 } from '@predrag-miletic/bpds-methodology.practice-prescriptions';
import './print.css';

/** Printable Coach Sheet and optional Drill Cards for one Practice snapshot. */
export function PracticePrint() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { practices, draft, teams } = useStore();
  const plan = id === 'draft' ? draft : practices.find((item) => item.id === id);
  const mode = params.get('mode') ?? 'plan';
  const selected = new Set((params.get('drills') ?? '').split(',').filter(Boolean));

  useEffect(() => { document.title = plan ? `${plan.name} — BPDS Practice Plan` : 'BPDS Practice Plan'; }, [plan]);
  if (!plan) return <main className="printPage"><h1>Practice not found</h1></main>;

  const grouped = plan.items.reduce<Array<{ phase: string; items: typeof plan.items }>>((groups, item) => {
    const group = groups.find((entry) => entry.phase === item.phase);
    if (group) group.items.push(item); else groups.push({ phase: item.phase, items: [item] });
    return groups;
  }, []);
  const drills = plan.items.map((item) => item.drillId ? getDrill(item.drillId) : undefined).filter(Boolean);
  const cards = mode === 'all' ? drills : mode === 'selected' ? drills.filter((drill) => drill && selected.has(drill.id)) : [];
  const team = teams.find((item) => item.id === plan.teamId);
  const practiceUrl = `${window.location.origin}/practice/${plan.id}`;

  return <div className="printPreview">
    <PrintToolbar onPrint={() => window.print()} />
    <main className="printPage">
      <section className="printSheet">
      <header className="printHeader">
        <div><h1>BPDS PRACTICE PLAN</h1><p>{plan.name}</p></div>
        <QrCode url={practiceUrl} label="Open this practice in BPDS" />
      </header>
      <div className="printMeta">
        <PrintField label="Team / age group">{team?.name ?? plan.ageGroup}</PrintField>
        <PrintField label="Date">{plan.date}</PrintField>
        <PrintField label="Duration">{plan.duration} min</PrintField>
        <PrintField label="Players">{plan.playerIds.length || '—'}</PrintField>
      </div>
      {plan.equipment.length ? <PrintSection title="Equipment"><p>{plan.equipment.join(' · ')}</p></PrintSection> : null}
      <PrintSection title="Objective"><p>{plan.objective}</p></PrintSection>
      {grouped.map((group) => <section className="printModule printBreakAvoid" key={group.phase}>
        <h2><span>{group.phase}</span><span>{group.items.reduce((sum, item) => sum + item.duration, 0)} min</span></h2>
        {group.items.map((item, index) => {
          const drill = item.drillId ? getDrill(item.drillId) : undefined;
          return <div className="printRow" key={item.id}><span>□</span><strong>{drill?.name ?? item.label ?? `Block ${index + 1}`}</strong><span>{item.duration} min</span></div>;
        })}
      </section>)}
      <div className="printTotal"><span>TOTAL</span><span>{plan.items.reduce((sum, item) => sum + item.duration, 0)} MIN</span></div>
      </section>
      {cards.length ? <div className="drillCards">{cards.map((drill, index) => { const item = plan.items.find((candidate) => candidate.drillId === drill!.id); const coachPrescription = item?.coachPrescription ?? resolveCoachPrescriptionV1(drill!.id, plan.ageGroup); return <section className="printSheet printCardSheet" key={drill!.id}><h1 className="printCardsTitle">DRILL INSTRUCTIONS{cards.length > 1 ? ` · ${index + 1}/${cards.length}` : ''}</h1><DrillCard drill={drill} duration={item?.duration} coachPrescription={coachPrescription} url={`${window.location.origin}/drill/${drill!.id}`} /></section>; })}</div> : null}
    </main>
  </div>;
}
