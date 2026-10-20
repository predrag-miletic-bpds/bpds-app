import type { DrillMetadataV1 } from './drill-metadata-v1.js';

const base = {
  metadataVersion: '1.0' as const,
  lifecycle: 'METHODOLOGY_VERIFIED' as const,
  primaryAgeGroups: ['U10'] as const,
  compatibleAgeGroups: ['U10', 'U12'] as const,
  primaryLevel: 1 as const,
  compatibleLevels: [1, 2] as const,
  primarySkillStage: 'STABILIZE' as const,
  compatibleSkillStages: ['STABILIZE', 'MOVE'] as const,
  primaryLearningMethod: 'REPEAT' as const,
  compatibleLearningMethods: ['REPEAT', 'STABILIZE'] as const,
  primaryDose: { type: 'QUALITY_REPS' as const, verification: 'UNVERIFIED' as const },
};
export const DRILL_METADATA_V1_FIXTURES: Record<string, DrillMetadataV1> = {
  LOW_POUND_DRIBBLE: {
    identity: { drillId: 'fixture-low-pound-dribble', name: 'Low Pound Dribble', module: 'BALL_HANDLING', skillFamily: 'DRIBBLING', ...base },
    classification: { primaryAgeGroups: [...base.primaryAgeGroups], compatibleAgeGroups: [...base.compatibleAgeGroups], primaryLevel: base.primaryLevel, compatibleLevels: [...base.compatibleLevels], primarySkillStage: base.primarySkillStage, compatibleSkillStages: [...base.compatibleSkillStages] },
    learning: { developmentNeeds: ['ball control'], learningObjectives: ['Maintain a low controlled dribble'], primaryLearningMethod: base.primaryLearningMethod, compatibleLearningMethods: [...base.compatibleLearningMethods], primaryDose: base.primaryDose, bilateralDevelopment: 'BALANCED' },
    organization: { format: 'PAIR', playersMin: 2, playersIdeal: 2, playersMax: 4, ballsRequired: 1 },
    execution: { executionCriteria: ['Keep the ball below the knee'], coachCues: ['Low and strong'] },
    coachCard: { teachingPoints: ['Eyes forward'] },
  },
  CATCH_AND_SHOOT_ACTIVE_TRIO: {
    identity: { drillId: 'fixture-catch-shoot-active-trio', name: 'Catch & Shoot Active Trio', module: 'SHOOTING', skillFamily: 'CATCH_AND_SHOOT', ...base },
    classification: { primaryAgeGroups: [...base.primaryAgeGroups], compatibleAgeGroups: [...base.compatibleAgeGroups], primaryLevel: base.primaryLevel, compatibleLevels: [...base.compatibleLevels], primarySkillStage: base.primarySkillStage, compatibleSkillStages: [...base.compatibleSkillStages] },
    learning: { developmentNeeds: ['catch-to-shot connection'], learningObjectives: ['Shoot in balance after the catch'], primaryLearningMethod: base.primaryLearningMethod, compatibleLearningMethods: [...base.compatibleLearningMethods], primaryDose: base.primaryDose },
    organization: { format: 'ACTIVE_TRIO', playersMin: 3, playersIdeal: 3, playersMax: 6, ballsRequired: 2, basketsRequired: 1 },
    execution: { executionCriteria: ['Hands ready before the catch'] },
    coachCard: { teachingPoints: ['Land balanced'] },
  },
  TWO_V_ONE_ADVANTAGE: {
    identity: { drillId: 'fixture-2v1-advantage', name: '2v1 Advantage', module: 'DECISION_MAKING', skillFamily: 'ADVANTAGE_PLAY', ...base },
    classification: { primaryAgeGroups: ['U12'], compatibleAgeGroups: ['U12', 'U14'], primaryLevel: 2, compatibleLevels: [2, 3], primarySkillStage: 'DECIDE', compatibleSkillStages: ['DECIDE', 'OPPOSE'] },
    learning: { developmentNeeds: ['advantage recognition'], learningObjectives: ['Choose pass or finish'], primaryLearningMethod: 'DECIDE', compatibleLearningMethods: ['DECIDE', 'OPPOSE'], primaryDose: { type: 'DECISION_EXPOSURES', verification: 'UNVERIFIED' } },
    organization: { format: 'SSG', decisionLoad: 3, defenderLoad: 1, playersMin: 3, playersIdeal: 3, playersMax: 6, ballsRequired: 1, basketsRequired: 1 },
    execution: { decision: { decisionQuestion: 'Does the defender commit to the ball?', validSolutions: ['Pass to teammate', 'Finish at the rim'], decisionCriteria: ['Read defender position'], successMeasurement: 'DECISION' } },
    coachCard: { teachingPoints: ['Attack the defender to create a decision'] },
  },
};

