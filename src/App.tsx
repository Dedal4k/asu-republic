/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { terminalAudio } from './audio';
import { TerminalPortrait } from './portraits';
import { GAME_CARDS } from './data/cards';
import { getTassHeadlineForMonth } from './data/news';
import { ALL_ENDINGS, determineStrategyEnding } from './data/endings';
import {
  Card,
  Ending,
  PoliticalProfile,
  Stats,
  RegionId,
  RegionState,
  LeaderBackgroundId,
  RepublicEconomy,
  InfrastructureNode,
  PoliticalActor,
  StateDecree,
  SectorId,
  SystemSettings,
  CameraFocus,
  IncomingHotlineCall,
} from './types';
import { LEADER_BACKGROUNDS, LEADER_BACKGROUND_LIST, BACKGROUND_ARCHETYPES } from './data/backgrounds';
import { createInitialNodes } from './data/nodes';
import { createInitialActors } from './data/actors';
import { createInitialDecrees } from './data/decrees';
import { SettingsScreen } from './components/SettingsScreen';
import { CabinetDeskScene } from './components/CabinetDeskScene';
import { loadSettings, saveSettings, resetToDefaults, getPhosphorTheme } from './services/settingsStorage';

type ScreenMode = 'menu' | 'candidate' | 'briefing' | 'game' | 'archive' | 'settings' | 'ending';

const MAX_ATTENTION_POINTS = 2;

const MONTH_NAMES = [
  'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
  'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'
];

function formatMonthYear(month: number): string {
  const m = Math.max(1, Math.min(36, month));
  const year = 1989 + Math.floor((m - 1) / 12);
  const monthName = MONTH_NAMES[(m - 1) % 12];
  return `«${monthName} ${year} // ХОД ${m} ИЗ 36»`;
}

function formatMonthOnly(month: number): string {
  const m = Math.max(1, Math.min(36, month));
  const year = 1989 + Math.floor((m - 1) / 12);
  const monthName = MONTH_NAMES[(m - 1) % 12];
  return `${monthName} ${year}`;
}

const INITIAL_REGIONS: Record<RegionId, RegionState> = {
  capital: {
    id: 'capital',
    name: 'СТОЛИЧНЫЙ ОКРУГ',
    subName: 'ВУЗЫ, ТЕЛЕЦЕНТР, ГОСАППАРАТ',
    tension: 25,
    curfewTurns: 0,
    specialization: 'Центр власти: студенчество, правительственный квартал, аппарат ЦК, телецентр.',
  },
  miners: {
    id: 'miners',
    name: 'ШАХТЕРСКИЙ БАССЕЙН',
    subName: 'УГОЛЬ, ЗАВОДЫ, Ж/Д УЗЛЫ',
    tension: 30,
    curfewTurns: 0,
    specialization: 'Индустриальное ядро: добыча антрацита, металлургия, машиностроение, магистрали.',
  },
  agrarian: {
    id: 'agrarian',
    name: 'АГРАРНЫЙ ПОЯС',
    subName: 'КОЛХОЗЫ, ЭЛЕВАТОРЫ, СЕЛЬХОЗСНАБ',
    tension: 25,
    curfewTurns: 0,
    specialization: 'Продовольственная база: элеваторы, посевные площади, скотоводство, сахар.',
  },
  autonomy: {
    id: 'autonomy',
    name: 'ОСОБАЯ АВТОНОМИЯ',
    subName: 'НАЦ. ПЕРИФЕРИЯ, ГРАНИЦЫ, ГАРНИЗОНЫ',
    tension: 30,
    curfewTurns: 0,
    specialization: 'Пограничный рубеж: гарнизоны военного округа, таможня, национальный баланс.',
  },
};

function getInitialEconomy(bgId: LeaderBackgroundId): RepublicEconomy {
  switch (bgId) {
    case 'apparatchik':
      return { rubleBudgetMillions: 55, shelfSupplyPercent: 60, moscowPlanFulfilled: 90, hardCurrencyReserve: 10 };
    case 'director':
      return { rubleBudgetMillions: 70, shelfSupplyPercent: 60, moscowPlanFulfilled: 85, hardCurrencyReserve: 18 };
    case 'kgb':
      return { rubleBudgetMillions: 45, shelfSupplyPercent: 65, moscowPlanFulfilled: 90, hardCurrencyReserve: 15 };
    case 'technocrat':
      return { rubleBudgetMillions: 50, shelfSupplyPercent: 75, moscowPlanFulfilled: 80, hardCurrencyReserve: 12 };
    default:
      return { rubleBudgetMillions: 50, shelfSupplyPercent: 65, moscowPlanFulfilled: 85, hardCurrencyReserve: 12 };
  }
}

function getDispatchForMonth(
  month: number,
  usedIds: Set<string>,
  activeFlags: Set<string>,
  regions: Record<RegionId, RegionState>,
  economy: RepublicEconomy
): Card {
  // 1. Fixed historical milestones
  const milestones: Record<number, string> = {
    1: 'act1_tobacco_riot',
    7: 'act1_miner_strike',
    17: 'act2_declaration_sovereignty',
    25: 'act3_pavlov_reform',
    27: 'act3_referendum_1991',
    32: 'act3_gkchp_day1_morning',
    33: 'act3_gkchp_day2_yeltsin',
    36: 'act4_belovezha_finale',
  };

  const milestoneId = milestones[month];
  if (milestoneId && !usedIds.has(milestoneId)) {
    const c = GAME_CARDS.find((x) => x.id === milestoneId);
    if (c) return c;
  }

  // 2. Contextual Crisis Cards (if tension >= 65% in a region, prioritize a regional crisis card)
  const highTensionRegion = (Object.keys(regions) as RegionId[]).find(
    (rId) => regions[rId].tension >= 65
  );
  if (highTensionRegion) {
    const crisisCard = GAME_CARDS.find(
      (c) =>
        !usedIds.has(c.id) &&
        c.region === highTensionRegion &&
        (c.isCrisis || c.minTurn === undefined || c.minTurn <= month)
    );
    if (crisisCard) return crisisCard;
  }

  if (economy.shelfSupplyPercent <= 35) {
    const deficitCard = GAME_CARDS.find(
      (c) =>
        !usedIds.has(c.id) &&
        (c.archetype === 'crisis_deficit' ||
          c.id.includes('tobacco') ||
          c.id.includes('ration') ||
          c.id.includes('deficit'))
    );
    if (deficitCard) return deficitCard;
  }

  // 3. Flags-dependent cards
  const targetAct = month <= 9 ? 1 : month <= 18 ? 2 : month <= 28 ? 3 : 4;
  const flagCandidates = GAME_CARDS.filter((c) => {
    if (usedIds.has(c.id)) return false;
    if (c.minTurn && month < c.minTurn) return false;
    if (c.maxTurn && month > c.maxTurn) return false;

    const req = c.requiredFlags || c.requiresFlags;
    if (req && req.some((f) => !activeFlags.has(f))) return false;

    const ban = c.bannedFlags || c.forbiddenFlags;
    if (ban && ban.some((f) => activeFlags.has(f))) return false;

    return (req && req.length > 0) || (ban && ban.length > 0);
  });
  if (flagCandidates.length > 0) return flagCandidates[0];

  // 4. Regular cards in current act
  const availableInAct = GAME_CARDS.filter((c) => {
    if (usedIds.has(c.id)) return false;
    if (c.act !== targetAct) return false;
    if (c.minTurn && month < c.minTurn) return false;
    if (c.maxTurn && month > c.maxTurn) return false;
    const req = c.requiredFlags || c.requiresFlags;
    if (req && req.some((f) => !activeFlags.has(f))) return false;
    const ban = c.bannedFlags || c.forbiddenFlags;
    if (ban && ban.some((f) => activeFlags.has(f))) return false;
    return true;
  });
  if (availableInAct.length > 0) return availableInAct[0];

  // 5. Any available unused card
  const anyAvailable = GAME_CARDS.filter((c) => !usedIds.has(c.id));
  if (anyAvailable.length > 0) return anyAvailable[0];

  return GAME_CARDS[0];
}

function generateIncomingCall(
  month: number,
  nodes: Record<string, InfrastructureNode>,
  actors: Record<string, PoliticalActor>,
  economy: RepublicEconomy
): IncomingHotlineCall | null {
  if (month < 2) return null;

  // 1. Kremlin/Gosplan priority if plan is low
  if (economy.moscowPlanFulfilled < 60) {
    return {
      id: `call_gosplan_${month}`,
      actorId: 'gosplan',
      actorName: 'Николай Рыжков',
      actorTitle: 'ПРЕДСЕДАТЕЛЬ СОВЕТА МИНИСТРОВ СССР',
      avatar: 'moscow_inspector',
      subject: 'СРЫВ ГОСУДАРСТВЕННОГО ПЛАНА ПОСТАВОК',
      dialogue:
        'Товарищ Первый Секретарь! Докладываю с заседания Политбюро. Ваша республика срывает плановые поставки в союзный фонд! Москва не намерена терпеть экономический сепаратизм. Каковы ваши объяснения?!',
      options: [
        {
          id: 'promise_plan',
          label: '«Обещаем мобилизовать резервы и закрыть план»',
          effectNote: 'План +15%, но требуется выделить 10 млн руб на сверхурочные и логистику.',
          rubleCost: 10,
          planDelta: 15,
          loyaltyDelta: 10,
        },
        {
          id: 'reject_pressure',
          label: '«Союзные фонды истощены, требуем пересмотра квот»',
          effectNote: 'Отказ от уступок: Москва урезает доверие (-15% союзного плана, +10 к суверенитету).',
          planDelta: -15,
          loyaltyDelta: -20,
        },
      ],
    };
  }

  // 2. Miners strike hotline if mining station is blocked
  if (nodes.mines_sorting_station?.status === 'blocked') {
    return {
      id: `call_koval_${month}`,
      actorId: 'koval',
      actorName: 'Степан Коваль',
      actorTitle: 'ПРЕДСЕДАТЕЛЬ ОБЪЕДИНЕННОГО СТАЧКОМА',
      avatar: 'miner',
      subject: 'РЕЛЬСОВАЯ ВОЙНА НА ПОДЪЕЗДНЫХ ПУТЯХ',
      dialogue:
        'Первый! Эшелоны с углем стоят на запасных путях. Мужики на путях жгут костры. Либо мы получаем гарантии по мылу, сахару и зарплатам, либо Донбасс и Кузбасс поддержат нас всеобщей стачкой!',
      options: [
        {
          id: 'concede_supplies',
          label: '«Срочно отгрузить продовольственные пайки шахтерам»',
          effectNote: 'Полки -10%, но станция немедленно разблокирована, Коваль доволен.',
          shelfDelta: -10,
          loyaltyDelta: 20,
          unblockNodeId: 'mines_sorting_station',
        },
        {
          id: 'threaten_court',
          label: '«Напомнить об уголовной ответственности за саботаж»',
          effectNote: 'Резкий рост напряженности в бассейне (+15%), Коваль бросает трубку.',
          tensionDelta: 15,
          loyaltyDelta: -25,
        },
      ],
    };
  }

  // 3. Imminent conspiracy plot (plotProgress >= 2)
  const conspiringActor = Object.values(actors).find((a) => a.plotProgress >= 2);
  if (conspiringActor) {
    if (conspiringActor.id === 'gromov') {
      return {
        id: `call_gromov_${month}`,
        actorId: 'gromov',
        actorName: 'Виктор Громов',
        actorTitle: 'ПРЕДСЕДАТЕЛЬ КГБ РЕСПУБЛИКИ',
        avatar: 'kgb_general',
        subject: 'ТРЕБОВАНИЕ САНКЦИИ НА ОПЕРАЦИЮ «ГРОЗА»',
        dialogue:
          'Товарищ Первый! Лубянка требует наведения порядка. Неформалы и кооператоры перешли все границы. Мне нужны чрезвычайные полномочия для нейтрализации зачинщиков, иначе инициативу перехватит Центр.',
        options: [
          {
            id: 'gromov_ok',
            label: '«Санкционировать спецоперацию под вашу ответственность»',
            effectNote: 'Громов лоялен (+20), заговор заморожен, но автократия возрастает (+10).',
            loyaltyDelta: 20,
          },
          {
            id: 'gromov_deny',
            label: '«Запретить любые несогласованные аресты»',
            effectNote: 'Громов затаил обиду (-15 лояльности), заговор продолжает зреть.',
            loyaltyDelta: -15,
          },
        ],
      };
    } else if (conspiringActor.id === 'pozharsky') {
      return {
        id: `call_pozharsky_${month}`,
        actorId: 'pozharsky',
        actorName: 'Олег Пожарский',
        actorTitle: 'ЛИДЕР ДЕМОКРАТИЧЕСКОГО ДВИЖЕНИЯ',
        avatar: 'popular_front',
        subject: 'УЛЬТИМАТУМ НАРОДНОГО ФРОНТА',
        dialogue:
          'Господин Первый Секретарь! На площади собираются пятьдесят тысяч человек. Наше терпение исчерпано. Дайте нам час прямого эфира на республиканском телевидении, или мы перейдем к бессрочной забастовке!',
        options: [
          {
            id: 'airtime_grant',
            label: '«Предоставить эфир на телецентре под надзором цензуры»',
            effectNote: 'Пожарский согласен на диалог (+15 лояльности), столица успокаивается (-10% tension).',
            loyaltyDelta: 15,
            tensionDelta: -10,
          },
          {
            id: 'airtime_deny',
            label: '«Отключить рубильник телевышки и блокировать площадь»',
            effectNote: 'Столица накалена (+15% tension), Пожарский форсирует стачку.',
            tensionDelta: 15,
            loyaltyDelta: -25,
          },
        ],
      };
    } else if (conspiringActor.id === 'platonov') {
      return {
        id: `call_platonov_${month}`,
        actorId: 'platonov',
        actorName: 'Аркадий Платонов',
        actorTitle: 'ПРЕЗИДЕНТ АССОЦИАЦИИ ДИРЕКТОРОВ',
        avatar: 'factory_director',
        subject: 'ПРЯМОЙ ВАЛЮТНЫЙ ВЫХОД НА ЗАПАД',
        dialogue:
          'Первый! Заводы встанут без импортного сырья. Мы больше не можем сдавать валютную выручку во Внешэкономбанк. Разрешите директорам оставлять 50% валюты на предприятиях!',
        options: [
          {
            id: 'permit_forex',
            label: '«Разрешить оставить валюту на балансе заводов»',
            effectNote: 'Директора лояльны (+20), казна теряет $3М валюты, полки наполняются (+10%).',
            currencyCost: 3,
            shelfDelta: 10,
            loyaltyDelta: 20,
          },
          {
            id: 'deny_forex',
            label: '«Вся валюта идет только через централизованный бюджет»',
            effectNote: 'Платонов готовит теневой вывод капитала (-20 лояльности).',
            loyaltyDelta: -20,
          },
        ],
      };
    }
  }

  return null;
}

