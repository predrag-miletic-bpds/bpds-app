import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COURT_SIZES, EQUIPMENT_OPTIONS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { DrillVideo, useDrills } from '../data/drill-media.js';




import { AREAS, MODULES, getModule } from '@predrag-miletic/bpds-methodology.modules-catalog';
import type { AgeGroup } from '../data/types.js';
import { useStore } from '../store/store.js';
import { Badge, Button, Card, Input, Page, PageHead, Select, levelInfo } from '../ui/ui.js';
import styles from './library.module.css';

const AGE_GROUPS: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];

/** Filterable BPDS drill library. */
export function Library() {
  const navigate = useNavigate();
  const { draft, setDraft } = useStore();
  const [q, setQ] = useState('');
  const [modules, setModules] = useState<string[]>([]);
  const [levels, setLevels] = useState<number[]>([]);
  const [age, setAge] = useState('');

  const [equipment, setEquipment] = useState('');
  const [court, setCourt] = useState('');
  const [intensity, setIntensity] = useState('');
  const [defense, setDefense] = useState('');
  const drills = useDrills();
  const [grouping, setGrouping] = useState('');
  const [original, setOriginal] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);

  const results = useMemo(() => drills.filter((d) => {
    const text = `${d.code} ${d.name} ${d.tags.join(' ')} ${getModule(d.moduleCode)?.name ?? ''}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (modules.length && !modules.includes(d.moduleCode)) return false;
    if (levels.length && !levels.includes(d.level)) return false;
    if (age && !d.suitableAges.includes(age as AgeGroup)) return false;
    if (equipment && !d.equipment.includes(equipment)) return false;
    if (court && !d.courtArea.includes(court)) return false;
    if (intensity && d.intensity !== intensity) return false;
    if (defense === 'with' && !d.withDefense) return false;
    if (defense === 'without' && d.withDefense) return false;
    if (grouping && d.grouping !== grouping && d.grouping !== 'Both') return false;
    if (original && !d.bpdsOriginal) return false;
    return true;
  }), [drills, q, modules, levels, age, equipment, court, intensity, defense, grouping, original]);

  const toggleModule = (code: string) => setModules((m) => (m.includes(code) ? m.filter((x) => x !== code) : [...m, code]));
  const toggleLevel = (lv: number) => setLevels((l) => (l.includes(lv) ? l.filter((x) => x !== lv) : [...l, lv]));

  const addToPractice = (drillId: string) => {
    const d = drills.find((x) => x.id === drillId);
    if (!d) return;
    if (!draft) {
      void navigate('/builder');
      return;
    }
    setDraft({
      ...draft,
      items: [...draft.items, { id: `i-${Date.now()}`, kind: 'drill', drillId, duration: d.duration, phase: 'Technical Skill Development' }],
    });
    void navigate('/practice/draft');
  };

  return (
    <Page>
      <PageHead
        title="Drill Library"
        sub={`${drills.length} methodical drills across ${MODULES.length} BPDS modules.`}
        actions={<Button className={styles.mobileFilterBtn} onClick={() => setOpenFilters((o) => !o)}>Filters</Button>}
      />

      <div className={styles.layout}>
        <div className={`${styles.filters} ${openFilters ? styles.filtersOpen : ''}`}>
          <Card>
            <div className={styles.filterGroup}>
              <div>Skill Level</div>
              {[1, 2, 3].map((lv) => (
                <label key={lv} className={styles.checkRow}>
                  <input type="checkbox" checked={levels.includes(lv)} onChange={() => toggleLevel(lv)} />
                  {levelInfo(lv).label}
                </label>
              ))}
            </div>
            <div className={styles.filterGroup}>
              <div>Suitable Age</div>
              <Select value={age} onChange={(e) => setAge(e.target.value)}>
                <option value="">Any age</option>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </Select>
            </div>
            <div className={styles.filterGroup}>
              <div>Module</div>
              <div className={styles.moduleScroll}>
                {AREAS.map((area) => (
                  <div key={area}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#9aa3b0', margin: '8px 0 4px' }}>{area}</div>
                    {MODULES.filter((m) => m.area === area).map((m) => (
                      <label key={m.code} className={styles.checkRow}>
                        <input type="checkbox" checked={modules.includes(m.code)} onChange={() => toggleModule(m.code)} />
                        {m.name}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div>Equipment</div>
              <Select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                <option value="">Any equipment</option>
                {EQUIPMENT_OPTIONS.map((e) => <option key={e}>{e}</option>)}
              </Select>
            </div>
            <div className={styles.filterGroup}>
              <div>Court Size</div>
              <Select value={court} onChange={(e) => setCourt(e.target.value)}>
                <option value="">Any court</option>
                {COURT_SIZES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div className={styles.filterGroup}>
              <div>Intensity</div>
              <Select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                <option value="">Any</option><option>Low</option><option>Medium</option><option>High</option>
              </Select>
            </div>
            <div className={styles.filterGroup}>
              <div>Defense</div>
              <Select value={defense} onChange={(e) => setDefense(e.target.value)}>
                <option value="">Any</option>
                <option value="with">With defense</option>
                <option value="without">Without defense</option>
              </Select>
            </div>
            <div className={styles.filterGroup}>
              <div>Grouping</div>
              <Select value={grouping} onChange={(e) => setGrouping(e.target.value)}>
                <option value="">Any</option><option>Individual</option><option>Group</option>
              </Select>
            </div>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={original} onChange={() => setOriginal((o) => !o)} />
              BPDS Original only
            </label>
          </Card>
        </div>

        <div>
          <div className={styles.searchBar}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <Input placeholder="Search by drill name, code or tag…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button onClick={() => {
              setQ(''); setModules([]); setLevels([]); setAge(''); setEquipment('');
              setCourt(''); setIntensity(''); setDefense(''); setGrouping(''); setOriginal(false);
            }}
            >
              Clear
            </Button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--bpds-slate)', marginBottom: 12 }}>
            {results.length} drill{results.length === 1 ? '' : 's'}
          </div>
          <div className={styles.grid}>
            {results.map((d) => {
          const li = levelInfo(d.level);                      
              return (
                <div key={d.id} className={styles.drillCard}>
                  <div className={styles.thumb}>
                  <DrillVideo drill={d} preview className={styles.thumbVideo} />
                    <span className={styles.thumbCode}>{d.code}</span>
                    
                    <span className={styles.thumbDur}>{d.duration} min</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardName}>{d.name}</div>
                    <div className={styles.cardModule}>{getModule(d.moduleCode)?.name}</div>
                    <div className={styles.cardBadges}>
                      <Badge tone={li.tone}>{li.label}</Badge>
                      <Badge tone="gray">{d.suitableAges[0]}+</Badge>
                      {d.withDefense ? <Badge tone="amber">Defense</Badge> : null}
                      {d.bpdsOriginal ? <Badge tone="dark">BPDS</Badge> : null}
                    </div>
                    <div className={styles.cardWhy}>{d.whyThisDrill}</div>
                    <div className={styles.cardActions}>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/drill/${d.id}`)}>View Drill</Button>
                      <Button size="sm" onClick={() => addToPractice(d.id)}>Add to Practice</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Page>
  );
}
