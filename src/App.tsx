/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  StatKey,
  RegionId,
  RegionState,
  LeaderBackgroundId,
  RepublicEconomy,
  InfrastructureNode,
  PoliticalActor,
  StateDecree,
  SectorId,
  ArchetypeId,
  ChoiceImpact,
  SystemSettings,
} from './types';
import { LEADER_BACKGROUNDS, LEADER_BACKGROUND_LIST, BACKGROUND_ARCHETYPES } from './data/backgrounds';
import { createInitialNodes } from './data/nodes';
import { createInitialActors } from './data/actors';
import { createInitialDecrees } from './data/decrees';
import { SettingsScreen } from './components/SettingsScreen';
import { loadSettings, saveSettings, resetToDefaults, getPhosphorTheme } from './services/settingsStorage';

type ScreenMode = 'menu' | 'candidate' | 'briefing' | 'game' | 'archive' | 'settings' | 'ending';
type CabinetModule = 'dispatch' | 'map' | 'hotline' | 'kgb' | 'decrees';

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

const REGION_META: Record<RegionId, { short: string; riotTitle: string }> = {
  capital: { short: 'СТОЛ', riotTitle: 'ОСАДА ДОМА СОВЕТОВ' },
  miners: { short: 'ШАХТ', riotTitle: 'РЕЛЬСОВАЯ БЛОКАДА' },
  agrarian: { short: 'АГР', riotTitle: 'ПРОДОВОЛЬСТВЕННАЯ БЛОКАДА' },
  autonomy: { short: 'АВТ', riotTitle: 'ВООРУЖЕННЫЙ МЯТЕЖ' },
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

function getDispatchForMonth(month: number, usedIds: Set<string>): Card {
  // Fixed historical milestones
  if (month === 1 && !usedIds.has('act1_tobacco_riot')) {
    const c = GAME_CARDS.find((x) => x.id === 'act1_tobacco_riot');
    if (c) return c;
  }
  if (month === 7 && !usedIds.has('act1_miner_strike')) {
    const c = GAME_CARDS.find((x) => x.id === 'act1_miner_strike');
    if (c) return c;
  }
  if (month === 17 && !usedIds.has('act2_declaration_sovereignty')) {
    const c = GAME_CARDS.find((x) => x.id === 'act2_declaration_sovereignty');
    if (c) return c;
  }
  if (month === 25 && !usedIds.has('act3_pavlov_reform')) {
    const c = GAME_CARDS.find((x) => x.id === 'act3_pavlov_reform');
    if (c) return c;
  }
  if (month === 27 && !usedIds.has('act3_referendum_1991')) {
    const c = GAME_CARDS.find((x) => x.id === 'act3_referendum_1991');
    if (c) return c;
  }
  if (month === 32 && !usedIds.has('act3_gkchp_day1_morning')) {
    const c = GAME_CARDS.find((x) => x.id === 'act3_gkchp_day1_morning');
    if (c) return c;
  }
  if (month === 33 && !usedIds.has('act3_gkchp_day2_yeltsin')) {
    const c = GAME_CARDS.find((x) => x.id === 'act3_gkchp_day2_yeltsin');
    if (c) return c;
  }
  if (month === 36 && !usedIds.has('act4_belovezha_finale')) {
    const c = GAME_CARDS.find((x) => x.id === 'act4_belovezha_finale');
    if (c) return c;
  }

  // Act selection
  const targetAct = month <= 9 ? 1 : month <= 18 ? 2 : month <= 28 ? 3 : 4;
  const availableInAct = GAME_CARDS.filter((c) => c.act === targetAct && !usedIds.has(c.id));
  if (availableInAct.length > 0) return availableInAct[0];

  const anyAvailable = GAME_CARDS.filter((c) => !usedIds.has(c.id));
  if (anyAvailable.length > 0) return anyAvailable[0];

  return GAME_CARDS[0];
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
  const [attentionPoints, setAttentionPoints] = useState<number>(3);
  const [economy, setEconomy] = useState<RepublicEconomy>(() => getInitialEconomy('apparatchik'));
  const [stats, setStats] = useState<Stats>({ moscow: 65, people: 40, economy: 50, kgb: 50 });
  const [profile, setProfile] = useState<PoliticalProfile>({ sovereignty: 20, autocracy: 50, market: 25 });
  const [regions, setRegions] = useState<Record<RegionId, RegionState>>(INITIAL_REGIONS);
  const [nodes, setNodes] = useState<Record<string, InfrastructureNode>>(createInitialNodes);
  const [actors, setActors] = useState<Record<string, PoliticalActor>>(createInitialActors);
  const [decrees, setDecrees] = useState<StateDecree[]>(createInitialDecrees);

  // Active module in cabinet
  const [activeModule, setActiveModule] = useState<CabinetModule>('dispatch');

  // Monthly Urgent Dispatch
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());
  const [urgentDossier, setUrgentDossier] = useState<Card | null>(null);
  const [urgentDossierResolved, setUrgentDossierResolved] = useState<boolean>(false);
  const [lastChoiceStamp, setLastChoiceStamp] = useState<string | null>(null);

  // Selected actor for ВЧ-связь & КГБ
  const [selectedActorId, setSelectedActorId] = useState<string>('koval');

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
      'Каждый месяц вы получаете 3 Очка Внимания (ОВ) для директив, ВЧ-связи и агентуры КГБ.',
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
    setAttentionPoints(3);
    setUsedCardIds(new Set());
    setSupportedGkchp(false);

    // Initial urgent dispatch
    const firstCard = getDispatchForMonth(1, new Set());
    setUrgentDossier(firstCard);
    setUsedCardIds(new Set([firstCard.id]));
    setUrgentDossierResolved(false);
    setLastChoiceStamp(null);

    setActiveModule('dispatch');
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

  // Handle return to menu
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

  // Menu typing simulator with teletypeSpeed support
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

  // Urgent Dispatch resolution (Does NOT cost AP)
  const handleResolveDispatch = useCallback(
    (choice: 'left' | 'right') => {
      if (!urgentDossier || urgentDossierResolved) return;
      const c = urgentDossier;
      const ch = choice === 'left' ? c.leftChoice : c.rightChoice;

      // Track GKCHP alignment
      if (c.id === 'act3_gkchp_day1_morning') {
        if (choice === 'left') setSupportedGkchp(true);
        else setSupportedGkchp(false);
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
        `${formatMonthOnly(currentMonth)}: По депеше «${c.senderTitle}» утверждено: [${ch.label}]. ${ch.effectNote || ''}`,
      ]);
    },
    [urgentDossier, urgentDossierResolved, currentMonth]
  );

  // Spend Action Point Helper
  const spendAP = useCallback(
    (cost: number = 1): boolean => {
      if (attentionPoints < cost) {
        setActionNotification({
          title: 'ДЕФИЦИТ ОЧКОВ ВНИМАНИЯ (ОВ)',
          text: 'Лимит внимания Первого секретаря на текущий месяц исчерпан (0 ОВ). Для восстановления ресурса перейдите к следующему месяцу.',
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

  // Repair / Unblock Infrastructure Node (Module 2)
  const handleRepairNode = useCallback(
    (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node || node.status === 'operational') return;

      const rubleCost = 8;
      if (economy.rubleBudgetMillions < rubleCost) {
        setActionNotification({
          title: 'НЕДОСТАТОЧНО СРЕДСТВ',
          text: `Для ликвидации сбоя на объекте «${node.name}» требуется 8 млн руб. В республиканском бюджете не хватает безналичных средств.`,
          stamp: 'БЮДЖЕТНЫЙ ТУПИК',
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
        [nodeId]: {
          ...prev[nodeId],
          status: 'operational',
        },
      }));

      terminalAudio.playDirectiveLaunch();
      setActionNotification({
        title: 'ОБЪЕКТ ВОССТАНОВЛЕН',
        text: `АСУ направила ремонтные бригады и резервные фонды (-8 млн руб, 1 ОВ). Объект «${node.name}» возвращен в штатный режим эксплуатации.`,
        stamp: 'ВВЕДЕНО В СТРОЙ',
      });

      setMonthlyLog((prev) => [
        ...prev,
        `${formatMonthOnly(currentMonth)}: Ликвидирован сбой на объекте «${node.name}» (-8 млн руб, 1 ОВ).`,
      ]);
    },
    [nodes, economy.rubleBudgetMillions, spendAP, currentMonth]
  );

  // Execute Hotline call option (Module 3)
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
            text: `Шантаж невозможен: 7-е управление КГБ еще не предоставило доказательств по фигуранту ${actor.name}. Сначала санкционируйте прослушку в Модуле 4.`,
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

      // Apply resource costs
      setEconomy((prev) => ({
        ...prev,
        rubleBudgetMillions: opt.rubleCost ? Math.round((prev.rubleBudgetMillions - opt.rubleCost) * 10) / 10 : prev.rubleBudgetMillions,
        hardCurrencyReserve: opt.currencyCost ? Math.max(0, prev.hardCurrencyReserve - opt.currencyCost) : prev.hardCurrencyReserve,
      }));

      // Apply actor loyalty & influence shifts
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

      // Special action chain effects
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

  // Authorize KGB Wiretap (Module 4)
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

  // Toggle State Decree (Module 5)
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
        text: 'Вы не можете закрыть месяц, не приняв решение по обязательной Депеше Месяца! Перейдите в Модуль 1 и поставьте резолюцию.',
        stamp: 'ДЕПЕША НЕ ПОДПИСАНА',
      });
      setActiveModule('dispatch');
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

    // 1. Infrastructure chain reactions
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

    // 2. Active decrees monthly impact
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

    // 3. Historical incidents at key months
    if (currentMonth === 6) {
      if (updatedNodes.mines_sorting_station.status === 'operational') {
        updatedNodes.mines_sorting_station = { ...updatedNodes.mines_sorting_station, status: 'blocked' };
        notes.push('СТИХИЙНАЯ СТАЧКА: горняки перекрыли подъездные пути станции "Угольная"!');
      }
    } else if (currentMonth === 12) {
      if (updatedNodes.autonomy_customs_terminal.status === 'operational') {
        updatedNodes.autonomy_customs_terminal = { ...updatedNodes.autonomy_customs_terminal, status: 'blocked' };
        notes.push('БЕСПОРЯДКИ НА ПЕРИФЕРИИ: таможенный терминал заблокирован радикалами.');
      }
    } else if (currentMonth === 19) {
      if (updatedNodes.capital_distrib_base.status === 'operational') {
        updatedNodes.capital_distrib_base = { ...updatedNodes.capital_distrib_base, status: 'damaged' };
        notes.push('ДЕФИЦИТНЫЙ БУНТ: склады ГлавТорга осаждены тысячами покупателей.');
      }
    }

    setNodes(updatedNodes);

    // 4. Progress KGB surveillance
    setActors((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        const a = updated[id];
        if (a.surveillance === 'wiretap') {
          updated[id] = {
            ...a,
            surveillance: 'infiltrated',
            unlockedKompromat: a.unlockedKompromat.map((k) => ({ ...k })),
          };
          notes.push(`7-е управление КГБ завершило разработку по фигуранту ${a.name}: получены улики!`);
        }
      });
      return updated;
    });

    // 5. Calculate new economy & tensions
    const newEconomy: RepublicEconomy = {
      rubleBudgetMillions: Math.round((economy.rubleBudgetMillions + (ecoDelta.rubleBudgetMillions || 0)) * 10) / 10,
      shelfSupplyPercent: Math.max(0, Math.min(100, economy.shelfSupplyPercent + (ecoDelta.shelfSupplyPercent || 0))),
      moscowPlanFulfilled: Math.max(0, Math.min(100, economy.moscowPlanFulfilled + (ecoDelta.moscowPlanFulfilled || 0))),
      hardCurrencyReserve: Math.max(0, Math.min(100, economy.hardCurrencyReserve + (ecoDelta.hardCurrencyReserve || 0))),
    };

    setEconomy(newEconomy);

    setRegions((prev) => {
      const next: Record<RegionId, RegionState> = { ...prev };
      (Object.keys(next) as RegionId[]).forEach((rId) => {
        const cur = next[rId];
        const shift = tensionDelta[rId] || 0;
        let newTension = cur.tension + shift;
        if (cur.curfewTurns > 0) {
          newTension = cur.tension;
          next[rId] = { ...cur, curfewTurns: cur.curfewTurns - 1, tension: Math.max(0, Math.min(100, newTension)) };
        } else {
          next[rId] = { ...cur, tension: Math.max(0, Math.min(100, newTension)) };
        }
      });
      return next;
    });

    // Synchronize stats
    const avgTension =
      (regions.capital.tension + regions.miners.tension + regions.agrarian.tension + regions.autonomy.tension) / 4;

    const newStats: Stats = {
      moscow: Math.round(Math.max(0, Math.min(100, newEconomy.moscowPlanFulfilled * 0.7 + (100 - avgTension) * 0.3))),
      people: Math.round(Math.max(0, Math.min(100, newEconomy.shelfSupplyPercent * 0.6 + (100 - avgTension) * 0.4))),
      kgb: stats.kgb,
      economy: Math.round(Math.max(0, Math.min(100, 30 + newEconomy.rubleBudgetMillions * 0.35 + newEconomy.shelfSupplyPercent * 0.35))),
    };
    setStats(newStats);

    // 6. Check ending condition
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

    // 7. Advance Month
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
    setAttentionPoints(3);

    const nextCard = getDispatchForMonth(nextM, usedCardIds);
    setUrgentDossier(nextCard);
    setUsedCardIds((prev) => new Set([...prev, nextCard.id]));
    setUrgentDossierResolved(false);
    setLastChoiceStamp(null);

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
    nodes,
    decrees,
    currentMonth,
    economy,
    regions,
    stats.kgb,
    profile,
    supportedGkchp,
    unlockedEndings,
    usedCardIds,
  ]);

  const currentTassNews = useMemo(() => getTassHeadlineForMonth(currentMonth), [currentMonth]);

  const brokenNodesCount = useMemo(() => {
    return Object.values(nodes).filter((n) => n.status !== 'operational').length;
  }, [nodes]);

  const activeDecreesCount = useMemo(() => {
    return decrees.filter((d) => d.active).length;
  }, [decrees]);

  const isMuted = terminalAudio.getMuted();

  return (
    <div
      style={phosphorThemeVars as React.CSSProperties}
      className={`w-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#0a0603] crt-term-text flex items-center justify-center p-0 md:p-2 select-none ${
        settings.screenCurvature ? 'crt-curve-frame' : ''
      }`}
    >
      {/* Outer Retro CRT Monitor Bezel */}
      <div
        className={`relative w-full h-full max-w-5xl crt-screen-bezel flex flex-col overflow-hidden border border-[#3d2607] md:rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.95)] ${
          isEmergency && settings.voltageGlitches ? 'animate-voltage-glitch' : ''
        }`}
      >
        {/* ========================================================= */}
        {/* TOP INFOBAR / HEADER                                      */}
        {/* ========================================================= */}
        {screen === 'game' ? (
          <header className="shrink-0 border-b border-[#3d2607] bg-[#100a04] px-2 py-1 md:py-1.5 flex flex-wrap items-center justify-between text-xs font-mono z-20">
            {/* Left: Date & Turn */}
            <div className="flex items-center space-x-2">
              <span className="font-extrabold crt-term-text text-xs md:text-sm tracking-wide">
                {formatMonthYear(currentMonth)}
              </span>
              <div className="px-2 py-0.5 border border-[#ffb000] bg-[#ffb000]/10 text-[10px] md:text-xs font-black">
                ОВ: {attentionPoints}/3
                <span className="ml-1 tracking-widest text-[#ffb000]">
                  {[0, 1, 2].map((i) => (i < attentionPoints ? '■' : '□')).join(' ')}
                </span>
              </div>
            </div>

            {/* Center: Economic Vital Indicators */}
            <div className="flex items-center space-x-3 text-[10px] md:text-xs">
              <div
                className={`flex items-center space-x-1 ${
                  economy.rubleBudgetMillions < 0 ? 'text-[#ff2a00] font-bold' : 'text-[#ffb000]'
                }`}
                title="Безналичный баланс республиканской казны"
              >
                <span className="text-[#8c5b0f]">КАЗНА:</span>
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
                <span className="text-[#8c5b0f]">ПОЛКИ:</span>
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
                <span className="text-[#8c5b0f]">ПЛАН:</span>
                <span className="font-bold">{economy.moscowPlanFulfilled}%</span>
              </div>

              <div className="flex items-center space-x-1 text-[#33ccff]" title="Валютный резерв республики">
                <span className="text-[#8c5b0f]">ВАЛЮТА:</span>
                <span className="font-bold">${economy.hardCurrencyReserve}М</span>
              </div>
            </div>

            {/* Right: Quick Settings & Menu */}
            <div className="flex items-center space-x-1 text-[10px]">
              <button
                onClick={handleToggleSound}
                className="px-2 py-0.5 border border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] cursor-pointer"
                title="Включение / выключение звука"
              >
                {isMuted ? 'ЗВУК: ВЫКЛ' : 'ЗВУК: ВКЛ'}
              </button>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  setScreen('settings');
                }}
                className="px-2 py-0.5 border border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] cursor-pointer"
                title="Параметры терминала"
              >
                ⚙
              </button>
              <button
                onClick={handleReturnToMenu}
                className="px-2 py-0.5 border border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] cursor-pointer"
              >
                МЕНЮ
              </button>
            </div>
          </header>
        ) : (
          <header className="shrink-0 border-b border-[#3d2607] bg-[#100a04] px-3 py-1.5 flex items-center justify-between text-xs font-mono z-20">
            <span className="font-extrabold crt-term-text tracking-wider">
              АСУ «РЕСПУБЛИКА-1989» // СИСТЕМА УПРАВЛЕНИЯ ГОСУДАРСТВОМ
            </span>
            <span className="text-[10px] text-[#8c5b0f]">СВЯЗЬ: АКТИВНА</span>
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
                  <svg width="48" height="48" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(255,176,0,0.6)]">
                    <polygon
                      points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36"
                      fill="none"
                      stroke="var(--term-color, #ffb000)"
                      strokeWidth="4"
                    />
                    <polygon
                      points="50,15 60,39 85,39 65,55 72,80 50,65 28,80 35,55 15,39 40,39"
                      fill="var(--term-color, #ffb000)"
                      opacity="0.15"
                    />
                    <path
                      d="M 52 42 C 43 40 40 48 42 56 C 44 64 53 66 59 62 L 62 66 C 54 71 42 68 38 57 C 35 46 41 35 53 37 Z"
                      fill="var(--term-color, #ffb000)"
                    />
                    <rect x="42" y="52" width="16" height="4" transform="rotate(-40 46 54)" fill="var(--term-color, #ffb000)" />
                    <rect x="44" y="52" width="4" height="18" transform="rotate(-40 46 54)" fill="var(--term-color, #ffb000)" />
                  </svg>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-widest crt-term-text">
                  АСУ-РЕСПУБЛИКА 1989
                </h1>
                <div className="text-xs text-[#8c5b0f] font-mono tracking-widest mt-1">
                  ПОШАГОВАЯ СТРАТЕГИЯ «КАБИНЕТ ПЕРВОГО СЕКРЕТАРЯ»
                </div>

                <div className="w-full max-w-[340px] flex items-center justify-between my-3 px-2 py-1 border-t border-b border-[#6e470b] text-[#ffb000] text-[10px] md:text-xs tracking-widest opacity-80 font-mono">
                  <span>+.-..--.------</span>
                  <span className="inline-block w-3 h-1.5 bg-[#ffb000]"></span>
                  <span>.---.</span>
                  <span className="inline-block w-4 h-1.5 bg-[#ffb000]"></span>
                  <span>.-.-</span>
                  <span className="inline-block w-2 h-1.5 bg-[#ffb000]"></span>
                  <span>----.-+</span>
                </div>
              </div>

              <div className="flex flex-col space-y-3 my-auto px-4 max-w-[380px] mx-auto w-full text-left font-mono">
                <button
                  onClick={() => handleMenuSelect('НАЧАТЬ СЕАНС', 'candidate')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[#6e470b] hover:border-[#ffb000] hover:bg-[#ffb000]/10 transition cursor-pointer text-sm crt-term-text"
                >
                  <span className="font-bold">[1] ЗАНЯТЬ КАБИНЕТ</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">▶</span>
                </button>

                <button
                  onClick={() => handleMenuSelect('АРХИВ ДАННЫХ', 'archive')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[#6e470b] hover:border-[#ffb000] hover:bg-[#ffb000]/10 transition cursor-pointer text-sm crt-term-text"
                >
                  <span className="font-bold">[2] АРХИВ ОСОБЫХ ПАПОК</span>
                  <span className="text-xs text-[#8c5b0f] group-hover:text-[#ffb000] transition">
                    [{unlockedEndings.length}/13]
                  </span>
                </button>

                <button
                  onClick={() => handleMenuSelect('НАСТРОЙКИ СИСТЕМЫ', 'settings')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[#6e470b] hover:border-[#ffb000] hover:bg-[#ffb000]/10 transition cursor-pointer text-sm crt-term-text"
                >
                  <span className="font-bold">[3] ПАРАМЕТРЫ ТЕРМИНАЛА</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">⚙</span>
                </button>
              </div>

              <div className="w-full max-w-[380px] mx-auto text-left px-2 py-2 border-t border-[#3d2607] font-mono">
                <div className="text-xs crt-term-text flex items-center space-x-1">
                  <span>ВЫБЕРИТЕ РЕЖИМ &gt;</span>
                  <span className="font-bold tracking-wider">{commandInput}</span>
                  <span className="inline-block w-2.5 h-4 bg-[#ffb000] animate-pulse">█</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: CANDIDATE SELECTION                               */}
          {/* ========================================================= */}
          {screen === 'candidate' && (
            <div className="flex-1 flex flex-col justify-between p-2 md:p-3 text-xs font-mono overflow-y-auto">
              <div className="border border-[#ffb000] bg-[#100a04] p-3 md:p-4 flex-1 flex flex-col justify-between shadow-[0_0_35px_rgba(255,176,0,0.2)]">
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#6e470b] pb-2 mb-2 gap-1">
                    <div>
                      <h2 className="text-xs md:text-sm font-black crt-term-text tracking-wider uppercase">
                        [ КАДРОВЫЙ РЕЗЕРВ ЦК КПСС // УТВЕРЖДЕНИЕ КАНДИДАТУРЫ ]
                      </h2>
                      <div className="text-[9px] text-[#8c5b0f]">
                        ОТДЕЛ ОРГАНИЗАЦИОННО-ПАРТИЙНОЙ РАБОТЫ • ЛИЧНОЕ ДЕЛО № 89-К
                      </div>
                    </div>
                    <div className="px-2 py-0.5 border border-[#ff2a00] bg-[#ff2a00]/15 text-[#ff2a00] text-[9px] font-bold tracking-widest uppercase">
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
                              ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000] font-bold shadow-[0_0_12px_rgba(255,176,0,0.3)]'
                              : 'border-[#4a341b] text-[#8c5b0f] hover:border-[#ffb000]/60 hover:text-[#ffb000] bg-[#0c0803]'
                          }`}
                        >
                          <div className="text-[10px] md:text-[11px] font-black truncate">{bg.title}</div>
                          <div className="text-[8.5px] text-[#8c5b0f] truncate mt-0.5">{bg.subtitle.split(',')[0]}</div>
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
                          <div className="w-full h-[150px] border border-[#ffb000] bg-[#0a0603] p-1 flex items-center justify-center relative">
                            <TerminalPortrait
                              archetype={portraitArchetype}
                              phosphorColor={settings.phosphorColor}
                            />
                          </div>
                          <div className="w-full mt-1.5 p-1 border border-[#3d2607] bg-[#080502] text-center text-[8.5px] text-[#8c5b0f]">
                            ГРИФ: «ОСОБАЯ ПАПКА»
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="border-b border-[#3d2607] pb-1">
                            <h3 className="text-sm font-extrabold text-[#ffb000]">{currentBg.title}</h3>
                            <div className="text-[10px] text-[#8c5b0f] font-bold">{currentBg.subtitle}</div>
                          </div>

                          <div className="p-2 border border-[#6e470b] bg-[#0d0904] text-[10.5px] leading-relaxed text-[#ffb000]">
                            <span className="text-[9px] text-[#8c5b0f] font-bold block mb-0.5 tracking-wider">
                              ХАРАКТЕРИСТИКА ИЗ СПЕЦХРАНА:
                            </span>
                            {currentBg.dossier}
                          </div>

                          <div className="space-y-1.5">
                            <div className="p-1.5 border border-[#33ff33]/50 bg-[#33ff33]/10 text-[#33ff33] text-[10px] leading-snug">
                              <span className="font-black">★ ПРЕИМУЩЕСТВО ({currentBg.perkTitle}):</span> {currentBg.perkDesc}
                            </div>
                            <div className="p-1.5 border border-[#ff2a00]/50 bg-[#ff2a00]/10 text-[#ff2a00] text-[10px] leading-snug">
                              <span className="font-black">▲ РИСК:</span> {currentBg.flawDesc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-3 mt-3 border-t border-[#6e470b] flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => startSessionWithBackground(inspectingBackground)}
                    className="flex-1 py-2.5 border-2 border-[#ffb000] bg-[#ffb000] text-black font-black text-xs md:text-sm hover:bg-[#ffb000]/80 tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(255,176,0,0.4)]"
                  >
                    [ УТВЕРДИТЬ В ДОЛЖНОСТИ ПЕРВОГО СЕКРЕТАРЯ ]
                  </button>
                  <button
                    onClick={handleReturnToMenu}
                    className="px-4 py-2.5 border border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] font-bold text-xs hover:bg-[#ffb000]/10 transition cursor-pointer"
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
              <div className="border border-[#ffb000] p-3 md:p-4 bg-[#0e0904] flex-1 flex flex-col justify-between font-mono">
                <div className="space-y-1.5 text-xs md:text-sm leading-relaxed crt-term-text">
                  {briefingLines.slice(0, briefingLineIdx).map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        idx === 0
                          ? 'font-bold text-center tracking-widest border-b border-[#6e470b] pb-2 mb-2 text-[#ffb000]'
                          : idx < 5
                          ? 'opacity-70 text-[10px]'
                          : 'my-0.5'
                      }
                    >
                      {line}
                    </div>
                  ))}
                  {!briefingDone && <div className="inline-block w-2 h-3.5 bg-[#ffb000] animate-pulse">█</div>}
                </div>

                <div className="mt-3 pt-2 border-t border-[#6e470b] flex flex-col items-center">
                  {briefingDone ? (
                    <button
                      onClick={handleSkipBriefing}
                      className="w-full py-2.5 border-2 border-[#ffb000] bg-[#ffb000]/10 hover:bg-[#ffb000] hover:text-black font-extrabold text-sm tracking-widest transition cursor-pointer"
                    >
                      [ ЗАНЯТЬ РАБОЧИЙ КАБИНЕТ ➔ ]
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#8c5b0f] tracking-wider animate-pulse">
                      [ КЛИКНИТЕ ДЛЯ УСКОРЕНИЯ ]
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: GAMEPLAY - CABINET STRATEGY INTERFACE             */}
          {/* ========================================================= */}
          {screen === 'game' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden font-mono">
              {/* 5-Module Cabinet Switcher Tabs */}
              <nav className="shrink-0 flex items-center border-b border-[#3d2607] bg-[#0e0904] px-1 py-1 gap-1 overflow-x-auto text-[10px] sm:text-[11px]">
                <button
                  onClick={() => {
                    terminalAudio.playSwitchToggle();
                    setActiveModule('dispatch');
                  }}
                  className={`px-2.5 py-1.5 border transition cursor-pointer font-bold flex items-center space-x-1 ${
                    activeModule === 'dispatch'
                      ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000]'
                      : 'border-[#3d2607] text-[#8c5b0f] hover:border-[#ffb000]/50 hover:text-[#ffb000]'
                  }`}
                >
                  <span>1. ДЕПЕША</span>
                  {!urgentDossierResolved && (
                    <span className="w-2 h-2 rounded-full bg-[#ff2a00] animate-pulse" title="Требуется решение!" />
                  )}
                </button>

                <button
                  onClick={() => {
                    terminalAudio.playSwitchToggle();
                    setActiveModule('map');
                  }}
                  className={`px-2.5 py-1.5 border transition cursor-pointer font-bold flex items-center space-x-1 ${
                    activeModule === 'map'
                      ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000]'
                      : 'border-[#3d2607] text-[#8c5b0f] hover:border-[#ffb000]/50 hover:text-[#ffb000]'
                  }`}
                >
                  <span>2. КАРТА И УЗЛЫ</span>
                  {brokenNodesCount > 0 && (
                    <span className="px-1 bg-[#ff2a00]/30 border border-[#ff2a00] text-[#ff2a00] text-[8.5px] rounded">
                      {brokenNodesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    terminalAudio.playSwitchToggle();
                    setActiveModule('hotline');
                  }}
                  className={`px-2.5 py-1.5 border transition cursor-pointer font-bold ${
                    activeModule === 'hotline'
                      ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000]'
                      : 'border-[#3d2607] text-[#8c5b0f] hover:border-[#ffb000]/50 hover:text-[#ffb000]'
                  }`}
                >
                  3. ВЧ-СВЯЗЬ
                </button>

                <button
                  onClick={() => {
                    terminalAudio.playSwitchToggle();
                    setActiveModule('kgb');
                  }}
                  className={`px-2.5 py-1.5 border transition cursor-pointer font-bold ${
                    activeModule === 'kgb'
                      ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000]'
                      : 'border-[#3d2607] text-[#8c5b0f] hover:border-[#ffb000]/50 hover:text-[#ffb000]'
                  }`}
                >
                  4. КАБИНЕТ КГБ
                </button>

                <button
                  onClick={() => {
                    terminalAudio.playSwitchToggle();
                    setActiveModule('decrees');
                  }}
                  className={`px-2.5 py-1.5 border transition cursor-pointer font-bold flex items-center space-x-1 ${
                    activeModule === 'decrees'
                      ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000]'
                      : 'border-[#3d2607] text-[#8c5b0f] hover:border-[#ffb000]/50 hover:text-[#ffb000]'
                  }`}
                >
                  <span>5. ПОСТАНОВЛЕНИЯ</span>
                  {activeDecreesCount > 0 && (
                    <span className="px-1 bg-[#33ff33]/20 border border-[#33ff33] text-[#33ff33] text-[8.5px] rounded">
                      {activeDecreesCount}
                    </span>
                  )}
                </button>
              </nav>

              {/* Module Content Container */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 relative">
                {/* -------------------------------------------------- */}
                {/* MODULE 1: ДЕПЕША МЕСЯЦА                            */}
                {/* -------------------------------------------------- */}
                {activeModule === 'dispatch' && urgentDossier && (
                  <div className="h-full flex flex-col justify-between max-w-2xl mx-auto space-y-2">
                    <div className="border border-[#6e470b] bg-[#110b06] p-3 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Dispatch Top Meta */}
                        <div className="flex items-center justify-between border-b border-[#3d2607] pb-1.5 mb-2 text-[10px]">
                          <span className="text-[#8c5b0f]">{urgentDossier.actTitle}</span>
                          <span className="px-1.5 py-0.5 border border-[#ffb000]/40 text-[#ffb000]">
                            РЕГИОН: {urgentDossier.region ? REGION_META[urgentDossier.region].short : 'РЕСПУБЛИКА'}
                          </span>
                        </div>

                        {/* Title & Sender */}
                        <h2 className="text-sm md:text-base font-extrabold text-[#ffb000] mb-2 tracking-wide">
                          {urgentDossier.senderTitle}
                        </h2>

                        {/* Portrait & Text */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start my-2">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 border border-[#ffb000] bg-[#0c0803] p-0.5">
                            <TerminalPortrait
                              archetype={urgentDossier.archetype}
                              isEmergency={urgentDossier.isCrisis}
                              phosphorColor={settings.phosphorColor}
                            />
                          </div>
                          <div className="flex-1 text-xs md:text-sm leading-relaxed text-[#ffb000]/95 font-mono">
                            {urgentDossier.text}
                          </div>
                        </div>
                      </div>

                      {/* Choices / Stamped Resolution */}
                      <div className="mt-3 pt-2 border-t border-[#3d2607]">
                        {urgentDossierResolved ? (
                          <div className="p-3 border-2 border-dashed border-[#33ff33] bg-[#33ff33]/10 text-center space-y-1">
                            <div className="text-xs md:text-sm font-black text-[#33ff33] tracking-wider">
                              ★ [РЕЗОЛЮЦИЯ УТВЕРЖДЕНА: {lastChoiceStamp}] ★
                            </div>
                            <div className="text-[10px] text-[#ffb000] opacity-80">
                              Решение принято к исполнению. Вы можете распорядиться оставшимися ОВ в других модулях или
                              перейти к следующему месяцу.
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-[10px] text-[#8c5b0f] font-bold text-center tracking-wider">
                              РЕЗОЛЮЦИЯ ПЕРВОГО СЕКРЕТАРЯ (РЕШЕНИЕ НЕ ТРАТИТ ОВ):
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Left Choice Button */}
                              <button
                                onClick={() => handleResolveDispatch('left')}
                                className="p-2.5 border border-[#ffb000] bg-[#ffb000]/10 hover:bg-[#ffb000] hover:text-black transition text-left cursor-pointer group"
                              >
                                <div className="font-extrabold text-xs text-[#ffb000] group-hover:text-black">
                                  [А] {urgentDossier.leftChoice.label}
                                </div>
                                {urgentDossier.leftChoice.effectNote && (
                                  <div className="text-[9.5px] text-[#8c5b0f] group-hover:text-black/80 mt-1">
                                    {urgentDossier.leftChoice.effectNote}
                                  </div>
                                )}
                                {/* Predictive hints modifiers */}
                                {settings.predictiveHints && (
                                  <div className="mt-1 pt-1 border-t border-[#3d2607]/80 text-[8.5px] text-[#33ff33] group-hover:text-black/90 font-mono space-x-1">
                                    {urgentDossier.leftChoice.economy?.shelfSupplyPercent !== undefined && (
                                      <span>Полки {urgentDossier.leftChoice.economy.shelfSupplyPercent > 0 ? '+' : ''}{urgentDossier.leftChoice.economy.shelfSupplyPercent}%</span>
                                    )}
                                    {urgentDossier.leftChoice.economy?.rubleBudgetMillions !== undefined && (
                                      <span>Казна {urgentDossier.leftChoice.economy.rubleBudgetMillions > 0 ? '+' : ''}{urgentDossier.leftChoice.economy.rubleBudgetMillions}М ₽</span>
                                    )}
                                    {urgentDossier.leftChoice.profile?.sovereignty !== undefined && (
                                      <span>Суверенитет +{urgentDossier.leftChoice.profile.sovereignty}%</span>
                                    )}
                                  </div>
                                )}
                              </button>

                              {/* Right Choice Button */}
                              <button
                                onClick={() => handleResolveDispatch('right')}
                                className="p-2.5 border border-[#ffb000] bg-[#ffb000]/10 hover:bg-[#ffb000] hover:text-black transition text-left cursor-pointer group"
                              >
                                <div className="font-extrabold text-xs text-[#ffb000] group-hover:text-black">
                                  [Б] {urgentDossier.rightChoice.label}
                                </div>
                                {urgentDossier.rightChoice.effectNote && (
                                  <div className="text-[9.5px] text-[#8c5b0f] group-hover:text-black/80 mt-1">
                                    {urgentDossier.rightChoice.effectNote}
                                  </div>
                                )}
                                {/* Predictive hints modifiers */}
                                {settings.predictiveHints && (
                                  <div className="mt-1 pt-1 border-t border-[#3d2607]/80 text-[8.5px] text-[#ff9900] group-hover:text-black/90 font-mono space-x-1">
                                    {urgentDossier.rightChoice.economy?.moscowPlanFulfilled !== undefined && (
                                      <span>План {urgentDossier.rightChoice.economy.moscowPlanFulfilled > 0 ? '+' : ''}{urgentDossier.rightChoice.economy.moscowPlanFulfilled}%</span>
                                    )}
                                    {urgentDossier.rightChoice.profile?.autocracy !== undefined && (
                                      <span>Автократия +{urgentDossier.rightChoice.profile.autocracy}%</span>
                                    )}
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------- */}
                {/* MODULE 2: ТАКТИЧЕСКАЯ КАРТА И УЗЛЫ                 */}
                {/* -------------------------------------------------- */}
                {activeModule === 'map' && (
                  <div className="space-y-3">
                    {/* Sectors Tension Infobar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px]">
                      {(Object.keys(regions) as RegionId[]).map((rId) => {
                        const r = regions[rId];
                        const isRiot = r.tension >= 80;
                        const isWarn = r.tension >= 50;

                        return (
                          <div
                            key={rId}
                            className={`p-1.5 border bg-[#0d0904] flex flex-col justify-between ${
                              isRiot
                                ? 'border-[#ff2a00] text-[#ff2a00]'
                                : isWarn
                                ? 'border-[#ff9900] text-[#ff9900]'
                                : 'border-[#4a341b] text-[#ffb000]'
                            }`}
                          >
                            <div className="font-bold truncate">{r.name}</div>
                            <div className="flex items-center justify-between mt-1 text-[9px]">
                              <span>НАПРЯЖЕНИЕ:</span>
                              <span className="font-extrabold">{r.tension}%</span>
                            </div>
                            <div className="w-full bg-[#201407] h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isRiot ? 'bg-[#ff2a00]' : isWarn ? 'bg-[#ff9900]' : 'bg-[#33ff33]'
                                }`}
                                style={{ width: `${r.tension}%` }}
                              />
                            </div>
                            {isRiot && (
                              <div className="text-[8px] font-bold text-[#ff2a00] mt-1 truncate">
                                ⚠ {REGION_META[rId].riotTitle}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Infrastructure Nodes Grid (8 Nodes) */}
                    <div>
                      <div className="text-[10px] text-[#8c5b0f] font-bold uppercase mb-1.5">
                        КЛЮЧЕВЫЕ ОБЪЕКТЫ ИНФРАСТРУКТУРЫ РЕСПУБЛИКИ:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.values(nodes).map((node) => {
                          const isOperational = node.status === 'operational';
                          const statusColor =
                            node.status === 'operational'
                              ? 'border-[#33ff33]/40 text-[#33ff33]'
                              : node.status === 'blocked'
                              ? 'border-[#ff9900] text-[#ff9900]'
                              : 'border-[#ff2a00] text-[#ff2a00]';

                          const statusLabel =
                            node.status === 'operational'
                              ? 'В СТРОЮ'
                              : node.status === 'blocked'
                              ? 'ЗАБЛОКИРОВАН'
                              : node.status === 'damaged'
                              ? 'АВАРИЙНЫЙ СБОЙ'
                              : 'ЗАХВАЧЕН';

                          return (
                            <div
                              key={node.id}
                              className={`p-2 border bg-[#110b06] flex flex-col justify-between ${
                                isOperational ? 'border-[#3d2607]' : 'border-[#ff9900] shadow-[0_0_10px_rgba(255,153,0,0.2)]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs text-[#ffb000]">{node.name}</span>
                                  <span className={`px-1.5 py-0.2 border text-[9px] font-bold ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className="text-[10px] text-[#8c5b0f] leading-snug mb-2">{node.description}</p>
                                <div className="text-[9px] text-[#8c5b0f] border-t border-[#261807] pt-1">
                                  Урон при отказе: Дефицит +{node.impact.deficitDelta}%, План {node.impact.moscowPlanDelta}
                                  %, Напряжение +{node.impact.tensionDelta}%
                                </div>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-[#261807] flex justify-end">
                                {!isOperational ? (
                                  <button
                                    onClick={() => handleRepairNode(node.id)}
                                    className="px-2.5 py-1 border border-[#ff9900] bg-[#ff9900]/15 hover:bg-[#ff9900] hover:text-black text-[#ff9900] font-bold text-[10px] transition cursor-pointer"
                                  >
                                    [ ЛИКВИДИРОВАТЬ СБОЙ (1 ОВ, -8М ₽) ]
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-[#33ff33]/70 font-mono">● РАБОТАЕТ В НОРМЕ</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------- */}
                {/* MODULE 3: ВЧ-СВЯЗЬ (КРЕМЛЕВКА)                     */}
                {/* -------------------------------------------------- */}
                {activeModule === 'hotline' && (
                  <div className="flex flex-col md:flex-row gap-3 h-full">
                    <div className="w-full md:w-[220px] shrink-0 space-y-1.5 overflow-y-auto">
                      {Object.values(actors).map((actor) => {
                        const isSelected = selectedActorId === actor.id;
                        return (
                          <button
                            key={actor.id}
                            onClick={() => {
                              terminalAudio.playTeletypeClick();
                              setSelectedActorId(actor.id);
                            }}
                            className={`w-full p-2 border text-left transition cursor-pointer flex items-center space-x-2 ${
                              isSelected
                                ? 'border-[#ffb000] bg-[#ffb000]/15 text-[#ffb000]'
                                : 'border-[#3d2607] text-[#8c5b0f] hover:border-[#ffb000]/50 hover:text-[#ffb000] bg-[#0c0803]'
                            }`}
                          >
                            <div className="w-8 h-8 shrink-0 border border-[#ffb000]/40 p-0.5">
                              <TerminalPortrait
                                archetype={actor.avatar as ArchetypeId}
                                phosphorColor={settings.phosphorColor}
                              />
                            </div>
                            <div className="min-w-0 flex-1 text-[10px]">
                              <div className="font-bold truncate">{actor.name}</div>
                              <div className="text-[8px] text-[#8c5b0f] truncate">{actor.title.split(',')[0]}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {actors[selectedActorId] && (
                      <div className="flex-1 border border-[#6e470b] bg-[#110b06] p-3 flex flex-col justify-between overflow-y-auto">
                        {(() => {
                          const actor = actors[selectedActorId];
                          return (
                            <div className="space-y-3">
                              <div className="flex items-start justify-between border-b border-[#3d2607] pb-2">
                                <div>
                                  <h3 className="text-sm font-extrabold text-[#ffb000]">{actor.name}</h3>
                                  <div className="text-[10px] text-[#8c5b0f]">{actor.title}</div>
                                </div>
                                <div className="text-right text-[10px]">
                                  <div className="text-[#33ff33]">ЛОЯЛЬНОСТЬ: {actor.loyalty}%</div>
                                  <div className="text-[#ff9900]">ВЛИЯНИЕ: {actor.influence}%</div>
                                </div>
                              </div>

                              <p className="text-[10.5px] text-[#ffb000]/90 leading-relaxed p-2 border border-[#3d2607] bg-[#0a0603]">
                                {actor.dossier}
                              </p>

                              <div>
                                <div className="text-[10px] text-[#8c5b0f] font-bold uppercase mb-1.5">
                                  ДИАЛОГ И ДИРЕКТИВЫ ПО ВЧ-СВЯЗИ (СТОИМОСТЬ: 1 ОВ):
                                </div>
                                <div className="space-y-2">
                                  {actor.callOptions.map((opt) => (
                                    <div
                                      key={opt.id}
                                      className="p-2 border border-[#3d2607] bg-[#0c0804] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                    >
                                      <div>
                                        <div className="text-xs font-bold text-[#ffb000]">{opt.label}</div>
                                        <div className="text-[9.5px] text-[#8c5b0f]">{opt.effectDescription}</div>
                                      </div>
                                      <button
                                        onClick={() => handleExecuteCallOption(actor.id, opt.id)}
                                        className="shrink-0 px-2.5 py-1 border border-[#ffb000] bg-[#ffb000]/10 hover:bg-[#ffb000] hover:text-black font-bold text-[10px] transition cursor-pointer"
                                      >
                                        [ СВЯЗАТЬСЯ ]
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* -------------------------------------------------- */}
                {/* MODULE 4: КАБИНЕТ КГБ                              */}
                {/* -------------------------------------------------- */}
                {activeModule === 'kgb' && (
                  <div className="space-y-3">
                    <div className="p-2 border border-[#ff2a00]/40 bg-[#ff2a00]/10 text-[#ff2a00] text-[10px] flex items-center justify-between">
                      <span className="font-bold">★ 7-Е УПРАВЛЕНИЕ КГБ ССР // ОПЕРАТИВНЫЕ МАТЕРИАЛЫ</span>
                      <span className="text-[9px]">ГРИФ «ОСОБАЯ ПАПКА»</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.values(actors).map((actor) => {
                        const isWiretap = actor.surveillance === 'wiretap';
                        const isInfiltrated = actor.surveillance === 'infiltrated';

                        return (
                          <div key={actor.id} className="p-2.5 border border-[#3d2607] bg-[#110b06] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#ffb000]">{actor.name}</span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                                  isInfiltrated
                                    ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/15'
                                    : isWiretap
                                    ? 'border-[#ff9900] text-[#ff9900] bg-[#ff9900]/15 animate-pulse'
                                    : 'border-[#4a341b] text-[#8c5b0f]'
                                }`}
                              >
                                {isInfiltrated
                                  ? 'ПОЛНЫЙ КОНТРОЛЬ'
                                  : isWiretap
                                  ? 'ВЕДЕТСЯ ПРОСЛУШКА'
                                  : 'БЕЗ НАБЛЮДЕНИЯ'}
                              </span>
                            </div>

                            {actor.unlockedKompromat.map((k) => (
                              <div key={k.id} className="p-1.5 border border-[#2d1b09] bg-[#0c0803] text-[9.5px]">
                                <div className="font-bold text-[#ffb000]">{k.title}</div>
                                <div className="text-[#8c5b0f] mt-0.5">{k.description}</div>
                                {k.used && (
                                  <span className="inline-block mt-1 text-[8px] text-[#33ff33] font-bold">
                                    ✓ КОМПРОМАТ УСПЕШНО ИСПОЛЬЗОВАН ДЛЯ ШАНТАЖА
                                  </span>
                                )}
                              </div>
                            ))}

                            <div className="flex justify-end pt-1">
                              {actor.surveillance === 'none' && (
                                <button
                                  onClick={() => handleAuthorizeWiretap(actor.id)}
                                  className="px-2 py-1 border border-[#ff2a00] text-[#ff2a00] hover:bg-[#ff2a00] hover:text-black font-bold text-[9.5px] transition cursor-pointer"
                                >
                                  [ САНКЦИОНИРОВАТЬ ПРОСЛУШКУ (1 ОВ) ]
                                </button>
                              )}
                              {actor.surveillance === 'wiretap' && (
                                <span className="text-[9px] text-[#ff9900] italic">
                                  Агентура собирает записи разговоров...
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------- */}
                {/* MODULE 5: ПОРТФЕЛЬ ПОСТАНОВЛЕНИЙ                   */}
                {/* -------------------------------------------------- */}
                {activeModule === 'decrees' && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#8c5b0f] font-bold uppercase mb-1">
                      ГОСУДАРСТВЕННЫЕ ПОСТАНОВЛЕНИЯ БЮРО ЦК (ПРИНЯТИЕ/ОТМЕНА СТОИТ 1 ОВ):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {decrees.map((decree) => {
                        return (
                          <div
                            key={decree.id}
                            className={`p-2.5 border bg-[#110b06] flex flex-col justify-between ${
                              decree.active
                                ? 'border-[#33ff33] bg-[#33ff33]/5 shadow-[0_0_15px_rgba(51,255,51,0.15)]'
                                : 'border-[#3d2607]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-[#ffb000]">{decree.title}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                                    decree.active
                                      ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/20'
                                      : 'border-[#4a341b] text-[#8c5b0f]'
                                  }`}
                                >
                                  {decree.active ? 'ДЕЙСТВУЕТ' : 'НЕ ВВЕДЕН'}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#8c5b0f] leading-snug mb-2">{decree.description}</p>
                              <div className="text-[9px] text-[#ffb000]/80 border-t border-[#261807] pt-1">
                                Ежемесячный эффект:
                                {decree.monthlyImpact.shelfSupplyPercent && ` Полки +${decree.monthlyImpact.shelfSupplyPercent}%`}
                                {decree.monthlyImpact.rubleBudgetMillions && ` | Казна ${decree.monthlyImpact.rubleBudgetMillions > 0 ? '+' : ''}${decree.monthlyImpact.rubleBudgetMillions}М ₽`}
                                {decree.monthlyImpact.moscowPlanFulfilled && ` | План ${decree.monthlyImpact.moscowPlanFulfilled > 0 ? '+' : ''}${decree.monthlyImpact.moscowPlanFulfilled}%`}
                                {decree.monthlyImpact.tensionDelta && ` | Напряжение ${decree.monthlyImpact.tensionDelta > 0 ? '+' : ''}${decree.monthlyImpact.tensionDelta}%`}
                              </div>
                            </div>

                            <div className="mt-2.5 pt-1.5 border-t border-[#261807] flex justify-end">
                              <button
                                onClick={() => handleToggleDecree(decree.id)}
                                className={`px-2.5 py-1 border font-bold text-[10px] transition cursor-pointer ${
                                  decree.active
                                    ? 'border-[#ff2a00] text-[#ff2a00] hover:bg-[#ff2a00] hover:text-black'
                                    : 'border-[#33ff33] text-[#33ff33] hover:bg-[#33ff33] hover:text-black'
                                }`}
                              >
                                {decree.active ? '[ ОТМЕНИТЬ ДЕЙСТВИЕ (1 ОВ) ]' : '[ ВВЕСТИ В ДЕЙСТВИЕ (1 ОВ) ]'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Strategy Action Bar */}
              <div className="shrink-0 border-t border-[#3d2607] bg-[#100a04] p-1.5 sm:p-2 flex items-center justify-between gap-2 z-20">
                <div className="text-[10px] text-[#8c5b0f] truncate hidden sm:block">
                  {!urgentDossierResolved ? '⚠ ТРЕБУЕТСЯ ПОДПИСАТЬ ДЕПЕШУ' : '✓ ДЕПЕША МЕСЯЦА УТВЕРЖДЕНА'}
                </div>

                <button
                  onClick={handleNextMonth}
                  className="w-full sm:w-auto px-4 py-2 border-2 border-[#ffb000] bg-[#ffb000] text-black font-black text-xs md:text-sm hover:bg-[#ffb000]/80 transition cursor-pointer shadow-[0_0_15px_rgba(255,176,0,0.3)] flex items-center justify-center space-x-1"
                >
                  <span>[ ЗАВЕРШИТЬ МЕСЯЦ И ПЕРЕЙТИ ДАЛЬШЕ ➔ ]</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: ARCHIVE (13 ENDINGS)                              */}
          {/* ========================================================= */}
          {screen === 'archive' && (
            <div className="flex-1 flex flex-col justify-between p-2 md:p-3 overflow-hidden text-xs font-mono">
              <div className="border border-[#6e470b] bg-[#110b06] p-3 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#6e470b] pb-2 mb-2">
                  <h2 className="text-sm md:text-base font-extrabold crt-term-text">
                    АРХИВ «ОСОБЫХ ПАПОК» ЦК КПСС
                  </h2>
                  <span className="text-[#8c5b0f]">
                    ОТКРЫТО: {unlockedEndings.length} ИЗ 13
                  </span>
                </div>

                {selectedDossier ? (
                  <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 border border-[#ffb000] text-[10px] text-[#ffb000]">
                          {selectedDossier.code}
                        </span>
                        <span className="text-[10px] text-[#8c5b0f]">
                          УСЛОВИЕ: {selectedDossier.trigger}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#ffb000]">{selectedDossier.title}</h3>

                      <div className="p-2 border-2 border-dashed border-[#ffb000] text-[#ffb000] font-black text-center tracking-widest text-xs md:text-sm">
                        ★ {selectedDossier.stamp} ★
                      </div>

                      <div className="space-y-2 text-[11px] leading-relaxed text-[#ffb000]">
                        <div>
                          <span className="text-[#8c5b0f] font-bold">ВЕРДИКТ: </span>
                          <span className="font-bold">{selectedDossier.verdict}</span>
                        </div>
                        <p>{selectedDossier.description}</p>
                        <p className="text-[#8c5b0f] italic border-t border-[#3d2607] pt-2">
                          Исторический контекст: {selectedDossier.historicalContext}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDossier(null)}
                      className="mt-4 w-full py-2 border border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] font-bold cursor-pointer"
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
                              ? 'border-[#6e470b] hover:border-[#ffb000] bg-[#160f08] cursor-pointer'
                              : 'border-[#291a07] text-[#4d320d] cursor-not-allowed bg-[#0a0704]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px]">
                              {isUnlocked ? ending.code : '[ЗАСЕКРЕЧЕНО]'}
                            </span>
                            <span className="text-[9px] opacity-75">
                              {isUnlocked ? (ending.category === 'grand' ? '★ ФИНАЛ 1991' : '● ДОСРОЧНО') : 'ЗАБЛОКИРОВАНО'}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold mt-0.5 truncate">
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
                    className="mt-3 w-full py-2 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black font-bold cursor-pointer"
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
              <div className="border-2 border-[#ffb000] bg-[#100a05] p-3 md:p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#6e470b] pb-2">
                    <span className="font-extrabold text-sm crt-term-text">
                      АРХИВНОЕ ДЕЛО №1991 / {currentEnding.code}
                    </span>
                    <span className="text-[10px] text-[#8c5b0f]">{formatMonthOnly(currentMonth)}</span>
                  </div>

                  <div
                    className={`p-3 border-4 border-dashed text-center font-black tracking-widest text-sm md:text-base ${
                      currentEnding.category === 'grand'
                        ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/10'
                        : 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10'
                    }`}
                  >
                    ★ {currentEnding.stamp} ★
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-[#ffb000] mb-1">{currentEnding.title}</h2>
                    <div className="text-[11px] text-[#ffb000] font-bold">
                      ВЕРДИКТ: <span className="underline">{currentEnding.verdict}</span>
                    </div>
                  </div>

                  <p className="text-[11px] md:text-xs leading-relaxed text-[#ffb000]">
                    {currentEnding.description}
                  </p>

                  <div className="p-2 border border-[#3d2607] bg-[#0c0804] space-y-1 text-[10px]">
                    <div className="font-bold text-[#8c5b0f]">ИТОГОВАЯ СВОДКА ПРАВЛЕНИЯ:</div>
                    <div className="grid grid-cols-2 gap-1 text-[#ffb000]">
                      <div>ПРОДЕРЖАЛИСЬ: ХОД {currentMonth} ИЗ 36</div>
                      <div>СУВЕРЕНИТЕТ: {profile.sovereignty}%</div>
                      <div>АВТОКРАТИЯ: {profile.autocracy}%</div>
                      <div>РЫНОК: {profile.market}%</div>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#8c5b0f] italic border-t border-[#3d2607] pt-2">
                    Исторический контекст: {currentEnding.historicalContext}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#6e470b] flex space-x-2">
                  <button
                    onClick={() => {
                      terminalAudio.playSwitchClick();
                      setScreen('candidate');
                    }}
                    className="flex-1 py-2.5 border-2 border-[#ffb000] bg-[#ffb000] text-black font-extrabold text-xs md:text-sm hover:bg-[#ffb000]/80 transition cursor-pointer"
                  >
                    [ ОТКРЫТЬ НОВУЮ ПАПКУ ]
                  </button>
                  <button
                    onClick={handleReturnToMenu}
                    className="px-4 py-2.5 border border-[#ffb000] text-[#ffb000] font-bold text-xs hover:bg-[#ffb000]/10 transition cursor-pointer"
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
            <div className="w-full max-w-lg border-2 border-[#ffb000] bg-[#0f0904] p-3 sm:p-4 shadow-[0_0_30px_rgba(255,176,0,0.3)] space-y-3">
              <div className="flex items-center justify-between border-b border-[#6e470b] pb-2">
                <span className="font-extrabold text-xs sm:text-sm crt-term-text">
                  ПРАВИТЕЛЬСТВЕННАЯ ТЕЛЕГРАММА // ИТОГИ МЕСЯЦА
                </span>
                <span className="text-[10px] text-[#8c5b0f]">
                  {formatMonthOnly(lastMonthSummary.prevMonth)}
                </span>
              </div>

              {/* Economic summary */}
              <div className="p-2 border border-[#3d2607] bg-[#0c0703] space-y-1 text-[10px]">
                <div className="font-bold text-[#8c5b0f]">СВОДКА ИЗМЕНЕНИЯ ЭКОНОМИКИ:</div>
                <div className="grid grid-cols-2 gap-1 text-[#ffb000]">
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
                <div className="space-y-1 text-[10px] text-[#ffb000]/90 max-h-36 overflow-y-auto pr-1">
                  <div className="font-bold text-[#8c5b0f]">ОПЕРАТИВНЫЕ СВОДКИ И ДОНЕСЕНИЯ:</div>
                  {lastMonthSummary.notes.map((n, i) => (
                    <div key={i} className="p-1 border border-[#2d1b09] bg-[#080502]">
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
                className="w-full py-2.5 border-2 border-[#ffb000] bg-[#ffb000] text-black font-extrabold text-xs sm:text-sm hover:bg-[#ffb000]/80 transition cursor-pointer"
              >
                [ ПРИНЯТЬ К СВЕДЕНИЮ // 3 ОВ НАЧИСЛЕНО ➔ ]
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GENERIC ACTION MODAL / TOAST NOTIFICATION                 */}
        {/* ========================================================= */}
        {actionNotification && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-3 font-mono">
            <div className="w-full max-w-md border border-[#ffb000] bg-[#110b06] p-4 shadow-[0_0_25px_rgba(255,176,0,0.3)] space-y-3">
              <div className="flex items-center justify-between border-b border-[#6e470b] pb-1.5">
                <span className="font-extrabold text-xs text-[#ffb000]">{actionNotification.title}</span>
                {actionNotification.stamp && (
                  <span className="px-1.5 py-0.5 border border-[#ffb000] text-[9px] font-bold text-[#ffb000]">
                    {actionNotification.stamp}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-[#ffb000]">{actionNotification.text}</p>
              <button
                onClick={() => {
                  terminalAudio.playKeyClick();
                  setActionNotification(null);
                }}
                className="w-full py-2 border border-[#ffb000] bg-[#ffb000]/15 hover:bg-[#ffb000] hover:text-black font-bold text-xs transition cursor-pointer"
              >
                [ ЗАКРЫТЬ ]
              </button>
            </div>
          </div>
        )}

        {/* Calm Red Emergency Vignette (Strictly in game when in crisis) */}
        {isEmergency && <div className="absolute inset-0 crt-emergency-vignette z-25 pointer-events-none" />}

        {/* TASS Teletype Ticker Tape */}
        <div className="relative z-20 w-full shrink-0 border-t border-[#3d2607] bg-[#0c0703] px-2 py-1.5 flex items-center overflow-hidden font-mono text-[9px] sm:text-[10px] md:text-[11px] crt-term-text shadow-[0_0_8px_rgba(255,176,0,0.2)] select-none">
          <span className="shrink-0 font-bold bg-[#ffb000]/15 text-[#ffb000] px-1.5 py-0.5 border border-[#ffb000]/40 mr-2.5 tracking-wider text-[8.5px] sm:text-[9.5px]">
            [ТАСС / СВОДКА]
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center relative min-w-0">
            <div key={currentTassNews} className="inline-flex animate-marquee whitespace-nowrap items-center">
              <span className="pr-12">{currentTassNews}</span>
              <span className="pr-12 text-[#8c5b0f]">+++ СВОДКА ТАСС +++</span>
              <span className="pr-12">{currentTassNews}</span>
              <span className="pr-12 text-[#8c5b0f]">+++ СВОДКА ТАСС +++</span>
            </div>
          </div>
        </div>

        {/* CRT Scanline Overlay layer */}
        {settings.scanlineDensity !== 'off' && (
          <div
            className={`absolute inset-0 pointer-events-none crt-scanlines z-30 ${
              settings.scanlineDensity === 'low'
                ? 'opacity-30'
                : settings.scanlineDensity === 'med'
                ? 'opacity-65'
                : 'opacity-95'
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
