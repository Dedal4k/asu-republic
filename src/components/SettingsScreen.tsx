/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemSettings, PhosphorColor, ScanlineDensity, TeletypeSpeed } from '../types';
import { TerminalSlider } from './TerminalSlider';
import { terminalAudio } from '../audio';

interface SettingsScreenProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onResetSettings: () => void;
  onClearArchive: () => void;
  onReturn: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onClearArchive,
  onReturn,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleUpdate = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
  };

  const handleResetDefaults = () => {
    terminalAudio.playSwitchClick();
    onResetSettings();
    setResetSuccessMessage('ПАРАМЕТРЫ СБРОШЕНЫ К ЗАВОДСКИМ НАСТРОЙКАМ ГОСПЛАНА');
    setTimeout(() => setResetSuccessMessage(null), 3000);
  };

  const handleConfirmClearArchive = () => {
    terminalAudio.playEmergencyAlarm();
    onClearArchive();
    setShowClearConfirm(false);
    setResetSuccessMessage('АРХИВ «ОСОБЫХ ПАПОК» ПОЛНОСТЬЮ ОЧИЩЕН');
    setTimeout(() => setResetSuccessMessage(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 md:p-3 overflow-hidden text-xs font-mono select-none">
      <div className="border border-(--term-border) bg-(--term-panel) p-3 md:p-4 flex-1 flex flex-col justify-between overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-(--term-border) pb-2 mb-2 gap-1 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-black crt-term-text tracking-wider uppercase">
              [ СИСТЕМНЫЕ НАСТРОЙКИ АСУ-РЕСПУБЛИКА // КОНФИГУРАЦИЯ ]
            </h2>
            <div className="text-[11px] font-semibold text-(--term-dim)">
              МОДУЛЬ ТЕХНИЧЕСКОГО ОБСЛУЖИВАНИЯ КИНЕСКОПА И СВЯЗИ • ВЕРСИЯ 2.1
            </div>
          </div>
          <div className="px-2 py-0.5 border border-(--term-border) text-(--term-main) text-xs font-bold tracking-widest uppercase">
            ГОСТ 21552-84
          </div>
        </div>

        {/* Status message */}
        {resetSuccessMessage && (
          <div className="mb-2 p-2 border border-[#33ff33] bg-[#33ff33]/15 text-[#33ff33] font-bold text-center text-xs animate-pulse">
            ✓ {resetSuccessMessage}
          </div>
        )}

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ========================================================= */}
          {/* 1. РАЗДЕЛ: АКУСТИЧЕСКИЙ ТРАКТ                             */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-black text-(--term-main) border-b border-(--term-border-dark) pb-1 flex items-center justify-between">
              <span>1. АКУСТИЧЕСКИЙ ТРАКТ И СИНТЕЗ ЗВУКА</span>
              <span className="text-[11px] font-bold text-(--term-dim) uppercase">УЗЕЛ ЗВУКОУСИЛЕНИЯ</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-(--term-dim) mb-1 font-bold">
                  ФОНОВАЯ МУЗЫКА (ПЕРЕСТРОЕЧНЫЙ ЭМБИЕНТ):
                </div>
                <TerminalSlider
                  value={settings.ambientVolume}
                  onChange={(val) => {
                    handleUpdate('ambientVolume', val);
                    terminalAudio.setAmbientVolume(val);
                  }}
                  label="МУЗЫКА:"
                />
              </div>

              <div>
                <div className="text-xs text-(--term-dim) mb-1 font-bold">
                  ЭФФЕКТЫ АППАРАТУРЫ (КЛАВИШИ, ТЕЛЕТАЙП, СИРЕНА):
                </div>
                <TerminalSlider
                  value={settings.sfxVolume}
                  onChange={(val) => {
                    handleUpdate('sfxVolume', val);
                    terminalAudio.setSfxVolume(val);
                  }}
                  label="ЭФФЕКТЫ:"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. РАЗДЕЛ: ОПТИКА И КИНЕСКОП                              */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-black text-(--term-main) border-b border-(--term-border-dark) pb-1 flex items-center justify-between">
              <span>2. ОПТИКА И ЛЮМИНОФОР КИНЕСКОПА</span>
              <span className="text-[11px] font-bold text-(--term-dim) uppercase">ЭЛТ ТИПА 31ЛН</span>
            </div>

            {/* Phosphor Palette Switcher */}
            <div className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-xs text-(--term-main)">ТИП ЛЮМИНОФОРА:</div>
                <div className="text-[11px] text-(--term-dim)">
                  Спектр свечения электронно-лучевой трубки
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 shrink-0">
                {(
                  [
                    { id: 'amber', label: 'ЯНТАРЬ', color: '#ffb000' },
                    { id: 'green', label: 'ЗЕЛЕНЫЙ', color: '#33ff66' },
                    { id: 'mono', label: 'МОНОХРОМ', color: '#f0f6fc' },
                  ] as { id: PhosphorColor; label: string; color: string }[]
                ).map((opt) => {
                  const isSelected = settings.phosphorColor === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        terminalAudio.playKeyClick();
                        handleUpdate('phosphorColor', opt.id);
                      }}
                      className={`px-3 py-1.5 border text-xs font-black transition cursor-pointer ${
                        isSelected
                          ? 'border-(--term-main) bg-(--term-main) text-black shadow-[0_0_8px_rgba(255,255,255,0.3)]'
                          : 'border-(--term-border) text-(--term-dim) hover:border-(--term-main) hover:text-(--term-main)'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scanlines Density */}
            <div className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-xs text-(--term-main)">РАЗВЕРТКА КИНЕСКОПА:</div>
                <div className="text-[11px] text-(--term-dim)">
                  Плотность чересстрочных полос советского монитора
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 shrink-0">
                {(
                  [
                    { id: 'off', label: 'ВЫКЛ' },
                    { id: 'low', label: 'МИН' },
                    { id: 'med', label: 'НОРМ' },
                    { id: 'high', label: 'МАКС' },
                  ] as { id: ScanlineDensity; label: string }[]
                ).map((opt) => {
                  const isSelected = settings.scanlineDensity === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        terminalAudio.playKeyClick();
                        handleUpdate('scanlineDensity', opt.id);
                      }}
                      className={`px-2 py-1.5 border text-xs font-black transition cursor-pointer ${
                        isSelected
                          ? 'border-(--term-main) bg-(--term-main) text-black'
                          : 'border-(--term-border) text-(--term-dim) hover:border-(--term-main) hover:text-(--term-main)'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Screen Curvature */}
            <div className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-(--term-main)">СФЕРИЧЕСКАЯ ГЕОМЕТРИЯ:</div>
                <div className="text-[11px] text-(--term-dim)">
                  Выпуклая форма стекла колбы и тень корпуса
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('screenCurvature', !settings.screenCurvature);
                }}
                className={`px-3 py-1.5 border text-xs font-black transition cursor-pointer ${
                  settings.screenCurvature
                    ? 'border-(--term-main) bg-(--term-main)/20 text-(--term-main)'
                    : 'border-(--term-border) text-(--term-dim)'
                }`}
              >
                {settings.screenCurvature ? '[ ВЫПУКЛЫЙ ]' : '[ ПЛОСКИЙ ]'}
              </button>
            </div>

            {/* Voltage Glitches */}
            <div className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-(--term-main)">СЕТЕВЫЕ СБОИ И ПОМЕХИ:</div>
                <div className="text-[11px] text-(--term-dim)">
                  Микро-просадки яркости и мерцания при кризисах
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('voltageGlitches', !settings.voltageGlitches);
                }}
                className={`px-3 py-1.5 border text-xs font-black transition cursor-pointer ${
                  settings.voltageGlitches
                    ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/15'
                    : 'border-[#ff2a00] text-[#ff2a00] bg-[#ff2a00]/10'
                }`}
              >
                {settings.voltageGlitches ? '[ ВКЛЮЧЕНО ]' : '[ ВЫКЛЮЧЕНО ]'}
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. РАЗДЕЛ: ТЕЛЕТАЙП И ИНТЕРФЕЙС                           */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-black text-(--term-main) border-b border-(--term-border-dark) pb-1 flex items-center justify-between">
              <span>3. ТЕЛЕТАЙП, МАСШТАБ И АСУ-ПОДСКАЗКИ</span>
              <span className="text-[11px] font-bold text-(--term-dim) uppercase">ТЕРМИНАЛЬНЫЙ СЕРВЕР</span>
            </div>

            {/* Teletype Speed */}
            <div className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-xs text-(--term-main)">СКОРОСТЬ ПЕЧАТИ:</div>
                <div className="text-[11px] text-(--term-dim)">
                  Темп вывода сводок брифинга и телетайпа
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 shrink-0">
                {(
                  [
                    { id: 'instant', label: 'МГНОВЕННО' },
                    { id: 'normal', label: 'СТАНДАРТ' },
                    { id: 'slow', label: 'ТЕЛЕТАЙП' },
                  ] as { id: TeletypeSpeed; label: string }[]
                ).map((opt) => {
                  const isSelected = settings.teletypeSpeed === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        terminalAudio.playKeyClick();
                        handleUpdate('teletypeSpeed', opt.id);
                      }}
                      className={`px-2 py-1.5 border text-xs font-black transition cursor-pointer ${
                        isSelected
                          ? 'border-(--term-main) bg-(--term-main) text-black'
                          : 'border-(--term-border) text-(--term-dim) hover:border-(--term-main) hover:text-(--term-main)'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Predictive Hints */}
            <div className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-(--term-main)">РАСЧЕТНЫЕ ПОДСКАЗКИ АСУ:</div>
                <div className="text-[11px] text-(--term-dim)">
                  Отображение точных цифровых модификаторов на выборах
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('predictiveHints', !settings.predictiveHints);
                }}
                className={`px-3 py-1.5 border text-xs font-black transition cursor-pointer ${
                  settings.predictiveHints
                    ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/15'
                    : 'border-(--term-border) text-(--term-dim)'
                }`}
              >
                {settings.predictiveHints ? '[ ВИДИМЫ ]' : '[ СКРЫТЫ ]'}
              </button>
            </div>

            {/* Terminal Scale */}
            <div className="p-2 border border-(--term-border-dark) bg-(--term-panel-light) flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-(--term-main)">МАСШТАБ СИСТЕМЫ:</div>
                <div className="text-[11px] text-(--term-dim)">
                  Плотность отображения текста и элементов кабинета
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('terminalScale', settings.terminalScale === 'compact' ? 'normal' : 'compact');
                }}
                className={`px-3 py-1.5 border text-xs font-black transition cursor-pointer ${
                  settings.terminalScale === 'compact'
                    ? 'border-(--term-main) bg-(--term-main)/20 text-(--term-main)'
                    : 'border-(--term-border) text-(--term-dim)'
                }`}
              >
                {settings.terminalScale === 'compact' ? '[ КОМПАКТНЫЙ ]' : '[ ОБЫЧНЫЙ ]'}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. НИЖНИЙ БЛОК ДЕЙСТВИЙ                                    */}
        {/* ========================================================= */}
        <div className="pt-3 mt-3 border-t border-(--term-border) space-y-2 shrink-0">
          {showClearConfirm ? (
            <div className="p-3 border-2 border-[#ff2a00] bg-[#ff2a00]/15 space-y-2 text-center">
              <div className="text-xs font-bold text-[#ff2a00]">
                ⚠ ВНИМАНИЕ: Все открытые архивные дела (13 финалов) будут безвозвратно удалены!
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleConfirmClearArchive}
                  className="flex-1 py-2 border border-[#ff2a00] bg-[#ff2a00] text-black font-black text-xs hover:bg-[#ff2a00]/80 transition cursor-pointer"
                >
                  [ ПОДТВЕРДИТЬ ОЧИСТКУ ]
                </button>
                <button
                  onClick={() => {
                    terminalAudio.playKeyClick();
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-2 border border-(--term-border) text-(--term-main) hover:border-(--term-main) font-bold text-xs cursor-pointer"
                >
                  [ ОТМЕНА ]
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleResetDefaults}
                className="flex-1 py-2 border border-(--term-border) hover:border-(--term-main) text-(--term-main) font-bold text-xs hover:bg-(--term-main)/10 transition cursor-pointer"
              >
                [ СБРОС НАСТРОЕК ПО УМОЛЧАНИЮ ]
              </button>
              <button
                onClick={() => {
                  terminalAudio.playKeyClick();
                  setShowClearConfirm(true);
                }}
                className="py-2 px-3 border border-[#6e1000] hover:border-[#ff2a00] text-[#ff2a00] font-bold text-xs hover:bg-[#ff2a00]/10 transition cursor-pointer"
              >
                [ ОЧИСТИТЬ АРХИВ ДОСЬЕ ]
              </button>
            </div>
          )}

          <button
            onClick={() => {
              terminalAudio.playSwitchClick();
              onReturn();
            }}
            className="w-full py-2.5 border-2 border-(--term-main) bg-(--term-main) text-black font-black text-xs md:text-sm hover:opacity-90 tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            [ ◄ ВОЗВРАТ В СИСТЕМУ ]
          </button>
        </div>
      </div>
    </div>
  );
};
