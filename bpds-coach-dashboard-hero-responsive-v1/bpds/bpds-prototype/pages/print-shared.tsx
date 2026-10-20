import type { ReactNode } from 'react';
import type { CoachDrillPrescriptionV1 } from '@predrag-miletic/bpds-methodology.practice-prescriptions';
import { formatCoachPrescriptionV1 } from '@predrag-miletic/bpds-methodology.practice-prescriptions';

/** QR image backed by the stable BPDS URL rather than a copied/static image. */
export function QrCode({ url, label }: { url: string; label: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(url)}`;
  return (
    <div className="printQr">
      <img src={src} alt={`QR code: ${label}`} />
      <span>{label}</span>
    </div>
  );
}

export function PrintToolbar({ onPrint }: { onPrint: () => void }) {
  return (
    <div className="printToolbar no-print">
      <button type="button" onClick={onPrint}>Print / Save PDF</button>
      <button type="button" onClick={() => window.history.back()}>Back to Practice</button>
    </div>
  );
}

export function PrintField({ label, children }: { label: string; children?: ReactNode }) {
  return <div className="printField"><span>{label}</span><b>{children || '—'}</b></div>;
}

export function DrillCard({ drill, duration, url, coachPrescription }: { drill: any; duration?: number; url: string; coachPrescription?: CoachDrillPrescriptionV1 }) {
  return (
    <section className="drillCard printBreakAvoid">
      <div className="drillCardHead">
        <div>
          <div className="printKicker">{drill.code} · {drill.moduleCode}</div>
          <h2>{drill.name}</h2>
          {duration ? <div className="printMuted">Practice time: {duration} min</div> : null}
        </div>
        <QrCode url={url} label="Watch video / Open Drill" />
      </div>
      {drill.objective ? <PrintSection title="Objective"><p>{drill.objective}</p></PrintSection> : null}
      {drill.setup ? <PrintSection title="Setup"><p>{drill.setup}</p></PrintSection> : null}
      {drill.execution?.length ? <PrintList title="How to perform" items={drill.execution} /> : null}
      {drill.coachingPoints?.length ? <PrintList title="Coaching points" items={drill.coachingPoints} /> : null}
      {drill.commonMistakes?.length ? <PrintList title="Common mistakes" items={drill.commonMistakes} /> : null}
      <div className="printFacts">
        {coachPrescription ? <PrintField label="Locked Coach dosage">{formatCoachPrescriptionV1(coachPrescription)}</PrintField> : null}
        {drill.equipment?.length ? <PrintField label="Equipment">{drill.equipment.join(', ')}</PrintField> : null}
        {drill.repetitions ? <PrintField label="Repetitions">{drill.repetitions}</PrintField> : null}
        {drill.workTime ? <PrintField label="Work time">{drill.workTime}</PrintField> : null}
        {drill.restTime ? <PrintField label="Rest time">{drill.restTime}</PrintField> : null}
      </div>
    </section>
  );
}

export function PrintSection({ title, children }: { title: string; children: ReactNode }) {
  return <div className="printSection"><h3>{title}</h3>{children}</div>;
}

export function PrintList({ title, items }: { title: string; items: string[] }) {
  return <PrintSection title={title}><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></PrintSection>;
}
