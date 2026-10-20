import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/store.js';
import { DrillCard, PrintToolbar } from './print-shared.js';
import './print.css';

/** Standalone Drill Card print view reused by Practice PDF detailed cards. */
export function DrillPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drills } = useStore();
  const drill = drills.find((item) => item.id === id);
  useEffect(() => { document.title = drill ? `${drill.name} — BPDS Drill` : 'BPDS Drill'; }, [drill]);
  if (!drill) return <div className="printPreview"><main className="printPage"><section className="printSheet"><h1>Drill not found</h1><button type="button" onClick={() => navigate('/library')}>Back to Library</button></section></main></div>;
  return <div className="printPreview"><PrintToolbar onPrint={() => window.print()} /><main className="printPage"><section className="printSheet"><header className="printHeader"><div><h1>BPDS DRILL CARD</h1><p>Practical coaching reference</p></div></header><DrillCard drill={drill} url={`${window.location.origin}/drill/${drill.id}`} /></section></main></div>;
}
