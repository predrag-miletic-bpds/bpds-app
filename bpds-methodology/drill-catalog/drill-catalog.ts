import type { Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';
import { fitsPlayerCount, hasEquipment } from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { AgeGroup, SkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';

const ALL_AGES: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];
const FROM_U12: AgeGroup[] = ['U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];
const FROM_U14: AgeGroup[] = ['U14', 'U16', 'U18', 'Senior', 'Professional'];

type DrillSeed = Partial<Drill> & {
  code: string;
  name: string;
  moduleCode: string;
  level: SkillLevel;
  objective: string;
  whyThisDrill: string;
};

/** Fill a drill seed with sensible BPDS defaults so every record is complete. */
function makeDrill(seed: DrillSeed): Drill {
  return {
    category: seed.category ?? 'General',
    typicalIntroduction: seed.typicalIntroduction ?? 'U8–U10',
    suitableAges: seed.suitableAges ?? ALL_AGES,
    skillStatus: seed.skillStatus ?? 'Core skill',
    equipment: seed.equipment ?? ['Basketballs'],
    minPlayers: seed.minPlayers ?? 1,
    maxPlayers: seed.maxPlayers ?? 12,
    courtArea: seed.courtArea ?? ['Small indoor space', 'Half court', 'Full court', 'Outdoor court', 'Home training area'],
    setup: seed.setup ?? 'Players spread out with one basketball each in an athletic stance.',
    execution: seed.execution ?? ['Execute the movement under control.', 'Increase speed once technique is stable.'],
    coachingPoints: seed.coachingPoints ?? ['Eyes up.', 'Stay in an athletic stance.', 'Fingertip control.'],
    commonMistakes: seed.commonMistakes ?? ['Standing too upright.', 'Looking at the ball.'],
    corrections: seed.corrections ?? ['Slow the movement down.', 'Use a visual target to keep the eyes up.'],
    regression: seed.regression ?? ['Perform stationary.', 'Reduce the speed.'],
    progression: seed.progression ?? ['Increase speed.', 'Add a reaction signal.', 'Add a defender.'],
    performanceOptions: seed.performanceOptions ?? ['Add a time limit.', 'Compete against a partner.'],
    variations: seed.variations ?? ['Weak hand only.', 'Two-ball version.'],
    reads: seed.reads ?? ['React to the coach signal.'],
    gameApplication: seed.gameApplication ?? 'Transfers directly to live ball handling and attacking situations.',
    repetitions: seed.repetitions ?? '3–4 sets each side',
    workTime: seed.workTime ?? '30 seconds',
    restTime: seed.restTime ?? '20 seconds',
    duration: seed.duration ?? 6,
    intensity: seed.intensity ?? 'Medium',
    withDefense: seed.withDefense ?? false,
    grouping: seed.grouping ?? 'Individual',
    videoUrl: seed.videoUrl ?? 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: seed.thumbnail ?? '',
    tags: seed.tags ?? [],
    relatedDrills: seed.relatedDrills ?? [],
    prerequisiteDrills: seed.prerequisiteDrills ?? [],
    followUpDrills: seed.followUpDrills ?? [],
    bpdsOriginal: seed.bpdsOriginal ?? true,
    published: seed.published ?? true,
    ...seed,
    id: seed.code.toLowerCase(),
  } as Drill;
}

/**
 * The BPDS drill database.
 *
 * Every record is a complete BPDS drill — objective, methodological
 * justification, coaching points, mistakes, corrections, regressions,
 * progressions and game application — so the catalog can answer both
 * "which drill fits here" and "why this drill".
 */
export const DRILLS: Drill[] = [
  makeDrill({
    code: 'WUP-001',
    name: 'Dynamic Warm-Up',
    moduleCode: 'WUP',
    category: 'Movement Preparation',
    level: 1,
    duration: 10,
    intensity: 'Low',
    grouping: 'Both',
    maxPlayers: 20,
    equipment: ['Cones', 'No additional equipment'],
    objective: 'Prepare the body for basketball movement through mobility, activation and running mechanics.',
    whyThisDrill: 'Every quality practice begins with a body that is ready to move. This sequence raises core temperature, opens the hips and ankles and activates the posterior chain so players can decelerate and change direction safely from the first minute of practice.',
    setup: 'Players line up on the baseline in waves of four. Cones mark the far end of the working area.',
    execution: ['High knees to the free throw line, jog back.', 'Butt kicks, walking lunge with rotation, inchworm.', 'Lateral shuffle both directions with low hips.', 'Carioca both directions.', 'Two build-up sprints at 70% and 90%.'],
    coachingPoints: ['Tall posture with relaxed shoulders.', 'Land softly through the mid-foot.', 'Full range of motion before speed.'],
    commonMistakes: ['Rushing through the mobility work.', 'Heavy noisy landings.'],
    corrections: ['Slow the tempo and hold each position for two counts.', 'Cue "quiet feet" on every landing.'],
    regression: ['Shorten the working distance.', 'Remove the sprint build-ups.'],
    progression: ['Add reaction starts on a coach signal.', 'Add a basketball to the movement patterns.'],
    tags: ['warm-up', 'activation', 'mobility'],
    followUpDrills: ['bm-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'BM-L1-001',
    name: 'Around the Head',
    moduleCode: 'BM',
    category: 'Ball Mastery',
    level: 1,
    duration: 4,
    intensity: 'Low',
    objective: 'Develop hand speed and ball familiarity by circling the basketball around the head under control.',
    whyThisDrill: 'Before a player can dribble under pressure they must be comfortable holding, moving and catching the ball with soft hands. Circling drills build the fingertip feel and hand speed that every later ball handling skill depends on.',
    execution: ['Stand in an athletic stance with the ball at chest height.', 'Circle the ball around the head clockwise for the work time.', 'Reverse direction on the coach call.'],
    coachingPoints: ['Fingertips only, never the palms.', 'Eyes up and away from the ball.', 'Increase speed without losing control.'],
    commonMistakes: ['Palming the ball.', 'Dropping the chin to watch the ball.'],
    tags: ['ball mastery', 'foundation', 'warm-up'],
    followUpDrills: ['bm-l1-012'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'BM-L1-012',
    name: 'Ball Roll Across Hands',
    moduleCode: 'BM',
    category: 'Ball Mastery',
    level: 1,
    duration: 4,
    intensity: 'Low',
    objective: 'Improve touch and hand-to-hand transfer by rolling the ball across the fingertips.',
    whyThisDrill: 'Soft hands catch difficult passes and secure loose balls. Rolling the ball across the hands trains the fine motor control that turns bobbled catches into clean possessions.',
    execution: ['Extend both arms in front at chest height.', 'Roll the ball from one hand to the other across the fingertips.', 'Progress to rolling behind the back.'],
    coachingPoints: ['Relaxed hands and wrists.', 'Keep the elbows soft.', 'Eyes up.'],
    tags: ['ball mastery', 'coordination'],
    prerequisiteDrills: ['bm-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'SBH-L1-001',
    name: 'Low Pound RH',
    moduleCode: 'SBH',
    category: 'Stationary Ball Handling',
    level: 1,
    duration: 4,
    objective: 'Build strong, low, controlled dribbling with the right hand from a stationary athletic stance.',
    whyThisDrill: 'A low hard dribble is the foundation of ball security. Players who can pound the ball below the knee with force protect it from digs and can attack without losing control.',
    execution: ['Athletic stance with feet outside shoulder width.', 'Pound the ball hard below knee height with the right hand.', 'Maintain the rhythm for the full work time.'],
    coachingPoints: ['Push through the ball, do not slap it.', 'Wide base and low hips.', 'Off-hand up in a protective position.'],
    commonMistakes: ['Dribble rises above the knee.', 'Narrow stance with high hips.'],
    tags: ['ball handling', 'foundation', 'right hand'],
    prerequisiteDrills: ['bm-l1-001'],
    followUpDrills: ['sbh-l1-002', 'mbh-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'SBH-L1-002',
    name: 'Low Pound LH',
    moduleCode: 'SBH',
    category: 'Stationary Ball Handling',
    level: 1,
    duration: 4,
    objective: 'Build strong, low, controlled dribbling with the weak hand from a stationary athletic stance.',
    whyThisDrill: 'Weak hand strength is the single biggest limiter for young guards. Isolating the left hand at low height forces the player to build the same power and confidence they already have on their dominant side.',
    execution: ['Athletic stance with feet outside shoulder width.', 'Pound the ball hard below knee height with the left hand.', 'Maintain the rhythm for the full work time.'],
    coachingPoints: ['Same force as the strong hand.', 'Shoulder over the working hand.', 'Eyes up.'],
    tags: ['ball handling', 'weak hand', 'foundation'],
    prerequisiteDrills: ['sbh-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'SBH-L2-004',
    name: 'Two-Ball Alternating Pound',
    moduleCode: 'SBH',
    category: 'Stationary Ball Handling',
    level: 2,
    duration: 5,
    intensity: 'Medium',
    equipment: ['Basketballs'],
    objective: 'Develop independent hand control and rhythm using two basketballs alternating at knee height.',
    whyThisDrill: 'Two-ball work removes the dominant hand crutch. Each hand must generate its own force and rhythm, which directly improves control when a defender takes away the strong side.',
    execution: ['One ball in each hand in an athletic stance.', 'Alternate the pound dribbles in a steady rhythm.', 'Switch to simultaneous dribbles on the coach call.'],
    coachingPoints: ['Equal force in both hands.', 'Keep both dribbles below the knee.', 'Eyes up on a target.'],
    tags: ['ball handling', 'two ball', 'development'],
    prerequisiteDrills: ['sbh-l1-002'],
    typicalIntroduction: 'U10–U12',
    suitableAges: ['U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'],
  }),
  makeDrill({
    code: 'MBH-L1-001',
    name: 'Speed Dribble Forward RH',
    moduleCode: 'MBH',
    category: 'Moving Ball Handling',
    level: 1,
    duration: 6,
    intensity: 'Medium',
    courtArea: ['Half court', 'Full court', 'Outdoor court'],
    objective: 'Push the ball ahead at speed with the right hand while maintaining control and vision.',
    whyThisDrill: 'Transition points are won by players who can advance the ball at full speed without slowing down to dribble. This drill connects sprinting mechanics to ball control.',
    execution: ['Start on the baseline with the ball.', 'Push the ball out in front and sprint to the opposite baseline.', 'Take as few dribbles as possible while staying in control.'],
    coachingPoints: ['Push the ball ahead of the body, not beside it.', 'Run tall at full sprint speed.', 'Eyes up the floor.'],
    commonMistakes: ['Dribbling too high beside the hip.', 'Slowing the sprint to control the ball.'],
    tags: ['ball handling', 'transition', 'speed'],
    prerequisiteDrills: ['sbh-l1-001'],
    followUpDrills: ['cod-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'MBH-L2-006',
    name: 'Stop and Go Dribble',
    moduleCode: 'MBH',
    category: 'Moving Ball Handling',
    level: 2,
    duration: 6,
    intensity: 'Medium',
    equipment: ['Basketballs', 'Cones'],
    courtArea: ['Half court', 'Full court', 'Outdoor court'],
    objective: 'Control acceleration and deceleration while dribbling in a straight line.',
    whyThisDrill: 'Change of pace beats defenders more often than change of direction. Learning to fully stop and re-accelerate on balance gives the player a weapon that requires no advanced handle.',
    execution: ['Speed dribble to the first cone.', 'Come to a controlled stop with the ball low and protected.', 'Explode past the cone with two hard dribbles.'],
    coachingPoints: ['Sink the hips to stop, do not stand up.', 'Ball goes lower as the body stops.', 'First step after the stop is long and low.'],
    tags: ['ball handling', 'change of pace'],
    prerequisiteDrills: ['mbh-l1-001'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'COD-L1-001',
    name: 'Stationary Crossover',
    moduleCode: 'COD',
    category: 'Change of Direction',
    level: 1,
    duration: 5,
    objective: 'Learn the low, tight crossover dribble technique from a stationary balanced position.',
    whyThisDrill: 'The crossover is the most used change of direction move in basketball. Building it stationary first ensures the ball travels low and tight before speed and defenders are introduced.',
    execution: ['Athletic stance, ball in the right hand.', 'Push the ball across the body below knee height.', 'Receive it with a wide left hand and repeat.'],
    coachingPoints: ['Ball crosses below the knees.', 'Shoulders stay low and level.', 'Fingertips push the ball across.'],
    commonMistakes: ['Crossover too high and slow.', 'Standing up during the switch.'],
    tags: ['crossover', 'change of direction', 'foundation'],
    prerequisiteDrills: ['mbh-l1-001'],
    followUpDrills: ['cod-l2-017', 'cod-l3-016'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'COD-L2-017',
    name: 'Hesitation to Crossover',
    moduleCode: 'COD',
    category: 'Change of Direction',
    level: 2,
    duration: 6,
    intensity: 'Medium',
    equipment: ['Basketballs', 'Cones'],
    courtArea: ['Half court', 'Full court', 'Outdoor court'],
    objective: 'Combine a change of pace hesitation with a crossover against a cone reference point.',
    whyThisDrill: 'Isolated moves rarely beat defenders. Pairing a hesitation with a crossover teaches the player to attack the defender\'s reaction rather than simply performing a move.',
    execution: ['Attack the cone with a speed dribble.', 'Hesitate at the cone by rising slightly and slowing.', 'Cross over low and accelerate past the cone.'],
    coachingPoints: ['Sell the hesitation with the eyes.', 'Crossover stays low.', 'Explode after the move.'],
    tags: ['crossover', 'hesitation', 'combination'],
    prerequisiteDrills: ['cod-l1-001'],
    followUpDrills: ['cod-l3-016'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
  }),
  makeDrill({
    code: 'COD-L3-016',
    name: 'Hesitation to Crossover',
    moduleCode: 'COD',
    category: 'Change of Direction',
    level: 3,
    duration: 8,
    intensity: 'High',
    withDefense: true,
    grouping: 'Both',
    minPlayers: 1,
    maxPlayers: 12,
    equipment: ['Basketballs', 'Cones', 'No additional equipment'],
    courtArea: ['Half court', 'Full court', 'Outdoor court'],
    objective: 'Develop the ability to freeze the defender with a hesitation dribble before changing direction explosively with a crossover.',
    whyThisDrill: 'This drill teaches players how to use a change of pace to make the defender react before attacking the open space. It converts an isolated dribble move into a live decision made against a real defender reaction.',
    setup: 'Player starts at the wing with a basketball. Optional cone or live defender positioned at the elbow. Basket available for a finish.',
    execution: ['Start in an athletic basketball stance.', 'Dribble forward under control.', 'Perform a hesitation by slowing down and slightly raising the shoulders.', 'Keep the eyes up.', 'Plant the outside foot.', 'Execute a low and quick crossover.', 'Accelerate in the opposite direction.'],
    coachingPoints: ['Stay balanced.', 'Sell the hesitation with the eyes and shoulders.', 'Keep the crossover low and tight.', 'Push the basketball across with the fingertips.', 'Keep the eyes up.', 'Explode after the crossover.'],
    commonMistakes: ['Weak or unconvincing hesitation.', 'Standing too upright.', 'High crossover.', 'Looking at the basketball.', 'No acceleration after the move.'],
    corrections: ['Slow down the first phase.', 'Emphasize shoulder and eye deception.', 'Use a lower crossover.', 'Add a target in front of the player to keep the eyes up.', 'Require an explosive first step after the crossover.'],
    regression: ['Perform stationary.', 'Walk through the move.', 'Remove defensive pressure.', 'Use a cone as a reference point.'],
    progression: ['Add a passive defender.', 'Add a live defender.', 'Add a reaction signal.', 'Finish with a layup.', 'Finish with a floater.', 'Finish with a pull-up shot.', 'Add a time limit.'],
    performanceOptions: ['Score only if the defender is beaten on the first move.', 'Five second shot clock.'],
    variations: ['Weak hand start.', 'Hesitation into between the legs.', 'Hesitation into a retreat dribble.'],
    reads: ['If the defender rises out of the stance, attack straight.', 'If the defender jumps to the ball, cross back.', 'If the defender sits, attack with the pull-up.'],
    gameApplication: 'Used on every closeout attack, ball screen rejection and isolation attack in a live game.',
    repetitions: '6–10 repetitions each side',
    workTime: '20–30 seconds',
    restTime: '20–30 seconds',
    tags: ['crossover', 'hesitation', 'performance', 'decision making', 'game speed'],
    relatedDrills: ['cod-l1-001', 'com-l1-001'],
    prerequisiteDrills: ['cod-l2-017'],
    followUpDrills: ['ssg-l3-002'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
    skillStatus: 'Advanced application',
  }),
  makeDrill({
    code: 'COM-L1-001',
    name: 'Crossover to Between the Legs',
    moduleCode: 'COM',
    category: 'Combination Moves',
    level: 1,
    duration: 6,
    intensity: 'Medium',
    equipment: ['Basketballs', 'Cones'],
    objective: 'Chain a crossover directly into a between the legs dribble without losing rhythm.',
    whyThisDrill: 'Defenders recover from single moves. Combining two moves in sequence teaches the player to keep attacking after the first move is contained, which is how advantages are actually created.',
    execution: ['Attack the cone with control.', 'Cross over from right to left.', 'Immediately go between the legs back to the right.', 'Accelerate out of the second move.'],
    coachingPoints: ['No pause between the two moves.', 'Both dribbles stay below the knee.', 'Eyes up throughout.'],
    tags: ['combination', 'crossover', 'between the legs'],
    prerequisiteDrills: ['cod-l1-001'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
  }),
  makeDrill({
    code: 'FW-L1-003',
    name: 'Jump Stop',
    moduleCode: 'FW',
    category: 'Footwork',
    level: 1,
    duration: 5,
    objective: 'Land in a balanced two-foot jump stop from a dribble or a catch.',
    whyThisDrill: 'A balanced stop is the entry point to every pivot, shot and pass. Players who cannot stop under control travel, lose balance and rush decisions in traffic.',
    execution: ['Speed dribble toward the elbow.', 'Jump stop with both feet landing simultaneously.', 'Hold the balanced position for two seconds.'],
    coachingPoints: ['Both feet land at the same time.', 'Hips sink on landing.', 'Chest up and ball in the chin-to-chest pocket.'],
    commonMistakes: ['One-two landing instead of a jump stop.', 'Straight legs on landing.'],
    tags: ['footwork', 'balance', 'foundation'],
    followUpDrills: ['tt-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'FIN-L1-001',
    name: 'Right-Hand Layup',
    moduleCode: 'FIN',
    category: 'Finishing',
    level: 1,
    duration: 8,
    intensity: 'Medium',
    grouping: 'Both',
    maxPlayers: 16,
    courtArea: ['Half court', 'Full court', 'Outdoor court'],
    objective: 'Finish a right-hand layup with correct footwork, inside hand and soft touch off the backboard.',
    whyThisDrill: 'The layup is the highest percentage shot in basketball. Correct rhythm footwork and backboard use built early prevents the rushed, off-balance finishes that cost young players easy points.',
    setup: 'Line at the right wing, coach or partner rebounding under the basket.',
    execution: ['Attack the rim on the right side.', 'Right foot then left foot rhythm, jump off the left.', 'Raise the right knee and finish high off the square.'],
    coachingPoints: ['Jump up, not forward.', 'Inside knee drives up.', 'Soft touch high off the glass.'],
    commonMistakes: ['Wrong take-off foot.', 'Throwing the ball hard at the backboard.'],
    tags: ['finishing', 'layup', 'foundation'],
    prerequisiteDrills: ['fw-l1-003'],
    followUpDrills: ['fin-l2-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'FIN-L2-001',
    name: 'Euro Step',
    moduleCode: 'FIN',
    category: 'Finishing',
    level: 2,
    duration: 8,
    intensity: 'Medium',
    grouping: 'Both',
    equipment: ['Basketballs', 'Cones', 'Contact pad'],
    courtArea: ['Half court', 'Full court'],
    objective: 'Avoid the help defender with a two-direction Euro step finish.',
    whyThisDrill: 'Once players attack the paint they meet help. The Euro step gives them a legal, balanced way to change the finishing angle instead of driving into a charge or a block.',
    execution: ['Attack the middle from the wing.', 'Pick the ball up on the first step to one side.', 'Second step crosses to the opposite side.', 'Finish with the outside hand.'],
    coachingPoints: ['Long first step, longer second step.', 'Ball is protected far from the defender.', 'Stay low through both steps.'],
    tags: ['finishing', 'euro step', 'development'],
    prerequisiteDrills: ['fin-l1-001'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
  }),
  makeDrill({
    code: 'FIN-L3-004',
    name: 'Contested Finish with Contact Pad',
    moduleCode: 'FIN',
    category: 'Finishing',
    level: 3,
    duration: 8,
    intensity: 'High',
    withDefense: true,
    grouping: 'Group',
    minPlayers: 2,
    equipment: ['Basketballs', 'Contact pad'],
    courtArea: ['Half court', 'Full court'],
    objective: 'Finish through body contact while maintaining balance and touch.',
    whyThisDrill: 'Game finishes happen against a body. Adding controlled contact makes the player absorb the hit, stay vertical and keep the same soft touch they use in unopposed reps.',
    execution: ['Attack the rim from the wing.', 'Partner delivers legal contact with the pad at the take-off.', 'Absorb the contact and finish high.'],
    coachingPoints: ['Chin the ball through contact.', 'Jump vertically, not away.', 'Finish above the contact.'],
    tags: ['finishing', 'contact', 'performance', 'game speed'],
    prerequisiteDrills: ['fin-l2-001'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
  }),
  makeDrill({
    code: 'PAS-L1-001',
    name: 'Chest Pass',
    moduleCode: 'PAS',
    category: 'Passing',
    level: 1,
    duration: 5,
    grouping: 'Group',
    minPlayers: 2,
    maxPlayers: 20,
    objective: 'Deliver an accurate two-hand chest pass with correct step and follow through.',
    whyThisDrill: 'Every offensive concept depends on a pass that arrives on time and on target. Building a firm accurate chest pass early removes the turnovers that stop good offense before it starts.',
    execution: ['Partners face each other four metres apart.', 'Step toward the target and push the ball from the chest.', 'Follow through with the thumbs down.'],
    coachingPoints: ['Step into the pass.', 'Thumbs finish down, fingers out.', 'Target the receiver\'s chest.'],
    tags: ['passing', 'foundation'],
    followUpDrills: ['pas-l1-002'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'PAS-L1-002',
    name: 'Bounce Pass',
    moduleCode: 'PAS',
    category: 'Passing',
    level: 1,
    duration: 5,
    grouping: 'Group',
    minPlayers: 2,
    maxPlayers: 20,
    objective: 'Deliver a bounce pass that lands two thirds of the way to the receiver.',
    whyThisDrill: 'The bounce pass is the safest way to feed the post and hit a cutter under a defender\'s hands. Learning the correct landing point makes it catchable at speed.',
    execution: ['Partners face each other five metres apart.', 'Bounce the ball two thirds of the distance to the partner.', 'Receiver catches at hip height.'],
    coachingPoints: ['Step into the pass.', 'Land the ball two thirds of the way.', 'Pass with purpose, not softly.'],
    tags: ['passing', 'foundation'],
    prerequisiteDrills: ['pas-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'PAS-L2-007',
    name: 'Pass on the Move',
    moduleCode: 'PAS',
    category: 'Passing',
    level: 2,
    duration: 6,
    intensity: 'Medium',
    grouping: 'Group',
    minPlayers: 3,
    courtArea: ['Half court', 'Full court'],
    objective: 'Deliver accurate passes while running at game speed.',
    whyThisDrill: 'Static passing does not transfer to transition. Passing while sprinting teaches players to lead the receiver and keep the break alive without slowing the ball down.',
    execution: ['Three lines run the floor in a wide lane.', 'Pass ahead to the leading runner without stopping.', 'Finish the break with a layup.'],
    coachingPoints: ['Lead the runner into space.', 'Do not slow down to pass.', 'Eyes up the whole floor.'],
    tags: ['passing', 'transition', 'development'],
    prerequisiteDrills: ['pas-l1-002'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'SH-L1-001',
    name: 'Form Shooting — 1 Hand',
    moduleCode: 'SH',
    category: 'Shooting',
    level: 1,
    duration: 8,
    intensity: 'Low',
    courtArea: ['Small indoor space', 'Half court', 'Full court', 'Outdoor court', 'Home training area'],
    objective: 'Groove correct shooting mechanics using one hand close to the basket.',
    whyThisDrill: 'Shooting form is built at low volume and close range. Removing the guide hand isolates the wrist, elbow and release so the player builds a repeatable stroke before adding distance.',
    execution: ['Stand one metre from the rim.', 'Shoot with the shooting hand only, guide hand behind the back.', 'Ten makes before stepping back.'],
    coachingPoints: ['Elbow under the ball.', 'Wrist snaps with fingers to the rim.', 'Hold the follow through until the ball lands.'],
    commonMistakes: ['Ball resting on the palm.', 'Elbow flaring out.'],
    tags: ['shooting', 'form', 'foundation'],
    followUpDrills: ['sh-l2-003', 'sh-l2-009'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'SH-L2-003',
    name: 'Catch and Shoot off the Pass',
    moduleCode: 'SH',
    category: 'Shooting',
    level: 2,
    duration: 12,
    intensity: 'Medium',
    grouping: 'Group',
    minPlayers: 2,
    maxPlayers: 12,
    courtArea: ['Half court', 'Full court'],
    objective: 'Shoot on balance from a catch with feet and hands ready before the ball arrives.',
    whyThisDrill: 'Most game shots come off a pass. Training the footwork and hand target before the catch removes the wasted movement that turns an open shot into a contested one.',
    execution: ['Passer at the top, shooter relocating to a spot.', 'Shooter shows hands and sets the feet before the catch.', 'Catch, shoot and follow through. Five spots.'],
    coachingPoints: ['Feet ready before the ball arrives.', 'Hands as a target.', 'Same release every time.'],
    tags: ['shooting', 'catch and shoot', 'development'],
    prerequisiteDrills: ['sh-l1-001'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'SH-L2-009',
    name: 'One-Dribble Pull-Up',
    moduleCode: 'SH',
    category: 'Shooting',
    level: 2,
    duration: 12,
    intensity: 'Medium',
    courtArea: ['Half court', 'Full court'],
    objective: 'Create a shot from one hard dribble into a balanced pull-up jumper.',
    whyThisDrill: 'When the closeout takes away the catch and shoot, the one dribble pull-up is the immediate counter. It teaches players to attack the closeout and stop on balance rather than driving into help.',
    execution: ['Catch at the wing in Triple Threat.', 'One hard dribble to the middle.', 'Two foot stop and rise into the jumper.'],
    coachingPoints: ['Long low first dribble.', 'Stop on balance before rising.', 'Same release as the catch and shoot.'],
    commonMistakes: ['Drifting sideways on the shot.', 'Rushing the gather.'],
    tags: ['shooting', 'pull-up', 'development'],
    prerequisiteDrills: ['sh-l2-003'],
    followUpDrills: ['sh-l3-011'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
  }),
  makeDrill({
    code: 'SH-L3-011',
    name: 'Contested Game-Speed Shooting',
    moduleCode: 'SH',
    category: 'Shooting',
    level: 3,
    duration: 12,
    intensity: 'High',
    withDefense: true,
    grouping: 'Group',
    minPlayers: 3,
    courtArea: ['Half court', 'Full court'],
    objective: 'Shoot at game speed against a live closeout and contest.',
    whyThisDrill: 'Percentages drop when a hand appears. Shooting against a real closeout trains the player to keep the mechanics and the arc identical whether the shot is open or contested.',
    execution: ['Shooter relocates, passer delivers, defender closes out live.', 'Shooter reads the closeout: shoot, drive or pull-up.', 'Play out the possession.'],
    coachingPoints: ['Do not change the shot because of the contest.', 'Read the closeout before deciding.', 'Balanced landing.'],
    tags: ['shooting', 'contested', 'performance', 'decision making', 'game speed'],
    prerequisiteDrills: ['sh-l2-009'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
  }),
  makeDrill({
    code: 'SH-FT-001',
    name: 'Pressure Free Throws',
    moduleCode: 'SH',
    category: 'Shooting',
    level: 2,
    duration: 4,
    intensity: 'Low',
    grouping: 'Both',
    objective: 'Complete a consistent free throw routine under fatigue.',
    whyThisDrill: 'Free throws are taken tired and under pressure. Shooting them at the end of practice with a consequence trains the routine that holds up in the last minute of a game.',
    execution: ['Shoot two free throws per player.', 'Same routine on every attempt.', 'Team consequence if the group target is missed.'],
    coachingPoints: ['Identical routine every rep.', 'Breathe before the shot.', 'Hold the follow through.'],
    tags: ['shooting', 'free throws', 'cool down'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'TT-L1-001',
    name: 'Triple Threat Stance',
    moduleCode: 'TT',
    category: 'Triple Threat',
    level: 1,
    duration: 5,
    objective: 'Establish a balanced Triple Threat position that allows a shot, drive or pass.',
    whyThisDrill: 'A player who catches without a Triple Threat position has already given up two of their three options. This position is the starting point of every half court attack.',
    execution: ['Catch with a jump stop.', 'Ball in the shooting pocket near the hip.', 'Knees bent, eyes up, ready to shoot, drive or pass.'],
    coachingPoints: ['Ball off the hip, not on the chest.', 'Feet shoulder width and staggered.', 'See the rim immediately.'],
    tags: ['triple threat', 'foundation'],
    prerequisiteDrills: ['fw-l1-003'],
    followUpDrills: ['att-l1-001'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'ATT-L1-001',
    name: 'Jab Step to Drive',
    moduleCode: 'ATT',
    category: 'Attacking from Triple Threat',
    level: 1,
    duration: 6,
    intensity: 'Medium',
    grouping: 'Both',
    courtArea: ['Half court', 'Full court'],
    objective: 'Use a jab step to move the defender and attack the open side.',
    whyThisDrill: 'The jab step is the simplest way to create an advantage from a standstill. It teaches players to move the defender before moving themselves rather than driving into a set defence.',
    execution: ['Catch in Triple Threat at the wing.', 'Short hard jab step to the baseline side.', 'Read the defender and drive to the open side.'],
    coachingPoints: ['Jab is short and low, not a lunge.', 'Ball stays protected during the jab.', 'Long first step past the defender.'],
    tags: ['triple threat', 'attacking', 'decision making'],
    prerequisiteDrills: ['tt-l1-001'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'DFW-L1-001',
    name: 'Defensive Stance',
    moduleCode: 'DFW',
    category: 'Defensive Footwork',
    level: 1,
    duration: 5,
    intensity: 'Medium',
    grouping: 'Both',
    maxPlayers: 20,
    equipment: ['No additional equipment'],
    objective: 'Hold a correct defensive stance and slide without crossing the feet.',
    whyThisDrill: 'Defensive position is a physical skill before it is a tactical one. Players who cannot hold a low wide stance cannot contain the ball no matter how hard they try.',
    execution: ['Feet wider than the shoulders, hips low.', 'Slide on coach direction without crossing the feet.', 'Hold the stance for the work time.'],
    coachingPoints: ['Chest up, back flat.', 'Push off the trail foot.', 'Hands active and outside the frame.'],
    commonMistakes: ['Feet clicking together.', 'Standing up during the slide.'],
    tags: ['defense', 'footwork', 'foundation'],
    followUpDrills: ['obd-l2-002'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'OBD-L2-002',
    name: 'Closeout and Contain',
    moduleCode: 'OBD',
    category: 'On-Ball Defense',
    level: 2,
    duration: 8,
    intensity: 'High',
    withDefense: true,
    grouping: 'Group',
    minPlayers: 2,
    courtArea: ['Half court', 'Full court'],
    objective: 'Close out under control and contain the first dribble.',
    whyThisDrill: 'Most defensive breakdowns start with a bad closeout. Sprinting then chopping the feet with high hands takes away the shot without giving up the drive.',
    execution: ['Defender starts in help at the paint.', 'Coach passes to the wing, defender sprints and chops the feet.', 'Contain the offensive player for one drive.'],
    coachingPoints: ['Sprint then break down.', 'High hand on the shooter.', 'Force to the sideline.'],
    tags: ['defense', 'closeout', 'development'],
    prerequisiteDrills: ['dfw-l1-001'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'REB-L1-003',
    name: 'High Point Rebound',
    moduleCode: 'REB',
    category: 'Rebounding',
    level: 1,
    duration: 6,
    intensity: 'Medium',
    grouping: 'Both',
    courtArea: ['Half court', 'Full court'],
    objective: 'Catch the rebound at the highest point with two hands and land in balance.',
    whyThisDrill: 'Rebounds are lost by players who wait for the ball to come down. Attacking the ball at its highest point wins possessions and prevents tie-ups after the catch.',
    execution: ['Coach shoots the ball off the rim.', 'Player jumps and catches at the highest point.', 'Chin the ball on landing and pivot away from pressure.'],
    coachingPoints: ['Two hands on the catch.', 'Chin the ball immediately.', 'Land wide and strong.'],
    tags: ['rebounding', 'foundation'],
    prerequisiteDrills: ['fw-l1-003'],
    typicalIntroduction: 'U8–U10',
  }),
  makeDrill({
    code: 'OCS-L2-001',
    name: '4-on-0 Spacing and Ball Reversal',
    moduleCode: 'OCS',
    category: 'Offensive Concepts',
    level: 2,
    duration: 10,
    intensity: 'Medium',
    grouping: 'Group',
    minPlayers: 4,
    maxPlayers: 10,
    courtArea: ['Half court', 'Full court'],
    objective: 'Maintain correct spacing while reversing the ball and filling behind cuts.',
    whyThisDrill: 'Good spacing creates driving lanes without any set play. Reversing the ball with correct fills teaches players to move the defence before attacking it.',
    execution: ['Four players in the spots around the perimeter.', 'Reverse the ball with cut and fill on every pass.', 'Add a paint touch requirement.'],
    coachingPoints: ['Four to five metres between players.', 'Cut hard and fill immediately.', 'Ball does not stick.'],
    tags: ['spacing', 'team offense', 'development'],
    prerequisiteDrills: ['pas-l2-007'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'PNR-L2-005',
    name: 'Ball Screen — Turn the Corner',
    moduleCode: 'PNR',
    category: 'Pick and Roll',
    level: 2,
    duration: 10,
    intensity: 'Medium',
    grouping: 'Group',
    minPlayers: 2,
    courtArea: ['Half court'],
    objective: 'Use a ball screen with correct angle and pace to turn the corner into the paint.',
    whyThisDrill: 'The pick and roll is the most used action in modern basketball. Setting up the defender and using the screen shoulder to shoulder is what creates the advantage the rest of the action depends on.',
    execution: ['Screener sets a solid angled screen at the wing.', 'Handler sets the defender up before using it.', 'Handler turns the corner and attacks the paint.'],
    coachingPoints: ['Set the defender up first.', 'Shoulder to shoulder off the screen.', 'Two hard dribbles into the paint.'],
    tags: ['pick and roll', 'team offense', 'development'],
    prerequisiteDrills: ['ocs-l2-001'],
    typicalIntroduction: 'U13+',
    suitableAges: FROM_U14,
  }),
  makeDrill({
    code: 'ADV-L3-001',
    name: '3-on-2 Advantage Break',
    moduleCode: 'ADV',
    category: 'Advantage Basketball',
    level: 3,
    duration: 10,
    intensity: 'High',
    withDefense: true,
    grouping: 'Group',
    minPlayers: 5,
    maxPlayers: 15,
    courtArea: ['Half court', 'Full court'],
    objective: 'Make the correct decision in a three on two numerical advantage.',
    whyThisDrill: 'Advantage situations happen in every game and are frequently wasted. Repeating 3-on-2 reads trains players to attack the front defender and make the extra pass instead of forcing a contested shot.',
    execution: ['Three attackers against two defenders in transition.', 'Attack the front defender with the ball.', 'Make the pass the defence gives you.'],
    coachingPoints: ['Attack the top defender, do not drift.', 'Wide lanes.', 'One pass ahead of the defence.'],
    reads: ['If the top defender steps up, pass to the wing.', 'If the bottom defender steps out, pass to the opposite wing.'],
    tags: ['advantage', 'decision making', 'transition', 'game speed'],
    prerequisiteDrills: ['pas-l2-007'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'TOF-L2-002',
    name: 'Lane Running and Pitch Ahead',
    moduleCode: 'TOF',
    category: 'Transition Offense',
    level: 2,
    duration: 8,
    intensity: 'High',
    grouping: 'Group',
    minPlayers: 3,
    courtArea: ['Full court'],
    objective: 'Run wide lanes and advance the ball with a pitch-ahead pass.',
    whyThisDrill: 'Early offense scores before the defence is set. Running wide and passing ahead of the dribble is the fastest way to move the ball from defence to attack.',
    execution: ['Rebound and outlet.', 'Wings sprint the wide lanes to the corners.', 'Pitch ahead and attack the rim in under four seconds.'],
    coachingPoints: ['Sprint the lane, do not jog.', 'Pass beats the dribble.', 'Rim run through the paint.'],
    tags: ['transition', 'team offense'],
    prerequisiteDrills: ['pas-l2-007'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'SSG-L3-002',
    name: '3-on-3 Paint Touch Game',
    moduleCode: 'SSG',
    category: 'Small-Sided Games',
    level: 3,
    duration: 12,
    intensity: 'High',
    withDefense: true,
    grouping: 'Group',
    minPlayers: 6,
    maxPlayers: 18,
    courtArea: ['Half court', 'Full court'],
    objective: 'Compete 3-on-3 with a rule that a paint touch is required before a shot.',
    whyThisDrill: 'Constraints teach concepts faster than instruction. Requiring a paint touch forces players to drive, collapse the defence and find the open teammate rather than settling for the first available shot.',
    execution: ['Two teams of three play half court.', 'A paint touch by drive or pass is required before any shot.', 'First to five baskets, winner stays.'],
    coachingPoints: ['Attack gaps, do not swing the ball around the perimeter.', 'Space to four metres.', 'Talk on defence.'],
    reads: ['If two defenders help, pass out to the open shooter.', 'If the help is late, finish at the rim.'],
    tags: ['small sided game', 'competition', 'decision making', 'game speed'],
    prerequisiteDrills: ['adv-l3-001'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
  makeDrill({
    code: 'SSG-L3-005',
    name: '1-on-1 Closeout Attack',
    moduleCode: 'SSG',
    category: 'Small-Sided Games',
    level: 3,
    duration: 10,
    intensity: 'High',
    withDefense: true,
    grouping: 'Group',
    minPlayers: 2,
    courtArea: ['Half court'],
    objective: 'Attack a live closeout one on one with a two dribble limit.',
    whyThisDrill: 'The closeout attack is the most common one on one situation in a real game. Limiting the dribbles forces a decisive read instead of an extended isolation that never occurs in team basketball.',
    execution: ['Defender closes out from the paint.', 'Attacker has two dribbles to score.', 'Play live to a make or a defensive stop.'],
    coachingPoints: ['Read the closeout before dribbling.', 'Attack the top foot.', 'Finish or shoot within two dribbles.'],
    tags: ['small sided game', 'one on one', 'competition', 'game speed'],
    prerequisiteDrills: ['att-l1-001'],
    typicalIntroduction: 'U10–U12',
    suitableAges: FROM_U12,
  }),
];

/** Find a drill by its internal id. */
export function getDrill(id: string): Drill | undefined {
  return DRILLS.find((d) => d.id === id);
}

/** Find a drill by its BPDS code, e.g. `COD-L3-016`. */
export function getDrillByCode(code: string): Drill | undefined {
  return DRILLS.find((d) => d.code.toUpperCase() === code.toUpperCase());
}

/** Every drill belonging to a module. */
export function drillsByModule(moduleCode: string): Drill[] {
  return DRILLS.filter((d) => d.moduleCode === moduleCode);
}

/** Criteria accepted by {@link searchDrills}. */
export type DrillQuery = {
  /** Free-text match against name, code, objective and tags. */
  text?: string;
  /** Restrict to one module code. */
  moduleCode?: string;
  /** Restrict to one development area. */
  area?: string;
  /** Restrict to one BPDS level. */
  level?: SkillLevel;
  /** Restrict to drills suitable for an age group. */
  ageGroup?: AgeGroup;
  /** Restrict by whether live defense is involved. */
  withDefense?: boolean;
  /** Restrict to drills runnable with this many players. */
  playerCount?: number;
  /** Restrict to drills runnable with this equipment. */
  equipment?: string[];
  /** Restrict to drills runnable in this court configuration. */
  courtSize?: string;
  /** Include unpublished drills. Defaults to false. */
  includeUnpublished?: boolean;
  /** Resolve a module code to its area, used when filtering by area. */
  areaOf?: (moduleCode: string) => string | undefined;
};

/**
 * Filters the catalog against coach-facing search criteria.
 *
 * Every criterion is optional and they combine with AND, which is exactly
 * how the Drill Library filter bar behaves.
 *
 * @param query the criteria to match.
 * @returns the matching drills, in catalog order.
 */
export function searchDrills(query: DrillQuery = {}): Drill[] {
  const text = query.text?.trim().toLowerCase();
  return DRILLS.filter((drill) => {
    if (!query.includeUnpublished && !drill.published) return false;
    if (query.moduleCode && drill.moduleCode !== query.moduleCode) return false;
    if (query.area && query.areaOf?.(drill.moduleCode) !== query.area) return false;
    if (query.level && drill.level !== query.level) return false;
    if (query.ageGroup && !drill.suitableAges.includes(query.ageGroup)) return false;
    if (query.withDefense !== undefined && drill.withDefense !== query.withDefense) return false;
    if (query.playerCount !== undefined && !fitsPlayerCount(drill, query.playerCount)) return false;
    if (query.equipment && !hasEquipment(drill, query.equipment)) return false;
    if (query.courtSize && drill.courtArea.length > 0 && !drill.courtArea.includes(query.courtSize)) return false;
    if (text) {
      const haystack = [drill.name, drill.code, drill.objective, ...drill.tags].join(' ').toLowerCase();
      if (!haystack.includes(text)) return false;
    }
    return true;
  });
}

/**
 * Resolves related, prerequisite and follow-up drills for a drill.
 * @param drill the drill to resolve links for.
 */
export function relatedDrills(drill: Drill): {
  related: Drill[]; prerequisites: Drill[]; followUps: Drill[];
} {
  const resolve = (ids: string[]) => ids.map(getDrill).filter((d): d is Drill => Boolean(d));
  return {
    related: resolve(drill.relatedDrills),
    prerequisites: resolve(drill.prerequisiteDrills),
    followUps: resolve(drill.followUpDrills),
  };
}

/** All distinct equipment options used across the platform. */
export const EQUIPMENT_OPTIONS = [
  'Basketballs', 'Cones', 'Flat markers', 'Tennis balls', 'Size 3 ball',
  'Size 3 overweight ball, 600 g', 'Size 5 overweight ball, 900 g', 'Resistance bands',
  'Mini bands', 'Agility ladder', 'Contact pad', 'Chairs', 'Reaction lights', 'No additional equipment',
];

/** Court size options offered to the coach. */
export const COURT_SIZES = ['Small indoor space', 'Half court', 'Full court', 'Outdoor court', 'Home training area'];

/** Training focus options offered by the generator. */
export const FOCUS_OPTIONS = [
  'Complete Player Development', 'Ball Mastery', 'Ball Handling', 'Change of Direction',
  'Combination Moves', 'Footwork', 'Finishing', 'Passing', 'Shooting', 'Triple Threat',
  'Defense', 'Rebounding', 'Spacing', 'Off-Ball Movement', 'Pick and Roll', 'Transition',
  'Decision Making', 'Advantage Basketball', 'Small-Sided Games',
];

/** Maps a coach-facing focus label to the BPDS module codes it covers. */
export const FOCUS_TO_MODULES: Record<string, string[]> = {
  'Complete Player Development': ['BM', 'SBH', 'MBH', 'COD', 'FW', 'FIN', 'PAS', 'SH', 'TT', 'ATT', 'DFW', 'REB', 'ADV', 'SSG'],
  'Ball Mastery': ['BM', 'SBH'],
  'Ball Handling': ['BM', 'SBH', 'MBH', 'COD'],
  'Change of Direction': ['COD', 'MBH'],
  'Combination Moves': ['COM', 'COD'],
  Footwork: ['FW'],
  Finishing: ['FIN', 'FW'],
  Passing: ['PAS'],
  Shooting: ['SH'],
  'Triple Threat': ['TT', 'ATT'],
  Defense: ['DFW', 'OBD', 'OFD', 'TRD'],
  Rebounding: ['REB'],
  Spacing: ['OCS'],
  'Off-Ball Movement': ['OBM', 'OBS'],
  'Pick and Roll': ['PNR', 'TOC'],
  Transition: ['TOF', 'TRD'],
  'Decision Making': ['ADV', 'SSG', 'OBD'],
  'Advantage Basketball': ['ADV'],
  'Small-Sided Games': ['SSG'],
};

/**
 * Module codes covered by a coach-facing training focus.
 * @param focus one of {@link FOCUS_OPTIONS}.
 */
export function modulesForFocus(focus: string): string[] {
  return FOCUS_TO_MODULES[focus] ?? [];
}

/**
 * The read model the app uses for the BPDS drill database.
 *
 * Pages depend on this service surface rather than on the `DRILLS` array,
 * so the catalog can move behind a remote API without any page changing.
 */
export const drillCatalog = {
  /** Every drill in the catalog. */
  all: (): Drill[] => DRILLS,
  /** Only drills offered to coaches. */
  published: (): Drill[] => DRILLS.filter((d) => d.published),
  /** Look up one drill by internal id. */
  get: getDrill,
  /** Look up one drill by BPDS code. */
  getByCode: getDrillByCode,
  /** All drills in one module. */
  byModule: drillsByModule,
  /** Filter the catalog against coach-facing criteria. */
  search: searchDrills,
  /** Resolve related, prerequisite and follow-up drills. */
  links: relatedDrills,
  /** Module codes covered by a training focus. */
  modulesForFocus,
  /** Equipment options offered to the coach. */
  equipmentOptions: (): string[] => EQUIPMENT_OPTIONS,
  /** Court size options offered to the coach. */
  courtSizes: (): string[] => COURT_SIZES,
  /** Training focus options offered to the coach. */
  focusOptions: (): string[] => FOCUS_OPTIONS,
  /** How many drills the catalog holds. */
  count: (): number => DRILLS.length,
};
