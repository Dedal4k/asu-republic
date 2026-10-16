/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatKey = 'moscow' | 'people' | 'kgb' | 'economy';

export interface Stats {
  moscow: number;
  people: number;
  kgb: number;
  economy: number;
}

export interface PoliticalProfile {
  sovereignty: number; // 0 to 100: republican independence vs subordination to Union Center
  autocracy: number;   // 0 to 100: iron fist & siloviki vs democratization & street rallies
  market: number;      // 0 to 100: private cooperatives & free prices vs Gosplan & rationing
}

export type RegionId = 'capital' | 'miners' | 'agrarian' | 'autonomy';

export interface RegionState {
  id: RegionId;
  name: string;
  subName: string;
  tension: number; // 0 to 100%
  curfewTurns: number; // >0 freezes tension growth during curfew
  specialization: string;
}

export interface ChoiceImpact {
  label: string;
  stats: Partial<Stats>;
  profile?: Partial<PoliticalProfile>;
  decreeBadge?: string;
  effectNote?: string;
  tensionDelta?: number; // Shift to region tension (-14% to +16%)
}

export type ArchetypeId =
  | 'kgb_general'
  | 'party_boss'
  | 'miner'
  | 'popular_front'
  | 'factory_director'
  | 'cooperator'
  | 'moscow_inspector'
  | 'western_diplomat'
  | 'crisis_radar'
  | 'crisis_deficit'
  | 'crisis_tank'
  | 'yeltsin'
  | 'technocrat';

export type LeaderBackgroundId = 'apparatchik' | 'director' | 'kgb' | 'technocrat';

export interface LeaderBackground {
  id: LeaderBackgroundId;
  title: string;
  subtitle: string;
  dossier: string;
  initialStats: Stats;
  initialRegions: Record<RegionId, number>;
  perkTitle: string;
  perkDesc: string;
  flawDesc: string;
}

export interface Card {
  id: string;
  act: 1 | 2 | 3 | 4;
  actTitle: string;
  senderTitle: string;
  archetype: ArchetypeId;
  region?: RegionId;
  text: string;
  leftChoice: ChoiceImpact;
  rightChoice: ChoiceImpact;
  daysElapsed: number; // 10 to 25
  isCrisis?: boolean;
  isGkchp?: boolean;
  requiredFlags?: string[];
  bannedFlags?: string[];
  setFlagsOnLeft?: string[];
  setFlagsOnRight?: string[];
}

export interface Ending {
  id: string;
  code: string;
  title: string;
  category: 'defeat' | 'grand';
  trigger: string;
  stamp: string;
  verdict: string;
  description: string;
  historicalContext: string;
}

export interface GameArchiveRecord {
  endingId: string;
  unlockedAt: string;
  daysSurvived: number;
  decrees: string[];
}
