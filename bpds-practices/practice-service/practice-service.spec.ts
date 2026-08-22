import { createMemoryDriver, createRepository } from '@predrag-miletic/bpds-storage.repository';
import type { GeneratorContext, HistoryEntry, Practice } from '@predrag-miletic/bpds-practices.entities.practice';
import { createPracticeService } from './practice-service.js';

const CONTEXT: GeneratorContext = {
  trainingType: 'Team',
  playerIds: ['p1', 'p2'],
  ageGroup: 'U14',
  skillLevel: 'Intermediate',
  duration: 90,
  playerCount: 12,
  baskets: 2,
  courtSize: 'Full court',
  equipment: ['Cones', 'Balls'],
  primaryFocus: 'Ball Handling',
  secondaryFocus: 'Finishing',
  intensity: 'Medium',
  withDefense: true,
  competitive: true,
  smallSidedGame: true,
};

function service(practices: Practice[] = [], history: HistoryEntry[] = []) {
  const driver = createMemoryDriver();
  return createPracticeService({
    practices: createRepository<Practice>(driver, 'practices', practices),
    history: createRepository<HistoryEntry>(driver, 'history', history),
  });
}

it('generates a practice with an ordered timeline and saves it', () => {
  const svc = service();
  const generated = svc.generate(CONTEXT);
  expect(generated.items.length).toBeGreaterThan(0);
  expect(generated.status).toBe('Draft');
  svc.savePractice(generated);
  expect(svc.listPractices()).toHaveLength(1);
  expect(svc.durationOf(generated)).toBeGreaterThan(0);
});

it('duplicates a practice as a fresh, uncompleted draft', () => {
  const svc = service();
  const saved = svc.savePractice(svc.generate(CONTEXT));
  const copy = svc.duplicatePractice(saved.id);
  expect(copy?.id).not.toBe(saved.id);
  expect(copy?.name).toBe(`${saved.name} (Copy)`);
  expect(copy?.items.every((item) => !item.completed)).toBe(true);
  expect(svc.listPractices()).toHaveLength(2);
});

it('completes a session, marking the practice done and writing history', () => {
  const svc = service();
  const saved = svc.savePractice(svc.generate(CONTEXT));
  svc.toggleItem(saved.id, saved.items[0].id);
  const result = svc.completePractice(saved.id, 'Good energy from the guards.');
  expect(result?.practice.status).toBe('Completed');
  expect(result?.entry.completedDrills).toBe(1);
  expect(svc.listHistory()).toHaveLength(1);
  expect(svc.totals().sessions).toBe(1);
});
