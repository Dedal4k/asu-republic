/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from 'react';
import {
  CameraFocus,
  RepublicEconomy,
  Stats,
  PoliticalProfile,
  RegionId,
  RegionState,
  InfrastructureNode,
  PoliticalActor,
  StateDecree,
  Card,
  IncomingHotlineCall,
  PhosphorColor,
  ArchetypeId,
  ChoiceImpact,
} from '../types';
import { TerminalPortrait } from '../portraits';
import { terminalAudio } from '../audio';

interface CabinetDeskSceneProps {
  cameraFocus: CameraFocus;
  setCameraFocus: (focus: CameraFocus) => void;
  // Game state
  currentMonth: number;
  attentionPoints: number;
  maxAttentionPoints: number;
  economy: RepublicEconomy;
  stats: Stats;
  profile: PoliticalProfile;
  regions: Record<RegionId, RegionState>;
  nodes: Record<string, InfrastructureNode>;
  actors: Record<string, PoliticalActor>;
  decrees: StateDecree[];
  // Dispatch
  urgentDossier: Card | null;
  urgentDossierResolved: boolean;
  lastChoiceStamp: string | null;
  onResolveDispatch: (choice: 'left' | 'right' | 'shelve') => void;
  // Map actions
  onRepairDamagedMoney: (nodeId: string) => void;
  onRepairDamagedShelves: (nodeId: string) => void;
  onResolveBlockedConcession: (nodeId: string) => void;
  onStormInsurgents: (nodeId: string) => void;
  onDeclareCurfew: (regionId: RegionId) => void;
  // Hotline
  selectedActorId: string;
  setSelectedActorId: (id: string) => void;
  onExecuteCallOption: (actorId: string, optionId: string) => void;
  incomingCall: IncomingHotlineCall | null;
  onAnswerIncomingCall: (optionId: string) => void;
  // KGB
  onAuthorizeWiretap: (actorId: string) => void;
  onFreezeActorAssets: (actorId: string, kompromatId: string) => void;
  // Decrees
  onToggleDecree: (decreeId: string) => void;
  // Settings & Theme
  phosphorColor: PhosphorColor;
  predictiveHints: boolean;
}

const REGION_NAMES: Record<RegionId, string> = {
  capital: 'СТОЛИЧНЫЙ ОКРУГ',
  miners: 'ШАХТЕРСКИЙ БАССЕЙН',
  agrarian: 'АГРАРНЫЙ ПОЯС',
  autonomy: 'ОСОБАЯ АВТОНОМИЯ',
};

function renderChoicePredictiveHints(choice: ChoiceImpact) {
  const hints: string[] = [];

  // Economy
  if (choice.economy?.rubleBudgetMillions) {
    const v = choice.economy.rubleBudgetMillions;
    hints.push(`Казна ${v > 0 ? '+' : ''}${v}М ₽`);
  } else if (choice.stats?.economy) {
    const v = Math.round(choice.stats.economy * 1.5);
    hints.push(`Казна ${v > 0 ? '+' : ''}${v}М ₽`);
  }

  if (choice.economy?.shelfSupplyPercent) {
    const v = choice.economy.shelfSupplyPercent;
    hints.push(`Полки ${v > 0 ? '+' : ''}${v}%`);
  } else if (choice.stats?.economy) {
    const v = Math.round(choice.stats.economy * 0.8);
    hints.push(`Полки ${v > 0 ? '+' : ''}${v}%`);
  }

  if (choice.economy?.moscowPlanFulfilled) {
    const v = choice.economy.moscowPlanFulfilled;
    hints.push(`План ${v > 0 ? '+' : ''}${v}%`);
  } else if (choice.stats?.moscow) {
    const v = Math.round(choice.stats.moscow * 1.2);
    hints.push(`План ${v > 0 ? '+' : ''}${v}%`);
  }

  if (choice.economy?.hardCurrencyReserve) {
    const v = choice.economy.hardCurrencyReserve;
    hints.push(`Валюта ${v > 0 ? '+' : ''}$${v}М`);
  }

  // Region Tension
  if (choice.tensionDelta) {
    const v = choice.tensionDelta;
    hints.push(`Напряжение ${v > 0 ? '+' : ''}${v}%`);
  }

  // Profile
  if (choice.profile?.sovereignty) {
    const v = choice.profile.sovereignty;
    hints.push(`Суверенитет ${v > 0 ? '+' : ''}${v}`);
  }
  if (choice.profile?.autocracy) {
    const v = choice.profile.autocracy;
    hints.push(`Автократия ${v > 0 ? '+' : ''}${v}`);
  }
  if (choice.profile?.market) {
    const v = choice.profile.market;
    hints.push(`Рынок ${v > 0 ? '+' : ''}${v}`);
  }

  if (hints.length === 0) return null;

  return (
    <div className="mt-1.5 pt-1 border-t border-(--term-border-dark) flex flex-wrap gap-1 text-[11px] font-mono">
      {hints.map((h, i) => (
        <span
          key={i}
          className="px-1.5 py-0.5 bg-(--term-panel) border border-(--term-border) text-(--term-main) font-bold rounded"
        >
          {h}
        </span>
      ))}
    </div>
  );
}

