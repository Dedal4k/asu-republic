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

// ====================================================================
// 1. РЕАЛЬНАЯ ЭКОНОМИКА РЕСПУБЛИКИ («КАБИНЕТ ПЕРВОГО СЕКРЕТАРЯ»)
// ====================================================================

export interface RepublicEconomy {
  rubleBudgetMillions: number;    // безналичный баланс в млн руб.
  shelfSupplyPercent: number;     // наполненность полок товарами, 0–100%
  moscowPlanFulfilled: number;    // выполнение союзного Госзаказа, %
  hardCurrencyReserve: number;    // валютный резерв в млн долларов
}

// ====================================================================
// 2. ИНФРАСТРУКТУРНЫЕ УЗЛЫ КАРТЫ
// ====================================================================

export type SectorId = 'capital' | 'mines' | 'agrarian' | 'autonomy';
export type RegionId = 'capital' | 'miners' | 'agrarian' | 'autonomy';

export type InfrastructureNodeType = 'power' | 'logistics' | 'production' | 'garrison';
export type InfrastructureNodeStatus = 'operational' | 'blocked' | 'damaged' | 'insurgent_held';

export interface InfrastructureNode {
  id: string;
  name: string;
  sectorId: SectorId;
  type: InfrastructureNodeType;
  status: InfrastructureNodeStatus;
  description: string;
  impact: {
    deficitDelta: number;     // Сдвиг дефицита полок (% в месяц)
    moscowPlanDelta: number;  // Влияние на союзный Госзаказ (% в месяц)
    tensionDelta: number;     // Влияние на напряженность в секторе (% в месяц)
  };
}

// ====================================================================
// 3. ФИГУРЫ ПОЛИТИКИ И АГЕНТУРА КГБ
// ====================================================================

export type SurveillanceLevel = 'none' | 'wiretap' | 'infiltrated';

export interface KompromatItem {
  id: string;
  title: string;
  description: string;
  used: boolean;
  effectDescription?: string;
}

export interface ActorCallOption {
  id: string;
  label: string;
  costDescription?: string;
  effectDescription: string;
  rubleCost?: number;
  currencyCost?: number;
  loyaltyDelta?: number;
  influenceDelta?: number;
  requiresKompromat?: boolean;
  actionType: 'bribe' | 'threaten' | 'concession' | 'pressure' | 'deal';
  executeText: string;
}

export interface PoliticalActor {
  id: string;
  name: string;
  title: string;
  avatar: string; // ArchetypeId
  loyalty: number; // 0–100
  influence: number; // 0–100
  surveillance: SurveillanceLevel;
  surveillanceProgress?: number; // turns under active surveillance
  dossier: string;
  unlockedKompromat: KompromatItem[];
  callOptions: ActorCallOption[];
}

// ====================================================================
// 4. УКАЗЫ И ПОСТАНОВЛЕНИЯ
// ====================================================================

export interface StateDecree {
  id: string;
  title: string;
  description: string;
  active: boolean;
  apCost: number; // стоимость принятия в Очках Внимания
  monthlyImpact: Partial<RepublicEconomy> & { tensionDelta?: number };
}

// ====================================================================
// 5. ГЛОБАЛЬНЫЙ СТЕЙТ КАБИНЕТА
// ====================================================================

export interface CabinetState {
  currentMonth: number; // 1..36, от 01.1989 до 12.1991
  attentionPoints: number; // текущие ОВ, от 0 до 3
  maxAttentionPoints: number; // по умолчанию 3
  economy: RepublicEconomy;
  nodes: Record<string, InfrastructureNode>;
  actors: Record<string, PoliticalActor>;
  activeDecrees: string[];
  urgentDossier: Card | null; // обязательная депеша месяца
}

// ====================================================================
// СТАТУС РЕГИОНОВ И КАРТОЧЕК
// ====================================================================

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
  economy?: Partial<RepublicEconomy>;
  decreeBadge?: string;
  effectNote?: string;
  tensionDelta?: number; // Shift to region tension (-14% to +16%)
  resetDirectiveCooldown?: boolean; // Immediately resets operational directives cooldown to 0
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
  initialEconomy?: Partial<RepublicEconomy>;
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
  isSpecialReport?: boolean;
  unique?: boolean;
  minTurn?: number;
  maxTurn?: number;
  requiredFlags?: string[];
  bannedFlags?: string[];
  requiresFlags?: string[];
  forbiddenFlags?: string[];
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

// ====================================================================
// 6. СИСТЕМНЫЕ НАСТРОЙКИ АСУ-РЕСПУБЛИКА
// ====================================================================

export type PhosphorColor = 'amber' | 'green' | 'mono';
export type ScanlineDensity = 'off' | 'low' | 'med' | 'high';
export type TeletypeSpeed = 'instant' | 'normal' | 'slow';
export type TerminalScale = 'compact' | 'normal';

export interface SystemSettings {
  ambientVolume: number; // 0..100, шаг 10, по умолчанию 70 — фоновая музыка
  sfxVolume: number; // 0..100, шаг 10, по умолчанию 80 — телетайп, щелчки, сирены
  phosphorColor: PhosphorColor; // по умолчанию 'amber'
  scanlineDensity: ScanlineDensity; // по умолчанию 'med'
  screenCurvature: boolean; // выпуклая геометрия кинескопа, по умолчанию true
  teletypeSpeed: TeletypeSpeed; // по умолчанию 'normal'
  voltageGlitches: boolean; // микро-помехи экрана при кризисах, по умолчанию true
  predictiveHints: boolean; // показ цифровых модификаторов на выборах, по умолчанию false
  terminalScale: TerminalScale; // по умолчанию 'normal'
}
