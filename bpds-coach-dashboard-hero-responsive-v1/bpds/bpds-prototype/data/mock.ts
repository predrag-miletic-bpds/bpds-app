import type { HistoryEntry, Player, Practice, Team } from './types.js';

/** Seed player profiles owned by the demo coach. */
export const PLAYERS: Player[] = [
  {
    id: 'p1', fullName: 'Luka Jovanović', dateOfBirth: '2009-03-14', ageGroup: 'U16', height: 188, weight: 76,
    position: 'Point Guard', dominantHand: 'Right', club: 'KK Partizan Youth', teamId: 't1', skillLevel: 'Advanced',
    trainingFrequency: '5 sessions per week', notes: ['Excellent hesitation, needs left hand under pressure.', 'Responds well to competitive constraints.'],
    active: true, photoColor: '#e2571f', stats: { completedPractices: 34, totalMinutes: 2760, completedDrills: 218 },
  },
  {
    id: 'p2', fullName: 'Marko Petrović', dateOfBirth: '2010-07-02', ageGroup: 'U14', height: 176, weight: 63,
    position: 'Shooting Guard', dominantHand: 'Right', club: 'KK Partizan Youth', teamId: 't1', skillLevel: 'Intermediate',
    trainingFrequency: '4 sessions per week', notes: ['Shot mechanics improving, elbow still flares on long twos.'],
    active: true, photoColor: '#2563eb', stats: { completedPractices: 22, totalMinutes: 1650, completedDrills: 141 },
  },
  {
    id: 'p3', fullName: 'Ana Kovač', dateOfBirth: '2011-11-21', ageGroup: 'U12', height: 158, weight: 48,
    position: 'Combo Guard', dominantHand: 'Left', club: 'BC Olimpija Girls', teamId: 't2', skillLevel: 'Intermediate',
    trainingFrequency: '3 sessions per week', notes: ['Natural left hand, must build right hand finishing.'],
    active: true, photoColor: '#1f9d63', stats: { completedPractices: 18, totalMinutes: 1080, completedDrills: 96 },
  },
  {
    id: 'p4', fullName: 'Stefan Ilić', dateOfBirth: '2008-01-09', ageGroup: 'U18', height: 201, weight: 92,
    position: 'Center', dominantHand: 'Right', club: 'KK Partizan Youth', teamId: 't1', skillLevel: 'Elite',
    trainingFrequency: '6 sessions per week', notes: ['Strong sealer. Add face-up game from the elbow.'],
    active: true, photoColor: '#7c3aed', stats: { completedPractices: 48, totalMinutes: 4320, completedDrills: 331 },
  },
  {
    id: 'p5', fullName: 'Nikola Ristić', dateOfBirth: '2013-05-30', ageGroup: 'U10', height: 142, weight: 36,
    position: 'Guard', dominantHand: 'Right', club: 'KK Partizan Youth', skillLevel: 'Beginner',
    trainingFrequency: '2 sessions per week', notes: ['Loves ball mastery. Keep sessions short and playful.'],
    active: true, photoColor: '#d98a06', stats: { completedPractices: 9, totalMinutes: 405, completedDrills: 52 },
  },
  {
    id: 'p6', fullName: 'Teodora Marić', dateOfBirth: '2009-09-17', ageGroup: 'U16', height: 179, weight: 68,
    position: 'Small Forward', dominantHand: 'Right', club: 'BC Olimpija Girls', teamId: 't2', skillLevel: 'Advanced',
    trainingFrequency: '5 sessions per week', notes: ['Elite cutter. Needs pull-up game off two dribbles.'],
    active: true, photoColor: '#db2777', stats: { completedPractices: 29, totalMinutes: 2320, completedDrills: 187 },
  },
];

/** Seed teams. Teams are an optional grouping of players. */
export const TEAMS: Team[] = [
  { id: 't1', name: 'Partizan U16 Blue', club: 'KK Partizan Youth', ageGroup: 'U16', skillLevel: 'Advanced', coach: 'Coach Predrag', playerIds: ['p1', 'p2', 'p4'], notes: ['Focus block: pick and roll reads through March.'] },
  { id: 't2', name: 'Olimpija U14 Girls', club: 'BC Olimpija Girls', ageGroup: 'U14', skillLevel: 'Intermediate', coach: 'Coach Predrag', playerIds: ['p3', 'p6'], notes: ['Building weak hand finishing across the roster.'] },
];

