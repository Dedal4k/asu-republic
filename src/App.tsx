/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { terminalAudio } from './audio';
import { TerminalPortrait } from './portraits';
import { GAME_CARDS } from './data/cards';
import { getTassHeadline } from './data/news';
import { ALL_ENDINGS, determineEnding } from './data/endings';
import { Card, Ending, PoliticalProfile, Stats, StatKey, RegionId, RegionState, LeaderBackgroundId } from './types';
import { LEADER_BACKGROUNDS, LEADER_BACKGROUND_LIST, BACKGROUND_ARCHETYPES } from './data/backgrounds';

type ScreenMode = 'menu' | 'briefing' | 'candidate' | 'game' | 'hotline' | 'archive' | 'settings' | 'ending';

interface TassBulletinData {
  prevAct: number;
  nextAct: number;
  title: string;
  summary: string;
}

const TASS_SUMMARIES: Record<2 | 3 | 4, { title: string; summary: string }> = {
  2: {
    title: 'ИТОГИ 1989-1990: ИСПЫТАНИЕ ГЛАСНОСТЬЮ ЗАВЕРШЕНО',
    summary:
      'Волна стихийных стачек и уличных манифестаций потрясла основы союзной системы. Компартия стремительно теряет монополию на власть. В союзных республиках стартовал исторический «Парад суверенитетов».',
  },
  3: {
    title: 'ИТОГИ 1990-1991: ПАРАД СУВЕРЕНИТЕТОВ ЗАВЕРШЕН',
    summary:
      'Приняты Декларации о верховенстве республиканских законов, учреждены таможенные кордоны и автономные бюджеты. Союзный Центр парализован. Начинается период «Разлома империи».',
  },
  4: {
    title: 'ИТОГИ АВГУСТА 1991: РАЗЛОМ ИМПЕРИИ ЗАВЕРШЕН',
    summary:
      'Путч ГКЧП полностью провалился, деятельность союзных структур КПСС прекращена. Наступает кульминационный Беловежский эндшпиль — обратный отсчет до декабря 1991 года.',
  },
};

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

const REGION_META: Record<
  RegionId,
  {
    short: string;
    bonusDesc: string;
    riotDesc: string;
    riotTitle: string;
  }
> = {
  capital: {
    short: 'СТОЛ',
    bonusDesc: 'Каждые 3 хода +1 к Москве (при <30%)',
    riotDesc: '«Осада Дома Советов»: блок откладывания [ПОД СУКНО], каждый ход -2 к Народу',
    riotTitle: 'ОСАДА ДОМА СОВЕТОВ',
  },
  miners: {
    short: 'ШАХТ',
    bonusDesc: 'Каждые 3 хода +1 к Экономике (при <30%)',
    riotDesc: '«Рельсовая блокада»: каждый ход -2 к Экономике, стоимость эшелона удваивается (-12)',
    riotTitle: 'РЕЛЬСОВАЯ БЛОКАДА',
  },
  agrarian: {
    short: 'АГР',
    bonusDesc: 'Каждые 3 хода +1 к Народу (при <30%)',
    riotDesc: '«Срыв поставок»: каждый ход +5% к напряженности в Столице и Шахтах',
    riotTitle: 'СРЫВ ПОСТАВОК',
  },
  autonomy: {
    short: 'АВТ',
    bonusDesc: 'Каждые 3 хода +1 к Армии (при <30%)',
    riotDesc: '«Межэтнический кризис»: каждый ход -2 к Армии и -2 к Москве',
    riotTitle: 'МЕЖЭТНИЧЕСКИЙ КРИЗИС',
  },
};