export const CabinetDeskScene: React.FC<CabinetDeskSceneProps> = ({
  cameraFocus,
  setCameraFocus,
  currentMonth,
  attentionPoints,
  maxAttentionPoints,
  economy,
  stats,
  profile,
  regions,
  nodes,
  actors,
  decrees,
  urgentDossier,
  urgentDossierResolved,
  lastChoiceStamp,
  onResolveDispatch,
  onRepairDamagedMoney,
  onRepairDamagedShelves,
  onResolveBlockedConcession,
  onStormInsurgents,
  onDeclareCurfew,
  selectedActorId,
  setSelectedActorId,
  onExecuteCallOption,
  incomingCall,
  onAnswerIncomingCall,
  onAuthorizeWiretap,
  onFreezeActorAssets,
  onToggleDecree,
  phosphorColor,
  predictiveHints,
}) => {
  // ESC key returns to overview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cameraFocus !== 'overview') {
        terminalAudio.playSwitchToggle();
        setCameraFocus('overview');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraFocus, setCameraFocus]);

  const handleZoom = useCallback(
    (focus: CameraFocus) => {
      terminalAudio.playPaperSlide();
      setCameraFocus(focus);
    },
    [setCameraFocus]
  );

  const activeWiretapsCount = Object.values(actors).filter((a) => a.surveillance === 'wiretap').length;
  // Bug 2 fix: count only infiltrated actors with unused kompromat!
  const readyKompromatCount = Object.values(actors).reduce(
    (acc, a) => acc + (a.surveillance === 'infiltrated' ? a.unlockedKompromat.filter((k) => !k.used).length : 0),
    0
  );
  const activeDecreesCount = decrees.filter((d) => d.active).length;
  const powerOutage = nodes.capital_tec3?.status !== 'operational';

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden font-mono select-none bg-(--term-bg)">
      {/* ========================================================= */}
      {/* FOCUS MODE: BACK TO OVERVIEW BANNER                       */}
      {/* ========================================================= */}
      {cameraFocus !== 'overview' && (
        <div className="shrink-0 z-30 bg-(--term-panel) border-b border-(--term-border) px-3 py-1.5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                terminalAudio.playSwitchToggle();
                setCameraFocus('overview');
              }}
              className="px-3 py-1 border border-(--term-main) bg-(--term-main)/15 hover:bg-(--term-main) hover:text-black text-(--term-main) font-black text-xs transition cursor-pointer flex items-center space-x-1"
            >
              <span>[ ◄ ОТЪЕХАТЬ К ОБЩЕМУ ПЛАНУ СТОЛА (ESC) ]</span>
            </button>
            <span className="text-xs text-(--term-dim) hidden sm:inline font-bold">
              РАБОЧИЙ КАБИНЕТ ПЕРВОГО СЕКРЕТАРЯ ЦК
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-(--term-main)">
            <span className="font-bold">
              ФОКУС:{' '}
              {cameraFocus === 'dispatch'
                ? 'ОСОБАЯ ПАПКА'
                : cameraFocus === 'map'
                ? 'ЩИТ УЗЛОВ АСУ'
                : cameraFocus === 'hotline'
                ? 'ВЧ-ВЕРТУШКА'
                : cameraFocus === 'kgb'
                ? 'СПЕЦХРАН КГБ'
                : 'БЮВАР УКАЗОВ'}
            </span>
            <span className="px-2 py-0.5 border border-(--term-border) text-(--term-main) font-mono font-bold">
              ОВ: {attentionPoints}/{maxAttentionPoints}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN VIEWPORT CONTAINER                                   */}
      {/* ========================================================= */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* ======================================================= */}
        {/* VIEW 1: OVERVIEW 2.5D DESK PERSPECTIVE                  */}
        {/* ======================================================= */}
        {cameraFocus === 'overview' ? (
          <div className="w-full h-full flex flex-col justify-between relative overflow-hidden bg-[var(--term-bg)]">
            {/* ---------------------------------------------------- */}
            {/* UPPER 42%: WALL WITH TACTICAL SHIELD & USSR CREST    */}
            {/* ---------------------------------------------------- */}
            <div
              className="relative w-full h-[42%] border-b-4 border-(--term-border-dark) overflow-hidden flex flex-col justify-between p-2 sm:p-3"
              style={{
                background:
                  'linear-gradient(180deg, #130c06 0%, #1a1108 50%, #100a04 100%)',
              }}
            >
              {/* Window blinds shadow effect on the left */}
              <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 pointer-events-none opacity-20 bg-[repeating-linear-gradient(180deg,transparent,transparent_8px,rgba(0,0,0,0.8)_8px,rgba(0,0,0,0.8)_16px)]" />

              {/* USSR State Emblem Watermark on the right */}
              <div className="absolute right-4 top-2 bottom-2 w-28 sm:w-36 pointer-events-none opacity-15 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full stroke-(--term-main) fill-none stroke-[2]">
                  <circle cx="50" cy="50" r="42" strokeDasharray="3 3" />
                  <polygon points="50,12 59,38 88,38 64,55 73,82 50,65 27,82 36,55 12,38 41,38" fill="var(--term-main)" opacity="0.1" />
                  <path d="M 44 48 L 56 60 M 56 48 L 44 60" />
                </svg>
              </div>

              {/* CENTER: ТАКТИЧЕСКИЙ ЩИТ АСУ (Large interactive mnemoscheme) */}
              <div
                onClick={() => handleZoom('map')}
                className="group relative z-10 w-full max-w-4xl mx-auto h-full p-2 border-2 border-(--term-border) hover:border-(--term-main) bg-(--term-panel)/90 rounded shadow-[0_4px_25px_rgba(0,0,0,0.9)] cursor-pointer transition flex flex-col justify-between"
                title="Нажмите, чтобы приблизить Тактический Щит и Узлы АСУ"
              >
                {/* Shield Header */}
                <div className="flex items-center justify-between border-b border-(--term-border-dark) pb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#33ff33] animate-pulse" />
                    <span className="font-black text-xs sm:text-sm text-(--term-main) tracking-wider group-hover:underline">
                      ТАКТИЧЕСКИЙ ДИСПЕТЧЕРСКИЙ ЩИТ «АСУ-РЕСПУБЛИКА»
                    </span>
                  </div>
                  <div className="text-xs font-bold text-(--term-dim) group-hover:text-(--term-main)">
                    [КЛИК: УПРАВЛЕНИЕ УЗЛАМИ И КАРТОЙ]
                  </div>
                </div>

                {/* 4 Regional Sectors with live bars & 8 Node LEDs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-auto">
                  {(Object.keys(regions) as RegionId[]).map((rId) => {
                    const r = regions[rId];
                    const isRiot = r.tension >= 80;
                    const isWarning = r.tension >= 50;

                    // Filter nodes belonging to this sector
                    const sectorMap: Record<RegionId, string> = {
                      capital: 'capital',
                      miners: 'mines',
                      agrarian: 'agrarian',
                      autonomy: 'autonomy',
                    };
                    const secNodes = Object.values(nodes).filter(
                      (n) => n.sectorId === sectorMap[rId]
                    );

                    return (
                      <div
                        key={rId}
                        className={`p-1.5 border bg-(--term-bg) rounded flex flex-col justify-between ${
                          isRiot
                            ? 'border-[#ff2a00] bg-[#ff2a00]/10'
                            : isWarning
                            ? 'border-[#ff9900]/70'
                            : 'border-(--term-border-dark)'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-(--term-main) truncate">{r.name}</span>
                            <span className={isRiot ? 'text-[#ff2a00]' : 'text-(--term-main)'}>
                              {r.tension}%
                            </span>
                          </div>
                          {/* Tension Progress Bar */}
                          <div className="w-full bg-(--term-border-dark) h-1.5 my-1 rounded overflow-hidden">
                            <div
                              className={`h-full ${
                                isRiot
                                  ? 'bg-[#ff2a00]'
                                  : isWarning
                                  ? 'bg-[#ff9900]'
                                  : 'bg-[#33ff33]'
                              }`}
                              style={{ width: `${r.tension}%` }}
                            />
                          </div>
                        </div>

                        {/* Regional Nodes status dots */}
                        <div className="space-y-0.5 mt-1 pt-1 border-t border-(--term-border-dark)">
                          {secNodes.map((n) => {
                            const isOk = n.status === 'operational';
                            const isDamaged = n.status === 'damaged';
                            return (
                              <div
                                key={n.id}
                                className="flex items-center justify-between text-[11px] font-bold"
                              >
                                <span className="text-(--term-dim) truncate max-w-[110px]">
                                  {n.name}
                                </span>
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isOk
                                      ? 'bg-[#33ff33]'
                                      : isDamaged
                                      ? 'bg-[#ff9900] animate-pulse'
                                      : 'bg-[#ff2a00] animate-bounce'
                                  }`}
                                  title={`${n.name}: ${n.status}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Shield Subtitle */}
                <div className="flex items-center justify-between text-xs text-(--term-dim) border-t border-(--term-border-dark) pt-1 font-semibold">
                  <span>ЭНЕРГЕТИКА • ЛОГИСТИКА • СЫРЬЕВОЙ БАЛАНС</span>
                  <span className="text-(--term-main) font-bold">
                    РАСХОД ЭНТРОПИИ: -4%/МЕС
                  </span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LOWER 58%: MASSIVE 2.5D DESK WITH PHYSICAL OBJECTS   */}
            {/* ---------------------------------------------------- */}
            <div
              className="relative w-full h-[58%] overflow-hidden flex flex-col justify-between p-2 sm:p-3"
              style={{
                background:
                  'radial-gradient(ellipse 90% 70% at 50% 40%, #152414 0%, #0c180b 55%, #050d05 100%)',
                boxShadow: 'inset 0 10px 40px rgba(0,0,0,0.9)',
              }}
            >
              {/* Overhead banker's lamp cone of warm light */}
              <div
                className={`absolute inset-0 pointer-events-none z-10 ${
                  powerOutage ? 'opacity-30 animate-pulse' : 'opacity-80'
                }`}
                style={{
                  background:
                    'radial-gradient(ellipse 65% 55% at 50% 30%, rgba(255, 215, 120, 0.18) 0%, rgba(255, 176, 0, 0.05) 50%, transparent 80%)',
                }}
              />

              {/* Physical Desk Objects Row */}
              <div className="relative z-20 flex-1 flex items-center justify-between gap-2 sm:gap-4 my-auto">
                {/* ------------------------------------------------ */}
                {/* OBJECT 1 (LEFT): TERMINAL ЭВМ & ПОСТАНОВЛЕНИЯ    */}
                {/* ------------------------------------------------ */}
                <div
                  onClick={() => handleZoom('decrees')}
                  className="w-[28%] max-w-[240px] h-[160px] sm:h-[190px] border-2 border-(--term-border) hover:border-(--term-main) bg-(--term-panel) rounded-lg p-2 cursor-pointer transition transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col justify-between group"
                  title="Нажмите, чтобы открыть Бювар «Постановления Бюро ЦК»"
                >
                  <div className="flex items-center justify-between border-b border-(--term-border-dark) pb-1">
                    <span className="font-black text-xs text-(--term-main) truncate">
                      БЮРО ЦК КПСС
                    </span>
                    <span className="text-[11px] font-bold text-(--term-dim)">УКАЗЫ</span>
                  </div>

                  {/* Soviet PC Terminal SVG graphic */}
                  <div className="flex-1 flex items-center justify-center my-1 relative">
                    <svg viewBox="0 0 100 80" className="w-24 sm:w-28 h-auto drop-shadow-md">
                      {/* Monitor Case */}
                      <rect x="15" y="8" width="70" height="50" rx="4" fill="#18120a" stroke="var(--term-border)" strokeWidth="2" />
                      {/* CRT Screen */}
                      <rect x="22" y="14" width="56" height="38" rx="6" fill="var(--term-bg)" stroke="var(--term-main)" strokeWidth="1.5" />
                      {/* Terminal code lines on screen */}
                      <line x1="28" y1="22" x2="65" y2="22" stroke="var(--term-main)" strokeWidth="2" />
                      <line x1="28" y1="28" x2="55" y2="28" stroke="var(--term-dim)" strokeWidth="1.5" />
                      <line x1="28" y1="34" x2="70" y2="34" stroke="var(--term-dim)" strokeWidth="1.5" />
                      <line x1="28" y1="40" x2="45" y2="40" stroke="var(--term-main)" strokeWidth="2" />
                      {/* Stand & Keyboard Base */}
                      <rect x="35" y="58" width="30" height="6" fill="#120c06" stroke="var(--term-border)" strokeWidth="1" />
                      <rect x="10" y="64" width="80" height="10" rx="2" fill="#18120a" stroke="var(--term-border)" strokeWidth="2" />
                      {/* Keyboard keys */}
                      <line x1="16" y1="69" x2="84" y2="69" stroke="var(--term-dim)" strokeWidth="2" strokeDasharray="4 2" />
                    </svg>
                  </div>

                  {/* Decrees Status Banner */}
                  <div className="text-center pt-1 border-t border-(--term-border-dark)">
                    <span className="px-2 py-0.5 border border-(--term-border) bg-(--term-bg) text-(--term-main) text-xs font-bold rounded">
                      АКТИВНО: {activeDecreesCount} УКАЗОВ
                    </span>
                  </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* OBJECT 2 (CENTER, LARGE): ОСОБАЯ ПАПКА ЦК        */}
                {/* ------------------------------------------------ */}
                <div
                  onClick={() => handleZoom('dispatch')}
                  className="flex-1 max-w-[380px] h-[175px] sm:h-[210px] border-4 border-(--term-border) hover:border-(--term-main) bg-[#1e1308] rounded-lg p-2.5 sm:p-3 cursor-pointer transition transform hover:-translate-y-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.95)] flex flex-col justify-between group relative"
                  title="Нажмите, чтобы открыть Особую Папку ЦК (Депеша месяца)"
                >
                  {/* Silk Red Ribbon / Bookmark */}
                  <div className="absolute -top-2 left-6 w-4 h-8 bg-[#c41500] border-x border-[#ff2a00] shadow-md z-10" />

                  {/* Folder Header */}
                  <div className="flex items-center justify-between border-b-2 border-(--term-border) pb-1 pl-8">
                    <span className="text-(--term-main) font-black text-xs sm:text-sm tracking-wider">
                      ОСОБАЯ ПАПКА ЦК КПСС
                    </span>
                    <span className="px-2 py-0.5 border border-[#ff2a00] bg-[#ff2a00]/15 text-[#ff2a00] text-[11px] font-bold tracking-widest">
                      СОВЕРШЕННО СЕКРЕТНО
                    </span>
                  </div>

                  {/* Center Content: Sheet of Paper inside Folder */}
                  <div className="my-auto bg-[#e8dec8] text-[#1a1208] p-2 rounded shadow-inner border border-[#b8a88a] space-y-1">
                    <div className="flex items-center justify-between border-b border-[#a8987a] pb-0.5">
                      <span className="text-[11px] font-black tracking-widest text-[#5c3a10]">
                        ДЕПЕША ХОДА {currentMonth} ИЗ 36
                      </span>
                      <span className="text-[11px] font-bold text-[#8a2211]">
                        {urgentDossier?.region ? REGION_NAMES[urgentDossier.region] : 'РЕСПУБЛИКА'}
                      </span>
                    </div>

                    <div className="font-extrabold text-xs sm:text-sm truncate text-[#1a1208]">
                      {urgentDossier?.senderTitle || 'СВОДКА СОБЫТИЙ'}
                    </div>

                    {/* Resolution Status */}
                    {!urgentDossierResolved ? (
                      <div className="py-1 px-2 border-2 border-dashed border-[#c41500] bg-[#c41500]/15 text-[#c41500] text-xs font-black text-center animate-pulse rounded">
                        ⚠ ТРЕБУЕТ РЕЗОЛЮЦИИ (1 ОВ ИЛИ ПОД СУКНО)
                      </div>
                    ) : (
                      <div className="py-0.5 px-2 border border-[#1b6e22] bg-[#1b6e22]/15 text-[#1b6e22] text-xs font-black text-center rounded">
                        ★ [УТВЕРЖДЕНО: {lastChoiceStamp}]
                      </div>
                    )}
                  </div>

                  {/* Bottom Folder Stamp */}
                  <div className="text-center text-xs text-(--term-dim) border-t border-(--term-border-dark) pt-1 font-bold">
                    [КЛИК: ОТКРЫТЬ ДОКУМЕНТ НА ВЕСЬ ЭКРАН]
                  </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* OBJECT 3 (RIGHT): СОВЕТСКАЯ ВЧ-ВЕРТУШКА          */}
                {/* ------------------------------------------------ */}
                <div
                  onClick={() => handleZoom('hotline')}
                  className={`w-[28%] max-w-[220px] h-[160px] sm:h-[190px] border-2 rounded-lg p-2 cursor-pointer transition transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col justify-between group ${
                    incomingCall
                      ? 'border-[#ff2a00] bg-[#2a0b06] animate-bounce shadow-[0_0_30px_rgba(255,42,0,0.5)]'
                      : 'border-(--term-border) hover:border-(--term-main) bg-(--term-panel)'
                  }`}
                  title="Нажмите, чтобы снять трубку правительственной ВЧ-связи"
                >
                  <div className="flex items-center justify-between border-b border-(--term-border-dark) pb-1">
                    <span className="font-black text-xs text-(--term-main)">ВЧ-СВЯЗЬ</span>
                    <span className="text-[11px] font-bold text-(--term-dim)">ВЕРТУШКА</span>
                  </div>

                  {/* Soviet Rotary Phone SVG graphic */}
                  <div className="flex-1 flex items-center justify-center my-1 relative">
                    <svg viewBox="0 0 100 85" className="w-24 sm:w-28 h-auto drop-shadow-md">
                      {/* Phone Handset across top */}
                      <path d="M 12 18 C 12 8, 30 8, 36 16 L 64 16 C 70 8, 88 8, 88 18 C 88 24, 75 22, 68 20 L 32 20 C 25 22, 12 24, 12 18 Z" fill="#22180e" stroke="var(--term-border)" strokeWidth="2" />
                      {/* Handset Cradles */}
                      <rect x="25" y="20" width="10" height="6" fill="#120c06" />
                      <rect x="65" y="20" width="10" height="6" fill="#120c06" />
                      {/* Phone Body Trapezoid */}
                      <polygon points="18,78 82,78 72,26 28,26" fill="#1c1208" stroke="var(--term-border)" strokeWidth="2" />
                      {/* Big Rotary Dial Outer Chrome Ring */}
                      <circle cx="50" cy="52" r="20" fill="#2a1c0e" stroke="var(--term-main)" strokeWidth="2" />
                      <circle cx="50" cy="52" r="16" fill="#140d06" stroke="var(--term-border)" strokeWidth="1" />
                      {/* 10 Finger Holes */}
                      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((ang, i) => {
                        const rad = (ang * Math.PI) / 180;
                        const hx = 50 + 11 * Math.cos(rad);
                        const hy = 52 + 11 * Math.sin(rad);
                        return <circle key={i} cx={hx} cy={hy} r="2.5" fill="#f0e6d2" stroke="#120c06" strokeWidth="0.5" />;
                      })}
                      {/* Central Emblem Star */}
                      <polygon points="50,47 52,51 56,51 53,53 54,57 50,54 46,57 47,53 44,51 48,51" fill="var(--term-main)" />
                      {/* Coiled Cord */}
                      <path d="M 22 65 C 10 70, 8 80, 18 82 C 12 84, 10 90, 20 90" fill="none" stroke="var(--term-dim)" strokeWidth="2" />
                    </svg>
                  </div>

                  {/* Incoming Call / Idle Indicator */}
                  <div className="text-center pt-1 border-t border-(--term-border-dark)">
                    {incomingCall ? (
                      <div className="py-1 px-1 border border-[#ff2a00] bg-[#ff2a00] text-black font-black text-xs animate-pulse rounded">
                        ☎ ЗВОНОК (0 ОВ)!
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-(--term-dim)">
                        ЛИНИЯ СВОБОДНА
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------- */}
              {/* OBJECT 4 (BOTTOM DRAWER): СЕЙФ 7-ГО УПР. КГБ        */}
              {/* ---------------------------------------------------- */}
              <div
                onClick={() => handleZoom('kgb')}
                className="relative z-20 w-full bg-(--term-panel) border-2 border-(--term-border) hover:border-(--term-main) px-4 py-2 rounded flex items-center justify-between cursor-pointer transition shadow-lg group"
                title="Нажмите, чтобы выдвинуть сейф-картотеку 7-го управления КГБ"
              >
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 border border-[#ff2a00] bg-[#ff2a00]/20 text-[#ff2a00] text-xs font-black">
                    КГБ СССР
                  </span>
                  <span className="font-black text-xs text-(--term-main) group-hover:underline">
                    ВЫДВИЖНОЙ СЕЙФ: 7-Е ОПЕРАТИВНО-ТЕХНИЧЕСКОЕ УПРАВЛЕНИЕ
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-bold">
                  <span className="text-(--term-dim)">
                    ПРОСЛУШКА: <b className="text-(--term-main)">{activeWiretapsCount}</b>
                  </span>
                  <span className="text-(--term-dim)">
                    КОМПРОМАТ: <b className="text-[#33ff33]">{readyKompromatCount}</b>
                  </span>
                  <span className="text-xs text-(--term-main) font-black">
                    [КЛИК: СЕЙФ]
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ======================================================= */}
        {/* VIEW 2: FOCUSED MODULE 1 - ДЕПЕША МЕСЯЦА                */}
        {/* ======================================================= */}
        {cameraFocus === 'dispatch' && urgentDossier && (
          <div className="w-full h-full p-2 sm:p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto border-2 border-(--term-border) bg-(--term-panel) p-4 shadow-2xl flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between border-b border-(--term-border-dark) pb-2 mb-2 text-xs">
                  <span className="text-(--term-dim) font-bold">{urgentDossier.actTitle}</span>
                  <span className="px-2 py-0.5 border border-(--term-border) text-(--term-main) font-bold">
                    РЕГИОН: {urgentDossier.region ? REGION_NAMES[urgentDossier.region] : 'ОБЩЕРЕСПУБЛИКАНСКИЙ'}
                  </span>
                </div>

                <h2 className="text-sm md:text-base font-black text-(--term-main) mb-2">
                  {urgentDossier.senderTitle}
                </h2>

                <div className="flex flex-col sm:flex-row gap-3 items-start my-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 border border-(--term-border) bg-(--term-bg) p-0.5">
                    <TerminalPortrait
                      archetype={urgentDossier.archetype}
                      isEmergency={urgentDossier.isCrisis}
                      phosphorColor={phosphorColor}
                    />
                  </div>
                  <div className="flex-1 text-xs sm:text-sm leading-relaxed text-(--term-main) font-mono">
                    {urgentDossier.text}
                  </div>
                </div>
              </div>

              {/* Choices / Stamped Resolution */}
              <div className="mt-4 pt-3 border-t border-(--term-border-dark) space-y-2">
                {urgentDossierResolved ? (
                  <div className="p-3 border-2 border-dashed border-[#33ff33] bg-[#33ff33]/10 text-center space-y-1">
                    <div className="text-sm font-black text-[#33ff33] tracking-wider">
                      ★ [РЕЗОЛЮЦИЯ УТВЕРЖДЕНА: {lastChoiceStamp}] ★
                    </div>
                    <div className="text-xs text-(--term-main) font-semibold">
                      Решение скреплено гербовой печатью. Вернитесь к столу (ESC) для дальнейших действий.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-(--term-dim) font-black text-center tracking-wider">
                      РЕЗОЛЮЦИЯ ПЕРВОГО СЕКРЕТАРЯ (СТОИМОСТЬ: 1 ОВ):
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Left Choice Button */}
                      <button
                        onClick={() => onResolveDispatch('left')}
                        disabled={attentionPoints < 1}
                        className="p-3 border border-(--term-border) bg-(--term-panel-light) hover:border-(--term-main) hover:bg-(--term-main) hover:text-black transition text-left cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="font-black text-xs sm:text-sm text-(--term-main) group-hover:text-black">
                          [А] {urgentDossier.leftChoice.label} (1 ОВ)
                        </div>
                        {urgentDossier.leftChoice.effectNote && (
                          <div className="text-xs text-(--term-dim) group-hover:text-black/80 mt-1 font-semibold">
                            {urgentDossier.leftChoice.effectNote}
                          </div>
                        )}
                        {predictiveHints && renderChoicePredictiveHints(urgentDossier.leftChoice)}
                      </button>

                      {/* Right Choice Button */}
                      <button
                        onClick={() => onResolveDispatch('right')}
                        disabled={attentionPoints < 1}
                        className="p-3 border border-(--term-border) bg-(--term-panel-light) hover:border-(--term-main) hover:bg-(--term-main) hover:text-black transition text-left cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="font-black text-xs sm:text-sm text-(--term-main) group-hover:text-black">
                          [Б] {urgentDossier.rightChoice.label} (1 ОВ)
                        </div>
                        {urgentDossier.rightChoice.effectNote && (
                          <div className="text-xs text-(--term-dim) group-hover:text-black/80 mt-1 font-semibold">
                            {urgentDossier.rightChoice.effectNote}
                          </div>
                        )}
                        {predictiveHints && renderChoicePredictiveHints(urgentDossier.rightChoice)}
                      </button>
                    </div>

                    {/* 3rd Emergency Option: Отложить в долгий ящик */}
                    <button
                      onClick={() => onResolveDispatch('shelve')}
                      className="w-full p-2.5 border border-[#ff9900] bg-[#ff9900]/15 hover:bg-[#ff9900] hover:text-black text-[#ff9900] font-bold text-xs transition cursor-pointer text-center"
                    >
                      [ ПОД СУКНО: ОТЛОЖИТЬ В ДОЛГИЙ ЯЩИК (0 ОВ) ]
                      <div className="text-xs text-[#ff9900]/80 mt-0.5">
                        Штраф: +8% напряженности во всех регионах, -10% к плану Москвы и -5% полок
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 3: FOCUSED MODULE 2 - ТАКТИЧЕСКИЙ ЩИТ И УЗЛЫ      */}
        {/* ======================================================= */}
        {cameraFocus === 'map' && (
          <div className="w-full h-full p-2 sm:p-4 overflow-y-auto space-y-4">
            {/* Regions and Curfew Actions */}
            <div>
              <div className="text-xs text-(--term-dim) font-black uppercase mb-1.5">
                РЕГИОНАЛЬНЫЕ СЕКТОРЫ И ОСОБОЕ ПОЛОЖЕНИЕ (КОМЕНДАНТСКИЙ ЧАС):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(regions) as RegionId[]).map((rId) => {
                  const r = regions[rId];
                  const isCurfew = r.curfewTurns > 0;
                  const isRiot = r.tension >= 80;

                  return (
                    <div
                      key={rId}
                      className={`p-2.5 border bg-(--term-panel) flex flex-col justify-between ${
                        isRiot
                          ? 'border-[#ff2a00]'
                          : r.tension > 50
                          ? 'border-[#ff9900]'
                          : 'border-(--term-border-dark)'
                      }`}
                    >
                      <div>
                        <div className="font-black text-xs text-(--term-main)">{r.name}</div>
                        <div className="text-[11px] font-semibold text-(--term-dim) mb-1">{r.subName}</div>
                        <div className="flex items-center justify-between text-xs font-mono my-1 font-bold">
                          <span>НАПРЯЖЕННОСТЬ:</span>
                          <span className={isRiot ? 'text-[#ff2a00]' : 'text-(--term-main)'}>
                            {r.tension}%
                          </span>
                        </div>
                        <div className="w-full bg-(--term-border-dark) h-2 overflow-hidden rounded mb-1">
                          <div
                            className={`h-full ${
                              isRiot ? 'bg-[#ff2a00]' : r.tension > 50 ? 'bg-[#ff9900]' : 'bg-[#33ff33]'
                            }`}
                            style={{ width: `${r.tension}%` }}
                          />
                        </div>
                        {isCurfew && (
                          <div className="text-xs text-[#33ccff] font-bold">
                            РЕЖИМ ПАТРУЛЕЙ: {r.curfewTurns} МЕС.
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-1 border-t border-(--term-border-dark)">
                        {!isCurfew ? (
                          <button
                            onClick={() => onDeclareCurfew(rId)}
                            disabled={attentionPoints < 1}
                            className="w-full py-1.5 border border-[#ff9900] bg-[#ff9900]/15 hover:bg-[#ff9900] hover:text-black text-[#ff9900] font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            [ ВВЕСТИ ПАТРУЛИ ВВ (1 ОВ) ]
                          </button>
                        ) : (
                          <span className="text-xs text-[#33ccff] italic font-semibold">Напряжение заморожено</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 8 Infrastructure Nodes with Specialized Repairs */}
            <div>
              <div className="text-xs text-(--term-dim) font-black uppercase mb-1.5">
                ИНФРАСТРУКТУРНЫЕ ОБЪЕКТЫ (РАСЧЕТ ДОХОДОВ И УБЫТКОВ):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.values(nodes).map((node) => {
                  const isOk = node.status === 'operational';
                  const isDamaged = node.status === 'damaged';
                  const isBlocked = node.status === 'blocked';
                  const isInsurgent = node.status === 'insurgent_held';

                  return (
                    <div
                      key={node.id}
                      className={`p-3 border bg-(--term-panel) flex flex-col justify-between ${
                        isOk
                          ? 'border-(--term-border-dark)'
                          : 'border-[#ff9900] shadow-[0_0_12px_rgba(255,153,0,0.2)]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs sm:text-sm text-(--term-main)">{node.name}</span>
                          <span
                            className={`px-2 py-0.5 border text-xs font-black ${
                              isOk
                                ? 'border-[#33ff33] text-[#33ff33]'
                                : isBlocked
                                ? 'border-[#ff9900] text-[#ff9900]'
                                : 'border-[#ff2a00] text-[#ff2a00]'
                            }`}
                          >
                            {isOk
                              ? 'В СТРОЮ'
                              : isBlocked
                              ? 'ЗАБЛОКИРОВАН'
                              : isDamaged
                              ? 'АВАРИЙНЫЙ ИЗНОС'
                              : 'ЗАХВАЧЕН БОЕВИКАМИ'}
                          </span>
                        </div>
                        <p className="text-xs text-(--term-dim) leading-snug mb-2">{node.description}</p>
                        <div className="text-[11px] font-semibold text-(--term-main)/80 border-t border-(--term-border-dark) pt-1">
                          Убыток при простое: -4.5 млн ₽/мес | Дефицит +{node.impact.deficitDelta}% | План{' '}
                          {node.impact.moscowPlanDelta}%
                        </div>
                      </div>

                      {/* Specialized Action Buttons depending on status */}
                      <div className="mt-2.5 pt-1.5 border-t border-(--term-border-dark) space-y-1">
                        {isDamaged && (
                          <div className="flex flex-col sm:flex-row gap-1">
                            <button
                              onClick={() => onRepairDamagedMoney(node.id)}
                              disabled={attentionPoints < 1 || economy.rubleBudgetMillions < 10}
                              className="flex-1 py-1.5 px-2 border border-[#ff9900] bg-[#ff9900]/15 hover:bg-[#ff9900] hover:text-black text-[#ff9900] font-bold text-xs transition cursor-pointer disabled:opacity-40"
                            >
                              [ РЕМОНТ (1 ОВ, -10М ₽) ]
                            </button>
                            <button
                              onClick={() => onRepairDamagedShelves(node.id)}
                              disabled={attentionPoints < 1 || economy.shelfSupplyPercent < 15}
                              className="flex-1 py-1.5 px-2 border border-(--term-border) bg-(--term-panel-light) hover:border-(--term-main) hover:bg-(--term-main) hover:text-black text-(--term-main) font-bold text-xs transition cursor-pointer disabled:opacity-40"
                            >
                              [ СНЯТЬ С ПОЛОК (-15%) ]
                            </button>
                          </div>
                        )}

                        {isBlocked && (
                          <div className="space-y-1">
                            <div className="text-xs text-[#ff9900] italic font-semibold">
                              Парализовано забастовщиками. Решается через ВЧ-связь, Комендантский час или паек:
                            </div>
                            <button
                              onClick={() => onResolveBlockedConcession(node.id)}
                              disabled={attentionPoints < 1 || economy.rubleBudgetMillions < 12}
                              className="w-full py-1.5 border border-[#ff9900] bg-[#ff9900]/20 hover:bg-[#ff9900] hover:text-black text-[#ff9900] font-bold text-xs transition cursor-pointer disabled:opacity-40"
                            >
                              [ ЧРЕЗВЫЧАЙНЫЙ ПАЕК СТАЧКОМУ (1 ОВ, -12М ₽, -10% ПЛАН) ]
                            </button>
                          </div>
                        )}

                        {isInsurgent && (
                          <button
                            onClick={() => onStormInsurgents(node.id)}
                            disabled={attentionPoints < 1}
                            className="w-full py-2 border-2 border-[#ff2a00] bg-[#ff2a00]/25 hover:bg-[#ff2a00] hover:text-black text-[#ff2a00] font-black text-xs transition cursor-pointer disabled:opacity-40"
                          >
                            [ ШТУРМ СПЕЦНАЗОМ КГБ И ВВ МВД (1 ОВ, НАПРЯЖЕНИЕ +15%, АВТОКРАТИЯ +10%) ]
                          </button>
                        )}

                        {isOk && (
                          <span className="text-xs text-[#33ff33] font-bold block text-right">
                            ● В ШТАТНОМ РЕЖИМЕ (+2.0М ₽/мес)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 4: FOCUSED MODULE 3 - ВЧ-СВЯЗЬ И ВХОДЯЩИЕ ВЫЗОВЫ   */}
        {/* ======================================================= */}
        {cameraFocus === 'hotline' && (
          <div className="w-full h-full p-2 sm:p-4 overflow-y-auto">
            {/* INCOMING EMERGENCY CALL SCREEN (0 AP TO RESPOND) */}
            {incomingCall ? (
              <div className="max-w-xl mx-auto border-4 border-[#ff2a00] bg-[#1a0804] p-4 shadow-[0_0_35px_rgba(255,42,0,0.4)] space-y-3">
                <div className="flex items-center justify-between border-b border-[#ff2a00] pb-2">
                  <span className="font-black text-sm text-[#ff2a00] animate-pulse">
                    ☎ ВХОДЯЩИЙ ВЫЗОВ ВЧ-СВЯЗИ: {incomingCall.subject}
                  </span>
                  <span className="px-2 py-0.5 bg-[#ff2a00] text-black font-black text-xs">
                    МОЛНИЯ
                  </span>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border border-[#ff2a00] p-0.5 bg-black">
                    <TerminalPortrait archetype={incomingCall.avatar} isEmergency phosphorColor={phosphorColor} />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-(--term-main)">{incomingCall.actorName}</div>
                    <div className="text-xs text-(--term-dim) mb-1 font-semibold">{incomingCall.actorTitle}</div>
                    <p className="text-xs text-(--term-main) leading-relaxed bg-(--term-bg) p-2 border border-(--term-border-dark)">
                      «{incomingCall.dialogue}»
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-(--term-border-dark) space-y-2">
                  <div className="text-xs text-(--term-dim) font-black">
                    ВАШ ОТВЕТ В ТРУБКУ (ОТВЕТ НЕ ТРАТИТ ОВ):
                  </div>
                  {incomingCall.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onAnswerIncomingCall(opt.id)}
                      className="w-full p-2.5 border border-(--term-border) bg-(--term-panel-light) hover:border-(--term-main) hover:bg-(--term-main) hover:text-black text-left transition cursor-pointer"
                    >
                      <div className="font-bold text-xs text-(--term-main)">{opt.label}</div>
                      <div className="text-xs text-(--term-dim) mt-0.5 font-semibold">{opt.effectNote}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Normal Hotline list & dialogues */
              <div className="flex flex-col md:flex-row gap-3 h-full">
                {/* Actors list */}
                <div className="w-full md:w-[240px] shrink-0 space-y-1.5 overflow-y-auto">
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
                            ? 'border-(--term-main) bg-(--term-main)/20 text-(--term-main)'
                            : 'border-(--term-border-dark) text-(--term-dim) hover:border-(--term-border) hover:text-(--term-main) bg-(--term-panel)'
                        }`}
                      >
                        <div className="w-9 h-9 shrink-0 border border-(--term-border) p-0.5 bg-(--term-bg)">
                          <TerminalPortrait archetype={actor.avatar as ArchetypeId} phosphorColor={phosphorColor} />
                        </div>
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="font-bold truncate">{actor.name}</div>
                          <div className="text-[11px] text-(--term-dim) truncate font-semibold">{actor.title.split(',')[0]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected actor details */}
                {actors[selectedActorId] && (
                  <div className="flex-1 border border-(--term-border) bg-(--term-panel) p-3 flex flex-col justify-between overflow-y-auto">
                    {(() => {
                      const actor = actors[selectedActorId];
                      return (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between border-b border-(--term-border-dark) pb-2">
                            <div>
                              <h3 className="text-sm font-extrabold text-(--term-main)">{actor.name}</h3>
                              <div className="text-xs text-(--term-dim) font-semibold">{actor.title}</div>
                            </div>
                            <div className="text-right text-xs font-bold">
                              <div className="text-[#33ff33]">ЛОЯЛЬНОСТЬ: {actor.loyalty}%</div>
                              <div className="text-[#ff9900]">ВЛИЯНИЕ: {actor.influence}%</div>
                            </div>
                          </div>

                          {/* Plot Progress info (Revealed only if wiretapped or infiltrated) */}
                          <div className="p-2 border border-(--term-border-dark) bg-(--term-bg) text-xs">
                            {actor.surveillance !== 'none' ? (
                              <div>
                                <span className="font-bold text-[#ff2a00]">ОПЕРАТИВНЫЙ ЗАГОВОР: </span>
                                <span className="text-(--term-main)">{actor.plotTitle}</span>
                                <div className="mt-1 flex items-center space-x-1">
                                  <span>СТАДИЯ УДАРА:</span>
                                  <span className="font-extrabold text-[#ff2a00]">
                                    {actor.plotProgress} / 3
                                  </span>
                                  <span className="tracking-widest ml-1 text-[#ff2a00]">
                                    {[0, 1, 2].map((i) => (i < actor.plotProgress ? '■' : '□')).join(' ')}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-(--term-dim) italic font-semibold">
                                [ЗАМЫСЛЫ ФИГУРАНТА СКРЫТЫ — ТРЕБУЕТСЯ ПРОСЛУШКА В МОДУЛЕ КГБ]
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-(--term-main) leading-relaxed p-2 border border-(--term-border-dark) bg-(--term-bg)">
                            {actor.dossier}
                          </p>

                          <div>
                            <div className="text-xs text-(--term-dim) font-black uppercase mb-1.5">
                              ВАРИАНТЫ ДИАЛОГА ПО ВЧ-СВЯЗИ (СТОИМОСТЬ: 1 ОВ):
                            </div>
                            <div className="space-y-2">
                              {actor.callOptions.map((opt) => (
                                <div
                                  key={opt.id}
                                  className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="text-xs font-bold text-(--term-main)">{opt.label}</div>
                                    <div className="text-[11px] text-(--term-dim) font-semibold">{opt.effectDescription}</div>
                                  </div>
                                  <button
                                    onClick={() => onExecuteCallOption(actor.id, opt.id)}
                                    disabled={attentionPoints < 1}
                                    className="shrink-0 px-3 py-1.5 border border-(--term-border) bg-(--term-bg) hover:border-(--term-main) hover:bg-(--term-main) hover:text-black font-bold text-xs transition cursor-pointer disabled:opacity-40"
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
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 5: FOCUSED MODULE 4 - 7-Е УПРАВЛЕНИЕ КГБ           */}
        {/* ======================================================= */}
        {cameraFocus === 'kgb' && (
          <div className="w-full h-full p-2 sm:p-4 overflow-y-auto space-y-3">
            <div className="p-2 border border-[#ff2a00]/40 bg-[#ff2a00]/10 text-[#ff2a00] text-xs flex items-center justify-between font-bold">
              <span>★ 7-Е ОПЕРАТИВНОЕ УПРАВЛЕНИЕ КГБ СССР // СПЕЦХРАН</span>
              <span>ГРИФ «ОСОБАЯ ПАПКА»</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.values(actors).map((actor) => {
                const isWiretap = actor.surveillance === 'wiretap';
                const isInfiltrated = actor.surveillance === 'infiltrated';

                return (
                  <div key={actor.id} className="p-3 border border-(--term-border-dark) bg-(--term-panel) space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-(--term-main)">{actor.name}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 border ${
                          isInfiltrated
                            ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/15'
                            : isWiretap
                            ? 'border-[#ff9900] text-[#ff9900] bg-[#ff9900]/15 animate-pulse'
                            : 'border-(--term-border-dark) text-(--term-dim)'
                        }`}
                      >
                        {isInfiltrated
                          ? 'ПОЛНЫЙ КОНТРОЛЬ'
                          : isWiretap
                          ? 'ВЕДЕТСЯ ПРОСЛУШКА'
                          : 'БЕЗ НАБЛЮДЕНИЯ'}
                      </span>
                    </div>

                    {/* Plot info */}
                    {actor.surveillance !== 'none' ? (
                      <div className="p-2 border border-[#ff2a00]/30 bg-[#200a06] text-xs">
                        <div className="font-bold text-[#ff2a00]">ЗАГОВОР: {actor.plotTitle}</div>
                        <div className="text-(--term-main)/80 font-semibold mt-0.5">
                          Прогресс удара: <b>{actor.plotProgress}/3</b> (каждый месяц +1 при лояльности &lt;55%)
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-(--term-dim) italic font-semibold">
                        Агентурная разработка не ведется. Текущие планы фигуранта неизвестны.
                      </div>
                    )}

                    {/* Bug 2 fix: Kompromat is ONLY shown if surveillance === 'infiltrated' */}
                    {isInfiltrated ? (
                      actor.unlockedKompromat.map((k) => (
                        <div key={k.id} className="p-2 border border-(--term-border-dark) bg-(--term-bg) text-xs space-y-1">
                          <div className="font-bold text-(--term-main)">{k.title}</div>
                          <div className="text-(--term-dim) font-semibold">{k.description}</div>
                          {!k.used ? (
                            <button
                              onClick={() => onFreezeActorAssets(actor.id, k.id)}
                              className="w-full py-1.5 border border-[#33ff33] bg-[#33ff33]/15 hover:bg-[#33ff33] hover:text-black text-[#33ff33] font-bold text-xs transition cursor-pointer"
                            >
                              [ АРЕСТОВАТЬ СЧЕТА И АКТИВЫ (0 ОВ, СБРОС ЗАГОВОРА, +12М ₽ / +$5М) ]
                            </button>
                          ) : (
                            <span className="text-xs text-[#33ff33] font-bold block">
                              ✓ КОМПРОМАТ И АКТИВЫ РЕАЛИЗОВАНЫ
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 border border-(--term-border-dark) bg-(--term-bg) text-xs text-(--term-dim) italic text-center font-semibold">
                        [ ДОСЬЕ ПУСТО — ТРЕБУЕТСЯ САНКЦИЯ НА ПРОСЛУШКУ ]
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      {actor.surveillance === 'none' && (
                        <button
                          onClick={() => onAuthorizeWiretap(actor.id)}
                          disabled={attentionPoints < 1}
                          className="px-3 py-1.5 border border-[#ff2a00] text-[#ff2a00] hover:bg-[#ff2a00] hover:text-black font-bold text-xs transition cursor-pointer disabled:opacity-40"
                        >
                          [ САНКЦИОНИРОВАТЬ ПРОСЛУШКУ (1 ОВ) ]
                        </button>
                      )}
                      {actor.surveillance === 'wiretap' && (
                        <span className="text-xs text-[#ff9900] italic font-semibold">
                          Агентура расшифровывает записи разговоров...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 6: FOCUSED MODULE 5 - ПОСТАНОВЛЕНИЯ БЮРО ЦК       */}
        {/* ======================================================= */}
        {cameraFocus === 'decrees' && (
          <div className="w-full h-full p-2 sm:p-4 overflow-y-auto space-y-2">
            <div className="text-xs text-(--term-dim) font-black uppercase mb-1">
              ГОСУДАРСТВЕННЫЕ ПОСТАНОВЛЕНИЯ БЮРО ЦК (ПРИНЯТИЕ/ОТМЕНА СТОИТ 1 ОВ):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {decrees.map((decree) => {
                return (
                  <div
                    key={decree.id}
                    className={`p-3 border bg-(--term-panel) flex flex-col justify-between ${
                      decree.active
                        ? 'border-[#33ff33] bg-[#33ff33]/5 shadow-[0_0_15px_rgba(51,255,51,0.15)]'
                        : 'border-(--term-border-dark)'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs sm:text-sm text-(--term-main)">{decree.title}</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 border ${
                            decree.active
                              ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/20'
                              : 'border-(--term-border-dark) text-(--term-dim)'
                          }`}
                        >
                          {decree.active ? 'ДЕЙСТВУЕТ' : 'НЕ ВВЕДЕН'}
                        </span>
                      </div>
                      <p className="text-xs text-(--term-dim) leading-snug mb-2 font-semibold">{decree.description}</p>
                      <div className="text-[11px] font-bold text-(--term-main)/80 border-t border-(--term-border-dark) pt-1">
                        Ежемесячный эффект:
                        {decree.monthlyImpact.shelfSupplyPercent && ` Полки +${decree.monthlyImpact.shelfSupplyPercent}%`}
                        {decree.monthlyImpact.rubleBudgetMillions && ` | Казна ${decree.monthlyImpact.rubleBudgetMillions > 0 ? '+' : ''}${decree.monthlyImpact.rubleBudgetMillions}М ₽`}
                        {decree.monthlyImpact.moscowPlanFulfilled && ` | План ${decree.monthlyImpact.moscowPlanFulfilled > 0 ? '+' : ''}${decree.monthlyImpact.moscowPlanFulfilled}%`}
                        {decree.monthlyImpact.tensionDelta && ` | Напряжение ${decree.monthlyImpact.tensionDelta > 0 ? '+' : ''}${decree.monthlyImpact.tensionDelta}%`}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-(--term-border-dark) flex justify-end">
                      <button
                        onClick={() => onToggleDecree(decree.id)}
                        disabled={attentionPoints < 1}
                        className={`px-3 py-1.5 border font-bold text-xs transition cursor-pointer disabled:opacity-40 ${
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
    </div>
  );
};