/** Seed saved practice plans. */
export const PRACTICES: Practice[] = [
  {
    id: 'pr1', name: 'U16 Advanced Shooting Practice', date: '2024-06-10', playerIds: ['p1', 'p2', 'p4'], teamId: 't1',
    ageGroup: 'U16', skillLevel: 'Advanced', duration: 90, primaryFocus: 'Shooting', secondaryFocus: 'Decision Making',
    equipment: ['Basketballs', 'Cones'], courtSize: 'Full court',
    objective: 'Develop game-speed shooting from a technical base through to contested live reads.',
    status: 'Completed', lastOpened: '2024-06-10',
    items: [
      { id: 'i1', kind: 'drill', drillId: 'wup-001', duration: 10, phase: 'Warm-Up and Movement Preparation' },
      { id: 'i2', kind: 'drill', drillId: 'sbh-l1-001', duration: 8, phase: 'Individual Skill Activation' },
      { id: 'i3', kind: 'drill', drillId: 'sh-l1-001', duration: 8, phase: 'Technical Skill Development' },
      { id: 'i4', kind: 'drill', drillId: 'sh-l2-003', duration: 12, phase: 'Technical Skill Development' },
      { id: 'i5', kind: 'drill', drillId: 'sh-l2-009', duration: 12, phase: 'Skill Application' },
      { id: 'i6', kind: 'drill', drillId: 'sh-l3-011', duration: 12, phase: 'Decision Making' },
      { id: 'i7', kind: 'drill', drillId: 'ssg-l3-002', duration: 12, phase: 'Competitive Play' },
      { id: 'i8', kind: 'break', label: 'Water Break', duration: 3, phase: 'Cool Down' },
      { id: 'i9', kind: 'drill', drillId: 'sh-ft-001', duration: 4, phase: 'Cool Down' },
    ],
  },
  {
    id: 'pr2', name: 'U12 Ball Handling Foundation', date: '2024-06-12', playerIds: ['p3', 'p5'],
    ageGroup: 'U12', skillLevel: 'Intermediate', duration: 60, primaryFocus: 'Ball Handling', secondaryFocus: 'Footwork',
    equipment: ['Basketballs', 'Cones'], courtSize: 'Half court',
    objective: 'Build stationary control before introducing movement and change of direction.',
    status: 'Scheduled', lastOpened: '2024-06-11',
    items: [
      { id: 'i1', kind: 'drill', drillId: 'wup-001', duration: 10, phase: 'Warm-Up and Movement Preparation' },
      { id: 'i2', kind: 'drill', drillId: 'bm-l1-001', duration: 5, phase: 'Individual Skill Activation' },
      { id: 'i3', kind: 'drill', drillId: 'sbh-l1-001', duration: 6, phase: 'Individual Skill Activation' },
      { id: 'i4', kind: 'drill', drillId: 'sbh-l1-002', duration: 6, phase: 'Technical Skill Development' },
      { id: 'i5', kind: 'drill', drillId: 'mbh-l1-001', duration: 8, phase: 'Technical Skill Development' },
      { id: 'i6', kind: 'drill', drillId: 'cod-l1-001', duration: 8, phase: 'Skill Application' },
      { id: 'i7', kind: 'drill', drillId: 'fw-l1-003', duration: 5, phase: 'Skill Application' },
      { id: 'i8', kind: 'drill', drillId: 'ssg-l3-005', duration: 10, phase: 'Competitive Play' },
    ],
  },
  {
    id: 'pr3', name: 'Individual Session — Luka Finishing', date: '2024-06-14', playerIds: ['p1'],
    ageGroup: 'U16', skillLevel: 'Advanced', duration: 45, primaryFocus: 'Finishing', secondaryFocus: 'Change of Direction',
    equipment: ['Basketballs', 'Cones', 'Contact pad'], courtSize: 'Half court',
    objective: 'Attack the paint from a live change of direction and finish through contact.',
    status: 'Draft', lastOpened: '2024-06-13',
    items: [
      { id: 'i1', kind: 'drill', drillId: 'wup-001', duration: 8, phase: 'Warm-Up and Movement Preparation' },
      { id: 'i2', kind: 'drill', drillId: 'cod-l1-001', duration: 5, phase: 'Individual Skill Activation' },
      { id: 'i3', kind: 'drill', drillId: 'cod-l3-016', duration: 8, phase: 'Technical Skill Development' },
      { id: 'i4', kind: 'drill', drillId: 'fin-l2-001', duration: 8, phase: 'Skill Application' },
      { id: 'i5', kind: 'drill', drillId: 'fin-l3-004', duration: 8, phase: 'Game Application' },
      { id: 'i6', kind: 'drill', drillId: 'ssg-l3-005', duration: 8, phase: 'Competitive Play' },
    ],
  },
];

/** Seed training history entries. */
export const HISTORY: HistoryEntry[] = [
  { id: 'h1', date: '2024-06-10', practiceName: 'U16 Advanced Shooting Practice', playerIds: ['p1', 'p2', 'p4'], teamId: 't1', duration: 90, focus: 'Shooting', completedDrills: 8, totalDrills: 9, notes: 'Excellent energy. Luka shot 62% contested. Stefan needs work on the short roll.' },
  { id: 'h2', date: '2024-06-07', practiceName: 'Transition and Advantage', playerIds: ['p1', 'p2', 'p4', 'p6'], teamId: 't1', duration: 75, focus: 'Transition', completedDrills: 7, totalDrills: 7, notes: 'Wide lanes much better. Pitch ahead still late.' },
  { id: 'h3', date: '2024-06-05', practiceName: 'U12 Ball Handling Foundation', playerIds: ['p3', 'p5'], duration: 60, focus: 'Ball Handling', completedDrills: 6, totalDrills: 8, notes: 'Ana weak hand improving quickly. Short session due to court time.' },
  { id: 'h4', date: '2024-06-03', practiceName: 'Individual Session — Teodora', playerIds: ['p6'], duration: 45, focus: 'Shooting', completedDrills: 5, totalDrills: 5, notes: 'Pull-up rhythm much cleaner off two dribbles.' },
];

/** The demo coach account. */
export const COACH = {
  id: 'c1',
  name: 'Predrag Miletić',
  email: 'coach@bpds.app',
  role: 'Coach' as const,
  club: 'KK Partizan Youth',
  subscription: 'Free Preview' as const,
};