export default function App() {
  // Screen state
  const [screen, setScreen] = useState<ScreenMode>('menu');
  const [commandInput, setCommandInput] = useState<string>('');
  const [isTypingCommand, setIsTypingCommand] = useState<boolean>(false);
  const [menuFlicker, setMenuFlicker] = useState<boolean>(false);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(terminalAudio.getMuted());

  // Terminal CRT settings
  const [scanlineIntensity, setScanlineIntensity] = useState<'low' | 'med' | 'high'>('med');
  const [crtCurve, setCrtCurve] = useState<boolean>(true);

  // Archive records from localStorage
  const [unlockedEndings, setUnlockedEndings] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('asu_unlocked_endings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected archive ending for dossier inspection
  const [selectedDossier, setSelectedDossier] = useState<Ending | null>(null);

  // Leader Background («ЛИЧНОЕ ДЕЛО КАНДИДАТА ЦК КПСС»)
  const [leaderBackground, setLeaderBackground] = useState<LeaderBackgroundId | null>(() => {
    try {
      const saved = localStorage.getItem('asu_leader_background');
      if (saved && (saved === 'apparatchik' || saved === 'director' || saved === 'kgb' || saved === 'technocrat')) {
        return saved as LeaderBackgroundId;
      }
      return 'apparatchik';
    } catch {
      return 'apparatchik';
    }
  });
  const [inspectingBackground, setInspectingBackground] = useState<LeaderBackgroundId>(
    leaderBackground || 'apparatchik'
  );

  // Core Game State
  const [stats, setStats] = useState<Stats>(() => {
    const bgKey = leaderBackground || 'apparatchik';
    return { ...LEADER_BACKGROUNDS[bgKey].initialStats };
  });

  const [profile, setProfile] = useState<PoliticalProfile>({
    sovereignty: 20,
    autocracy: 30,
    market: 20,
  });

  const [daysSurvived, setDaysSurvived] = useState<number>(0);
  const [decrees, setDecrees] = useState<string[]>([]);
  const [supportedGkchp, setSupportedGkchp] = useState<boolean>(false);
  const [hotlineUsedInAct, setHotlineUsedInAct] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  // Narrative Memory: Story Flags across the playthrough
  const [storyFlags, setStoryFlags] = useState<string[]>([]);

  // Played Card IDs for unique repeat protection
  const [playedCardIds, setPlayedCardIds] = useState<string[]>([]);

  // KGB Special Report interval counter (fires every 6-7 turns or when tension >= 70%)
  const [turnsSinceSpecialReport, setTurnsSinceSpecialReport] = useState<number>(0);

  // Tactical Regions Architecture & Operational Directives
  const [regions, setRegions] = useState<Record<RegionId, RegionState>>(() => {
    const bgKey = leaderBackground || 'apparatchik';
    const bg = LEADER_BACKGROUNDS[bgKey];
    return {
      capital: { ...INITIAL_REGIONS.capital, tension: bg.initialRegions.capital },
      miners: { ...INITIAL_REGIONS.miners, tension: bg.initialRegions.miners },
      agrarian: { ...INITIAL_REGIONS.agrarian, tension: bg.initialRegions.agrarian },
      autonomy: { ...INITIAL_REGIONS.autonomy, tension: bg.initialRegions.autonomy },
    };
  });
  const [directiveCooldown, setDirectiveCooldown] = useState<number>(0);
  const [turnsPlayed, setTurnsPlayed] = useState<number>(0);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [selectedMapRegion, setSelectedMapRegion] = useState<RegionId>('capital');

  // New Mechanics: [ПОД СУКНО] per Act and [СВОДКА] modal
  const [shelveRemaining, setShelveRemaining] = useState<number>(() => {
    return leaderBackground === 'apparatchik' ? 4 : 2;
  });
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [tassBulletin, setTassBulletin] = useState<TassBulletinData | null>(null);

  // Crisis cooldown counter: tracks consecutive calm turns since last crisis
  const [turnsSinceCrisis, setTurnsSinceCrisis] = useState<number>(4);

  // Card deck management
  const [cardDeck, setCardDeck] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  // Swipe / Drag physical physics
  const [dragX, setDragX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cardAnimating, setCardAnimating] = useState<'left' | 'right' | null>(null);
  const dragStartX = useRef<number>(0);

  // Visual triumph effects
  const [triumphActive, setTriumphActive] = useState<boolean>(false);
  const [triumphText, setTriumphText] = useState<string>('');
  const [beamCollapse, setBeamCollapse] = useState<boolean>(false);
  const [currentEnding, setCurrentEnding] = useState<Ending | null>(null);

  // Briefing typewriter state
  const [briefingLineIdx, setBriefingLineIdx] = useState<number>(0);
  const [briefingDone, setBriefingDone] = useState<boolean>(false);

  // Hotline selection state
  const [hotlineBoostStat, setHotlineBoostStat] = useState<StatKey>('people');
  const [hotlineSacrificeStat, setHotlineSacrificeStat] = useState<StatKey>('moscow');

  // Strict Emergency Mode: Active ONLY on active gameplay screen ('game') with threshold <= 15 or >= 85
  const isEmergency = useMemo(() => {
    if (screen !== 'game') return false;
    const hasCriticalStat = Object.values(stats).some((v) => v <= 15 || v >= 85);
    const isCrisisCard = !!cardDeck[currentCardIndex]?.isCrisis;
    return hasCriticalStat || isCrisisCard;
  }, [stats, screen, cardDeck, currentCardIndex]);

  // Find the single most critical stat (furthest from 50 and <= 15 or >= 85) for targeted highlighting
  const mostCriticalStat = useMemo<StatKey | null>(() => {
    if (!isEmergency) return null;
    const keys: StatKey[] = ['moscow', 'people', 'kgb', 'economy'];
    const criticalKeys = keys.filter((k) => stats[k] <= 15 || stats[k] >= 85);
    if (criticalKeys.length === 0) return null;
    return criticalKeys.reduce((worst, cur) =>
      Math.abs(stats[cur] - 50) > Math.abs(stats[worst] - 50) ? cur : worst
    );
  }, [isEmergency, stats]);

  // Current Act calculation (1..4) based on days
  const currentAct = useMemo(() => {
    if (daysSurvived < 180) return 1;
    if (daysSurvived < 450) return 2;
    if (daysSurvived < 640) return 3;
    return 4;
  }, [daysSurvived]);

  // Formatted Soviet calendar date (Start: 14.10.1989)
  const currentDateFormatted = useMemo(() => {
    const base = new Date(1989, 9, 14);
    base.setDate(base.getDate() + daysSurvived);
    const day = String(base.getDate()).padStart(2, '0');
    const month = String(base.getMonth() + 1).padStart(2, '0');
    const year = base.getFullYear();
    return `${day}.${month}.${year}`;
  }, [daysSurvived]);

  // Current synchronized TASS Historical News Headline
  const currentTassNews = useMemo(() => {
    return getTassHeadline(daysSurvived);
  }, [daysSurvived]);

  // Current Card
  const currentCard = cardDeck[currentCardIndex] || null;

  // Sound emergency or warning siren when emergency or high tension activates during active gameplay ONLY
  useEffect(() => {
    if (screen === 'game') {
      const maxTension = Math.max(...Object.values(regions).map((r) => r.tension));
      if (isEmergency || maxTension >= 80) {
        terminalAudio.playSiren(true);
      } else if (maxTension >= 70) {
        terminalAudio.playSiren(false);
      }
    }
  }, [isEmergency, screen, regions]);

  // Adaptive Music Controller synchronization (peace vs crisis vs off)
  useEffect(() => {
    const inGame = screen === 'game' || screen === 'hotline';
    const maxTension = Math.max(...Object.values(regions).map((r) => r.tension));
    const isCrisisMood = isEmergency || maxTension >= 70 || currentAct >= 3;
    terminalAudio.updateAdaptiveMusic(inGame, isCrisisMood);
  }, [screen, isEmergency, regions, currentAct]);

  // Tactile paper slide effect when new card arrives on screen
  useEffect(() => {
    if (screen === 'game' && currentCard) {
      terminalAudio.playPaperSlide();
    }
  }, [currentCardIndex, screen, currentCard]);

  // Authentic teletype click series when TASS news headline updates during gameplay
  const prevTassNewsRef = useRef<string>(currentTassNews);
  useEffect(() => {
    if (screen === 'game' && prevTassNewsRef.current !== currentTassNews) {
      prevTassNewsRef.current = currentTassNews;
      terminalAudio.playTeletype();
    }
  }, [currentTassNews, screen]);

  // Swipe tilt percentage (-1 to +1)
  const dragTilt = Math.min(Math.max(dragX / 140, -1), 1);
  const cardRotation = dragTilt * 10; // Up to 10 degrees smooth tilt

  // Stat impact preview markers calculation
  const previewImpact = useMemo(() => {
    if (!currentCard || Math.abs(dragX) < 15) return null;
    const choice = dragX < 0 ? currentCard.leftChoice : currentCard.rightChoice;
    return choice.stats;
  }, [currentCard, dragX]);

  // Check if a card is eligible under current story flags, turn bounds, and uniqueness
  const isCardEligible = useCallback(
    (
      card: Card,
      activeFlags: string[],
      currentTurns: number,
      currentPlayedIds: string[]
    ): boolean => {
      // Unique cards cannot be played more than once
      if (card.unique && currentPlayedIds.includes(card.id)) return false;

      // Turn constraints
      if (card.minTurn !== undefined && currentTurns < card.minTurn) return false;
      if (card.maxTurn !== undefined && currentTurns > card.maxTurn) return false;

      // Required flags
      const required = card.requiresFlags || card.requiredFlags || [];
      if (required.length > 0) {
        const hasAllRequired = required.every((f) => activeFlags.includes(f));
        if (!hasAllRequired) return false;
      }

      // Forbidden flags
      const banned = card.forbiddenFlags || card.bannedFlags || [];
      if (banned.length > 0) {
        const hasBanned = banned.some((f) => activeFlags.includes(f));
        if (hasBanned) return false;
      }

      return true;
    },
    []
  );

  // Helper to reorder deck applying crisis spacing and flag filtering
  const buildInitialDeck = useCallback((): Card[] => {
    const act1 = GAME_CARDS.filter((c) => c.act === 1 && !c.isSpecialReport);
    const act2 = GAME_CARDS.filter((c) => c.act === 2 && !c.isSpecialReport);
    const act3NonGkchp = GAME_CARDS.filter((c) => c.act === 3 && !c.isGkchp && !c.isSpecialReport);
    const act3Gkchp = GAME_CARDS.filter((c) => c.act === 3 && c.isGkchp);
    const act4 = GAME_CARDS.filter((c) => c.act === 4 && !c.isSpecialReport);
    const specials = GAME_CARDS.filter((c) => c.isSpecialReport);

    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    return [
      ...shuffle(act1),
      ...shuffle(act2),
      ...shuffle(act3NonGkchp),
      ...act3Gkchp,
      ...shuffle(act4),
      ...shuffle(specials),
    ];
  }, []);

  // Start game session with selected candidate background
  const startSessionWithBackground = useCallback((bgId: LeaderBackgroundId) => {
    terminalAudio.playStampPress();
    terminalAudio.startMachineAmbient();
    setLeaderBackground(bgId);
    try {
      localStorage.setItem('asu_leader_background', bgId);
    } catch {}

    const bg = LEADER_BACKGROUNDS[bgId];
    const initialDeck = buildInitialDeck();
    setCardDeck(initialDeck);
    setCurrentCardIndex(0);
    setStats({ ...bg.initialStats });
    setProfile({ sovereignty: 20, autocracy: 30, market: 20 });
    setDaysSurvived(0);
    setDecrees([]);
    setSupportedGkchp(false);
    setHotlineUsedInAct({ 1: false, 2: false, 3: false, 4: false });
    setStoryFlags([]);
    setPlayedCardIds([]);
    setTurnsSinceSpecialReport(0);
    setShelveRemaining(bgId === 'apparatchik' ? 4 : 2);
    setTurnsSinceCrisis(4);
    setCurrentEnding(null);
    setShowSummaryModal(false);
    setTassBulletin(null);
    setRegions({
      capital: { ...INITIAL_REGIONS.capital, tension: bg.initialRegions.capital },
      miners: { ...INITIAL_REGIONS.miners, tension: bg.initialRegions.miners },
      agrarian: { ...INITIAL_REGIONS.agrarian, tension: bg.initialRegions.agrarian },
      autonomy: { ...INITIAL_REGIONS.autonomy, tension: bg.initialRegions.autonomy },
    });
    setDirectiveCooldown(0);
    setTurnsPlayed(0);
    setShowMapModal(false);
    setSelectedMapRegion('capital');
    setScreen('game');
  }, [buildInitialDeck]);

  // Initialize new game session with current background
  const initializeDeck = useCallback(() => {
    const bgKey = leaderBackground || 'apparatchik';
    startSessionWithBackground(bgKey);
  }, [leaderBackground, startSessionWithBackground]);

  // Clean transition to ending screen (resets emergency alarms)
  const triggerEnding = useCallback((ending: Ending) => {
    terminalAudio.stopMachineAmbient();
    terminalAudio.updateAdaptiveMusic(false, false);
    terminalAudio.playStampPress();
    setBeamCollapse(true);

    setTimeout(() => {
      setCurrentEnding(ending);
      setScreen('ending');
      setBeamCollapse(false);

      // Save to unlocked archives
      setUnlockedEndings((prev) => {
        if (!prev.includes(ending.id)) {
          const next = [...prev, ending.id];
          localStorage.setItem('asu_unlocked_endings', JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }, 750);
  }, []);

  // Historical Act transition helper
  const getActFromDays = (d: number): number => {
    if (d < 180) return 1;
    if (d < 450) return 2;
    if (d < 640) return 3;
    return 4;
  };

  // Stabilization helper: +5 points towards 50%
  const stabilizeStat = (val: number): number => {
    if (val < 50) return Math.min(50, val + 5);
    if (val > 50) return Math.max(50, val - 5);
    return 50;
  };

  // Handle choice resolution (left or right)
  const applyChoice = useCallback(
    (isLeft: boolean) => {
      if (!currentCard || cardAnimating || showSummaryModal || showMapModal || tassBulletin) return;

      const choice = isLeft ? currentCard.leftChoice : currentCard.rightChoice;
      terminalAudio.playPaperSlide();
      setCardAnimating(isLeft ? 'left' : 'right');

      setTimeout(() => {
        // Calculate new stats
        const newStats: Stats = {
          moscow: Math.max(0, Math.min(100, stats.moscow + (choice.stats.moscow || 0))),
          people: Math.max(0, Math.min(100, stats.people + (choice.stats.people || 0))),
          kgb: Math.max(0, Math.min(100, stats.kgb + (choice.stats.kgb || 0))),
          economy: Math.max(0, Math.min(100, stats.economy + (choice.stats.economy || 0))),
        };

        // Calculate new political profile
        const newProfile: PoliticalProfile = {
          sovereignty: Math.max(0, Math.min(100, profile.sovereignty + (choice.profile?.sovereignty || 0))),
          autocracy: Math.max(0, Math.min(100, profile.autocracy + (choice.profile?.autocracy || 0))),
          market: Math.max(0, Math.min(100, profile.market + (choice.profile?.market || 0))),
        };

        const newDays = daysSurvived + currentCard.daysElapsed;
        let newDecrees = [...decrees];
        if (choice.decreeBadge && !newDecrees.includes(choice.decreeBadge)) {
          newDecrees.push(choice.decreeBadge);
        }

        let newGkchpSupport = supportedGkchp;
        if (currentCard.id === 'act3_gkchp_day1_morning') {
          newGkchpSupport = isLeft; // Left was Support GKCHP
        }

        // Narrative Memory: Update story flags based on choice
        const newFlags = [...storyFlags];
        const flagsToSet = isLeft ? currentCard.setFlagsOnLeft : currentCard.setFlagsOnRight;
        if (flagsToSet) {
          for (const flag of flagsToSet) {
            if (!newFlags.includes(flag)) {
              newFlags.push(flag);
            }
          }
        }
        setStoryFlags(newFlags);

        // Played Cards tracking: ensure unique cards cannot repeat
        const updatedPlayedIds = playedCardIds.includes(currentCard.id)
          ? playedCardIds
          : [...playedCardIds, currentCard.id];
        setPlayedCardIds(updatedPlayedIds);

        // Update KGB Special Report counter
        const nextSpecialReportCount = currentCard.isSpecialReport ? 0 : turnsSinceSpecialReport + 1;
        setTurnsSinceSpecialReport(nextSpecialReportCount);

        // Reset operational directive cooldown if specified on choice impact
        if (choice.resetDirectiveCooldown) {
          setDirectiveCooldown(0);
          terminalAudio.playTriumphChime();
          setTriumphActive(true);
          setTriumphText('ДИРЕКТИВЫ АСУ ГОТОВЫ К ПУСКУ');
          setTimeout(() => setTriumphActive(false), 2200);
        }

        // Update crisis cooldown counter
        const nextCalmCount = currentCard.isCrisis ? 0 : turnsSinceCrisis + 1;
        setTurnsSinceCrisis(nextCalmCount);

        // Check triumph if resolving crisis or signing major decree
        if (choice.decreeBadge || (currentCard.isCrisis && !isEmergency)) {
          setTriumphActive(true);
          setTriumphText(choice.decreeBadge ? `УКАЗ [${choice.decreeBadge}] ПОДПИСАН` : 'СТАБИЛИЗАЦИЯ СИТУАЦИИ');
          if (choice.decreeBadge) {
            terminalAudio.playStampPress();
          }
          terminalAudio.playTriumphChime();
          setTimeout(() => setTriumphActive(false), 2000);
        }

        // Check Historical Act Transition (Acts I -> II -> III -> IV)
        const oldAct = getActFromDays(daysSurvived);
        const nextAct = getActFromDays(newDays);

        let finalStats = newStats;
        if (nextAct > oldAct && nextAct <= 4) {
          finalStats = {
            moscow: stabilizeStat(newStats.moscow),
            people: stabilizeStat(newStats.people),
            kgb: stabilizeStat(newStats.kgb),
            economy: stabilizeStat(newStats.economy),
          };

          setShelveRemaining(leaderBackground === 'apparatchik' ? 4 : 2);

          const bulletinInfo = TASS_SUMMARIES[nextAct as 2 | 3 | 4];
          setTassBulletin({
            prevAct: oldAct,
            nextAct: nextAct,
            title: bulletinInfo.title,
            summary: bulletinInfo.summary,
          });
          terminalAudio.playTriumphChime();
        }

        // =========================================================
        // TACTICAL REGIONAL TENSION & ASYMMETRIC REACTION
        // =========================================================
        const cardRegion: RegionId = currentCard.region || 'capital';
        let tensionShift = 0;
        if (choice.tensionDelta !== undefined) {
          tensionShift = choice.tensionDelta;
        } else if ((choice.stats.people || 0) < 0 || (choice.profile?.autocracy || 0) > 8) {
          tensionShift = 12; // Tough/unpopular decisions: +10..+16%
        } else if ((choice.stats.people || 0) > 0) {
          tensionShift = -10; // Concessions: -8..-14%
        } else {
          tensionShift = -4;
        }

        // Leader Background vulnerabilities:
        // apparatchik: capital tension growth +4%
        if (cardRegion === 'capital' && tensionShift > 0 && leaderBackground === 'apparatchik') {
          tensionShift += 4;
        }
        // kgb: autonomy tension growth +25% (rounded up)
        if (cardRegion === 'autonomy' && tensionShift > 0 && leaderBackground === 'kgb') {
          tensionShift = Math.ceil(tensionShift * 1.25);
        }

        // Story flag: 'koval_ally' reduces miner tension growth by 30%
        if (cardRegion === 'miners' && newFlags.includes('koval_ally') && tensionShift > 0) {
          tensionShift = Math.round(tensionShift * 0.7);
        }

        // Curfew freeze check for target region
        if (regions[cardRegion].curfewTurns > 0 && tensionShift > 0) {
          tensionShift = 0;
        }

        const updatedRegions: Record<RegionId, RegionState> = {
          capital: { ...regions.capital },
          miners: { ...regions.miners },
          agrarian: { ...regions.agrarian },
          autonomy: { ...regions.autonomy },
        };

        // Apply shift to current card's region
        updatedRegions[cardRegion].tension = Math.max(
          0,
          Math.min(100, updatedRegions[cardRegion].tension + tensionShift)
        );

        // Curfew decrement on all regions
        (Object.keys(updatedRegions) as RegionId[]).forEach((rId) => {
          updatedRegions[rId].curfewTurns = Math.max(0, updatedRegions[rId].curfewTurns - 1);
        });

        // Decrement directive cooldown
        setDirectiveCooldown((prev) => Math.max(0, prev - 1));

        // Flag effect: 'mirsky_arrested' adds +2% tension to capital every turn
        if (newFlags.includes('mirsky_arrested')) {
          if (updatedRegions.capital.curfewTurns === 0) {
            updatedRegions.capital.tension = Math.min(100, updatedRegions.capital.tension + 2);
          }
        }

        // ASYMMETRIC RIOT PENALTIES (tension >= 80%):
        // 1) Capital riot: 'Осада Дома Советов' (-2 to People)
        if (updatedRegions.capital.tension >= 80) {
          finalStats.people = Math.max(0, finalStats.people - 2);
        }

        // 2) Miners riot: 'Рельсовая блокада' (-2 to Economy)
        if (updatedRegions.miners.tension >= 80) {
          finalStats.economy = Math.max(0, finalStats.economy - 2);
        }

        // 3) Agrarian riot: 'Срыв поставок' (+5% tension to capital and miners)
        if (updatedRegions.agrarian.tension >= 80) {
          if (updatedRegions.capital.curfewTurns === 0) {
            updatedRegions.capital.tension = Math.min(100, updatedRegions.capital.tension + 5);
          }
          if (updatedRegions.miners.curfewTurns === 0) {
            updatedRegions.miners.tension = Math.min(100, updatedRegions.miners.tension + 5);
          }
        }

        // 4) Autonomy riot: 'Межэтнический кризис' (-2 to Army and -2 to Moscow)
        if (updatedRegions.autonomy.tension >= 80) {
          finalStats.kgb = Math.max(0, finalStats.kgb - 2);
          finalStats.moscow = Math.max(0, finalStats.moscow - 2);
        }

        // REGION CALM BONUSES (every 3 turns if tension < 30%):
        const nextTurnsCount = turnsPlayed + 1;
        setTurnsPlayed(nextTurnsCount);
        if (nextTurnsCount % 3 === 0) {
          if (updatedRegions.capital.tension < 30) {
            finalStats.moscow = Math.min(100, finalStats.moscow + 1);
          }
          if (updatedRegions.miners.tension < 30) {
            const minerBonus = leaderBackground === 'director' ? 2 : 1;
            finalStats.economy = Math.min(100, finalStats.economy + minerBonus);
          }
          if (updatedRegions.agrarian.tension < 30) {
            finalStats.people = Math.min(100, finalStats.people + 1);
          }
          if (updatedRegions.autonomy.tension < 30) {
            finalStats.kgb = Math.min(100, finalStats.kgb + 1);
          }
        }

        setRegions(updatedRegions);
        setStats(finalStats);
        setProfile(newProfile);
        setDaysSurvived(newDays);
        setDecrees(newDecrees);
        setSupportedGkchp(newGkchpSupport);

        // Check ending conditions
        const ending = determineEnding(finalStats, newProfile, newDays, newGkchpSupport);
        if (ending) {
          triggerEnding(ending);
        } else {
          // Check if KGB Special Report should trigger (every 6-7 turns OR any sector tension >= 70%)
          const shouldTriggerSpecial =
            nextSpecialReportCount >= 6 ||
            Object.values(updatedRegions).some((r) => r.tension >= 70);

          let targetIdx = currentCardIndex + 1;
          let foundIdx = -1;

          // 1. If special report triggered, prioritize eligible unplayed KGB Special Report
          if (shouldTriggerSpecial) {
            for (let i = targetIdx; i < cardDeck.length; i++) {
              const candidate = cardDeck[i];
              if (
                candidate.isSpecialReport &&
                isCardEligible(candidate, newFlags, nextTurnsCount, updatedPlayedIds)
              ) {
                foundIdx = i;
                break;
              }
            }
            if (foundIdx === -1) {
              for (let i = 0; i < targetIdx; i++) {
                const candidate = cardDeck[i];
                if (
                  candidate.isSpecialReport &&
                  isCardEligible(candidate, newFlags, nextTurnsCount, updatedPlayedIds)
                ) {
                  foundIdx = i;
                  break;
                }
              }
            }
          }

          // 2. Regular queue search: skip special reports unless triggered
          if (foundIdx === -1) {
            for (let i = targetIdx; i < cardDeck.length; i++) {
              const candidate = cardDeck[i];
              if (candidate.isSpecialReport) continue;
              if (!isCardEligible(candidate, newFlags, nextTurnsCount, updatedPlayedIds)) continue;
              if (candidate.isCrisis && !candidate.isGkchp && nextCalmCount < 4) continue;

              foundIdx = i;
              break;
            }
          }

          // 3. Fallback search earlier in deck if end reached
          if (foundIdx === -1) {
            for (let i = 0; i < targetIdx; i++) {
              const candidate = cardDeck[i];
              if (candidate.isSpecialReport) continue;
              if (!isCardEligible(candidate, newFlags, nextTurnsCount, updatedPlayedIds)) continue;
              if (candidate.isCrisis && !candidate.isGkchp && nextCalmCount < 4) continue;

              foundIdx = i;
              break;
            }
          }

          if (foundIdx !== -1) {
            if (foundIdx !== targetIdx) {
              setCardDeck((prev) => {
                const copy = [...prev];
                const [targetCard] = copy.splice(foundIdx, 1);
                copy.splice(targetIdx, 0, targetCard);
                return copy;
              });
            }
            setCurrentCardIndex(targetIdx);
          } else {
            setCurrentCardIndex((prev) => (prev + 1 < cardDeck.length ? prev + 1 : 0));
          }
        }

        setDragX(0);
        setIsDragging(false);
        setCardAnimating(null);
      }, 240);
    },
    [
      currentCard,
      cardAnimating,
      showSummaryModal,
      showMapModal,
      tassBulletin,
      stats,
      profile,
      daysSurvived,
      decrees,
      supportedGkchp,
      storyFlags,
      playedCardIds,
      turnsSinceSpecialReport,
      turnsSinceCrisis,
      isEmergency,
      cardDeck,
      currentCardIndex,
      isCardEligible,
      triggerEnding,
      regions,
      turnsPlayed,
      leaderBackground,
    ]
  );

  // New Mechanic: [ПОД СУКНО: 2] (Shelve current card without changing stats)
  const handleShelveCard = useCallback(() => {
    // Siege of House of Soviets: capital riot blocks shelving!
    if (regions.capital.tension >= 80) return;
    if (shelveRemaining <= 0 || cardAnimating || !currentCard || showSummaryModal || showMapModal || tassBulletin) return;
    terminalAudio.playPaperSlide();
    setShelveRemaining((prev) => prev - 1);
    setTriumphActive(true);
    setTriumphText('КАРТОЧКА ОТЛОЖЕНА ПОД СУКНО');
    setTimeout(() => setTriumphActive(false), 1600);

    // Push current card to the back of the deck and advance to next eligible card
    setCardDeck((prev) => {
      const copy = [...prev];
      const [shelved] = copy.splice(currentCardIndex, 1);
      copy.push(shelved);

      for (let i = currentCardIndex; i < copy.length; i++) {
        const candidate = copy[i];
        if (candidate.isSpecialReport) continue;
        if (!isCardEligible(candidate, storyFlags, turnsPlayed, playedCardIds)) continue;
        if (candidate.isCrisis && !candidate.isGkchp && turnsSinceCrisis < 4) continue;

        if (i !== currentCardIndex) {
          const [targetCard] = copy.splice(i, 1);
          copy.splice(currentCardIndex, 0, targetCard);
        }
        break;
      }
      return copy;
    });
  }, [
    regions,
    shelveRemaining,
    cardAnimating,
    currentCard,
    currentCardIndex,
    showSummaryModal,
    showMapModal,
    tassBulletin,
    isCardEligible,
    storyFlags,
    playedCardIds,
    turnsPlayed,
    turnsSinceCrisis,
  ]);

  // -------------------------------------------------------------
  // OPERATIONAL DIRECTIVES (АСУ ТАКТИЧЕСКИЙ ПЛАНШЕТ)
  // -------------------------------------------------------------
  const handleDirectiveGosplan = useCallback(() => {
    if (directiveCooldown > 0) return;
    const otherRegions = (['capital', 'miners', 'agrarian', 'autonomy'] as RegionId[]).filter(
      (id) => id !== selectedMapRegion
    );
    otherRegions.sort((a, b) => regions[a].tension - regions[b].tension);
    const calmest = otherRegions[0];

    const tensionDrop = leaderBackground === 'apparatchik' ? 30 : 25;
    const tensionAdd = leaderBackground === 'apparatchik' ? 15 : 18;

    setRegions((prev) => ({
      ...prev,
      [selectedMapRegion]: {
        ...prev[selectedMapRegion],
        tension: Math.max(0, prev[selectedMapRegion].tension - tensionDrop),
      },
      [calmest]: {
        ...prev[calmest],
        tension: Math.min(100, prev[calmest].tension + tensionAdd),
      },
    }));
    const nextCooldown = leaderBackground === 'technocrat' ? 2 : 3;
    setDirectiveCooldown(nextCooldown);
    terminalAudio.playDirectiveLaunch();
    setTriumphActive(true);
    setTriumphText(`ГОСПЛАН: ФОНДЫ ПЕРЕБРОШЕНЫ ИЗ [${regions[calmest].name}]`);
    setTimeout(() => setTriumphActive(false), 2200);
  }, [directiveCooldown, selectedMapRegion, regions, leaderBackground]);

  const handleDirectiveSupplyTrain = useCallback(() => {
    if (directiveCooldown > 0) return;
    const isMinersRiot = regions.miners.tension >= 80;
    const cost = leaderBackground === 'director' ? (isMinersRiot ? 6 : 3) : (isMinersRiot ? 12 : 6);
    if (stats.economy < cost) return;

    const nextStats = { ...stats, economy: Math.max(0, stats.economy - cost) };
    setStats(nextStats);
    setRegions((prev) => ({
      ...prev,
      [selectedMapRegion]: {
        ...prev[selectedMapRegion],
        tension: Math.max(0, prev[selectedMapRegion].tension - 30),
      },
    }));
    const nextCooldown = leaderBackground === 'technocrat' ? 2 : 3;
    setDirectiveCooldown(nextCooldown);
    terminalAudio.playDirectiveLaunch();
    setTriumphActive(true);
    setTriumphText(`ЭШЕЛОН СНАБЖЕНИЯ ПРИБЫЛ В [${regions[selectedMapRegion].name}]`);
    setTimeout(() => setTriumphActive(false), 2200);

    const ending = determineEnding(nextStats, profile, daysSurvived, supportedGkchp);
    if (ending) {
      setShowMapModal(false);
      triggerEnding(ending);
    }
  }, [directiveCooldown, regions, stats, selectedMapRegion, profile, daysSurvived, supportedGkchp, triggerEnding, leaderBackground]);

  const handleDirectiveCurfew = useCallback(() => {
    if (directiveCooldown > 0) return;
    const voronovAlly = storyFlags.includes('voronov_ally');
    let kgbCost = 6;
    let peopleCost = 4;
    let curfewDuration = 3;

    if (leaderBackground === 'kgb') {
      kgbCost = voronovAlly ? 2 : 3;
      peopleCost = 2;
      curfewDuration = 4;
    } else if (leaderBackground === 'technocrat') {
      kgbCost = voronovAlly ? 6 : 9;
      peopleCost = 4;
      curfewDuration = 3;
    } else {
      kgbCost = voronovAlly ? 3 : 6;
      peopleCost = 4;
      curfewDuration = 3;
    }

    if (stats.kgb < kgbCost || stats.people < peopleCost) return;

    const nextStats = {
      ...stats,
      kgb: Math.max(0, stats.kgb - kgbCost),
      people: Math.max(0, stats.people - peopleCost),
    };
    const nextProfile = {
      ...profile,
      autocracy: Math.min(100, profile.autocracy + 6),
    };

    setStats(nextStats);
    setProfile(nextProfile);
    setRegions((prev) => ({
      ...prev,
      [selectedMapRegion]: {
        ...prev[selectedMapRegion],
        tension: Math.max(0, prev[selectedMapRegion].tension - 35),
        curfewTurns: curfewDuration,
      },
    }));
    const nextCooldown = leaderBackground === 'technocrat' ? 2 : 3;
    setDirectiveCooldown(nextCooldown);
    terminalAudio.playDirectiveLaunch();
    setTriumphActive(true);
    setTriumphText(`ОСОБЫЙ РЕЖИМ ВВЕДЕН: [${regions[selectedMapRegion].name}]`);
    setTimeout(() => setTriumphActive(false), 2200);

    const ending = determineEnding(nextStats, nextProfile, daysSurvived, supportedGkchp);
    if (ending) {
      setShowMapModal(false);
      triggerEnding(ending);
    }
  }, [directiveCooldown, storyFlags, stats, profile, selectedMapRegion, regions, daysSurvived, supportedGkchp, triggerEnding, leaderBackground]);

  const handleDirectiveSelfGov = useCallback(() => {
    const moscowCost = leaderBackground === 'director' ? 9 : (leaderBackground === 'technocrat' ? 4 : 6);
    const sovGain = leaderBackground === 'technocrat' ? 8 : 6;

    if (directiveCooldown > 0 || stats.moscow < moscowCost) return;

    const nextStats = {
      ...stats,
      moscow: Math.max(0, stats.moscow - moscowCost),
    };
    const nextProfile = {
      ...profile,
      sovereignty: Math.min(100, profile.sovereignty + sovGain),
    };

    setStats(nextStats);
    setProfile(nextProfile);
    setRegions((prev) => ({
      ...prev,
      [selectedMapRegion]: {
        ...prev[selectedMapRegion],
        tension: Math.max(0, prev[selectedMapRegion].tension - 25),
      },
    }));
    const nextCooldown = leaderBackground === 'technocrat' ? 2 : 3;
    setDirectiveCooldown(nextCooldown);
    terminalAudio.playDirectiveLaunch();
    setTriumphActive(true);
    setTriumphText(`САМОУПРАВЛЕНИЕ УТВЕРЖДЕНО: [${regions[selectedMapRegion].name}]`);
    setTimeout(() => setTriumphActive(false), 2200);

    const ending = determineEnding(nextStats, nextProfile, daysSurvived, supportedGkchp);
    if (ending) {
      setShowMapModal(false);
      triggerEnding(ending);
    }
  }, [directiveCooldown, stats, profile, selectedMapRegion, regions, daysSurvived, supportedGkchp, triggerEnding, leaderBackground]);

  // Pointer drag events for realistic card swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    if (cardAnimating || showSummaryModal || showMapModal || tassBulletin) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || cardAnimating) return;
    const diff = e.clientX - dragStartX.current;
    setDragX(diff);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || cardAnimating) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }

    if (dragX < -85) {
      applyChoice(true);
    } else if (dragX > 85) {
      applyChoice(false);
    } else {
      setDragX(0);
    }
  };

  // Keyboard navigation: A / D, ArrowLeft / ArrowRight, and Russian Ф / В
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game' || cardAnimating || showSummaryModal || showMapModal || tassBulletin) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        terminalAudio.playKeyClick();
        applyChoice(true);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        terminalAudio.playKeyClick();
        applyChoice(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, cardAnimating, showSummaryModal, showMapModal, tassBulletin, applyChoice]);

  // Teletype menu selection typewriter
  const handleMenuSelect = (cmdText: string, targetScreen: ScreenMode) => {
    if (isTypingCommand) return;
    setIsTypingCommand(true);
    setCommandInput('');
    terminalAudio.playSwitchClick();

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setCommandInput(cmdText.slice(0, i));
      terminalAudio.playTeletypeClick();

      if (i >= cmdText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setMenuFlicker(true);
          setTimeout(() => {
            setMenuFlicker(false);
            setIsTypingCommand(false);
            setCommandInput('');
            if (targetScreen === 'candidate' || targetScreen === 'game') {
              setScreen('candidate');
            } else {
              setScreen(targetScreen);
            }
          }, 150);
        }, 120);
      }
    }, 30);
  };

  // Return to menu with clean stats and flags reset
  const handleReturnToMenu = () => {
    terminalAudio.playSwitchToggle();
    terminalAudio.stopMachineAmbient();
    terminalAudio.updateAdaptiveMusic(false, false);
    const bgKey = leaderBackground || 'apparatchik';
    const bg = LEADER_BACKGROUNDS[bgKey];
    setStats({ ...bg.initialStats });
    setProfile({ sovereignty: 20, autocracy: 30, market: 20 });
    setDaysSurvived(0);
    setDecrees([]);
    setStoryFlags([]);
    setPlayedCardIds([]);
    setTurnsSinceSpecialReport(0);
    setRegions({
      capital: { ...INITIAL_REGIONS.capital, tension: bg.initialRegions.capital },
      miners: { ...INITIAL_REGIONS.miners, tension: bg.initialRegions.miners },
      agrarian: { ...INITIAL_REGIONS.agrarian, tension: bg.initialRegions.agrarian },
      autonomy: { ...INITIAL_REGIONS.autonomy, tension: bg.initialRegions.autonomy },
    });
    setDirectiveCooldown(0);
    setTurnsPlayed(0);
    setShowMapModal(false);
    setSelectedMapRegion('capital');
    setShelveRemaining(bgKey === 'apparatchik' ? 4 : 2);
    setTurnsSinceCrisis(4);
    setShowSummaryModal(false);
    setTassBulletin(null);
    setCurrentEnding(null);
    setScreen('menu');
  };

  // Briefing lines
  const briefingLines = [
    'КАНАЛ СВЯЗИ ЦК КПСС — СОВЕРШЕННО СЕКРЕТНО',
    'ДАТА: 14 ОКТЯБРЯ 1989 ГОДА',
    'КОМУ: ПЕРВОМУ СЕКРЕТАРЮ ЦК КОМПАРТИИ РЕСПУБЛИКИ',
    '--------------------------------------------------',
    'ЧРЕЗВЫЧАЙНОЕ СООБЩЕНИЕ ИЗ МОСКВЫ.',
    'ПРЕЖНИЙ РУКОВОДИТЕЛЬ РЕСПУБЛИКИ СМЕЩЕН С ДОЛЖНОСТИ',
    'ПОСЛЕ ВЧЕРАШНИХ УЛИЧНЫХ ВОЛНЕНИЙ И ЗАБАСТОВОК.',
    'РЕШЕНИЕМ ПОЛИТБЮРО ЦК КПСС ВЫ НАЗНАЧЕНЫ ГЛАВОЙ РЕГИОНА.',
    'ВАША ЗАДАЧА — УДЕРЖАТЬ РЕСПУБЛИКУ ОТ КАТАСТРОФЫ,',
    'МАНЕВРИРУЯ МЕЖДУ МОСКВОЙ, НАРОДОМ, КГБ И ЭКОНОМИКОЙ.',
    'ВПЕРЕДИ — 750 ДНЕЙ ИСТОРИЧЕСКОГО ШТОРМА ДО ДЕКАБРЯ 1991.',
  ];

  // Briefing typewriter progression
  useEffect(() => {
    if (screen !== 'briefing') return;
    if (briefingLineIdx < briefingLines.length) {
      const timer = setTimeout(() => {
        setBriefingLineIdx((prev) => prev + 1);
        terminalAudio.playTeletype();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setBriefingDone(true);
    }
  }, [screen, briefingLineIdx, briefingLines.length]);

  // Skip briefing on tap
  const handleSkipBriefing = () => {
    if (!briefingDone) {
      setBriefingLineIdx(briefingLines.length);
      setBriefingDone(true);
      terminalAudio.playSwitchToggle();
    } else {
      terminalAudio.playSwitchToggle();
      setScreen('game');
    }
  };

  // Hotline «ВЧ-СВЯЗЬ» execution
  const executeHotline = () => {
    if (hotlineBoostStat === hotlineSacrificeStat) return;
    terminalAudio.playHotlineTone();

    setStats((prev) => ({
      ...prev,
      [hotlineBoostStat]: Math.min(100, prev[hotlineBoostStat] + 20),
      [hotlineSacrificeStat]: Math.max(0, prev[hotlineSacrificeStat] - 25),
    }));

    setHotlineUsedInAct((prev) => ({ ...prev, [currentAct]: true }));
    setTriumphActive(true);
    setTriumphText('ВЧ-ПРИКАЗ ИСПОЛНЕН');
    setTimeout(() => setTriumphActive(false), 2000);
    setScreen('game');
  };

  // Sound toggle handler
  const handleToggleSound = () => {
    const muted = terminalAudio.toggleMute();
    setIsMuted(muted);
  };

  // Stat names in Russian
  const statLabels: Record<StatKey, string> = {
    moscow: 'МОСКВА',
    people: 'НАРОД',
    kgb: 'КГБ',
    economy: 'ЭКОНОМИКА',
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-[#050302] flex items-center justify-center p-0 md:p-3 overflow-hidden select-none">
      {/* Outer Industrial Vintage CRT Cabinet / Bezel */}
      <div
        className={`relative w-full h-full max-w-[540px] max-h-[100dvh] md:max-h-[960px] flex flex-col crt-screen-bezel rounded-none md:rounded-3xl border-2 sm:border-4 md:border-8 border-[#1f150c] overflow-hidden ${
          crtCurve ? 'shadow-[0_0_50px_rgba(0,0,0,0.95)]' : ''
        }`}
      >
        {/* CRT Bezel Screws in corners */}
        <div className="hidden md:block absolute top-2 left-2 text-[#4a341b] text-xs font-mono select-none">⊕</div>
        <div className="hidden md:block absolute top-2 right-2 text-[#4a341b] text-xs font-mono select-none">⊕</div>
        <div className="hidden md:block absolute bottom-2 left-2 text-[#4a341b] text-xs font-mono select-none">⊕</div>
        <div className="hidden md:block absolute bottom-2 right-2 text-[#4a341b] text-xs font-mono select-none">⊕</div>

        {/* Top Edge Telemetry bar */}
        <header className="relative z-20 shrink-0 flex items-center justify-between px-2 sm:px-3 md:px-5 py-1.5 sm:py-2 border-b border-[#3d2607] text-[10px] md:text-xs font-mono tracking-wider crt-amber-dim bg-[#0a0704]/80">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span className={isEmergency ? 'text-[#ff2a00] font-bold' : 'text-[#ffb000]'}>
              {isEmergency ? 'СЕКТОР-ЧП' : 'СЕКТОР-01'}
            </span>
            <span className="opacity-40">|</span>
            <span>СВЯЗЬ: ОК</span>
            {leaderBackground && (
              <>
                <span className="opacity-40 hidden sm:inline">|</span>
                <span className="text-[#ffb000] font-bold hidden sm:inline truncate max-w-[170px]" title={LEADER_BACKGROUNDS[leaderBackground].title}>
                  [{LEADER_BACKGROUNDS[leaderBackground].title}]
                </span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="hidden sm:inline">ОЗУ: 98%</span>
            <button
              onClick={handleToggleSound}
              className="px-1.5 py-0.5 border border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] text-[9px] md:text-[10px] transition cursor-pointer active:bg-[#ffb000] active:text-black"
              title="Переключить звук"
            >
              [ЗВУК: {isMuted ? 'ВЫКЛ' : 'ВКЛ'}]
            </button>
          </div>
        </header>

        {/* CRT Screen Main Active Area (strictly NO shake animations) */}
        <main
          className={`relative z-10 flex-1 min-h-0 flex flex-col p-2 sm:p-3 md:p-4 overflow-hidden ${
            menuFlicker ? 'opacity-70' : ''
          } ${beamCollapse ? 'animate-crt-off' : ''}`}
        >
          {/* ========================================================= */}
          {/* SCREEN: MAIN MENU                                         */}
          {/* ========================================================= */}
          {screen === 'menu' && (
            <div className="flex-1 flex flex-col justify-between py-2 text-center">
              {/* Header: Soviet Star & Title */}
              <div className="flex flex-col items-center mt-2">
                <div className="mb-2">
                  <svg width="48" height="48" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_rgba(255,176,0,0.6)]">
                    <polygon
                      points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36"
                      fill="none"
                      stroke="#ffb000"
                      strokeWidth="4"
                    />
                    <polygon
                      points="50,15 60,39 85,39 65,55 72,80 50,65 28,80 35,55 15,39 40,39"
                      fill="#ffb000"
                      opacity="0.15"
                    />
                    <path
                      d="M 52 42 C 43 40 40 48 42 56 C 44 64 53 66 59 62 L 62 66 C 54 71 42 68 38 57 C 35 46 41 35 53 37 Z"
                      fill="#ffb000"
                    />
                    <rect x="42" y="52" width="16" height="4" transform="rotate(-40 46 54)" fill="#ffb000" />
                    <rect x="44" y="52" width="4" height="18" transform="rotate(-40 46 54)" fill="#ffb000" />
                  </svg>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest crt-amber-text">
                  АСУ-РЕСПУБЛИКА 1989
                </h1>

                {/* Punch card code strip */}
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

              {/* Menu items */}
              <div className="flex flex-col space-y-4 my-auto px-4 max-w-[380px] mx-auto w-full text-left">
                <button
                  onClick={() => handleMenuSelect('НАЧАТЬ СЕАНС', 'candidate')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[#6e470b] hover:border-[#ffb000] hover:bg-[#ffb000]/10 transition cursor-pointer text-sm md:text-base crt-amber-text"
                >
                  <span className="font-bold">[1] НАЧАТЬ СЕАНС</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">▶</span>
                </button>

                <button
                  onClick={() => handleMenuSelect('АРХИВ ДАННЫХ', 'archive')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[#6e470b] hover:border-[#ffb000] hover:bg-[#ffb000]/10 transition cursor-pointer text-sm md:text-base crt-amber-text"
                >
                  <span className="font-bold">[2] АРХИВ ДАННЫХ</span>
                  <span className="text-xs text-[#8c5b0f] group-hover:text-[#ffb000] transition">
                    [ДОСЬЕ: {unlockedEndings.length}/13]
                  </span>
                </button>

                <button
                  onClick={() => handleMenuSelect('НАСТРОЙКИ СИСТЕМЫ', 'settings')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[#6e470b] hover:border-[#ffb000] hover:bg-[#ffb000]/10 transition cursor-pointer text-sm md:text-base crt-amber-text"
                >
                  <span className="font-bold">[3] НАСТРОЙКИ СИСТЕМЫ</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">⚙</span>
                </button>

                <button
                  onClick={() => handleMenuSelect('ПЕРЕЗАГРУЗКА', 'menu')}
                  disabled={isTypingCommand}
                  className="group flex items-center justify-between p-2.5 border border-[#6e470b] hover:border-[#ffb000] hover:bg-[#ffb000]/10 transition cursor-pointer text-sm md:text-base crt-amber-text opacity-75"
                >
                  <span className="font-bold">[4] ПЕРЕЗАГРУЗКА СИСТЕМЫ</span>
                  <span className="opacity-0 group-hover:opacity-100 transition">↺</span>
                </button>
              </div>

              {/* Bottom Command Prompt with blinking cursor */}
              <div className="w-full max-w-[380px] mx-auto text-left px-2 py-3 border-t border-[#3d2607]">
                <div className="text-xs md:text-sm crt-amber-text flex items-center space-x-1">
                  <span>ВЫБЕРИТЕ РЕЖИМ &gt;</span>
                  <span className="font-bold tracking-wider">{commandInput}</span>
                  <span className="inline-block w-2.5 h-4 bg-[#ffb000] animate-pulse">█</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: LEADER BACKGROUND SELECTION (КАДРОВЫЙ РЕЗЕРВ ЦК)  */}
          {/* ========================================================= */}
          {screen === 'candidate' && (
            <div className="flex-1 flex flex-col justify-between py-1 md:py-2 text-xs font-mono overflow-y-auto">
              <div className="border-2 border-[#ffb000] bg-[#100a04] p-3 md:p-4 flex-1 flex flex-col justify-between shadow-[0_0_35px_rgba(255,176,0,0.2)]">
                <div>
                  {/* Top Header of Candidate Dossier */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#6e470b] pb-2 mb-3 gap-1">
                    <div>
                      <h2 className="text-xs md:text-sm font-black crt-amber-text tracking-wider uppercase">
                        [ КАДРОВЫЙ РЕЗЕРВ ЦК КПСС // УТВЕРЖДЕНИЕ КАНДИДАТУРЫ ]
                      </h2>
                      <div className="text-[9px] text-[#8c5b0f]">
                        ОТДЕЛ ОРГАНИЗАЦИОННО-ПАРТИЙНОЙ РАБОТЫ ЦК КПСС • ЛИЧНОЕ ДЕЛО № 89-К
                      </div>
                    </div>
                    <div className="px-2 py-0.5 border border-[#ff2a00] bg-[#ff2a00]/15 text-[#ff2a00] text-[9px] md:text-[10px] font-bold tracking-widest uppercase">
                      ★ СОВЕРШЕННО СЕКРЕТНО ★
                    </div>
                  </div>

                  {/* Candidate Switcher Tabs */}
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
                          <div className="text-[10px] md:text-[11px] font-black truncate">
                            {bg.title}
                          </div>
                          <div className="text-[8.5px] text-[#8c5b0f] truncate mt-0.5">
                            {bg.subtitle.split(',')[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Candidate Detailed Dossier View */}
                  {(() => {
                    const currentBg = LEADER_BACKGROUNDS[inspectingBackground];
                    const portraitArchetype = BACKGROUND_ARCHETYPES[inspectingBackground];

                    return (
                      <div className="flex flex-col md:flex-row gap-3">
                        {/* Left: Monolithic SVG Portrait & File Tag */}
                        <div className="w-full md:w-[170px] shrink-0 flex flex-col items-center">
                          <div className="w-full h-[155px] md:h-[185px] border border-[#ffb000] bg-[#0a0603] p-1 flex items-center justify-center relative">
                            <TerminalPortrait archetype={portraitArchetype} />
                            <div className="absolute top-1 left-1 px-1 py-0.2 bg-black/80 border border-[#ffb000]/40 text-[7.5px] text-[#8c5b0f] font-mono">
                              ЛИЦО-89
                            </div>
                          </div>
                          <div className="w-full mt-1.5 p-1 border border-[#3d2607] bg-[#080502] text-center text-[8.5px] text-[#8c5b0f]">
                            ГРИФ: «ОСОБАЯ ПАПКА»
                          </div>
                        </div>

                        {/* Right: Personal Data, Dossier Text, Starting Stats & Perks */}
                        <div className="flex-1 space-y-2.5">
                          {/* Title & Rank */}
                          <div className="border-b border-[#3d2607] pb-1.5">
                            <h3 className="text-sm md:text-base font-extrabold text-[#ffb000]">
                              {currentBg.title}
                            </h3>
                            <div className="text-[10px] md:text-[11px] text-[#8c5b0f] font-bold">
                              {currentBg.subtitle}
                            </div>
                          </div>

                          {/* Dossier Narrative Summary */}
                          <div className="p-2 border border-[#6e470b] bg-[#0d0904] text-[10.5px] md:text-[11.5px] leading-relaxed text-[#ffb000]">
                            <span className="text-[9px] text-[#8c5b0f] font-bold block mb-0.5 tracking-wider">
                              СВОДКА ОТДЕЛА ОРГПАРТРАБОТЫ ЦК:
                            </span>
                            {currentBg.dossier}
                          </div>

                          {/* Initial Stats Badges (>50 green, <50 red, 50 amber) */}
                          <div>
                            <div className="text-[9px] text-[#8c5b0f] font-bold uppercase mb-1 tracking-wider">
                              СТАРТОВЫЙ РЕСУРС ВЛАСТИ:
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                              {(['moscow', 'people', 'kgb', 'economy'] as StatKey[]).map((key) => {
                                const val = currentBg.initialStats[key];
                                const label = statLabels[key];
                                const isHigh = val > 50;
                                const isLow = val < 50;
                                const badgeColor = isHigh
                                  ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/15'
                                  : isLow
                                  ? 'border-[#ff2a00] text-[#ff2a00] bg-[#ff2a00]/15'
                                  : 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10';

                                return (
                                  <div
                                    key={key}
                                    className={`p-1.5 border flex items-center justify-between font-mono ${badgeColor}`}
                                  >
                                    <span className="font-bold">{label}:</span>
                                    <span className="font-extrabold">{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Initial Region Tension Badges */}
                          <div>
                            <div className="text-[9px] text-[#8c5b0f] font-bold uppercase mb-1 tracking-wider">
                              СТАРТОВАЯ НАПРЯЖЕННОСТЬ СЕКТОРОВ:
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9.5px]">
                              {(['capital', 'miners', 'agrarian', 'autonomy'] as RegionId[]).map((rId) => {
                                const tVal = currentBg.initialRegions[rId];
                                const rMeta = REGION_META[rId];
                                return (
                                  <div
                                    key={rId}
                                    className="p-1 border border-[#3d2607] bg-[#0c0804] flex items-center justify-between text-[#ffb000]"
                                  >
                                    <span className="text-[#8c5b0f] font-bold">{rMeta.short}:</span>
                                    <span className={tVal >= 30 ? 'text-[#ff9900] font-bold' : 'text-[#33ff33]'}>
                                      {tVal}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Perk & Flaw Blocks */}
                          <div className="space-y-1.5 pt-1">
                            <div className="p-2 border border-[#33ff33]/50 bg-[#33ff33]/10 text-[#33ff33] text-[10px] md:text-[11px] leading-snug">
                              <span className="font-black">★ ПРЕИМУЩЕСТВО АППАРАТА ({currentBg.perkTitle}):</span>{' '}
                              {currentBg.perkDesc}
                            </div>
                            <div className="p-2 border border-[#ff2a00]/50 bg-[#ff2a00]/10 text-[#ff2a00] text-[10px] md:text-[11px] leading-snug">
                              <span className="font-black">▲ ОПЕРАТИВНЫЙ РИСК:</span> {currentBg.flawDesc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Actions Confirmation */}
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
          {/* SCREEN: INTRO CRYPTO TELEGRAM BRIEFING                   */}
          {/* ========================================================= */}
          {screen === 'briefing' && (
            <div
              onClick={handleSkipBriefing}
              className="flex-1 flex flex-col justify-between py-2 px-1 md:px-3 cursor-pointer"
            >
              <div className="border border-[#ffb000] p-3 md:p-5 bg-[#0e0904]/90 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs md:text-sm font-mono leading-relaxed crt-amber-text">
                  {briefingLines.slice(0, briefingLineIdx).map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        idx === 0
                          ? 'font-bold text-center tracking-widest border-b border-[#6e470b] pb-2 mb-2 text-[#ffb000]'
                          : idx < 4
                          ? 'opacity-70 text-[11px]'
                          : 'my-1'
                      }
                    >
                      {line}
                    </div>
                  ))}
                  {!briefingDone && (
                    <div className="inline-block w-2 h-3.5 bg-[#ffb000] animate-pulse">█</div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#6e470b] flex flex-col items-center">
                  {briefingDone ? (
                    <button
                      onClick={handleSkipBriefing}
                      className="w-full py-2.5 border-2 border-[#ffb000] bg-[#ffb000]/10 hover:bg-[#ffb000] hover:text-black font-extrabold text-sm md:text-base tracking-widest transition cursor-pointer"
                    >
                      [ ПРИНЯТЬ ПОЛНОМОЧИЯ ]
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#8c5b0f] tracking-wider animate-pulse">
                      [ НАЖМИТЕ ДЛЯ УСКОРЕНИЯ ПЕЧАТИ ]
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: MAIN GAMEPLAY TERMINAL                            */}
          {/* ========================================================= */}
          {screen === 'game' && currentCard && (
            <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              {/* Emergency Banner Alert if applicable (no shake) */}
              {isEmergency && (
                <div className="w-full shrink-0 py-0.5 px-2 mb-1 border border-[#ff2a00] bg-[#ff2a00]/15 text-[#ff2a00] text-[8.5px] sm:text-[9.5px] font-bold text-center tracking-widest">
                  ⚠ ВНИМАНИЕ: УГРОЗА ПОТЕРИ УПРАВЛЕНИЯ РЕСПУБЛИКОЙ ⚠
                </div>
              )}

              {/* Triumph stabilization alert */}
              {triumphActive && (
                <div className="w-full shrink-0 py-0.5 sm:py-1 px-2 mb-1 border border-[#33ff33] bg-[#33ff33]/20 text-[#33ff33] text-[9.5px] sm:text-xs font-bold text-center tracking-widest">
                  ★ {triumphText} ★
                </div>
              )}

              {/* TOP 4 INDICATORS (0-100) WITH 10 LIGHT SEGMENTS & TRIANGLE IMPACT MARKERS */}
              <div className="shrink-0 grid grid-cols-4 gap-1 md:gap-2 mb-1">
                {(['moscow', 'people', 'kgb', 'economy'] as StatKey[]).map((key) => {
                  const val = stats[key];
                  const filledSegments = Math.round(val / 10);
                  const isCrit = key === mostCriticalStat;
                  const impactVal = previewImpact?.[key];

                  return (
                    <div key={key} className="flex flex-col items-center">
                      {/* Triangle Warning Marker above bar */}
                      <div className="h-2.5 sm:h-3 flex items-center justify-center">
                        {impactVal !== undefined && impactVal !== 0 && (
                          <span
                            className={`text-[8.5px] sm:text-[9px] font-bold ${
                              impactVal > 0 ? 'text-[#33ff33]' : 'text-[#ff2a00]'
                            }`}
                          >
                            {impactVal > 0 ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      {/* 10-Segment Bar: Only the MOST critical stat is highlighted in red */}
                      <div
                        className={`w-full flex space-x-[1px] md:space-x-[2px] p-[1.5px] border transition-colors ${
                          isCrit
                            ? 'border-[#ff2a00] bg-[#ff2a00]/15 shadow-[0_0_6px_rgba(255,42,0,0.6)]'
                            : 'border-[#6e470b] bg-[#0c0804]'
                        }`}
                      >
                        {Array.from({ length: 10 }).map((_, segIdx) => {
                          const isLit = segIdx < filledSegments;
                          return (
                            <div
                              key={segIdx}
                              className={`h-1.5 sm:h-2 md:h-2.5 flex-1 transition-all ${
                                isLit
                                  ? isCrit
                                    ? 'bg-[#ff2a00] shadow-[0_0_3px_#ff2a00]'
                                    : 'bg-[#ffb000] shadow-[0_0_3px_#ffb000]'
                                  : 'bg-[#21160a]'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Stat Label strictly in Russian */}
                      <span
                        className={`text-[8.5px] sm:text-[9px] md:text-[10px] font-bold tracking-wider mt-0.5 truncate ${
                          isCrit ? 'text-[#ff2a00]' : 'crt-amber-text'
                        }`}
                      >
                        {statLabels[key]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* TACTICAL CONTROL BAR (Date/Act | [ПОД СУКНО] | [СВОДКА] | [КАРТА] | [ВЧ-СВЯЗЬ]) */}
              <div className="shrink-0 flex items-center justify-between px-1.5 sm:px-2 py-0.5 sm:py-1 mb-1 border border-[#6e470b] bg-[#110b06] text-[8.5px] sm:text-[9px] md:text-xs font-mono">
                {/* Left: Date & Act */}
                <div className="truncate max-w-[28%] text-[#ffb000]">
                  <span className="font-bold">{currentDateFormatted}</span>
                  <span className="opacity-40 mx-1 hidden sm:inline">|</span>
                  <span className="text-[8.5px] sm:text-[9px] text-[#8c5b0f] hidden sm:inline">
                    {currentCard.actTitle.split(':')[0]}
                  </span>
                </div>

                {/* Center buttons: [ПОД СУКНО: 2] & [СВОДКА] & [КАРТА] */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleShelveCard}
                    disabled={shelveRemaining <= 0 || !!cardAnimating || regions.capital.tension >= 80}
                    className={`px-1 sm:px-1.5 py-0.5 border text-[8.5px] sm:text-[9px] font-bold transition cursor-pointer ${
                      regions.capital.tension >= 80
                        ? 'border-[#ff2a00] text-[#ff2a00] bg-[#ff2a00]/15 cursor-not-allowed'
                        : shelveRemaining > 0
                        ? 'border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black'
                        : 'border-[#4a341b] text-[#553810] cursor-not-allowed'
                    }`}
                    title={
                      regions.capital.tension >= 80
                        ? 'Осада Дома Советов: откладывание заблокировано бунтовщиками!'
                        : 'Отложить карточку без изменения шкал (2 раза за Акт)'
                    }
                  >
                    {regions.capital.tension >= 80 ? '[ОСАДА]' : `[СУКНО: ${shelveRemaining}]`}
                  </button>

                  <button
                    onClick={() => {
                      terminalAudio.playSwitchClick();
                      setShowSummaryModal(true);
                    }}
                    className="px-1 sm:px-1.5 py-0.5 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black text-[8.5px] sm:text-[9px] font-bold transition cursor-pointer"
                    title="Сводка политического профиля"
                  >
                    [СВОДКА]
                  </button>

                  <button
                    onClick={() => {
                      terminalAudio.playSwitchClick();
                      setShowMapModal(true);
                    }}
                    className="px-1 sm:px-1.5 py-0.5 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black text-[8.5px] sm:text-[9px] font-bold transition cursor-pointer"
                    title="Открыть тактический экран карты секторов"
                  >
                    [КАРТА]
                  </button>
                </div>

                {/* Right: Hotline Button «ВЧ-СВЯЗЬ» */}
                <button
                  onClick={() => {
                    terminalAudio.playHotlineTone();
                    setScreen('hotline');
                  }}
                  disabled={hotlineUsedInAct[currentAct]}
                  className={`px-1 sm:px-1.5 py-0.5 border text-[8.5px] sm:text-[9px] font-bold transition cursor-pointer ${
                    hotlineUsedInAct[currentAct]
                      ? 'border-[#3a250a] text-[#553810] cursor-not-allowed'
                      : 'border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black'
                  }`}
                  title="Правительственная спецсвязь (1 раз за Акт)"
                >
                  [ВЧ-СВЯЗЬ]
                </button>
              </div>

              {/* MINI-TELEMETRY OF 4 SECTORS */}
              <div className="shrink-0 flex items-center justify-between px-1.5 sm:px-2 py-0.5 sm:py-1 mb-1 border border-[#6e470b] bg-[#0c0803] text-[8.5px] md:text-[10px] font-mono select-none">
                <div className="flex items-center space-x-1 md:space-x-1.5 overflow-x-auto py-0.2">
                  {(['capital', 'miners', 'agrarian', 'autonomy'] as RegionId[]).map((rId) => {
                    const reg = regions[rId];
                    const isRiot = reg.tension >= 80;
                    const isWarn = reg.tension >= 50 && reg.tension < 80;
                    return (
                      <button
                        key={rId}
                        onClick={() => {
                          setSelectedMapRegion(rId);
                          setShowMapModal(true);
                          terminalAudio.playTeletypeClick();
                        }}
                        className={`px-1 sm:px-1.5 py-0.5 border cursor-pointer transition font-bold flex items-center space-x-0.5 sm:space-x-1 ${
                          isRiot
                            ? 'border-[#ff2a00] bg-[#ff2a00]/25 text-[#ff2a00] animate-pulse'
                            : isWarn
                            ? 'border-[#ff9900] bg-[#ff9900]/15 text-[#ff9900]'
                            : 'border-[#6e470b] bg-[#140d07] text-[#ffb000] hover:border-[#ffb000]'
                        }`}
                        title={`${reg.name}: ${reg.tension}% (клик для открытия карты)`}
                      >
                        <span>[{REGION_META[rId].short}: {reg.tension}%]</span>
                        {reg.curfewTurns > 0 && (
                          <span className="text-[7.5px] sm:text-[8px] text-[#33ff33]">●{reg.curfewTurns}Х</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    terminalAudio.playSwitchClick();
                    setShowMapModal(true);
                  }}
                  className="ml-1 px-1 sm:px-1.5 py-0.5 border border-[#ffb000] bg-[#ffb000]/10 text-[#ffb000] hover:bg-[#ffb000] hover:text-black font-extrabold text-[8.5px] sm:text-[9px] transition shrink-0 cursor-pointer"
                >
                  [КАРТА]
                </button>
              </div>

              {/* CENTRAL CARD STACK & SWIPEABLE CARD */}
              <div className="relative flex-1 min-h-0 flex items-center justify-center my-0.5 touch-none overflow-hidden">
                {/* Silhouette background sheets of upcoming dispatches */}
                <div className="absolute w-[86%] h-[94%] border border-[#3d2607] rotate-2 pointer-events-none opacity-40 bg-[#0e0904]" />
                <div className="absolute w-[86%] h-[94%] border border-[#3d2607] -rotate-2 pointer-events-none opacity-40 bg-[#0e0904]" />

                {/* Current Active Card with Smooth Spring Return */}
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    transform: `translateX(${dragX}px) rotate(${cardRotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1)',
                  }}
                  className={`relative z-10 w-[94%] sm:w-[92%] h-full max-h-[460px] border-2 p-2 sm:p-2.5 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
                    currentCard.isSpecialReport
                      ? 'border-[#ff2a00] bg-[#160806] shadow-[0_0_25px_rgba(255,42,0,0.4)]'
                      : isEmergency
                      ? 'border-[#ff2a00] bg-[#120c06]'
                      : 'border-[#ffb000] bg-[#120c06]'
                  } ${
                    cardAnimating === 'left'
                      ? '-translate-x-[450px] -rotate-15 opacity-0 transition-all duration-240'
                      : ''
                  } ${
                    cardAnimating === 'right'
                      ? 'translate-x-[450px] rotate-15 opacity-0 transition-all duration-240'
                      : ''
                  }`}
                >
                  {/* KGB Special Report Banner Header */}
                  {currentCard.isSpecialReport && (
                    <div className="shrink-0 flex items-center justify-between px-1.5 py-0.5 mb-1 border border-[#ff2a00] bg-[#ff2a00]/20 text-[#ff2a00] font-mono text-[8.5px] sm:text-[9.5px] font-bold tracking-wider">
                      <span className="flex items-center space-x-1">
                        <span>⚔️🛡️</span>
                        <span className="truncate">ОСОБАЯ ПАПКА УКГБ // ТОЛЬКО ЛИЧНО</span>
                      </span>
                      <span className="animate-pulse shrink-0 ml-1">● СОВ. СЕКРЕТНО</span>
                    </div>
                  )}

                  {/* Tilt decision stamp overlay */}
                  {dragX < -30 && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-2 py-0.5 sm:py-1 border-2 border-[#ff2a00] bg-[#120c06]/95 text-[#ff2a00] font-black text-xs md:text-sm tracking-widest rotate-6 pointer-events-none shadow-[0_0_10px_rgba(255,42,0,0.5)]">
                      {currentCard.leftChoice.label}
                    </div>
                  )}
                  {dragX > 30 && (
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 px-2 py-0.5 sm:py-1 border-2 border-[#33ff33] bg-[#120c06]/95 text-[#33ff33] font-black text-xs md:text-sm tracking-widest -rotate-6 pointer-events-none shadow-[0_0_10px_rgba(51,255,51,0.5)]">
                      {currentCard.rightChoice.label}
                    </div>
                  )}

                  {/* Upper Half: Procedural SVG Dithered Portrait or Crisis Visual */}
                  <div
                    className={`w-full flex-1 min-h-0 max-h-[125px] sm:max-h-[160px] md:max-h-[195px] flex items-center justify-center border p-1 overflow-hidden ${
                      currentCard.isSpecialReport ? 'border-[#ff2a00] bg-[#0c0303]' : 'border-[#6e470b] bg-[#0a0603]'
                    }`}
                  >
                    <TerminalPortrait
                      archetype={currentCard.archetype}
                      isEmergency={isEmergency || !!currentCard.isSpecialReport}
                    />
                  </div>

                  {/* Lower Half: Situation Text & Question strictly in Russian */}
                  <div className="w-full mt-1 sm:mt-2 pt-1 sm:pt-1.5 border-t border-[#6e470b] flex flex-col justify-between flex-shrink">
                    <div>
                      {/* Sender position with Sector badge */}
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                        <span
                          className={`text-[9px] md:text-[10px] font-bold tracking-wider truncate ${
                            currentCard.isSpecialReport ? 'text-[#ff5533]' : 'text-[#8c5b0f]'
                          }`}
                        >
                          ● {currentCard.senderTitle}
                        </span>
                        <span
                          className={`text-[8px] md:text-[9px] px-1 py-0.2 border font-bold shrink-0 ml-1 ${
                            currentCard.isSpecialReport
                              ? 'border-[#ff2a00] text-[#ff2a00] bg-[#ff2a00]/15'
                              : 'border-[#8c5b0f] text-[#ffb000] bg-[#160f08]'
                          }`}
                        >
                          [{regions[currentCard.region || 'capital'].name}]
                        </span>
                      </div>
                      {/* Telegram message */}
                      <p
                        className={`text-[10px] sm:text-[11px] md:text-[12px] font-mono leading-tight sm:leading-snug tracking-normal uppercase line-clamp-4 sm:line-clamp-5 ${
                          currentCard.isSpecialReport ? 'text-[#ffddaa]' : 'crt-amber-text'
                        }`}
                      >
                        {currentCard.text}
                      </p>
                    </div>

                    {/* Hint with keyboard controls */}
                    <div className="text-[8.5px] sm:text-[9px] text-center text-[#8c5b0f] mt-0.5">
                      ◀ [A / ВЛЕВО] СВАЙП [ВПРАВО / D] ▶
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM NAVIGATION & SWIPE CHOICES BUTTONS */}
              <div className="shrink-0 flex items-center justify-between px-1 py-0.5 sm:py-1 text-xs font-mono my-0.5">
                {/* Left Choice Button */}
                <button
                  onClick={() => {
                    terminalAudio.playKeyClick();
                    applyChoice(true);
                  }}
                  className={`flex-1 mr-1 p-1.5 sm:p-2 border text-left transition cursor-pointer active:scale-98 ${
                    dragX < -30
                      ? 'border-[#ff2a00] bg-[#ff2a00]/15 text-[#ff2a00] font-bold'
                      : 'border-[#6e470b] text-[#ffb000] hover:border-[#ffb000] bg-[#0f0904]'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">◀</span>
                    <span className="text-[9.5px] sm:text-[10px] md:text-[11px] font-bold truncate">
                      {currentCard.leftChoice.label}
                    </span>
                  </div>
                </button>

                {/* Right Choice Button */}
                <button
                  onClick={() => {
                    terminalAudio.playKeyClick();
                    applyChoice(false);
                  }}
                  className={`flex-1 ml-1 p-1.5 sm:p-2 border text-right transition cursor-pointer active:scale-98 ${
                    dragX > 30
                      ? 'border-[#33ff33] bg-[#33ff33]/15 text-[#33ff33] font-bold'
                      : 'border-[#6e470b] text-[#ffb000] hover:border-[#ffb000] bg-[#0f0904]'
                  }`}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span className="text-[9.5px] sm:text-[10px] md:text-[11px] font-bold truncate">
                      {currentCard.rightChoice.label}
                    </span>
                    <span className="text-xs">▶</span>
                  </div>
                </button>
              </div>

              {/* BOTTOM-MOST TERMINAL STATUS FRAME */}
              <footer className="shrink-0 flex items-center justify-between px-2 py-0.5 sm:py-1 border-t border-[#3d2607] text-[9px] sm:text-[10px] md:text-xs font-mono crt-amber-dim bg-[#0a0704]">
                <span>СЕРИЯ-89</span>
                <span className="font-bold text-[#ffb000]">
                  ДНЕЙ ДО ФИНАЛА: {Math.max(0, 750 - daysSurvived)}
                </span>
                <span
                  className={`font-bold ${
                    isEmergency ? 'text-[#ff2a00]' : 'text-[#ffb000]'
                  }`}
                >
                  {isEmergency ? 'СТАТУС: ЧП' : 'СТАТУС: НОРМА'}
                </span>
              </footer>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: СВОДКА ПОЛИТИЧЕСКОГО ВЕКТОРА                       */}
          {/* ========================================================= */}
          {showSummaryModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs">
              <div className="w-full max-w-[420px] border-2 border-[#ffb000] bg-[#120c06] p-4 font-mono shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                <div className="flex items-center justify-between border-b border-[#6e470b] pb-2 mb-3">
                  <h3 className="text-sm font-extrabold crt-amber-text">[ СВОДКА: ПОЛИТИЧЕСКИЙ ВЕКТОР ]</h3>
                  <span className="text-[10px] text-[#8c5b0f]">АРХИВ-89</span>
                </div>

                <div className="space-y-3 text-xs mb-4">
                  {/* Sovereignty */}
                  <div>
                    <div className="flex justify-between text-[#ffb000] mb-1">
                      <span className="font-bold">СУВЕРЕНИТЕТ: {profile.sovereignty}%</span>
                      <span className="text-[10px] text-[#8c5b0f]">
                        {profile.sovereignty >= 60
                          ? 'Курс на независимость'
                          : profile.sovereignty <= 30
                          ? 'Лояльность Центру'
                          : 'Баланс автономии'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#21160a] border border-[#6e470b]">
                      <div className="h-full bg-[#ffb000]" style={{ width: `${profile.sovereignty}%` }} />
                    </div>
                  </div>

                  {/* Autocracy */}
                  <div>
                    <div className="flex justify-between text-[#ffb000] mb-1">
                      <span className="font-bold">АВТОКРАТИЯ: {profile.autocracy}%</span>
                      <span className="text-[10px] text-[#8c5b0f]">
                        {profile.autocracy >= 60
                          ? 'Силовой контроль'
                          : profile.autocracy <= 30
                          ? 'Плюрализм и улица'
                          : 'Умеренное правление'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#21160a] border border-[#6e470b]">
                      <div className="h-full bg-[#ffb000]" style={{ width: `${profile.autocracy}%` }} />
                    </div>
                  </div>

                  {/* Market */}
                  <div>
                    <div className="flex justify-between text-[#ffb000] mb-1">
                      <span className="font-bold">РЫНОК: {profile.market}%</span>
                      <span className="text-[10px] text-[#8c5b0f]">
                        {profile.market >= 60
                          ? 'Частный сектор / Кооперативы'
                          : profile.market <= 30
                          ? 'Госплан и талоны'
                          : 'Смешанная модель'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#21160a] border border-[#6e470b]">
                      <div className="h-full bg-[#ffb000]" style={{ width: `${profile.market}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-2 border border-[#3d2607] bg-[#0c0804] text-[10px] text-[#ffb000]/80 mb-3 leading-relaxed">
                  Скрытый вектор республики формируется вашими историческими решениями и напрямую определяет финал в декабре 1991 года.
                </div>

                <button
                  onClick={() => {
                    terminalAudio.playSwitchClick();
                    setShowSummaryModal(false);
                  }}
                  className="w-full py-2 border border-[#ffb000] bg-[#ffb000]/10 hover:bg-[#ffb000] hover:text-black font-bold text-xs tracking-wider transition cursor-pointer"
                >
                  [ ЗАКРЫТЬ СВОДКУ ]
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: ТАКТИЧЕСКИЙ ПЛАНШЕТ (ВЕКТОРНАЯ КАРТА СЕКТОРОВ)     */}
          {/* ========================================================= */}
          {showMapModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-2 md:p-3 bg-black/90 backdrop-blur-xs font-mono select-none overflow-y-auto">
              <div className="w-full max-w-[780px] border-2 border-[#ffb000] bg-[#100a04] p-3 md:p-4 shadow-[0_0_40px_rgba(255,176,0,0.25)] flex flex-col max-h-[96vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#6e470b] pb-2 mb-2">
                  <div>
                    <h3 className="text-xs md:text-sm font-black crt-amber-text tracking-wider">
                      [ ТАКТИЧЕСКИЙ ПЛАНШЕТ: КАРТА СЕКТОРОВ АСУ ]
                    </h3>
                    <div className="flex items-center space-x-2 text-[9px] text-[#8c5b0f]">
                      <span>
                        {directiveCooldown > 0
                          ? `● КАНАЛ ДИРЕКТИВ: ПЕРЕЗАРЯДКА (${directiveCooldown} ХОДА)`
                          : '● КАНАЛ ДИРЕКТИВ: ГОТОВ К ИСПОЛНЕНИЮ'}
                      </span>
                      {leaderBackground && (
                        <>
                          <span className="opacity-40">|</span>
                          <span className="text-[#ffb000] font-bold">
                            КАНДИДАТ: {LEADER_BACKGROUNDS[leaderBackground].title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      terminalAudio.playSwitchClick();
                      setShowMapModal(false);
                    }}
                    className="px-2 py-1 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black font-bold text-[10px] md:text-xs transition cursor-pointer"
                  >
                    [ ЗАКРЫТЬ КАРТУ ]
                  </button>
                </div>

                {/* Content Area: Map and Inspector side-by-side on md+, stacked on mobile */}
                <div className="flex flex-col md:flex-row gap-3 flex-1 overflow-y-auto min-h-0">
                  {/* Left: Vector SVG Map */}
                  <div className="w-full md:w-[58%] border border-[#6e470b] bg-[#070402] p-1.5 flex flex-col justify-between relative">
                    <svg
                      viewBox="0 0 540 300"
                      className="w-full h-auto max-h-[260px] md:max-h-[300px]"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        {/* Warning 50-79% hatch pattern */}
                        <pattern
                          id="map-hatch-warning"
                          width="8"
                          height="8"
                          patternTransform="rotate(45 0 0)"
                          patternUnits="userSpaceOnUse"
                        >
                          <line x1="0" y1="0" x2="0" y2="8" stroke="#ff9900" strokeWidth="1.8" opacity="0.45" />
                        </pattern>
                        {/* Background coordinate grid */}
                        <pattern id="map-grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#6e470b" strokeWidth="0.5" opacity="0.3" />
                        </pattern>
                      </defs>

                      {/* Background grid */}
                      <rect x="0" y="0" width="540" height="300" fill="url(#map-grid-pattern)" />

                      {/* Coordinate markings */}
                      <text x="8" y="14" fill="#6e470b" fontSize="8" fontFamily="monospace">СШ 56°</text>
                      <text x="8" y="150" fill="#6e470b" fontSize="8" fontFamily="monospace">СШ 54°</text>
                      <text x="8" y="290" fill="#6e470b" fontSize="8" fontFamily="monospace">СШ 52°</text>
                      <text x="70" y="294" fill="#6e470b" fontSize="8" fontFamily="monospace">34° ВД</text>
                      <text x="250" y="294" fill="#6e470b" fontSize="8" fontFamily="monospace">38° ВД</text>
                      <text x="440" y="294" fill="#6e470b" fontSize="8" fontFamily="monospace">42° ВД</text>

                      {/* Transit Communications (Railway Lines & Supply Corridors) */}
                      <line x1="165" y1="95" x2="365" y2="105" stroke="#ffb000" strokeWidth="1.6" strokeDasharray="5 3" opacity="0.65" />
                      <line x1="165" y1="95" x2="135" y2="205" stroke="#ffb000" strokeWidth="1.6" strokeDasharray="5 3" opacity="0.65" />
                      <line x1="365" y1="105" x2="330" y2="215" stroke="#ffb000" strokeWidth="1.6" strokeDasharray="5 3" opacity="0.65" />
                      <line x1="135" y1="205" x2="330" y2="215" stroke="#ffb000" strokeWidth="1.6" strokeDasharray="5 3" opacity="0.65" />

                      {/* SECTOR 1: CAPITAL */}
                      {(() => {
                        const reg = regions.capital;
                        const isSelected = selectedMapRegion === 'capital';
                        const isRiot = reg.tension >= 80;
                        const isWarn = reg.tension >= 50 && reg.tension < 80;
                        const strokeColor = isRiot ? '#ff2a00' : isWarn ? '#ff9900' : isSelected ? '#ffffff' : '#ffb000';
                        const fillColor = isRiot ? 'rgba(255, 42, 0, 0.4)' : isWarn ? 'url(#map-hatch-warning)' : isSelected ? 'rgba(255, 176, 0, 0.28)' : 'rgba(255, 176, 0, 0.12)';
                        return (
                          <g
                            className="cursor-pointer transition"
                            onClick={() => {
                              terminalAudio.playTeletypeClick();
                              setSelectedMapRegion('capital');
                            }}
                          >
                            <polygon
                              points="90,40 250,30 270,140 210,160 120,150 70,90"
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? 2.5 : 1.2}
                            />
                            {/* Centroid radar */}
                            <circle cx="165" cy="95" r="3" fill={strokeColor} />
                            <circle cx="165" cy="95" r="8" fill="none" stroke={strokeColor} strokeWidth="0.8" className={isRiot ? 'animate-ping' : ''} />
                            <text x="165" y="80" fill={strokeColor} fontSize="10" fontWeight="bold" textAnchor="middle">
                              СТОЛИЧНЫЙ ОКРУГ
                            </text>
                            <text x="165" y="115" fill={strokeColor} fontSize="11" fontWeight="900" textAnchor="middle">
                              {reg.tension}%
                            </text>
                            <text x="165" y="130" fill={strokeColor} fontSize="8" fontWeight="bold" textAnchor="middle">
                              {isRiot ? '● БУНТ' : isWarn ? '● БРОЖЕНИЕ' : '● НОРМА'}
                            </text>
                            {reg.curfewTurns > 0 && (
                              <g>
                                <rect x="115" y="135" width="100" height="14" fill="#000" stroke="#33ff33" strokeWidth="0.8" rx="2" />
                                <text x="165" y="145" fill="#33ff33" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                                  [ОСОБЫЙ РЕЖИМ: {reg.curfewTurns}Х]
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })()}

                      {/* SECTOR 2: MINERS */}
                      {(() => {
                        const reg = regions.miners;
                        const isSelected = selectedMapRegion === 'miners';
                        const isRiot = reg.tension >= 80;
                        const isWarn = reg.tension >= 50 && reg.tension < 80;
                        const strokeColor = isRiot ? '#ff2a00' : isWarn ? '#ff9900' : isSelected ? '#ffffff' : '#ffb000';
                        const fillColor = isRiot ? 'rgba(255, 42, 0, 0.4)' : isWarn ? 'url(#map-hatch-warning)' : isSelected ? 'rgba(255, 176, 0, 0.28)' : 'rgba(255, 176, 0, 0.12)';
                        return (
                          <g
                            className="cursor-pointer transition"
                            onClick={() => {
                              terminalAudio.playTeletypeClick();
                              setSelectedMapRegion('miners');
                            }}
                          >
                            <polygon
                              points="250,30 460,40 470,160 380,180 270,140"
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? 2.5 : 1.2}
                            />
                            {/* Centroid radar */}
                            <circle cx="365" cy="105" r="3" fill={strokeColor} />
                            <circle cx="365" cy="105" r="8" fill="none" stroke={strokeColor} strokeWidth="0.8" className={isRiot ? 'animate-ping' : ''} />
                            <text x="365" y="88" fill={strokeColor} fontSize="10" fontWeight="bold" textAnchor="middle">
                              ШАХТЕРСКИЙ БАССЕЙН
                            </text>
                            <text x="365" y="125" fill={strokeColor} fontSize="11" fontWeight="900" textAnchor="middle">
                              {reg.tension}%
                            </text>
                            <text x="365" y="140" fill={strokeColor} fontSize="8" fontWeight="bold" textAnchor="middle">
                              {isRiot ? '● БУНТ' : isWarn ? '● БРОЖЕНИЕ' : '● НОРМА'}
                            </text>
                            {reg.curfewTurns > 0 && (
                              <g>
                                <rect x="315" y="145" width="100" height="14" fill="#000" stroke="#33ff33" strokeWidth="0.8" rx="2" />
                                <text x="365" y="155" fill="#33ff33" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                                  [ОСОБЫЙ РЕЖИМ: {reg.curfewTurns}Х]
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })()}

                      {/* SECTOR 3: AGRARIAN */}
                      {(() => {
                        const reg = regions.agrarian;
                        const isSelected = selectedMapRegion === 'agrarian';
                        const isRiot = reg.tension >= 80;
                        const isWarn = reg.tension >= 50 && reg.tension < 80;
                        const strokeColor = isRiot ? '#ff2a00' : isWarn ? '#ff9900' : isSelected ? '#ffffff' : '#ffb000';
                        const fillColor = isRiot ? 'rgba(255, 42, 0, 0.4)' : isWarn ? 'url(#map-hatch-warning)' : isSelected ? 'rgba(255, 176, 0, 0.28)' : 'rgba(255, 176, 0, 0.12)';
                        return (
                          <g
                            className="cursor-pointer transition"
                            onClick={() => {
                              terminalAudio.playTeletypeClick();
                              setSelectedMapRegion('agrarian');
                            }}
                          >
                            <polygon
                              points="70,90 120,150 210,160 220,265 110,270 50,170"
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? 2.5 : 1.2}
                            />
                            {/* Centroid radar */}
                            <circle cx="135" cy="205" r="3" fill={strokeColor} />
                            <circle cx="135" cy="205" r="8" fill="none" stroke={strokeColor} strokeWidth="0.8" className={isRiot ? 'animate-ping' : ''} />
                            <text x="135" y="190" fill={strokeColor} fontSize="10" fontWeight="bold" textAnchor="middle">
                              АГРАРНЫЙ ПОЯС
                            </text>
                            <text x="135" y="225" fill={strokeColor} fontSize="11" fontWeight="900" textAnchor="middle">
                              {reg.tension}%
                            </text>
                            <text x="135" y="240" fill={strokeColor} fontSize="8" fontWeight="bold" textAnchor="middle">
                              {isRiot ? '● БУНТ' : isWarn ? '● БРОЖЕНИЕ' : '● НОРМА'}
                            </text>
                            {reg.curfewTurns > 0 && (
                              <g>
                                <rect x="85" y="245" width="100" height="14" fill="#000" stroke="#33ff33" strokeWidth="0.8" rx="2" />
                                <text x="135" y="255" fill="#33ff33" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                                  [ОСОБЫЙ РЕЖИМ: {reg.curfewTurns}Х]
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })()}

                      {/* SECTOR 4: AUTONOMY */}
                      {(() => {
                        const reg = regions.autonomy;
                        const isSelected = selectedMapRegion === 'autonomy';
                        const isRiot = reg.tension >= 80;
                        const isWarn = reg.tension >= 50 && reg.tension < 80;
                        const strokeColor = isRiot ? '#ff2a00' : isWarn ? '#ff9900' : isSelected ? '#ffffff' : '#ffb000';
                        const fillColor = isRiot ? 'rgba(255, 42, 0, 0.4)' : isWarn ? 'url(#map-hatch-warning)' : isSelected ? 'rgba(255, 176, 0, 0.28)' : 'rgba(255, 176, 0, 0.12)';
                        return (
                          <g
                            className="cursor-pointer transition"
                            onClick={() => {
                              terminalAudio.playTeletypeClick();
                              setSelectedMapRegion('autonomy');
                            }}
                          >
                            <polygon
                              points="210,160 270,140 380,180 470,160 450,265 220,265"
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? 2.5 : 1.2}
                            />
                            {/* Centroid radar */}
                            <circle cx="330" cy="215" r="3" fill={strokeColor} />
                            <circle cx="330" cy="215" r="8" fill="none" stroke={strokeColor} strokeWidth="0.8" className={isRiot ? 'animate-ping' : ''} />
                            <text x="330" y="200" fill={strokeColor} fontSize="10" fontWeight="bold" textAnchor="middle">
                              ОСОБАЯ АВТОНОМИЯ
                            </text>
                            <text x="330" y="235" fill={strokeColor} fontSize="11" fontWeight="900" textAnchor="middle">
                              {reg.tension}%
                            </text>
                            <text x="330" y="250" fill={strokeColor} fontSize="8" fontWeight="bold" textAnchor="middle">
                              {isRiot ? '● БУНТ' : isWarn ? '● БРОЖЕНИЕ' : '● НОРМА'}
                            </text>
                            {reg.curfewTurns > 0 && (
                              <g>
                                <rect x="280" y="255" width="100" height="14" fill="#000" stroke="#33ff33" strokeWidth="0.8" rx="2" />
                                <text x="330" y="265" fill="#33ff33" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                                  [ОСОБЫЙ РЕЖИМ: {reg.curfewTurns}Х]
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })()}
                    </svg>
                    <div className="text-[8px] text-[#8c5b0f] text-center mt-1">
                      [ КЛИКНИТЕ ПО СЕКТОРУ КАРТЫ ДЛЯ ВЫБОРА ЦЕЛЕВОГО РЕГИОНА ]
                    </div>
                  </div>

                  {/* Right: Selected Sector Inspector & Operational Directives Panel */}
                  {(() => {
                    const currentReg = regions[selectedMapRegion];
                    const meta = REGION_META[selectedMapRegion];
                    const isMinersRiot = regions.miners.tension >= 80;
                    const supplyCost = leaderBackground === 'director' ? (isMinersRiot ? 6 : 3) : (isMinersRiot ? 12 : 6);
                    const voronovAlly = storyFlags.includes('voronov_ally');
                    let curfewKgbCost = 6;
                    let curfewPeopleCost = 4;
                    let curfewTurnsCount = 3;

                    if (leaderBackground === 'kgb') {
                      curfewKgbCost = voronovAlly ? 2 : 3;
                      curfewPeopleCost = 2;
                      curfewTurnsCount = 4;
                    } else if (leaderBackground === 'technocrat') {
                      curfewKgbCost = voronovAlly ? 6 : 9;
                      curfewPeopleCost = 4;
                      curfewTurnsCount = 3;
                    } else {
                      curfewKgbCost = voronovAlly ? 3 : 6;
                      curfewPeopleCost = 4;
                      curfewTurnsCount = 3;
                    }

                    const selfGovMoscowCost = leaderBackground === 'director' ? 9 : (leaderBackground === 'technocrat' ? 4 : 6);
                    const selfGovSovGain = leaderBackground === 'technocrat' ? 8 : 6;
                    const directiveCdTime = leaderBackground === 'technocrat' ? 2 : 3;
                    const gosplanDrop = leaderBackground === 'apparatchik' ? 30 : 25;
                    const gosplanAdd = leaderBackground === 'apparatchik' ? 15 : 18;

                    return (
                      <div className="w-full md:w-[42%] flex flex-col justify-between space-y-2 text-xs">
                        {/* Sector Header & Info */}
                        <div className="border border-[#6e470b] bg-[#120c06] p-2 space-y-1.5">
                          <div className="flex items-center justify-between border-b border-[#3d2607] pb-1">
                            <span className="font-extrabold crt-amber-text text-xs md:text-sm">
                              {currentReg.name}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 border ${
                                currentReg.tension >= 80
                                  ? 'border-[#ff2a00] text-[#ff2a00] bg-[#ff2a00]/20 animate-pulse'
                                  : currentReg.tension >= 50
                                  ? 'border-[#ff9900] text-[#ff9900] bg-[#ff9900]/15'
                                  : 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10'
                              }`}
                            >
                              {currentReg.tension >= 80
                                ? `БУНТ: ${meta.riotTitle}`
                                : currentReg.tension >= 50
                                ? 'БРОЖЕНИЕ'
                                : 'НОРМА'}
                            </span>
                          </div>

                          <div className="text-[10px] text-[#8c5b0f] font-mono leading-tight">
                            {currentReg.specialization}
                          </div>

                          {/* Tension Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[10px] text-[#ffb000] mb-0.5 font-bold">
                              <span>НАПРЯЖЕННОСТЬ: {currentReg.tension}%</span>
                              {currentReg.curfewTurns > 0 ? (
                                <span className="text-[#33ff33]">РЕЖИМ: {currentReg.curfewTurns} ХОДА</span>
                              ) : (
                                <span className="text-[#8c5b0f]">ПОРОГ: 80%</span>
                              )}
                            </div>
                            <div className="w-full h-2 bg-[#21160a] border border-[#6e470b]">
                              <div
                                className={`h-full transition-all ${
                                  currentReg.tension >= 80
                                    ? 'bg-[#ff2a00]'
                                    : currentReg.tension >= 50
                                    ? 'bg-[#ff9900]'
                                    : 'bg-[#ffb000]'
                                }`}
                                style={{ width: `${currentReg.tension}%` }}
                              />
                            </div>
                          </div>

                          {/* Effects status */}
                          <div className="text-[9px] p-1.5 border border-[#3d2607] bg-[#0c0803] space-y-1">
                            <div className="text-[#ffb000]">
                              <span className="text-[#33ff33]">★ БОНУС:</span> {meta.bonusDesc}
                            </div>
                            <div className="text-[#ffb000]">
                              <span className="text-[#ff2a00]">⚠ УГРОЗА БУНТА:</span> {meta.riotDesc}
                            </div>
                          </div>
                        </div>

                        {/* Directives Console (ПУЛЬТ ДИРЕКТИВ АСУ) */}
                        <div className="border border-[#6e470b] bg-[#120c06] p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                          <div className="text-[10px] font-bold text-[#ffb000] border-b border-[#3d2607] pb-1 flex justify-between">
                            <span>ОПЕРАТИВНЫЕ ДИРЕКТИВЫ АСУ:</span>
                            <span className="text-[9px] text-[#8c5b0f]">1 РАЗ В {directiveCdTime} ХОДА</span>
                          </div>

                          <div className="space-y-1.5 my-auto">
                            {/* Directive 1: Gosplan */}
                            <button
                              onClick={handleDirectiveGosplan}
                              disabled={directiveCooldown > 0}
                              className={`w-full p-1.5 border text-left font-mono transition text-[10px] cursor-pointer ${
                                directiveCooldown > 0
                                  ? 'border-[#3a250a] text-[#553810] cursor-not-allowed bg-[#090603]'
                                  : 'border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] bg-[#160f08] hover:bg-[#ffb000]/10'
                              }`}
                            >
                              <div className="font-bold">[1] ПЕРЕБРОСКА ФОНДОВ (ГОСПЛАН)</div>
                              <div className="text-[8.5px] text-[#8c5b0f]">
                                -{gosplanDrop}% напряженности за счет спокойного сектора (+{gosplanAdd}%). Без трат шкал. {leaderBackground === 'apparatchik' ? '★ Бонус аппаратчика' : ''}
                              </div>
                            </button>

                            {/* Directive 2: Echelon */}
                            <button
                              onClick={handleDirectiveSupplyTrain}
                              disabled={directiveCooldown > 0 || stats.economy < supplyCost}
                              className={`w-full p-1.5 border text-left font-mono transition text-[10px] cursor-pointer ${
                                directiveCooldown > 0 || stats.economy < supplyCost
                                  ? 'border-[#3a250a] text-[#553810] cursor-not-allowed bg-[#090603]'
                                  : 'border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] bg-[#160f08] hover:bg-[#ffb000]/10'
                              }`}
                            >
                              <div className="font-bold flex justify-between">
                                <span>[2] ЭШЕЛОН СНАБЖЕНИЯ</span>
                                <span className="text-[9px]">-{supplyCost} ЭКОН.</span>
                              </div>
                              <div className="text-[8.5px] text-[#8c5b0f]">
                                -30% напряженности. {isMinersRiot ? 'ВНИМАНИЕ: стоимость удвоена из-за блокады шахт!' : ''} {leaderBackground === 'director' ? '★ Скидка директора (-3)' : ''}
                              </div>
                            </button>

                            {/* Directive 3: Curfew */}
                            <button
                              onClick={handleDirectiveCurfew}
                              disabled={directiveCooldown > 0 || stats.kgb < curfewKgbCost || stats.people < curfewPeopleCost}
                              className={`w-full p-1.5 border text-left font-mono transition text-[10px] cursor-pointer ${
                                directiveCooldown > 0 || stats.kgb < curfewKgbCost || stats.people < curfewPeopleCost
                                  ? 'border-[#3a250a] text-[#553810] cursor-not-allowed bg-[#090603]'
                                  : 'border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] bg-[#160f08] hover:bg-[#ffb000]/10'
                              }`}
                            >
                              <div className="font-bold flex justify-between">
                                <span>[3] ОМОН И КОМЕНДАНТСКИЙ ЧАС</span>
                                <span className="text-[9px]">-{curfewKgbCost} АРМ, -{curfewPeopleCost} НАР</span>
                              </div>
                              <div className="text-[8.5px] text-[#8c5b0f]">
                                -35% напряженности, режим ЧО на {curfewTurnsCount} хода, +6% Автократии. {leaderBackground === 'kgb' ? '★ ЧК-режим (4 хода)' : leaderBackground === 'technocrat' ? '▲ Саботаж генералитета (-9)' : ''}
                              </div>
                            </button>

                            {/* Directive 4: Self-Government */}
                            <button
                              onClick={handleDirectiveSelfGov}
                              disabled={directiveCooldown > 0 || stats.moscow < selfGovMoscowCost}
                              className={`w-full p-1.5 border text-left font-mono transition text-[10px] cursor-pointer ${
                                directiveCooldown > 0 || stats.moscow < selfGovMoscowCost
                              ? 'border-[#3a250a] text-[#553810] cursor-not-allowed bg-[#090603]'
                              : 'border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] bg-[#160f08] hover:bg-[#ffb000]/10'
                              }`}
                            >
                              <div className="font-bold flex justify-between">
                                <span>[4] МЕСТНОЕ САМОУПРАВЛЕНИЕ</span>
                                <span className="text-[9px]">-{selfGovMoscowCost} МОСКВА</span>
                              </div>
                              <div className="text-[8.5px] text-[#8c5b0f]">
                                -25% напряженности, +{selfGovSovGain}% к Суверенитету. {leaderBackground === 'technocrat' ? '★ Кибернетика (+8%)' : leaderBackground === 'director' ? '▲ Сложность торга (-9)' : ''}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: БЮЛЛЕТЕНЬ ТАСС (ПЕРЕХОД МЕЖДУ АКТАМИ)              */}
          {/* ========================================================= */}
          {tassBulletin && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xs">
              <div className="w-full max-w-[440px] border-2 border-[#ffb000] bg-[#100a05] p-4 font-mono shadow-[0_0_35px_rgba(0,0,0,0.95)]">
                <div className="text-center border-b-2 border-double border-[#ffb000] pb-2 mb-3">
                  <div className="text-[10px] tracking-widest text-[#8c5b0f]">ТЕЛЕГРАФНОЕ АГЕНТСТВО СОВЕТСКОГО СОЮЗА</div>
                  <h2 className="text-base font-black crt-amber-text tracking-wider mt-1">★ БЮЛЛЕТЕНЬ ТАСС ★</h2>
                  <div className="text-[10px] text-[#ffb000] mt-0.5">{tassBulletin.title}</div>
                </div>

                <div className="text-xs leading-relaxed text-[#ffb000] space-y-2 mb-3">
                  <p>{tassBulletin.summary}</p>
                  <div className="p-2 border border-[#33ff33]/50 bg-[#33ff33]/10 text-[#33ff33] text-[11px] font-bold">
                    ★ БОНУС СТАБИЛИЗАЦИИ: +5 пунктов к центру (50%) для всех шкал республики. Ресурс «Под сукно» обновлен до 2.
                  </div>
                </div>

                <button
                  onClick={() => {
                    terminalAudio.playSwitchClick();
                    setTassBulletin(null);
                  }}
                  className="w-full py-2.5 border-2 border-[#ffb000] bg-[#ffb000] text-black font-extrabold text-xs tracking-widest hover:bg-[#ffb000]/80 transition cursor-pointer"
                >
                  [ ПРИНЯТЬ СВОДКУ И ПЕРЕЙТИ К АКТУ {tassBulletin.nextAct} ]
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: GOVERNMENT HOTLINE MODAL («ВЧ-СВЯЗЬ»)             */}
          {/* ========================================================= */}
          {screen === 'hotline' && (
            <div className="flex-1 flex flex-col justify-between py-2 px-2 text-xs font-mono">
              <div className="border-2 border-[#ffb000] p-3 md:p-4 bg-[#110b06] flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#6e470b] pb-2 mb-3">
                    <h2 className="text-sm md:text-base font-extrabold crt-amber-text">
                      [ ВЧ-СВЯЗЬ ЦК КПСС / ЭКСТРЕННЫЙ РЕЗЕРВ ]
                    </h2>
                    <span className="text-[#33ff33]">● СВЯЗЬ ЗАЩИЩЕНА</span>
                  </div>

                  <p className="text-[11px] text-[#ffb000] leading-relaxed mb-4">
                    Правительственный коммутатор позволяет задействовать стратегический маневр один раз
                    за исторический акт: принудительно поднять один критически упавший параметр на +20 пунктов,
                    заплатив за это -25 пунктами другого параметра.
                  </p>

                  {/* Select stat to boost */}
                  <div className="mb-4">
                    <label className="text-[#33ff33] font-bold block mb-1">
                      1. ВЫБЕРИТЕ ПАРАМЕТР ДЛЯ ПОДЪЕМА (+20):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['moscow', 'people', 'kgb', 'economy'] as StatKey[]).map((k) => (
                        <button
                          key={k}
                          onClick={() => {
                            setHotlineBoostStat(k);
                            terminalAudio.playTeletypeClick();
                          }}
                          className={`p-2 border text-left transition cursor-pointer ${
                            hotlineBoostStat === k
                              ? 'border-[#33ff33] bg-[#33ff33]/20 text-[#33ff33] font-bold'
                              : 'border-[#6e470b] text-[#ffb000]'
                          }`}
                        >
                          {statLabels[k]} ({stats[k]}%)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select stat to sacrifice */}
                  <div className="mb-4">
                    <label className="text-[#ff2a00] font-bold block mb-1">
                      2. ВЫБЕРИТЕ ПАРАМЕТР ДЛЯ СНИЖЕНИЯ (-25):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['moscow', 'people', 'kgb', 'economy'] as StatKey[]).map((k) => (
                        <button
                          key={k}
                          onClick={() => {
                            setHotlineSacrificeStat(k);
                            terminalAudio.playTeletypeClick();
                          }}
                          className={`p-2 border text-left transition cursor-pointer ${
                            hotlineSacrificeStat === k
                              ? 'border-[#ff2a00] bg-[#ff2a00]/20 text-[#ff2a00] font-bold'
                              : 'border-[#6e470b] text-[#ffb000]'
                          }`}
                        >
                          {statLabels[k]} ({stats[k]}%)
                        </button>
                      ))}
                    </div>
                  </div>

                  {hotlineBoostStat === hotlineSacrificeStat && (
                    <div className="text-[10px] text-[#ff2a00] font-bold">
                      ⚠ Нельзя одновременно повышать и понижать один и тот же параметр!
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-3 border-t border-[#6e470b]">
                  <button
                    onClick={() => {
                      terminalAudio.playSwitchClick();
                      setScreen('game');
                    }}
                    className="flex-1 py-2 border border-[#6e470b] text-[#ffb000] hover:border-[#ffb000] font-bold cursor-pointer"
                  >
                    ОТБОЙ
                  </button>
                  <button
                    onClick={executeHotline}
                    disabled={hotlineBoostStat === hotlineSacrificeStat}
                    className="flex-1 py-2 border-2 border-[#ffb000] bg-[#ffb000] text-black font-extrabold hover:bg-[#ffb000]/80 disabled:opacity-40 cursor-pointer"
                  >
                    ВЫДАТЬ ДИРЕКТИВУ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: ARCHIVE DOSSIER (13 ENDINGS)                      */}
          {/* ========================================================= */}
          {screen === 'archive' && (
            <div className="flex-1 flex flex-col justify-between py-2 overflow-hidden text-xs font-mono">
              <div className="border border-[#6e470b] bg-[#110b06] p-3 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#6e470b] pb-2 mb-2">
                  <h2 className="text-sm md:text-base font-extrabold crt-amber-text">
                    АРХИВ «ОСОБЫХ ПАПОК» ЦК КПСС
                  </h2>
                  <span className="text-[#8c5b0f]">
                    ОТКРЫТО: {unlockedEndings.length} ИЗ 13
                  </span>
                </div>

                {/* Selected ending detailed view */}
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

                      <h3 className="text-base font-extrabold text-[#ffb000]">
                        {selectedDossier.title}
                      </h3>

                      {/* Stamp Banner */}
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
                  /* List of all 13 endings */
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
                              {isUnlocked
                                ? ending.category === 'grand'
                                  ? '★ ФИНАЛ 1991'
                                  : '● ДОСРОЧНО'
                                : 'ЗАБЛОКИРОВАНО'}
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
            <div className="flex-1 flex flex-col justify-between py-2 text-xs font-mono">
              <div className="border border-[#6e470b] bg-[#110b06] p-3 md:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm md:text-base font-extrabold border-b border-[#6e470b] pb-2 mb-4 crt-amber-text">
                    СИСТЕМНЫЕ НАСТРОЙКИ «АСУ-РЕСПУБЛИКА»
                  </h2>

                  <div className="space-y-4">
                    {/* Audio Toggle */}
                    <div className="flex items-center justify-between p-2 border border-[#6e470b]">
                      <div>
                        <div className="font-bold text-[#ffb000]">ЗВУКОВОЙ СИНТЕЗАТОР:</div>
                        <div className="text-[10px] text-[#8c5b0f]">Телетайп, переключатели, ВЧ-связь</div>
                      </div>
                      <button
                        onClick={handleToggleSound}
                        className="px-3 py-1 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black font-bold cursor-pointer"
                      >
                        {isMuted ? 'ВЫКЛ' : 'ВКЛ'}
                      </button>
                    </div>

                    {/* Scanlines Intensity */}
                    <div className="flex items-center justify-between p-2 border border-[#6e470b]">
                      <div>
                        <div className="font-bold text-[#ffb000]">РАЗВЕРТКА КИНЕСКОПА:</div>
                        <div className="text-[10px] text-[#8c5b0f]">Плотность полос советского ЭЛТ-монитора</div>
                      </div>
                      <div className="flex space-x-1">
                        {(['low', 'med', 'high'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => {
                              terminalAudio.playTeletypeClick();
                              setScanlineIntensity(lvl);
                            }}
                            className={`px-2 py-0.5 border text-[10px] font-bold cursor-pointer ${
                              scanlineIntensity === lvl
                                ? 'border-[#ffb000] bg-[#ffb000] text-black'
                                : 'border-[#6e470b] text-[#ffb000]'
                            }`}
                          >
                            {lvl === 'low' ? 'МИН' : lvl === 'med' ? 'НОРМ' : 'МАКС'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CRT Screen Curvature */}
                    <div className="flex items-center justify-between p-2 border border-[#6e470b]">
                      <div>
                        <div className="font-bold text-[#ffb000]">ГЕОМЕТРИЯ ЭКРАНА:</div>
                        <div className="text-[10px] text-[#8c5b0f]">Выпуклый кинескоп и тень безеля</div>
                      </div>
                      <button
                        onClick={() => {
                          terminalAudio.playSwitchClick();
                          setCrtCurve(!crtCurve);
                        }}
                        className="px-3 py-1 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black font-bold cursor-pointer"
                      >
                        {crtCurve ? 'СФЕРИЧЕСКАЯ' : 'ПЛОСКАЯ'}
                      </button>
                    </div>

                    {/* Reset archive progress */}
                    <div className="flex items-center justify-between p-2 border border-[#6e1000]">
                      <div>
                        <div className="font-bold text-[#ff2a00]">СБРОСИТЬ АРХИВ:</div>
                        <div className="text-[10px] text-[#8c5b0f]">Очистить все открытые досье из памяти</div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Стереть все сохраненные исторические досье?')) {
                            localStorage.removeItem('asu_unlocked_endings');
                            setUnlockedEndings([]);
                            terminalAudio.playSwitchClick();
                          }
                        }}
                        className="px-2 py-1 border border-[#ff2a00] text-[#ff2a00] hover:bg-[#ff2a00] hover:text-black font-bold cursor-pointer"
                      >
                        СБРОС
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReturnToMenu}
                  className="w-full py-2 border border-[#ffb000] text-[#ffb000] hover:bg-[#ffb000] hover:text-black font-bold cursor-pointer"
                >
                  В ГЛАВНОЕ МЕНЮ
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SCREEN: GAME OVER / ENDING DOSSIER (Strictly No Alarms)   */}
          {/* ========================================================= */}
          {screen === 'ending' && currentEnding && (
            <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto text-xs font-mono">
              <div className="border-2 border-[#ffb000] bg-[#100a05] p-3 md:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  {/* Dossier Header */}
                  <div className="flex items-center justify-between border-b border-[#6e470b] pb-2">
                    <span className="font-extrabold text-sm crt-amber-text">
                      АРХИВНОЕ ДЕЛО №1991 / {currentEnding.code}
                    </span>
                    <span className="text-[10px] text-[#8c5b0f]">
                      {currentDateFormatted}
                    </span>
                  </div>

                  {/* Stamp Banner */}
                  <div
                    className={`p-3 border-4 border-dashed text-center font-black tracking-widest text-sm md:text-base ${
                      currentEnding.category === 'grand'
                        ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/10'
                        : 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/10'
                    }`}
                  >
                    ★ {currentEnding.stamp} ★
                  </div>

                  {/* Title & Verdict */}
                  <div>
                    <h2 className="text-lg font-black text-[#ffb000] mb-1">
                      {currentEnding.title}
                    </h2>
                    <div className="text-[11px] text-[#ffb000] font-bold">
                      ВЕРДИКТ: <span className="underline">{currentEnding.verdict}</span>
                    </div>
                  </div>

                  {/* Description Narrative */}
                  <p className="text-[11px] md:text-xs leading-relaxed text-[#ffb000]">
                    {currentEnding.description}
                  </p>

                  {/* Summary Stats & Decrees */}
                  <div className="p-2 border border-[#3d2607] bg-[#0c0804] space-y-1.5 text-[10px]">
                    <div className="font-bold text-[#8c5b0f]">ИТОГОВАЯ СВОДКА ПРАВЛЕНИЯ:</div>
                    <div className="grid grid-cols-2 gap-1 text-[#ffb000]">
                      <div>ПРОДЕРЖАЛИСЬ: {daysSurvived} ДНЕЙ ИЗ 750</div>
                      <div>ПОДПИСАНО УКАЗОВ: {decrees.length}</div>
                      <div>СУВЕРЕНИТЕТ: {profile.sovereignty}%</div>
                      <div>АВТОКРАТИЯ: {profile.autocracy}%</div>
                      <div>РЫНОК: {profile.market}%</div>
                      <div>
                        {currentEnding.category === 'grand'
                          ? 'СТАТУС: ФИНАЛ ДОСТИГНУТ'
                          : 'СТАТУС: ДОСРОЧНОЕ СНЯТИЕ'}
                      </div>
                    </div>

                    {decrees.length > 0 && (
                      <div className="pt-1 text-[#8c5b0f]">
                        УКАЗЫ: {decrees.map((d) => `[${d}]`).join(' ')}
                      </div>
                    )}
                  </div>

                  {/* Historical Analysis */}
                  <p className="text-[10px] text-[#8c5b0f] italic border-t border-[#3d2607] pt-2">
                    Исторический контекст: {currentEnding.historicalContext}
                  </p>
                </div>

                {/* Actions */}
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

        {/* Calm Red Emergency Vignette: Rendered ONLY during active gameplay mode */}
        {isEmergency && <div className="absolute inset-0 crt-emergency-vignette z-25 pointer-events-none" />}

        {/* TASS Teletype Ticker Tape (1989-1991 Live World) */}
        <div className="relative z-20 w-full shrink-0 border-t border-[#3d2607] bg-[#0c0703] px-2 py-1 flex items-center overflow-hidden font-mono text-[9px] md:text-[10px] crt-amber-text shadow-[0_0_8px_rgba(255,176,0,0.2)] select-none">
          <span className="shrink-0 font-bold bg-[#ffb000]/15 text-[#ffb000] px-1.5 py-0.5 border border-[#ffb000]/40 mr-2 tracking-wider">
            [ТАСС / СВОДКА]
          </span>
          <div className="overflow-hidden whitespace-nowrap flex-1 relative">
            <div key={currentTassNews} className="inline-block animate-marquee whitespace-nowrap">
              {currentTassNews}
            </div>
          </div>
        </div>

        {/* CRT Scanline Overlay layer (pointer-events: none) */}
        <div
          className={`absolute inset-0 pointer-events-none crt-scanlines z-30 ${
            scanlineIntensity === 'low'
              ? 'opacity-40'
              : scanlineIntensity === 'med'
              ? 'opacity-70'
              : 'opacity-95'
          }`}
        />

        {/* CRT Vignette shadow layer (pointer-events: none) */}
        <div className="absolute inset-0 pointer-events-none crt-vignette z-30" />

        {/* Subtle Screen Flicker effect */}
        <div className="absolute inset-0 pointer-events-none animate-crt-flicker z-20" />
      </div>
    </div>
  );
}
