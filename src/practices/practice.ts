import type { AgeGroup, Intensity, Phase, PlayerSkillLevel, TrainingType } from '../storage/shared-types';
export type PracticeItem={id:string;kind:'drill'|'break';drillId?:string;label?:string;duration:number;phase:Phase;note?:string;completed?:boolean};
export type GeneratorContext={trainingType:TrainingType;playerIds:string[];teamId?:string;ageGroup:AgeGroup;skillLevel:PlayerSkillLevel;duration:number;playerCount:number;baskets:number;courtSize:string;equipment:string[];primaryFocus:string;secondaryFocus:string;intensity:Intensity;withDefense:boolean;competitive:boolean;smallSidedGame:boolean};
export type Practice={id:string;name:string;date:string;playerIds:string[];teamId?:string;ageGroup:AgeGroup;skillLevel:PlayerSkillLevel;duration:number;primaryFocus:string;secondaryFocus:string;equipment:string[];courtSize:string;objective:string;items:PracticeItem[];status:'Draft'|'Scheduled'|'Completed';lastOpened:string;notes?:string};
export type HistoryEntry={id:string;date:string;practiceName:string;playerIds:string[];teamId?:string;duration:number;focus:string;completedDrills:number;totalDrills:number;notes:string};
export const practiceDuration=(p:Practice)=>p.items.reduce((t,i)=>t+i.duration,0);
export const drillCount=(p:Practice)=>p.items.filter(i=>i.kind==='drill').length;
export const phaseBreakdown=(p:Practice)=>p.items.reduce<Record<string,number>>((a,i)=>{a[i.phase]=(a[i.phase]??0)+i.duration;return a},{});
export const toHistoryEntry=(p:Practice,notes:string,completedDrills:number,id:string,date:string):HistoryEntry=>({id,date,practiceName:p.name,playerIds:p.playerIds,teamId:p.teamId,duration:practiceDuration(p),focus:p.primaryFocus,completedDrills,totalDrills:drillCount(p),notes});