export default function App() {
  // System Settings state
  const [settings, setSettings] = useState<SystemSettings>(() => loadSettings());

  // Screen state
  const [screen, setScreen] = useState<ScreenMode>('menu');
  const [selectedLeader, setSelectedLeader] = useState<LeaderBackgroundId>('apparatchik');
  const [inspectingBackground, setInspectingBackground] = useState<LeaderBackgroundId>('apparatchik');

  // Strategy Cabinet State
  const [currentMonth, setCurrentMonth] = useState<number>(1);
  const [attentionPoints, setAttentionPoints] = useState<number>(MAX_ATTENTION_POINTS);
  const [economy, setEconomy] = useState<RepublicEconomy>(() => getInitialEconomy('apparatchik'));
  const [stats, setStats] = useState<Stats>({ moscow: 65, people: 40, economy: 50, kgb: 50 });
  const [profile, setProfile] = useState<PoliticalProfile>({ sovereignty: 20, autocracy: 50, market: 25 });
  const [regions, setRegions] = useState<Record<RegionId, RegionState>>(INITIAL_REGIONS);
  const [nodes, setNodes] = useState<Record<string, InfrastructureNode>>(createInitialNodes);
  const [actors, setActors] = useState<Record<string, PoliticalActor>>(createInitialActors);
  const [decrees, setDecrees] = useState<StateDecree[]>(createInitialDecrees);

  // 2.5D Camera Focus
  const [cameraFocus, setCameraFocus] = useState<CameraFocus>('overview');

  // Monthly Urgent Dispatch
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());
  const [activeFlags, setActiveFlags] = useState<Set<string>>(new Set());
  const [urgentDossier, setUrgentDossier] = useState<Card | null>(null);
  const [urgentDossierResolved, setUrgentDossierResolved] = useState<boolean>(false);
  const [lastChoiceStamp, setLastChoiceStamp] = useState<string | null>(null);

  // ВЧ-Связь: Incoming Call & Selection
  const [selectedActorId, setSelectedActorId] = useState<string>('koval');
  const [incomingCall, setIncomingCall] = useState<IncomingHotlineCall | null>(null);

  // Logs & History
  const [monthlyLog, setMonthlyLog] = useState<string[]>([]);
  const [supportedGkchp, setSupportedGkchp] = useState<boolean>(false);

  // Modals & Notifications
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);
  const [lastMonthSummary, setLastMonthSummary] = useState<{
    prevMonth: number;
    economyChanges: Partial<RepublicEconomy>;
    tensionChanges: Record<string, number>;
    notes: string[];
  } | null>(null);

  const [actionNotification, setActionNotification] = useState<{
    title: string;
    text: string;
    stamp?: string;
  } | null>(null);

  // Endings & Archive
  const [unlockedEndings, setUnlockedEndings] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('asu_unlocked_endings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentEnding, setCurrentEnding] = useState<Ending | null>(null);
  const [selectedDossier, setSelectedDossier] = useState<Ending | null>(null);

  // Menu typing command
  const [commandInput, setCommandInput] = useState<string>('');
  const [isTypingCommand, setIsTypingCommand] = useState<boolean>(false);

  // Briefing
  const [briefingLineIdx, setBriefingLineIdx] = useState<number>(0);
  const [briefingDone, setBriefingDone] = useState<boolean>(false);

  // Dynamic Phosphor Theme CSS Variables
  const phosphorThemeVars = useMemo(() => {
    return getPhosphorTheme(settings.phosphorColor);
  }, [settings.phosphorColor]);

  // Synchronize initial audio volume from loaded settings
  useEffect(() => {
    terminalAudio.setAmbientVolume(settings.ambientVolume);
    terminalAudio.setSfxVolume(settings.sfxVolume);
  }, []);

  const briefingLines = useMemo(
    () => [
      'ШИФРОТЕЛЕГРАММА ИЗ КРЕМЛЯ // ОСОБАЯ ПАПКА ЦК КПСС',
      'ГРИФ: «СОВЕРШЕННО СЕКРЕТНО // ЭКЗЕМПЛЯР ЕДИНСТВЕННЫЙ»',
      'КОМУ: ПЕРВОМУ СЕКРЕТАРЮ ЦК КОМПАРТИИ РЕСПУБЛИКИ',
      'ДАТА: 1 ЯНВАРЯ 1989 ГОДА',
      '------------------------------------------------------------',
      'Товарищ Первый Секретарь!',
      'Пленум утвердил ваше назначение главой республиканской партийной организации.',
      'Перестройка входит в критическую фазу. Товарный дефицит опустошает полки гастрономов.',
      'В шахтерских бассейнах назревают забастовки, в столице активизировался Народный Фронт.',
      'Союзный Госплан требует бесперебойного выполнения пятилетки и отгрузки угля.',
      'В вашем распоряжении терминал автоматизированного управления «АСУ-Республика».',
      'Каждый месяц вы получаете 2 Очка Внимания (ОВ) для директив, ВЧ-связи и агентуры КГБ.',
      'Ваша цель — удержать республику от экономического и политического краха до конца 1991 года.',
      '------------------------------------------------------------',
      'ТЕРМИНАЛ АКТИВИРОВАН. ПРИСТУПИТЬ К РУКОВОДСТВУ КАБИНЕТОМ.',
    ],
    []
  );

  // Emergency status
  const isEmergency = useMemo(() => {
    if (screen !== 'game') return false;
    return (
      economy.shelfSupplyPercent <= 20 ||
      economy.moscowPlanFulfilled <= 30 ||
      Object.values(regions).some((r) => r.tension >= 80)
    );
  }, [screen, economy.shelfSupplyPercent, economy.moscowPlanFulfilled, regions]);

  // Synchronize audio on mount and when screen changes
  useEffect(() => {
    terminalAudio.updateAdaptiveMusic(screen === 'game', isEmergency);
  }, [screen, isEmergency]);

  // Briefing typewriter effect with teletypeSpeed support
  useEffect(() => {
    if (screen !== 'briefing') return;
    if (settings.teletypeSpeed === 'instant') {
      setBriefingLineIdx(briefingLines.length);
      setBriefingDone(true);
      return;
    }

    if (briefingLineIdx < briefingLines.length) {
      const lineDelay = settings.teletypeSpeed === 'slow' ? 550 : 350;
      const timer = setTimeout(() => {
        setBriefingLineIdx((prev) => prev + 1);
        terminalAudio.playTeletypeClick();
      }, lineDelay);
      return () => clearTimeout(timer);
    } else {
      setBriefingDone(true);
    }
  }, [screen, briefingLineIdx, briefingLines.length, settings.teletypeSpeed]);

  // Settings handlers
  const handleUpdateSettings = useCallback((newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    terminalAudio.setAmbientVolume(newSettings.ambientVolume);
    terminalAudio.setSfxVolume(newSettings.sfxVolume);
  }, []);

  const handleResetSettings = useCallback(() => {
    const defaults = resetToDefaults();
    setSettings(defaults);
    terminalAudio.setAmbientVolume(defaults.ambientVolume);
    terminalAudio.setSfxVolume(defaults.sfxVolume);
  }, []);

  const handleClearArchive = useCallback(() => {
    try {
      localStorage.removeItem('asu_unlocked_endings');
    } catch {}
    setUnlockedEndings([]);
  }, []);

  // Start new session
  const startSessionWithBackground = useCallback((bgId: LeaderBackgroundId) => {
    setSelectedLeader(bgId);
    const bg = LEADER_BACKGROUNDS[bgId];
    const initialEco = getInitialEconomy(bgId);

    setEconomy(initialEco);
    setStats({ ...bg.initialStats });
    setProfile({ sovereignty: 20, autocracy: 50, market: 25 });

    const newRegions: Record<RegionId, RegionState> = {
      capital: { ...INITIAL_REGIONS.capital, tension: bg.initialRegions.capital },
      miners: { ...INITIAL_REGIONS.miners, tension: bg.initialRegions.miners },
      agrarian: { ...INITIAL_REGIONS.agrarian, tension: bg.initialRegions.agrarian },
      autonomy: { ...INITIAL_REGIONS.autonomy, tension: bg.initialRegions.autonomy },
    };
    setRegions(newRegions);

    setNodes(createInitialNodes());
    setActors(createInitialActors());
    setDecrees(createInitialDecrees());

    setCurrentMonth(1);
    setAttentionPoints(MAX_ATTENTION_POINTS);
    setUsedCardIds(new Set());
    setActiveFlags(new Set());
    setIncomingCall(null);
    setCameraFocus('overview');
    setSupportedGkchp(false);

    // Initial urgent dispatch
    const firstCard = getDispatchForMonth(1, new Set(), new Set(), newRegions, initialEco);
    setUrgentDossier(firstCard);
    setUsedCardIds(new Set([firstCard.id]));
    setUrgentDossierResolved(false);
    setLastChoiceStamp(null);

    setMonthlyLog([
      '01.1989 // Сессия Верховного Совета утвердила новый состав ЦК. Терминал АСУ включен.',
    ]);
    setLastMonthSummary(null);
    setShowMonthlyReportModal(false);

    terminalAudio.playStampPress();
    setScreen('briefing');
    setBriefingLineIdx(0);
    setBriefingDone(false);
  }, []);

  // Return to menu
  const handleReturnToMenu = useCallback(() => {
    terminalAudio.playSwitchClick();
    terminalAudio.updateAdaptiveMusic(false, false);
    setScreen('menu');
  }, []);

  // Toggle sound
  const handleToggleSound = useCallback(() => {
    const muted = terminalAudio.toggleMute();
    if (muted) {
      handleUpdateSettings({ ...settings, sfxVolume: 0, ambientVolume: 0 });
    } else {
      handleUpdateSettings({ ...settings, sfxVolume: 80, ambientVolume: 70 });
    }
  }, [settings, handleUpdateSettings]);

  // Menu typing simulator
  const handleMenuSelect = useCallback((cmd: string, targetScreen: ScreenMode) => {
    terminalAudio.playTeletypeClick();
    if (settings.teletypeSpeed === 'instant') {
      setScreen(targetScreen);
      terminalAudio.playSwitchClick();
      return;
    }

    setIsTypingCommand(true);
    setCommandInput('');
    let idx = 0;
    const charDelay = settings.teletypeSpeed === 'slow' ? 65 : 40;
    const interval = setInterval(() => {
      idx++;
      setCommandInput(cmd.slice(0, idx));
      terminalAudio.playKeyClick();
      if (idx >= cmd.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsTypingCommand(false);
          setCommandInput('');
          setScreen(targetScreen);
          terminalAudio.playSwitchClick();
        }, 160);
      }
    }, charDelay);
  }, [settings.teletypeSpeed]);

  const handleSkipBriefing = useCallback(() => {
    terminalAudio.playSwitchClick();
    setScreen('game');
  }, []);

  // Spend Action Point Helper
  const spendAP = useCallback(
    (cost: number = 1): boolean => {
      if (attentionPoints < cost) {
        setActionNotification({
          title: 'ДЕФИЦИТ ОЧКОВ ВНИМАНИЯ (ОВ)',
          text: `Лимит внимания Первого секретаря на текущий месяц исчерпан (${attentionPoints}/${MAX_ATTENTION_POINTS} ОВ). Для восстановления ресурса перейдите к следующему месяцу.`,
          stamp: 'НЕТ ОВ',
        });
        terminalAudio.playTeletypeClick();
        return false;
      }
      setAttentionPoints((prev) => prev - cost);
      return true;
    },
    [attentionPoints]
  );

  // Urgent Dispatch resolution (left/right costs 1 AP; shelve costs 0 AP with penalties)
  const handleResolveDispatch = useCallback(
    (choice: 'left' | 'right' | 'shelve') => {
      if (!urgentDossier || urgentDossierResolved) return;
      const c = urgentDossier;

      if (choice === 'shelve') {
        // Emergency: Shelve with severe penalties (0 AP)
        setRegions((prev) => {
          const next = { ...prev };
          (Object.keys(next) as RegionId[]).forEach((rId) => {
            next[rId] = { ...next[rId], tension: Math.min(100, next[rId].tension + 8) };
          });
          return next;
        });

        setEconomy((prev) => ({
          ...prev,
          moscowPlanFulfilled: Math.max(0, prev.moscowPlanFulfilled - 10),
          shelfSupplyPercent: Math.max(0, prev.shelfSupplyPercent - 5),
        }));

        setUrgentDossierResolved(true);
        setLastChoiceStamp('ОТЛОЖЕНО В ДОЛГИЙ ЯЩИК');
        terminalAudio.playStampPress();

        setActionNotification({
          title: 'ДЕПЕША ОТЛОЖЕНА В ДОЛГИЙ ЯЩИК',
          text: 'Вы отложили решение по острой проблеме без затрат ОВ. Это вызвало раздражение во всех регионах (+8% к напряженности) и срыв союзного плана (-10%).',
          stamp: 'ПОД СУКНО (0 ОВ)',
        });

        setMonthlyLog((prev) => [
          ...prev,
          `${formatMonthOnly(currentMonth)}: Решение по депеше «${c.senderTitle}» отложено в долгий ящик (0 ОВ). Напряженность +8% во всех регионах, план -10%.`,
        ]);
        return;
      }

      // Left or Right resolution costs 1 AP!
      if (!spendAP(1)) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО ОЧКОВ ВНИМАНИЯ (ОВ)',
          text: 'Для утверждения государственной директивы требуется 1 ОВ. Если ОВ исчерпаны, вы можете отложить депешу под сукно [ОТЛОЖИТЬ В ДОЛГИЙ ЯЩИК (0 ОВ)] ценой роста напряженности.',
          stamp: 'ТРЕБУЕТСЯ 1 ОВ',
        });
        return;
      }

      const ch = choice === 'left' ? c.leftChoice : c.rightChoice;

      // Track GKCHP alignment
      if (c.id === 'act3_gkchp_day1_morning') {
        if (choice === 'left') setSupportedGkchp(true);
        else setSupportedGkchp(false);
      }

      // Update activeFlags
      const flagsToAdd = choice === 'left' ? c.setFlagsOnLeft : c.setFlagsOnRight;
      if (flagsToAdd && flagsToAdd.length > 0) {
        setActiveFlags((prev) => {
          const next = new Set(prev);
          flagsToAdd.forEach((f) => next.add(f));
          return next;
        });
      }

      // Apply economy
      setEconomy((prev) => {
        let ruble = prev.rubleBudgetMillions;
        let shelf = prev.shelfSupplyPercent;
        let plan = prev.moscowPlanFulfilled;
        let currency = prev.hardCurrencyReserve;

        if (ch.economy?.rubleBudgetMillions) ruble += ch.economy.rubleBudgetMillions;
        if (ch.economy?.shelfSupplyPercent) shelf += ch.economy.shelfSupplyPercent;
        if (ch.economy?.moscowPlanFulfilled) plan += ch.economy.moscowPlanFulfilled;
        if (ch.economy?.hardCurrencyReserve) currency += ch.economy.hardCurrencyReserve;

        if (!ch.economy) {
          if (ch.stats.economy) {
            ruble += Math.round(ch.stats.economy * 1.5);
            shelf += Math.round(ch.stats.economy * 0.8);
          }
          if (ch.stats.moscow) {
            plan += Math.round(ch.stats.moscow * 1.2);
          }
        }

        return {
          rubleBudgetMillions: Math.round(ruble * 10) / 10,
          shelfSupplyPercent: Math.max(0, Math.min(100, shelf)),
          moscowPlanFulfilled: Math.max(0, Math.min(100, plan)),
          hardCurrencyReserve: Math.max(0, Math.min(100, currency)),
        };
      });

      // Apply political profile
      if (ch.profile) {
        setProfile((prev) => ({
          sovereignty: Math.max(0, Math.min(100, prev.sovereignty + (ch.profile?.sovereignty || 0))),
          autocracy: Math.max(0, Math.min(100, prev.autocracy + (ch.profile?.autocracy || 0))),
          market: Math.max(0, Math.min(100, prev.market + (ch.profile?.market || 0))),
        }));
      }

      // Apply tension to region if specified
      if (c.region && ch.tensionDelta) {
        setRegions((prev) => {
          const r = prev[c.region!];
          if (!r) return prev;
          const newTension = Math.max(0, Math.min(100, r.tension + (ch.tensionDelta || 0)));
          return { ...prev, [c.region!]: { ...r, tension: newTension } };
        });
      }

      setUrgentDossierResolved(true);
      setLastChoiceStamp(ch.label);
      terminalAudio.playStampPress();

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: По депеше «${c.senderTitle}» утверждено: [${ch.label}] (1 ОВ). ${ch.effectNote || ''}`,
      ]);
    },
    [urgentDossier, urgentDossierResolved, currentMonth, spendAP]
  );

  // Split Repair: 1. Repair damaged node with Rubles (1 AP, -10M ₽)
  const handleRepairDamagedMoney = useCallback(
    (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node || node.status !== 'damaged') return;

      const rubleCost = 10;
      if (economy.rubleBudgetMillions < rubleCost) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО СРЕДСТВ',
          text: `Для капремонта объекта «${node.name}» требуется 10 млн руб. В казне недостаточно безналичных средств.`,
          stamp: 'БЮДЖЕТНЫЙ ДЕФИЦИТ',
        });
        return;
      }

      if (!spendAP(1)) return;

      setEconomy((prev) => ({
        ...prev,
        rubleBudgetMillions: Math.round((prev.rubleBudgetMillions - rubleCost) * 10) / 10,
      }));

      setNodes((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], status: 'operational' },
      }));

      terminalAudio.playDirectiveLaunch();
      setActionNotification({
        title: 'ОБЪЕКТ ВОССТАНОВЛЕН',
        text: `Выделены средства из резервного фонда (-10 млн руб, 1 ОВ). Объект «${node.name}» введен в строй.`,
        stamp: 'РЕМОНТ ЗА РУБЛИ',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Капитальный ремонт «${node.name}» (-10 млн руб, 1 ОВ).`,
      ]);
    },
    [nodes, economy.rubleBudgetMillions, spendAP, currentMonth]
  );

  // Split Repair: 2. Repair damaged node by drawing from shelves (1 AP, -15% shelves)
  const handleRepairDamagedShelves = useCallback(
    (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node || node.status !== 'damaged') return;

      if (economy.shelfSupplyPercent < 15) {
        setActionNotification({
          title: 'ПОЛКИ ПУСТЫ',
          text: `Для перераспределения материальных фондов на ремонт «${node.name}» требуется не менее 15% наполненности полок.`,
          stamp: 'ТОВАРНЫЙ ДЕФИЦИТ',
        });
        return;
      }

      if (!spendAP(1)) return;

      setEconomy((prev) => ({
        ...prev,
        shelfSupplyPercent: Math.max(0, prev.shelfSupplyPercent - 15),
      }));

      setNodes((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], status: 'operational' },
      }));

      terminalAudio.playDirectiveLaunch();
      setActionNotification({
        title: 'МАТЕРИАЛЬНЫЕ ФОНДЫ ПЕРЕНАПРАВЛЕНЫ',
        text: `Оборудование и стройматериалы изъяты из гражданского оборота (-15% полок, 1 ОВ). Объект «${node.name}» отремонтирован.`,
        stamp: 'ЗА СЧЕТ ТОВАРОВ',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Ремонт «${node.name}» за счет товарных фондов (-15% полок, 1 ОВ).`,
      ]);
    },
    [nodes, economy.shelfSupplyPercent, spendAP, currentMonth]
  );

  // Split Repair: 3. Resolve blocked node via emergency concession (1 AP, -12M ₽, -10% plan)
  const handleResolveBlockedConcession = useCallback(
    (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node || node.status !== 'blocked') return;

      const rubleCost = 12;
      if (economy.rubleBudgetMillions < rubleCost) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО СРЕДСТВ',
          text: `Для удовлетворения требований бастующих на объекте «${node.name}» требуется 12 млн руб.`,
          stamp: 'ФИНАНСОВЫЙ ТУПИК',
        });
        return;
      }

      if (!spendAP(1)) return;

      setEconomy((prev) => ({
        ...prev,
        rubleBudgetMillions: Math.round((prev.rubleBudgetMillions - rubleCost) * 10) / 10,
        moscowPlanFulfilled: Math.max(0, prev.moscowPlanFulfilled - 10),
      }));

      setNodes((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], status: 'operational' },
      }));

      terminalAudio.playDirectiveLaunch();
      setActionNotification({
        title: 'УСТУПКА БАСТУЮЩИМ',
        text: `Требования забастовщиков частично удовлетворены (-12 млн руб, -10% плана, 1 ОВ). Блокада с объекта «${node.name}» снята.`,
        stamp: 'КОМПРОМИСС',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Разблокирован узел «${node.name}» через уступку бастующим (-12 млн руб, -10% плана, 1 ОВ).`,
      ]);
    },
    [nodes, economy.rubleBudgetMillions, spendAP, currentMonth]
  );

  // Split Repair: 4. Storm insurgent-held node with special forces (1 AP, +15% tension, +10 autocracy)
  const handleStormInsurgents = useCallback(
    (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node || node.status !== 'insurgent_held') return;

      if (!spendAP(1)) return;

      const sectorToRegion: Record<SectorId, RegionId> = {
        capital: 'capital',
        mines: 'miners',
        agrarian: 'agrarian',
        autonomy: 'autonomy',
      };
      const regionId = sectorToRegion[node.sectorId];

      setNodes((prev) => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], status: 'operational' },
      }));

      setRegions((prev) => {
        const cur = prev[regionId];
        if (!cur) return prev;
        return { ...prev, [regionId]: { ...cur, tension: Math.min(100, cur.tension + 15) } };
      });

      setProfile((prev) => ({
        ...prev,
        autocracy: Math.min(100, prev.autocracy + 10),
      }));

      terminalAudio.playEmergencyAlarm();
      setActionNotification({
        title: 'СИЛОВОЙ ШТУРМ ЗАВЕРШЕН',
        text: `Спецназ КГБ и внутренние войска выбили незаконные формирования с объекта «${node.name}» (1 ОВ). Напряженность в регионе подскочила (+15%), Автократия +10.`,
        stamp: 'ШТУРМ СПЕЦНАЗА',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Силовой штурм объекта «${node.name}» (1 ОВ, напряженность +15%, автократия +10).`,
      ]);
    },
    [nodes, spendAP, currentMonth]
  );

  // Regional Curfew: 1 AP, curfewTurns = 3, -25% tension, unblocks nodes, -6M ₽, -12% plan, +12 autocracy
  const handleDeclareCurfew = useCallback(
    (regionId: RegionId) => {
      const reg = regions[regionId];
      if (!reg) return;

      if (economy.rubleBudgetMillions < 6) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО СРЕДСТВ',
          text: 'Для ввода комендантского часа, переброски мотострелковых частей и развертывания блокпостов требуется не менее 6 млн руб.',
          stamp: 'ОТКАЗ КОМЕНДАТУРЫ',
        });
        return;
      }

      if (!spendAP(1)) return;

      setEconomy((prev) => ({
        ...prev,
        rubleBudgetMillions: Math.round((prev.rubleBudgetMillions - 6) * 10) / 10,
        moscowPlanFulfilled: Math.max(0, prev.moscowPlanFulfilled - 12),
      }));

      setRegions((prev) => {
        const cur = prev[regionId];
        return {
          ...prev,
          [regionId]: {
            ...cur,
            curfewTurns: 3,
            tension: Math.max(0, cur.tension - 25),
          },
        };
      });

      const regionToSector: Record<RegionId, SectorId> = {
        capital: 'capital',
        miners: 'mines',
        agrarian: 'agrarian',
        autonomy: 'autonomy',
      };
      const targetSector = regionToSector[regionId];

      setNodes((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          if (next[id].sectorId === targetSector && next[id].status === 'blocked') {
            next[id] = { ...next[id], status: 'operational' };
          }
        });
        return next;
      });

      setProfile((prev) => ({
        ...prev,
        autocracy: Math.min(100, prev.autocracy + 12),
      }));

      terminalAudio.playEmergencyAlarm();
      setActionNotification({
        title: 'ВВЕДЕН КОМЕНДАНТСКИЙ ЧАС',
        text: `В регионе «${reg.name}» объявлено чрезвычайное положение на 3 месяца (1 ОВ, -6 млн руб). Напряженность сбита на 25%, забастовочные пикеты разогнаны, союзный план упал на 12%.`,
        stamp: 'ОСОБЫЙ РЕЖИМ',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Введен комендантский час в регионе «${reg.name}» (1 ОВ, -25% напряжение, -6М ₽, -12% план, +12 автократия).`,
      ]);
    },
    [regions, economy.rubleBudgetMillions, spendAP, currentMonth]
  );

  // Execute Hotline call option (costs 1 AP)
  const handleExecuteCallOption = useCallback(
    (actorId: string, optionId: string) => {
      const actor = actors[actorId];
      if (!actor) return;
      const opt = actor.callOptions.find((o) => o.id === optionId);
      if (!opt) return;

      if (opt.requiresKompromat) {
        const hasKompromat = actor.unlockedKompromat.some((k) => !k.used);
        if (!hasKompromat) {
          setActionNotification({
            title: 'НЕТ ОПЕРАТИВНОГО КОМПРОМАТА',
            text: `Шантаж невозможен: 7-е управление КГБ еще не предоставило доказательств по фигуранту ${actor.name}. Сначала санкционируйте прослушку в сейфе КГБ.`,
            stamp: 'ОТКАЗ КГБ',
          });
          return;
        }
      }

      if (opt.rubleCost && economy.rubleBudgetMillions < opt.rubleCost) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО СРЕДСТВ',
          text: `Для согласования договоренности требуется ${opt.rubleCost} млн руб. В бюджете недостаточно средств.`,
          stamp: 'ФИНАНСОВЫЙ ТУПИК',
        });
        return;
      }

      if (opt.currencyCost && economy.hardCurrencyReserve < opt.currencyCost) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО ВАЛЮТЫ',
          text: `Требуется ${opt.currencyCost} млн долларов валютного резерва. Казна пуста.`,
          stamp: 'ВАЛЮТНЫЙ ДЕФИЦИТ',
        });
        return;
      }

      if (!spendAP(1)) return;

      setEconomy((prev) => ({
        ...prev,
        rubleBudgetMillions: opt.rubleCost ? Math.round((prev.rubleBudgetMillions - opt.rubleCost) * 10) / 10 : prev.rubleBudgetMillions,
        hardCurrencyReserve: opt.currencyCost ? Math.max(0, prev.hardCurrencyReserve - opt.currencyCost) : prev.hardCurrencyReserve,
      }));

      setActors((prev) => {
        const a = prev[actorId];
        const newLoyalty = Math.max(0, Math.min(100, a.loyalty + (opt.loyaltyDelta || 0)));
        const newInfluence = Math.max(0, Math.min(100, a.influence + (opt.influenceDelta || 0)));
        const updatedKompromat = opt.requiresKompromat
          ? a.unlockedKompromat.map((k) => ({ ...k, used: true }))
          : a.unlockedKompromat;

        return {
          ...prev,
          [actorId]: {
            ...a,
            loyalty: newLoyalty,
            influence: newInfluence,
            unlockedKompromat: updatedKompromat,
          },
        };
      });

      if (opt.id === 'koval_subsidies' || opt.id === 'koval_blackmail') {
        setNodes((prev) => ({
          ...prev,
          mines_sorting_station: { ...prev.mines_sorting_station, status: 'operational' },
        }));
      }

      terminalAudio.playHotlineTone();
      setActionNotification({
        title: `ВЧ-СВЯЗЬ: ${actor.name.toUpperCase()}`,
        text: opt.executeText,
        stamp: 'СВЯЗЬ СОСТОЯЛАСЬ',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: ВЧ-звонок абоненту ${actor.name}: «${opt.label}» (1 ОВ).`,
      ]);
    },
    [actors, economy.rubleBudgetMillions, economy.hardCurrencyReserve, spendAP, currentMonth]
  );

  // Incoming Call Answer (0 AP)
  const handleAnswerIncomingCall = useCallback(
    (optionId: string) => {
      if (!incomingCall) return;
      const opt = incomingCall.options.find((o) => o.id === optionId);
      if (!opt) return;

      if (opt.rubleCost && economy.rubleBudgetMillions < opt.rubleCost) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО СРЕДСТВ',
          text: `Для согласия требуется ${opt.rubleCost} млн руб. В казне нет средств.`,
          stamp: 'ФИНАНСОВЫЙ ТУПИК',
        });
        return;
      }

      if (opt.currencyCost && economy.hardCurrencyReserve < opt.currencyCost) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО ВАЛЮТЫ',
          text: `Для выполнения условий требуется $${opt.currencyCost} млн валюты.`,
          stamp: 'ВАЛЮТНЫЙ ДЕФИЦИТ',
        });
        return;
      }

      setEconomy((prev) => ({
        ...prev,
        rubleBudgetMillions: opt.rubleCost ? Math.round((prev.rubleBudgetMillions - opt.rubleCost) * 10) / 10 : prev.rubleBudgetMillions,
        hardCurrencyReserve: opt.currencyCost ? Math.max(0, prev.hardCurrencyReserve - opt.currencyCost) : prev.hardCurrencyReserve,
        moscowPlanFulfilled: opt.planDelta ? Math.max(0, Math.min(100, prev.moscowPlanFulfilled + opt.planDelta)) : prev.moscowPlanFulfilled,
        shelfSupplyPercent: opt.shelfDelta ? Math.max(0, Math.min(100, prev.shelfSupplyPercent + opt.shelfDelta)) : prev.shelfSupplyPercent,
      }));

      if (opt.loyaltyDelta && incomingCall.actorId && actors[incomingCall.actorId]) {
        setActors((prev) => {
          const a = prev[incomingCall.actorId];
          return {
            ...prev,
            [incomingCall.actorId]: {
              ...a,
              loyalty: Math.max(0, Math.min(100, a.loyalty + opt.loyaltyDelta!)),
              plotProgress: opt.loyaltyDelta! > 0 ? Math.max(0, a.plotProgress - 1) : a.plotProgress,
            },
          };
        });
      }

      if (opt.tensionDelta) {
        setRegions((prev) => {
          const next = { ...prev };
          (Object.keys(next) as RegionId[]).forEach((rId) => {
            next[rId] = { ...next[rId], tension: Math.max(0, Math.min(100, next[rId].tension + opt.tensionDelta!)) };
          });
          return next;
        });
      }

      if (opt.unblockNodeId) {
        setNodes((prev) => {
          if (prev[opt.unblockNodeId!]) {
            return {
              ...prev,
              [opt.unblockNodeId!]: { ...prev[opt.unblockNodeId!], status: 'operational' },
            };
          }
          return prev;
        });
      }

      terminalAudio.playHotlineTone();
      setActionNotification({
        title: `ВЧ-СВЯЗЬ: ${incomingCall.actorName.toUpperCase()}`,
        text: `Разговор завершен: [${opt.label}]. ${opt.effectNote}`,
        stamp: 'ВЧ-РАЗГОВОР',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Входящий звонок от ${incomingCall.actorName}: «${opt.label}» (0 ОВ).`,
      ]);

      setIncomingCall(null);
    },
    [incomingCall, economy, actors, currentMonth]
  );

  // Authorize KGB Wiretap (1 AP)
  const handleAuthorizeWiretap = useCallback(
    (actorId: string) => {
      const actor = actors[actorId];
      if (!actor || actor.surveillance !== 'none') return;

      if (!spendAP(1)) return;

      setActors((prev) => ({
        ...prev,
        [actorId]: {
          ...prev[actorId],
          surveillance: 'wiretap',
          surveillanceProgress: 1,
        },
      }));

      terminalAudio.playDirectiveLaunch();
      setActionNotification({
        title: 'САНКЦИЯ КГБ УТВЕРЖДЕНА',
        text: `7-е оперативно-техническое управление КГБ приступило к прослушиванию телефонных линий и перехвату корреспонденции фигуранта ${actor.name} (1 ОВ). Результаты разработки поступят в следующем месяце.`,
        stamp: 'ОПЕРАЦИЯ «КОЛЬЦО»',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Санкционирована негласная разработка КГБ по фигуранту ${actor.name} (1 ОВ).`,
      ]);
    },
    [actors, spendAP, currentMonth]
  );

  // Freeze Actor Assets in KGB safe (0 AP, resets plot, +12M ₽, +$5M)
  const handleFreezeActorAssets = useCallback(
    (actorId: string, kompromatId: string) => {
      const actor = actors[actorId];
      if (!actor) return;
      const item = actor.unlockedKompromat.find((k) => k.id === kompromatId && !k.used);
      if (!item) return;

      setActors((prev) => {
        const a = prev[actorId];
        return {
          ...prev,
          [actorId]: {
            ...a,
            plotProgress: 0,
            loyalty: Math.max(0, a.loyalty - 15),
            unlockedKompromat: a.unlockedKompromat.map((k) =>
              k.id === kompromatId ? { ...k, used: true } : k
            ),
          },
        };
      });

      setEconomy((prev) => ({
        ...prev,
        rubleBudgetMillions: Math.round((prev.rubleBudgetMillions + 12) * 10) / 10,
        hardCurrencyReserve: prev.hardCurrencyReserve + 5,
      }));

      terminalAudio.playStampPress();
      setActionNotification({
        title: 'АРЕСТ АКТИВОВ И СЧЕТОВ',
        text: `На основании материалов 7-го управления КГБ заморожены теневые счета фигуранта ${actor.name} (0 ОВ). Изъято +12 млн руб. и $5 млн валюты. Заговор нейтрализован (прогресс сброшен на 0). Лояльность фигуранта снизилась на 15.`,
        stamp: 'КОНФИСКАЦИЯ КГБ',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Арест счетов фигуранта ${actor.name} по материалам КГБ (+12 млн руб, +$5 млн валюты, сброс заговора).`,
      ]);
    },
    [actors, currentMonth]
  );

  // Toggle State Decree (1 AP)
  const handleToggleDecree = useCallback(
    (decreeId: string) => {
      const decree = decrees.find((d) => d.id === decreeId);
      if (!decree) return;

      if (!spendAP(1)) return;

      const nextActive = !decree.active;
      setDecrees((prev) =>
        prev.map((d) => (d.id === decreeId ? { ...d, active: nextActive } : d))
      );

      terminalAudio.playStampPress();
      setActionNotification({
        title: nextActive ? 'ПОСТАНОВЛЕНИЕ ВВЕДЕНО' : 'ПОСТАНОВЛЕНИЕ ОТМЕНЕНО',
        text: nextActive
          ? `Указ ${decree.title} вступил в законную силу (1 ОВ). Его экономические и социальные эффекты будут применяться ежемесячно.`
          : `Действие указа ${decree.title} приостановлено решением Бюро ЦК (1 ОВ).`,
        stamp: nextActive ? 'УТВЕРЖДЕНО БЮРО' : 'ОТМЕНЕНО',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: ${nextActive ? 'Введено' : 'Отменено'} постановление ${decree.title} (1 ОВ).`,
      ]);
    },
    [decrees, spendAP, currentMonth]
  );

  // Month Rollover Simulation
  const handleNextMonth = useCallback(() => {
    if (!urgentDossierResolved) {
      setActionNotification({
        title: 'ТРЕБУЕТСЯ ПОДПИСЬ ПЕРВОГО СЕКРЕТАРЯ',
        text: 'Вы не можете закрыть месяц, не приняв решение по обязательной Депеше Месяца! Откройте «Особую папку ЦК» на столе (клик по папке в центре стола).',
        stamp: 'ПАПКА НЕ ПОДПИСАНА',
      });
      setCameraFocus('dispatch');
      terminalAudio.playTeletypeClick();
      return;
    }

    const ecoDelta: Partial<RepublicEconomy> = {
      rubleBudgetMillions: 0,
      shelfSupplyPercent: 0,
      moscowPlanFulfilled: 0,
      hardCurrencyReserve: 0,
    };
    const tensionDelta: Record<RegionId, number> = {
      capital: 0,
      miners: 0,
      agrarian: 0,
      autonomy: 0,
    };
    const notes: string[] = [];

    // 1. Process ignored incoming call if any
    if (incomingCall) {
      if (incomingCall.actorId === 'gosplan') {
        ecoDelta.moscowPlanFulfilled = (ecoDelta.moscowPlanFulfilled || 0) - 15;
        notes.push('ВЧ-ВЕРТУШКА: Звонок из Госплана остался без ответа! Москва сочла это саботажем (-15% союзного плана).');
      } else if (actors[incomingCall.actorId]) {
        const caller = actors[incomingCall.actorId];
        notes.push(`ВЧ-ВЕРТУШКА: Абонент ${caller.name} не дождался ответа на срочный звонок! Лояльность упала на 20.`);
        setActors((prev) => {
          const cur = prev[incomingCall.actorId];
          if (!cur) return prev;
          return {
            ...prev,
            [incomingCall.actorId]: {
              ...cur,
              loyalty: Math.max(0, cur.loyalty - 20),
              plotProgress: Math.min(3, cur.plotProgress + 1),
            },
          };
        });
      }
      setIncomingCall(null);
    }

    // 2. Base state upkeep & tension penalties
    const curAvgTension = (regions.capital.tension + regions.miners.tension + regions.agrarian.tension + regions.autonomy.tension) / 4;
    ecoDelta.rubleBudgetMillions = (ecoDelta.rubleBudgetMillions || 0) - 14;
    notes.push('ГОСРАСХОДЫ: Базовое содержание партаппарата, милиции и бюджетников: -14М ₽.');

    if (curAvgTension > 50) {
      ecoDelta.rubleBudgetMillions = (ecoDelta.rubleBudgetMillions || 0) - 4;
      notes.push('БЕСПОРЯДКИ: Высокая напряженность в республике (>50%): экстренные расходы на правопорядок -4М ₽.');
    }

    // 2b. Node operational production vs breakdown losses
    const opNodesCount = Object.values(nodes).filter((n) => n.status === 'operational').length;
    const nonOpNodesCount = 8 - opNodesCount;
    const insurgentNodesCount = Object.values(nodes).filter((n) => n.status === 'insurgent_held').length;

    const ecoEfficiency = Math.max(0.2, (economy.shelfSupplyPercent + economy.moscowPlanFulfilled) / 160);
    const opNodeIncome = Math.round(opNodesCount * 2.0 * ecoEfficiency * 10) / 10;
    ecoDelta.rubleBudgetMillions = (ecoDelta.rubleBudgetMillions || 0) + opNodeIncome;
    notes.push(`АСУ-ДОХОД: Действующие узлы (${opNodesCount}/8, эфф. ${Math.round(ecoEfficiency * 100)}%) принесли +${opNodeIncome}М ₽ в бюджет.`);

    if (nonOpNodesCount > 0) {
      const nonOpLoss = Math.round(nonOpNodesCount * 4.5 * 10) / 10;
      ecoDelta.rubleBudgetMillions = (ecoDelta.rubleBudgetMillions || 0) - nonOpLoss;
      notes.push(`ДОТАЦИИ И УБЫТКИ: Недействующие узлы (${nonOpNodesCount}/8) потребовали субсидий -${nonOpLoss}М ₽.`);
    }

    if (insurgentNodesCount > 0) {
      const insurgentLoss = insurgentNodesCount * 3;
      const insurgentPlanLoss = insurgentNodesCount * 5;
      ecoDelta.rubleBudgetMillions = (ecoDelta.rubleBudgetMillions || 0) - insurgentLoss;
      ecoDelta.moscowPlanFulfilled = (ecoDelta.moscowPlanFulfilled || 0) - insurgentPlanLoss;
      notes.push(`МЯТЕЖ: Незаконные формирования удерживают объекты (${insurgentNodesCount}), диверсии -${insurgentLoss}М ₽, срыв плана -${insurgentPlanLoss}%.`);
    }

    // 3. Base Perestroika entropy
    const shelfEntropy = economy.shelfSupplyPercent < 40 ? 7 : 4;
    ecoDelta.shelfSupplyPercent = (ecoDelta.shelfSupplyPercent || 0) - shelfEntropy;
    notes.push(`ДЕФИЦИТ: Товарная энтропия снизила запасы полок на -${shelfEntropy}%.`);

    const tensionGrowth = economy.shelfSupplyPercent < 40 ? 7 : 3;
    tensionDelta.capital += tensionGrowth;
    tensionDelta.miners += tensionGrowth;
    tensionDelta.agrarian += tensionGrowth;
    tensionDelta.autonomy += tensionGrowth;

    // 4. Infrastructure chain reactions
    const updatedNodes = { ...nodes };

    if (updatedNodes.mines_sorting_station?.status !== 'operational') {
      if (updatedNodes.capital_tec3?.status === 'operational') {
        updatedNodes.capital_tec3 = { ...updatedNodes.capital_tec3, status: 'damaged' };
        notes.push('Блокада станции "Угольная" оставила столицу без угля: ТЭЦ-3 перешла в аварийный режим!');
      }
      ecoDelta.shelfSupplyPercent = (ecoDelta.shelfSupplyPercent || 0) - 15;
      ecoDelta.moscowPlanFulfilled = (ecoDelta.moscowPlanFulfilled || 0) - 20;
      tensionDelta.miners += 15;
      tensionDelta.capital += 10;
    }

    if (updatedNodes.capital_tec3?.status !== 'operational') {
      ecoDelta.shelfSupplyPercent = (ecoDelta.shelfSupplyPercent || 0) - 10;
      tensionDelta.capital += 12;
      notes.push('Авария на ТЭЦ-3: веерные отключения отопления в столичных кварталах.');
    }

    if (updatedNodes.agrarian_elevator_4?.status !== 'operational') {
      ecoDelta.shelfSupplyPercent = (ecoDelta.shelfSupplyPercent || 0) - 12;
      tensionDelta.agrarian += 8;
      notes.push('Элеваторный комплекс №4 заблокирован: сбои с отгрузкой зерна на мельницы.');
    }

    if (updatedNodes.autonomy_garrison_arsenal?.status === 'insurgent_held') {
      ecoDelta.moscowPlanFulfilled = (ecoDelta.moscowPlanFulfilled || 0) - 15;
      tensionDelta.autonomy += 25;
      notes.push('Гарнизонный арсенал удерживается незаконными формированиями: угроза вооруженного мятежа!');
    }

    // 5. Active decrees monthly impact
    decrees.filter((d) => d.active).forEach((d) => {
      if (d.monthlyImpact.rubleBudgetMillions) ecoDelta.rubleBudgetMillions = (ecoDelta.rubleBudgetMillions || 0) + d.monthlyImpact.rubleBudgetMillions;
      if (d.monthlyImpact.shelfSupplyPercent) ecoDelta.shelfSupplyPercent = (ecoDelta.shelfSupplyPercent || 0) + d.monthlyImpact.shelfSupplyPercent;
      if (d.monthlyImpact.moscowPlanFulfilled) ecoDelta.moscowPlanFulfilled = (ecoDelta.moscowPlanFulfilled || 0) + d.monthlyImpact.moscowPlanFulfilled;
      if (d.monthlyImpact.hardCurrencyReserve) ecoDelta.hardCurrencyReserve = (ecoDelta.hardCurrencyReserve || 0) + d.monthlyImpact.hardCurrencyReserve;
      if (d.monthlyImpact.tensionDelta) {
        tensionDelta.capital += d.monthlyImpact.tensionDelta;
        tensionDelta.miners += d.monthlyImpact.tensionDelta;
        tensionDelta.agrarian += d.monthlyImpact.tensionDelta;
        tensionDelta.autonomy += d.monthlyImpact.tensionDelta;
      }
      notes.push(`Указ ${d.title}: плановое исполнение.`);
    });

    // 6. Dynamic Breakdowns based on tension & budget
    (Object.keys(regions) as RegionId[]).forEach((rId) => {
      const reg = regions[rId];
      if (reg.tension >= 85) {
        const sectorMap: Record<RegionId, SectorId> = { capital: 'capital', miners: 'mines', agrarian: 'agrarian', autonomy: 'autonomy' };
        const sec = sectorMap[rId];
        const sectorNode = Object.values(updatedNodes).find((n) => n.sectorId === sec && n.status !== 'insurgent_held');
        if (sectorNode) {
          updatedNodes[sectorNode.id] = { ...sectorNode, status: 'insurgent_held' };
          notes.push(`БУНТ В РЕГИОНЕ: Напряженность достигла 85%! Объект «${sectorNode.name}» захвачен мятежниками!`);
        }
      } else if (reg.tension >= 65 && Math.random() < 0.5) {
        const sectorMap: Record<RegionId, SectorId> = { capital: 'capital', miners: 'mines', agrarian: 'agrarian', autonomy: 'autonomy' };
        const sec = sectorMap[rId];
        const sectorNode = Object.values(updatedNodes).find((n) => n.sectorId === sec && n.status === 'operational');
        if (sectorNode) {
          updatedNodes[sectorNode.id] = { ...sectorNode, status: 'blocked' };
          notes.push(`ВОЛНЕНИЯ: Объект «${sectorNode.name}» блокирован забастовщиками/протестующими!`);
        }
      }
    });

    if (economy.rubleBudgetMillions <= 5) {
      const randomOpNode = Object.values(updatedNodes).find((n) => n.status === 'operational');
      if (randomOpNode) {
        updatedNodes[randomOpNode.id] = { ...randomOpNode, status: 'damaged' };
        notes.push(`ИЗНОС ОСНОВНЫХ ФОНДОВ: Из-за безденежья объект «${randomOpNode.name}» вышел из строя.`);
      }
    }

    // 7. Key historical incidents
    if (currentMonth === 6) {
      if (updatedNodes.mines_sorting_station?.status === 'operational') {
        updatedNodes.mines_sorting_station = { ...updatedNodes.mines_sorting_station, status: 'blocked' };
        notes.push('ИСТОРИЧЕСКИЙ КРИЗИС (Июль 1989): Всесоюзная шахтерская стачка парализовала станцию "Угольная"!');
      }
    } else if (currentMonth === 12) {
      if (updatedNodes.autonomy_customs_terminal?.status === 'operational') {
        updatedNodes.autonomy_customs_terminal = { ...updatedNodes.autonomy_customs_terminal, status: 'blocked' };
        notes.push('ИСТОРИЧЕСКИЙ КРИЗИС: Таможенный терминал автономии заблокирован!');
      }
    } else if (currentMonth === 19) {
      if (updatedNodes.capital_distrib_base?.status === 'operational') {
        updatedNodes.capital_distrib_base = { ...updatedNodes.capital_distrib_base, status: 'damaged' };
        notes.push('ИСТОРИЧЕСКИЙ КРИЗИС: Товарный голод вызвал погром распределительной базы ГлавТорга!');
      }
    }

    setNodes(updatedNodes);

    // 8. Progress KGB surveillance & Actor Plots
    const updatedActors = { ...actors };
    Object.keys(updatedActors).forEach((id) => {
      const a = { ...updatedActors[id] };

      if (a.surveillance === 'wiretap') {
        a.surveillance = 'infiltrated';
        notes.push(`КГБ: 7-е управление завершило прослушку фигуранта ${a.name}: компромат в сейфе!`);
      }

      if (a.loyalty < 55) {
        a.plotProgress = Math.min(3, a.plotProgress + 1);
      }

      if (a.plotProgress >= 3) {
        a.plotProgress = 0;
        if (a.id === 'koval') {
          if (updatedNodes.mines_sorting_station) {
            updatedNodes.mines_sorting_station = { ...updatedNodes.mines_sorting_station, status: 'blocked' };
          }
          tensionDelta.miners += 20;
          notes.push('ЗАБАСТОВОЧНЫЙ УДАР: Степан Коваль остановил погрузку угля! Напряженность шахтеров +20%.');
        } else if (a.id === 'pozharsky') {
          tensionDelta.capital += 25;
          notes.push('МАССОВЫЙ МИТИНГ: Олег Пожарский вывел толпу на площадь Дома Советов! Столица парализована (+25% tension).');
        } else if (a.id === 'platonov') {
          ecoDelta.rubleBudgetMillions = (ecoDelta.rubleBudgetMillions || 0) - 15;
          ecoDelta.hardCurrencyReserve = (ecoDelta.hardCurrencyReserve || 0) - 5;
          notes.push('ТЕНЕВОЙ САБОТАЖ: Аркадий Платонов увел средства в теневые кооперативы (-15М ₽, -$5М).');
        } else if (a.id === 'gromov') {
          ecoDelta.moscowPlanFulfilled = (ecoDelta.moscowPlanFulfilled || 0) - 15;
          notes.push('ОПЕРАЦИЯ "КРОТ": Виктор Громов направил закрытое донесение в КГБ СССР (-15% доверия Москвы).');
        } else if (a.id === 'voronov') {
          if (updatedNodes.autonomy_garrison_arsenal) {
            updatedNodes.autonomy_garrison_arsenal = { ...updatedNodes.autonomy_garrison_arsenal, status: 'insurgent_held' };
          }
          tensionDelta.autonomy += 25;
          notes.push('МЯТЕЖ ГАРНИЗОНА: Сепаратисты при попустительстве комендатуры захватили арсенал автономии!');
        }
      }

      updatedActors[id] = a;
    });
    setActors(updatedActors);

    // 9. Calculate new economy & tensions
    const newEconomy: RepublicEconomy = {
      rubleBudgetMillions: Math.round((economy.rubleBudgetMillions + (ecoDelta.rubleBudgetMillions || 0)) * 10) / 10,
      shelfSupplyPercent: Math.max(0, Math.min(100, economy.shelfSupplyPercent + (ecoDelta.shelfSupplyPercent || 0))),
      moscowPlanFulfilled: Math.max(0, Math.min(100, economy.moscowPlanFulfilled + (ecoDelta.moscowPlanFulfilled || 0))),
      hardCurrencyReserve: Math.max(0, Math.min(100, economy.hardCurrencyReserve + (ecoDelta.hardCurrencyReserve || 0))),
    };
    setEconomy(newEconomy);

    const nextRegions: Record<RegionId, RegionState> = { ...regions };
    (Object.keys(nextRegions) as RegionId[]).forEach((rId) => {
      const cur = nextRegions[rId];
      const shift = tensionDelta[rId] || 0;
      if (cur.curfewTurns > 0) {
        nextRegions[rId] = { ...cur, curfewTurns: cur.curfewTurns - 1 };
      } else {
        nextRegions[rId] = { ...cur, tension: Math.max(0, Math.min(100, cur.tension + shift)) };
      }
    });
    setRegions(nextRegions);

    // Synchronize stats
    const avgTension =
      (nextRegions.capital.tension + nextRegions.miners.tension + nextRegions.agrarian.tension + nextRegions.autonomy.tension) / 4;

    const controlledActorsCount = Object.values(updatedActors).filter(
      (a) => a.surveillance === 'infiltrated' || a.loyalty >= 70
    ).length;
    const curfewCount = Object.values(nextRegions).filter((r) => r.curfewTurns > 0).length;
    const dynamicKgb = Math.max(0, Math.min(100, 40 + controlledActorsCount * 10 + curfewCount * 8));

    const newStats: Stats = {
      moscow: Math.round(Math.max(0, Math.min(100, newEconomy.moscowPlanFulfilled * 0.7 + (100 - avgTension) * 0.3))),
      people: Math.round(Math.max(0, Math.min(100, newEconomy.shelfSupplyPercent * 0.6 + (100 - avgTension) * 0.4))),
      kgb: dynamicKgb,
      economy: Math.round(Math.max(0, Math.min(100, 30 + newEconomy.rubleBudgetMillions * 0.35 + newEconomy.shelfSupplyPercent * 0.35))),
    };
    setStats(newStats);

    // 10. Check ending conditions
    const ending = determineStrategyEnding(newEconomy, newStats, profile, currentMonth, supportedGkchp);
    if (ending) {
      if (!unlockedEndings.includes(ending.id)) {
        const nextUnlocked = [...unlockedEndings, ending.id];
        setUnlockedEndings(nextUnlocked);
        try {
          localStorage.setItem('asu_unlocked_endings', JSON.stringify(nextUnlocked));
        } catch {}
      }
      setCurrentEnding(ending);
      terminalAudio.updateAdaptiveMusic(false, false);
      if (ending.category === 'defeat') {
        terminalAudio.playEmergencyAlarm();
      } else {
        terminalAudio.playTriumphChime();
      }
      setScreen('ending');
      return;
    }

    // 11. Advance Month
    const nextM = currentMonth + 1;
    if (nextM > 36) {
      const finalEnding =
        determineStrategyEnding(newEconomy, newStats, profile, 36, supportedGkchp) ||
        ALL_ENDINGS.find((e) => e.id === 'wild_field')!;
      if (!unlockedEndings.includes(finalEnding.id)) {
        const nextUnlocked = [...unlockedEndings, finalEnding.id];
        setUnlockedEndings(nextUnlocked);
        try {
          localStorage.setItem('asu_unlocked_endings', JSON.stringify(nextUnlocked));
        } catch {}
      }
      setCurrentEnding(finalEnding);
      terminalAudio.updateAdaptiveMusic(false, false);
      terminalAudio.playTriumphChime();
      setScreen('ending');
      return;
    }

    setCurrentMonth(nextM);
    setAttentionPoints(MAX_ATTENTION_POINTS);
    setCameraFocus('overview');

    const nextCard = getDispatchForMonth(nextM, usedCardIds, activeFlags, nextRegions, newEconomy);
    setUrgentDossier(nextCard);
    setUsedCardIds((prev) => new Set([...prev, nextCard.id]));
    setUrgentDossierResolved(false);
    setLastChoiceStamp(null);

    // Generate incoming call for next month
    const newCall = generateIncomingCall(nextM, updatedNodes, updatedActors, newEconomy);
    setIncomingCall(newCall);

    setLastMonthSummary({
      prevMonth: currentMonth,
      economyChanges: ecoDelta,
      tensionChanges: tensionDelta,
      notes,
    });
    setShowMonthlyReportModal(true);
    terminalAudio.playPaperSlide();
  }, [
    urgentDossierResolved,
    incomingCall,
    actors,
    nodes,
    economy,
    decrees,
    regions,
    stats.kgb,
    profile,
    supportedGkchp,
    unlockedEndings,
    currentMonth,
    usedCardIds,
    activeFlags,
  ]);

  const currentTassNews = useMemo(() => getTassHeadlineForMonth(currentMonth), [currentMonth]);
  const isMuted = terminalAudio.getMuted();

  return (
    <div
      style={phosphorThemeVars as React.CSSProperties}
      className={`w-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-[var(--term-bg)] crt-term-text flex items-center justify-center p-0 md:p-2 select-none ${
        settings.screenCurvature ? 'crt-curve-frame' : ''
      }`}
    >
      {/* Outer Retro CRT Monitor Bezel */}
      <div
        className={`relative w-full h-full max-w-5xl crt-screen-bezel flex flex-col overflow-hidden border border-[var(--term-border-dark)] md:rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.95)] ${
          isEmergency && settings.voltageGlitches ? 'animate-voltage-glitch' : ''
        }`}
      >
        {/* ========================================================= */}
        {/* TOP INFOBAR / HEADER                                      */}
        {/* ========================================================= */}
        {screen === 'game' ? (
          <header className="shrink-0 border-b border-[var(--term-border-dark)] bg-[var(--term-panel)] px-2 py-1 md:py-1.5 flex flex-wrap items-center justify-between text-xs font-mono z-20">
            {/* Left: Date & Turn */}
            <div className="flex items-center space-x-2">
              <span className="font-extrabold crt-term-text text-xs md:text-sm tracking-wide">
                {formatMonthYear(currentMonth)}
              </span>
              <div className="px-2 py-0.5 border border-[var(--term-border)] bg-[var(--term-main)]/10 text-xs font-black">
                ОВ: {attentionPoints}/{MAX_ATTENTION_POINTS}
                <span className="ml-1 tracking-widest text-[var(--term-main)]">
                  {Array.from({ length: MAX_ATTENTION_POINTS }).map((_, i) => (i < attentionPoints ? '■' : '□')).join(' ')}
                </span>
              </div>
            </div>

            {/* Center: Economic Vital Indicators */}
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <div
                className={`flex items-center space-x-1 ${
                  economy.rubleBudgetMillions < 0 ? 'text-[#ff2a00] font-bold' : 'text-[var(--term-main)]'
                }`}
                title="Безналичный баланс республиканской казны"
              >
                <span className="text-[var(--term-dim)] font-semibold">КАЗНА:</span>
                <span className="font-bold">{economy.rubleBudgetMillions}М ₽</span>
              </div>

              <div
                className={`flex items-center space-x-1 ${
                  economy.shelfSupplyPercent <= 25
                    ? 'text-[#ff2a00] font-bold animate-pulse'
                    : economy.shelfSupplyPercent <= 45
                    ? 'text-[#ff9900]'
                    : 'text-[#33ff33]'
                }`}
                title="Наполненность полок магазинов (Дефицит)"
              >
                <span className="text-[var(--term-dim)] font-semibold">ПОЛКИ:</span>
                <span className="font-bold">{economy.shelfSupplyPercent}%</span>
              </div>

              <div
                className={`flex items-center space-x-1 ${
                  economy.moscowPlanFulfilled <= 30
                    ? 'text-[#ff2a00] font-bold animate-pulse'
                    : economy.moscowPlanFulfilled <= 60
                    ? 'text-[#ff9900]'
                    : 'text-[#33ff33]'
                }`}
                title="Выполнение союзного плана поставок (Госплан)"
              >
                <span className="text-[var(--term-dim)] font-semibold">ПЛАН:</span>
                <span className="font-bold">{economy.moscowPlanFulfilled}%</span>
              </div>

              <div className="flex items-center space-x-1 text-[#33ccff]" title="Валютный резерв республики">
                <span className="text-[var(--term-dim)] font-semibold">ВАЛЮТА:</span>
                <span className="font-bold">${economy.hardCurrencyReserve}М</span>
              </div>
            </div>

            {/* Right: Quick Settings & Menu */}
            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={handleToggleSound}
                className="px-2 py-0.5 border border-[var(--term-border)] hover:border-[var(--term-main)] text-[var(--term-main)] cursor-pointer"
                title="Включение / выключение звука"
              >
                {isMuted ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ'}
              </button>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  setScreen('settings');
                }}
                className="px-2 py-0.5 border border-[var(--term-border)] hover:border-[var(--term-main)] text-[var(--term-main)] cursor-pointer"
                title="Параметры терминала"
              >
                ⚙
              </button>
              <button
                onClick={handleReturnToMenu}
                className="px-2 py-0.5 border border-[var(--term-border)] hover:border-[var(--term-main)] text-[var(--term-main)] cursor-pointer"
              >
                МЕНЮ
              </button>
            </div>
          </header>
        ) : (
          <header className="shrink-0 border-b border-[var(--term-border-dark)] bg-[var(--term-panel)] px-3 py-1.5 flex items-center justify-between text-xs font-mono z-20">
            <span className="font-extrabold crt-term-text tracking-wider">
              АСУ «РЕСПУБЛИКА-1989» // СИСТЕМА УПРАВЛЕНИЯ ГОСУДАРСТВОМ
            </span>
            <span className="text-xs text-[var(--term-dim)] font-semibold">СВЯЗЬ: АКТИВНА</span>
          </header>
        )}

        {/* ========================================================= */}
        {/* MAIN BODY VIEWPORT (Strictly 100dvh without outer scroll) */}
        {/* ========================================================= */}
        <main
          className={`flex-1 flex flex-col min-h-0 overflow-hidden relative z-10 ${
            settings.terminalScale === 'compact' ? 'scale-[0.98] origin-center' : ''
          }`}
        >
          {/* ========================================================= */}
          {/* SCREEN: MAIN MENU                                         */}
          {/* ========================================================= */}
          {screen === 'menu' && (
            <div className="flex-1 flex flex-col justify-between py-3 text-center px-4 overflow-y-auto">
              <div className="flex flex-col items-center mt-2">
                <div className="mb-2">
                  <svg width="48" height="48" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_var(--term-glow)]">
                    <polygon
                      points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36"
                      fill="none"
                      stroke="var(--term-main)"
                      strokeWidth="4"
                    />
                    <polygon
                      points="50,15 60,39 85,39 65,55 72,80 50,65 28,80 35,55 15,39 40,39"
                      fill="var(--term-main)"
                      opacity="0.15"
                    />
                    <path
                      d="M 52 42 C 43 40 40 48 42 56 C 44 64 53 66 59 62 L 62 66 C 54 71 42 68 38 57 C 35 46 41 35 53 37 Z"
                      fill="var(--term-main)"
                    />
                    <rect x="42" y="52" width="16" height="4" transform="rotate(-40 46 54)" fill="var(--term-main)" />
                    <rect x="44" y="52" width="4" height="18" transform="rotate(-40 46 54)" fill="var(--term-main)" />
                  </svg>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-widest crt-term-text">
                  АСУ-РЕСПУБЛИКА 1989
                </h1>
                <div className="text-xs text-[var(--term-dim)] font-mono font-semibold tracking-widest mt-1">
                  ПОШАГОВАЯ СТРАТЕГИЯ «КАБИНЕТ ПЕРВОГО СЕКРЕТАРЯ»
                </div>

                <div className="w-full max-w-[340px] flex items-center justify-between my-3 px-2 py-1 border-t border-b border-[var(--term-border)] text-[var(--term-main)] text-xs tracking-widest opacity-80 font-mono">
                  <span>+.-..--.------</span>
                  <span className="inline-block w-3 h-1.5 bg-[var(--term-main)]"></span>
                  <span>.---.</span>
                  <span className="inline-block w-4 h-1.5 bg-[var(--term-main)]"></span>
                  <span>.-.-</span>
                  <span className="inline-block w-2 h-1.5 bg-[var(--term-main)]"></span>
                  <span>----.-+</span>
                </div>
              </div>

              <div className="flex flex-col space-y-3 my-auto px-4 max-w-[380px] mx-auto w-full text-left font-mono">
                <button
                  onClick={() => handleMenuSelect('НАЧАТЬ СЕАНС', 'candidate')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[var(--term-border)] hover:border-[var(--term-main)] hover:bg-[var(--term-main)]/10 transition cursor-pointer text-sm crt-term-text"
                >
                  <span className="font-bold">[1] ЗАНЯТЬ КАБИНЕТ</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">▶</span>
                </button>

                <button
                  onClick={() => handleMenuSelect('АРХИВ ДАННЫХ', 'archive')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[var(--term-border)] hover:border-[var(--term-main)] hover:bg-[var(--term-main)]/10 transition cursor-pointer text-sm crt-term-text"
                >
                  <span className="font-bold">[2] АРХИВ ОСОБЫХ ПАПОК</span>
                  <span className="text-xs text-[var(--term-dim)] group-hover:text-[var(--term-main)] font-semibold transition">
                    [{unlockedEndings.length}/13]
                  </span>
                </button>

                <button
                  onClick={() => handleMenuSelect('НАСТРОЙКИ СИСТЕМЫ', 'settings')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[var(--term-border)] hover:border-[var(--term-main)] hover:bg-[var(--term-main)]/10 transition cursor-pointer text-sm crt-term-text"
                >
                  <span className="font-bold">[3] ПАРАМЕТРЫ ТЕРМИНАЛА</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">⚙</span>
                </button>
              </div>

              <div className="w-full max-w-[380px] mx-auto text-left px-2 py-2 border-t border-[var(--term-border-dark)] font-mono">
                <div className="text-xs crt-term-text flex items-center space-x-1">
                  <span>ВЫБЕРИТЕ РЕЖИМ &gt;</span>
                  <span className="font-bold tracking-wider">{commandInput}</span>
                  <span className="inline-block w-2.5 h-4 bg-[var(--term-main)] animate-pulse">█</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: CANDIDATE SELECTION                               */}
          {/* ========================================================= */}
          {screen === 'candidate' && (
            <div className="flex-1 flex flex-col justify-between p-2 md:p-3 text-xs font-mono overflow-y-auto">
              <div className="border border-[var(--term-border)] bg-[var(--term-panel)] p-3 md:p-4 flex-1 flex flex-col justify-between shadow-[0_0_35px_var(--term-glow)]">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[var(--term-border)] pb-2 mb-2 gap-1">
                    <div>
                      <h2 className="text-xs md:text-sm font-black crt-term-text tracking-wider uppercase">
                        [ КАДРОВЫЙ РЕЗЕРВ ЦК КПСС // УТВЕРЖДЕНИЕ КАНДИДАТУРЫ ]
                      </h2>
                      <div className="text-xs text-[var(--term-dim)] font-semibold">
                        ОТДЕЛ ОРГАНИЗАЦИОННО-ПАРТИЙНОЙ РАБОТЫ • ЛИЧНОЕ ДЕЛО № 89-К
                      </div>
                    </div>
                    <div className="px-2 py-0.5 border border-[#ff2a00] bg-[#ff2a00]/15 text-[#ff2a00] text-xs font-bold tracking-widest uppercase">
                      ★ СОВЕРШЕННО СЕКРЕТНО ★
                    </div>
                  </div>

                  {/* Switcher Tabs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-3">
                    {LEADER_BACKGROUND_LIST.map((bg) => {
                      const isSelected = inspectingBackground === bg.id;
                      return (
                        <button
                          key={bg.id}
                          onClick={() => {
                            terminalAudio.playTeletypeClick();
                            setInspectingBackground(bg.id);
                          }}
                          className={`p-2 border text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-[var(--term-main)] bg-[var(--term-main)]/20 text-[var(--term-main)] font-bold shadow-[0_0_12px_var(--term-glow)]'
                              : 'border-[var(--term-border-dark)] text-[var(--term-dim)] hover:border-[var(--term-main)]/60 hover:text-[var(--term-main)] bg-[var(--term-bg)] font-medium'
                          }`}
                        >
                          <div className="text-xs font-black truncate">{bg.title}</div>
                          <div className="text-[11px] text-[var(--term-dim)] font-semibold truncate mt-0.5">{bg.subtitle.split(',')[0]}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active candidate dossier view */}
                  {(() => {
                    const currentBg = LEADER_BACKGROUNDS[inspectingBackground];
                    const portraitArchetype = BACKGROUND_ARCHETYPES[inspectingBackground];

                    return (
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="w-full md:w-[160px] shrink-0 flex flex-col items-center">
                          <div className="w-full h-[150px] border border-[var(--term-border)] bg-[var(--term-bg)] p-1 flex items-center justify-center relative">
                            <TerminalPortrait
                              archetype={portraitArchetype}
                              phosphorColor={settings.phosphorColor}
                            />
                          </div>
                          <div className="w-full mt-1.5 p-1 border border-[var(--term-border-dark)] bg-[var(--term-bg)] text-center text-[11px] text-[var(--term-dim)] font-bold">
                            ГРИФ: «ОСОБАЯ ПАПКА»
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="border-b border-[var(--term-border-dark)] pb-1">
                            <h3 className="text-sm font-extrabold text-[var(--term-main)]">{currentBg.title}</h3>
                            <div className="text-xs text-[var(--term-dim)] font-bold">{currentBg.subtitle}</div>
                          </div>

                          <div className="p-2 border border-[var(--term-border)] bg-[var(--term-bg)] text-xs leading-relaxed text-[var(--term-main)]">
                            <span className="text-[11px] text-[var(--term-dim)] font-bold block mb-0.5 tracking-wider">
                              ХАРАКТЕРИСТИКА ИЗ СПЕЦХРАНА:
                            </span>
                            {currentBg.dossier}
                          </div>

                          <div className="space-y-1.5">
                            <div className="p-1.5 border border-[#33ff33]/50 bg-[#33ff33]/10 text-[#33ff33] text-xs leading-snug">
                              <span className="font-black">★ ПРЕИМУЩЕСТВО ({currentBg.perkTitle}):</span> {currentBg.perkDesc}
                            </div>
                            <div className="p-1.5 border border-[#ff2a00]/50 bg-[#ff2a00]/10 text-[#ff2a00] text-xs leading-snug">
                              <span className="font-black">▲ РИСК:</span> {currentBg.flawDesc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-3 mt-3 border-t border-[var(--term-border)] flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => startSessionWithBackground(inspectingBackground)}
                    className="flex-1 py-2.5 border-2 border-[var(--term-main)] bg-[var(--term-main)] text-black font-black text-xs md:text-sm hover:opacity-90 tracking-wider transition cursor-pointer shadow-[0_0_15px_var(--term-glow)]"
                  >
                    [ УТВЕРДИТЬ В ДОЛЖНОСТИ ПЕРВОГО СЕКРЕТАРЯ ]
                  </button>
                  <button
                    onClick={handleReturnToMenu}
                    className="px-4 py-2.5 border border-[var(--term-border)] hover:border-[var(--term-main)] text-[var(--term-main)] font-bold text-xs hover:bg-[var(--term-main)]/10 transition cursor-pointer"
                  >
                    В ГЛАВНОЕ МЕНЮ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: BRIEFING TELEGRAM                                 */}
          {/* ========================================================= */}
          {screen === 'briefing' && (
            <div onClick={handleSkipBriefing} className="flex-1 flex flex-col justify-between p-2 md:p-3 cursor-pointer">
              <div className="border border-[var(--term-border)] p-3 md:p-4 bg-[var(--term-panel)] flex-1 flex flex-col justify-between font-mono">
                <div className="space-y-1.5 text-xs md:text-sm leading-relaxed crt-term-text">
                  {briefingLines.slice(0, briefingLineIdx).map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        idx === 0
                          ? 'font-bold text-center tracking-widest border-b border-[var(--term-border)] pb-2 mb-2 text-[var(--term-main)]'
                          : idx < 5
                          ? 'opacity-75 text-xs text-[var(--term-dim)] font-semibold'
                          : 'my-0.5'
                      }
                    >
                      {line}
                    </div>
                  ))}
                  {!briefingDone && <div className="inline-block w-2 h-3.5 bg-[var(--term-main)] animate-pulse">█</div>}
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--term-border)] flex flex-col items-center">
                  {briefingDone ? (
                    <button
                      onClick={handleSkipBriefing}
                      className="w-full py-2.5 border-2 border-[var(--term-main)] bg-[var(--term-main)]/10 hover:bg-[var(--term-main)] hover:text-black text-[var(--term-main)] font-extrabold text-sm tracking-widest transition cursor-pointer"
                    >
                      [ ЗАНЯТЬ РАБОЧИЙ КАБИНЕТ ➔ ]
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--term-dim)] font-semibold tracking-wider animate-pulse">
                      [ КЛИКНИТЕ ДЛЯ УСКОРЕНИЯ ]
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: GAMEPLAY - 2.5D INTERACTIVE CABINET SCENE         */}
          {/* ========================================================= */}
          {screen === 'game' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden font-mono">
              {/* The 2.5D Cabinet Desk Scene Viewport */}
              <div className="flex-1 min-h-0 relative overflow-hidden">
                <CabinetDeskScene
                  cameraFocus={cameraFocus}
                  setCameraFocus={setCameraFocus}
                  currentMonth={currentMonth}
                  attentionPoints={attentionPoints}
                  maxAttentionPoints={MAX_ATTENTION_POINTS}
                  economy={economy}
                  stats={stats}
                  profile={profile}
                  regions={regions}
                  nodes={nodes}
                  actors={actors}
                  decrees={decrees}
                  urgentDossier={urgentDossier}
                  urgentDossierResolved={urgentDossierResolved}
                  lastChoiceStamp={lastChoiceStamp}
                  onResolveDispatch={handleResolveDispatch}
                  onRepairDamagedMoney={handleRepairDamagedMoney}
                  onRepairDamagedShelves={handleRepairDamagedShelves}
                  onResolveBlockedConcession={handleResolveBlockedConcession}
                  onStormInsurgents={handleStormInsurgents}
                  onDeclareCurfew={handleDeclareCurfew}
                  selectedActorId={selectedActorId}
                  setSelectedActorId={setSelectedActorId}
                  onExecuteCallOption={handleExecuteCallOption}
                  incomingCall={incomingCall}
                  onAnswerIncomingCall={handleAnswerIncomingCall}
                  onAuthorizeWiretap={handleAuthorizeWiretap}
                  onFreezeActorAssets={handleFreezeActorAssets}
                  onToggleDecree={handleToggleDecree}
                  phosphorColor={settings.phosphorColor}
                  predictiveHints={settings.predictiveHints}
                />
              </div>

              {/* Bottom Strategy Action Bar */}
              <div className="shrink-0 border-t border-[var(--term-border-dark)] bg-[var(--term-panel)] px-2 py-1.5 flex items-center justify-between gap-2 z-20">
                <div className="flex items-center space-x-2 text-xs font-semibold truncate">
                  {!urgentDossierResolved ? (
                    <span className="text-[#ff2a00] font-bold flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-[#ff2a00] animate-pulse inline-block" />
                      <span>⚠ ТРЕБУЕТСЯ РЕЗОЛЮЦИЯ ПО ДЕПЕШЕ МЕСЯЦА (1 ОВ ИЛИ ПОД СУКНО)</span>
                    </span>
                  ) : (
                    <span className="text-[#33ff33] font-bold flex items-center space-x-1">
                      <span>✓ ДЕПЕША УТВЕРЖДЕНА: {lastChoiceStamp}</span>
                    </span>
                  )}
                  {incomingCall && (
                    <span className="px-1.5 py-0.5 border border-[#ff2a00] bg-[#ff2a00]/20 text-[#ff2a00] font-black animate-pulse">
                      ☎ ЗВОНИТ ВЧ-ВЕРТУШКА!
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {cameraFocus !== 'overview' && (
                    <button
                      onClick={() => {
                        terminalAudio.playSwitchClick();
                        setCameraFocus('overview');
                      }}
                      className="px-2.5 py-1.5 border border-[var(--term-border)] hover:border-[var(--term-main)] text-[var(--term-main)] text-xs font-bold transition cursor-pointer"
                    >
                      [ ◄ К СТОЛУ (ESC) ]
                    </button>
                  )}
                  <button
                    onClick={handleNextMonth}
                    className="px-4 py-1.5 border-2 border-[var(--term-main)] bg-[var(--term-main)] text-black font-black text-xs md:text-sm hover:opacity-90 transition cursor-pointer shadow-[0_0_15px_var(--term-glow)] flex items-center justify-center space-x-1"
                  >
                    <span>[ ЗАВЕРШИТЬ МЕСЯЦ И ПЕРЕЙТИ ДАЛЬШЕ ➔ ]</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: ARCHIVE (13 ENDINGS)                              */}
          {/* ========================================================= */}
          {screen === 'archive' && (
            <div className="flex-1 flex flex-col justify-between p-2 md:p-3 overflow-hidden text-xs font-mono">
              <div className="border border-[var(--term-border)] bg-[var(--term-panel)] p-3 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--term-border)] pb-2 mb-2">
                  <h2 className="text-sm md:text-base font-extrabold crt-term-text">
                    АРХИВ «ОСОБЫХ ПАПОК» ЦК КПСС
                  </h2>
                  <span className="text-[var(--term-dim)] font-semibold">
                    ОТКРЫТО: {unlockedEndings.length} ИЗ 13
                  </span>
                </div>

                {selectedDossier ? (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 border border-[var(--term-border)] text-xs text-[var(--term-main)] font-bold">
                          {selectedDossier.code}
                        </span>
                        <span className="text-xs text-[var(--term-dim)] font-semibold">
                          УСЛОВИЕ: {selectedDossier.trigger}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[var(--term-main)]">{selectedDossier.title}</h3>

                      <div className="p-2 border-2 border-dashed border-[var(--term-main)] text-[var(--term-main)] font-black text-center tracking-widest text-xs md:text-sm">
                        ★ {selectedDossier.stamp} ★
                      </div>

                      <div className="space-y-2 text-xs leading-relaxed text-[var(--term-main)]">
                        <div>
                          <span className="text-[var(--term-dim)] font-bold">ВЕРДИКТ: </span>
                          <span className="font-bold">{selectedDossier.verdict}</span>
                        </div>
                        <p>{selectedDossier.description}</p>
                        <p className="text-[var(--term-dim)] italic border-t border-[var(--term-border-dark)] pt-2">
                          Исторический контекст: {selectedDossier.historicalContext}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDossier(null)}
                      className="mt-4 w-full py-2 border border-[var(--term-border)] hover:border-[var(--term-main)] text-[var(--term-main)] font-bold cursor-pointer"
                    >
                      ◀ ВЕРНУТЬСЯ К СПИСКУ ДОСЬЕ
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {ALL_ENDINGS.map((ending) => {
                      const isUnlocked = unlockedEndings.includes(ending.id);
                      return (
                        <div
                          key={ending.id}
                          onClick={() => {
                            if (isUnlocked) {
                              terminalAudio.playTeletypeClick();
                              setSelectedDossier(ending);
                            }
                          }}
                          className={`p-2 border transition ${
                            isUnlocked
                              ? 'border-[var(--term-border-dark)] hover:border-[var(--term-main)] bg-[var(--term-panel-light)] cursor-pointer'
                              : 'border-[var(--term-border-dark)] opacity-40 cursor-not-allowed bg-[var(--term-bg)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">
                              {isUnlocked ? ending.code : '[ЗАСЕКРЕЧЕНО]'}
                            </span>
                            <span className="text-xs opacity-80 font-semibold">
                              {isUnlocked ? (ending.category === 'grand' ? '★ ФИНАЛ 1991' : '● ДОСРОЧНО') : 'ЗАБЛОКИРОВАНО'}
                            </span>
                          </div>
                          <div className="text-xs font-bold mt-0.5 truncate">
                            {isUnlocked ? ending.title : '••••••••••••••••••••••••••••••'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!selectedDossier && (
                  <button
                    onClick={handleReturnToMenu}
                    className="mt-3 w-full py-2 border border-[var(--term-border)] text-[var(--term-main)] hover:bg-[var(--term-main)] hover:text-black font-bold cursor-pointer"
                  >
                    В ГЛАВНОЕ МЕНЮ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: SYSTEM SETTINGS                                   */}
          {/* ========================================================= */}
          {screen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSettings={handleResetSettings}
              onClearArchive={handleClearArchive}
              onReturn={handleReturnToMenu}
            />
          )}

          {/* ========================================================= */}
          {/* SCREEN: GAME OVER / ENDING                                */}
          {/* ========================================================= */}
          {screen === 'ending' && currentEnding && (
            <div className="flex-1 flex flex-col justify-between p-2 md:p-3 overflow-y-auto text-xs font-mono">
              <div className="border-2 border-[var(--term-border)] bg-[var(--term-panel)] p-3 md:p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--term-border)] pb-2">
                    <span className="font-extrabold text-sm crt-term-text">
                      АРХИВНОЕ ДЕЛО №1991 / {currentEnding.code}
                    </span>
                    <span className="text-xs text-[var(--term-dim)] font-semibold">{formatMonthOnly(currentMonth)}</span>
                  </div>

                  <div
                    className={`p-3 border-4 border-dashed text-center font-black tracking-widest text-sm md:text-base ${
                      currentEnding.category === 'grand'
                        ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/10'
                        : 'border-[var(--term-main)] text-[var(--term-main)] bg-[var(--term-main)]/10'
                    }`}
                  >
                    ★ {currentEnding.stamp} ★
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-[var(--term-main)] mb-1">{currentEnding.title}</h2>
                    <div className="text-xs text-[var(--term-main)] font-bold">
                      ВЕРДИКТ: <span className="underline">{currentEnding.verdict}</span>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm leading-relaxed text-[var(--term-main)]">
                    {currentEnding.description}
                  </p>

                  <div className="p-2 border border-[var(--term-border-dark)] bg-[var(--term-bg)] space-y-1 text-xs">
                    <div className="font-bold text-[var(--term-dim)]">ИТОГОВАЯ СВОДКА ПРАВЛЕНИЯ:</div>
                    <div className="grid grid-cols-2 gap-1 text-[var(--term-main)] font-semibold">
                      <div>ПРОДЕРЖАЛИСЬ: ХОД {currentMonth} ИЗ 36</div>
                      <div>СУВЕРЕНИТЕТ: {profile.sovereignty}%</div>
                      <div>АВТОКРАТИЯ: {profile.autocracy}%</div>
                      <div>РЫНОК: {profile.market}%</div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--term-dim)] italic border-t border-[var(--term-border-dark)] pt-2">
                    Исторический контекст: {currentEnding.historicalContext}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--term-border)] flex space-x-2">
                  <button
                    onClick={() => {
                      terminalAudio.playSwitchClick();
                      setScreen('candidate');
                    }}
                    className="flex-1 py-2.5 border-2 border-[var(--term-main)] bg-[var(--term-main)] text-black font-extrabold text-xs md:text-sm hover:opacity-90 transition cursor-pointer"
                  >
                    [ ОТКРЫТЬ НОВУЮ ПАПКУ ]
                  </button>
                  <button
                    onClick={handleReturnToMenu}
                    className="px-4 py-2.5 border border-[var(--term-border)] text-[var(--term-main)] font-bold text-xs hover:bg-[var(--term-main)]/10 transition cursor-pointer"
                  >
                    В МЕНЮ
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ========================================================= */}
        {/* MONTHLY REPORT TELEGRAM MODAL                             */}
        {/* ========================================================= */}
        {showMonthlyReportModal && lastMonthSummary && (
          <div className="absolute inset-0 bg-black/85 z-40 flex items-center justify-center p-3 font-mono">
            <div className="w-full max-w-lg border-2 border-[var(--term-border)] bg-[var(--term-panel)] p-3 sm:p-4 shadow-[0_0_30px_var(--term-glow)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--term-border)] pb-2">
                <span className="font-extrabold text-xs sm:text-sm crt-term-text">
                  ПРАВИТЕЛЬСТВЕННАЯ ТЕЛЕГРАММА // ИТОГИ МЕСЯЦА
                </span>
                <span className="text-xs text-[var(--term-dim)] font-semibold">
                  {formatMonthOnly(lastMonthSummary.prevMonth)}
                </span>
              </div>

              {/* Economic summary */}
              <div className="p-2 border border-[var(--term-border-dark)] bg-[var(--term-bg)] space-y-1 text-xs">
                <div className="font-bold text-[var(--term-dim)]">СВОДКА ИЗМЕНЕНИЯ ЭКОНОМИКИ:</div>
                <div className="grid grid-cols-2 gap-1 text-[var(--term-main)] font-semibold">
                  <div>
                    Казна:{' '}
                    {lastMonthSummary.economyChanges.rubleBudgetMillions
                      ? `${lastMonthSummary.economyChanges.rubleBudgetMillions > 0 ? '+' : ''}${lastMonthSummary.economyChanges.rubleBudgetMillions}М ₽`
                      : '0М ₽'}
                  </div>
                  <div>
                    Полки:{' '}
                    {lastMonthSummary.economyChanges.shelfSupplyPercent
                      ? `${lastMonthSummary.economyChanges.shelfSupplyPercent > 0 ? '+' : ''}${lastMonthSummary.economyChanges.shelfSupplyPercent}%`
                      : '0%'}
                  </div>
                  <div>
                    Госплан:{' '}
                    {lastMonthSummary.economyChanges.moscowPlanFulfilled
                      ? `${lastMonthSummary.economyChanges.moscowPlanFulfilled > 0 ? '+' : ''}${lastMonthSummary.economyChanges.moscowPlanFulfilled}%`
                      : '0%'}
                  </div>
                  <div>
                    Валюта:{' '}
                    {lastMonthSummary.economyChanges.hardCurrencyReserve
                      ? `${lastMonthSummary.economyChanges.hardCurrencyReserve > 0 ? '+' : ''}$${lastMonthSummary.economyChanges.hardCurrencyReserve}М`
                      : '$0М'}
                  </div>
                </div>
              </div>

              {/* Events & Intelligence notes */}
              {lastMonthSummary.notes.length > 0 && (
                <div className="space-y-1 text-xs text-[var(--term-main)]/90 max-h-36 overflow-y-auto pr-1">
                  <div className="font-bold text-[var(--term-dim)]">ОПЕРАТИВНЫЕ СВОДКИ И ДОНЕСЕНИЯ:</div>
                  {lastMonthSummary.notes.map((n, i) => (
                    <div key={i} className="p-1 border border-[var(--term-border-dark)] bg-[var(--term-bg)]">
                      • {n}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  terminalAudio.playStampPress();
                  setShowMonthlyReportModal(false);
                }}
                className="w-full py-2.5 border-2 border-[var(--term-main)] bg-[var(--term-main)] text-black font-extrabold text-xs sm:text-sm hover:opacity-90 transition cursor-pointer"
              >
                [ ПРИНЯТЬ К СВЕДЕНИЮ // {MAX_ATTENTION_POINTS} ОВ НАЧИСЛЕНО ➔ ]
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GENERIC ACTION MODAL / TOAST NOTIFICATION                 */}
        {/* ========================================================= */}
        {actionNotification && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-3 font-mono">
            <div className="w-full max-w-md border border-[var(--term-border)] bg-[var(--term-panel)] p-4 shadow-[0_0_25px_var(--term-glow)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--term-border)] pb-1.5">
                <span className="font-extrabold text-xs text-[var(--term-main)]">{actionNotification.title}</span>
                {actionNotification.stamp && (
                  <span className="px-1.5 py-0.5 border border-[var(--term-border)] text-xs font-bold text-[var(--term-main)]">
                    {actionNotification.stamp}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-[var(--term-main)]">{actionNotification.text}</p>
              <button
                onClick={() => {
                  terminalAudio.playKeyClick();
                  setActionNotification(null);
                }}
                className="w-full py-2 border border-[var(--term-border)] bg-[var(--term-main)]/15 hover:bg-[var(--term-main)] hover:text-black font-bold text-xs transition cursor-pointer text-[var(--term-main)]"
              >
                [ ЗАКРЫТЬ ]
              </button>
            </div>
          </div>
        )}

        {/* Calm Red Emergency Vignette (Strictly in game when in crisis) */}
        {isEmergency && <div className="absolute inset-0 crt-emergency-vignette z-25 pointer-events-none" />}

        {/* TASS Teletype Ticker Tape */}
        <div className="relative z-20 w-full shrink-0 border-t border-[var(--term-border-dark)] bg-[var(--term-bg)] px-2 py-1.5 flex items-center overflow-hidden font-mono text-xs crt-term-text shadow-[0_0_8px_var(--term-glow)] select-none">
          <span className="shrink-0 font-bold bg-[var(--term-main)]/15 text-[var(--term-main)] px-1.5 py-0.5 border border-[var(--term-border)] mr-2.5 tracking-wider text-[11px] font-bold">
            [ТАСС / СВОДКА]
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center relative min-w-0">
            <div key={currentTassNews} className="inline-flex animate-marquee whitespace-nowrap items-center">
              <span className="pr-12">{currentTassNews}</span>
              <span className="pr-12 text-[var(--term-dim)] font-bold">+++ СВОДКА ТАСС +++</span>
              <span className="pr-12">{currentTassNews}</span>
              <span className="pr-12 text-[var(--term-dim)] font-bold">+++ СВОДКА ТАСС +++</span>
            </div>
          </div>
        </div>

        {/* CRT Scanline Overlay layer */}
        {settings.scanlineDensity !== 'off' && (
          <div
            className={`absolute inset-0 pointer-events-none crt-scanlines z-30 ${
              settings.scanlineDensity === 'low'
                ? 'opacity-15'
                : settings.scanlineDensity === 'med'
                ? 'opacity-30'
                : 'opacity-50'
            }`}
          />
        )}

        {/* CRT Vignette shadow layer */}
        <div className="absolute inset-0 pointer-events-none crt-vignette z-30" />

        {/* Subtle Screen Flicker effect */}
        <div className="absolute inset-0 pointer-events-none animate-crt-flicker z-20" />
      </div>
    </div>
  );
}
