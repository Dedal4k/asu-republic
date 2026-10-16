/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemSettings, PhosphorColor, ScanlineDensity, TeletypeSpeed, TerminalScale } from '../types';
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
      <div className="border border-[#6e470b] bg-[#100a04] p-3 md:p-4 flex-1 flex flex-col justify-between overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#6e470b] pb-2 mb-2 gap-1 shrink-0">
          <div>
            <h2 className="text-xs sm:text-sm md:text-base font-black crt-amber-text tracking-wider uppercase">
              [ СИСТЕМНЫЕ НАСТРОЙКИ АСУ-РЕСПУБЛИКА // КОНФИГУРАЦИЯ ]
            </h2>
            <div className="text-[9px] text-[#8c5b0f]">
              МОДУЛЬ ТЕХНИЧЕСКОГО ОБСЛУЖИВАНИЯ КИНЕСКОПА И СВЯЗИ • ВЕРСИЯ 2.1
            </div>
          </div>
          <div className="px-2 py-0.5 border border-[#ffb000]/40 text-[#ffb000] text-[9px] font-bold tracking-widest uppercase">
            ГОСТ 21552-84
          </div>
        </div>

        {/* Status message */}
        {resetSuccessMessage && (
          <div className="mb-2 p-1.5 border border-[#33ff33] bg-[#33ff33]/15 text-[#33ff33] font-bold text-center text-[10px] animate-pulse">
            ✓ {resetSuccessMessage}
          </div>
        )}

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ========================================================= */}
          {/* 1. РАЗДЕЛ: АКУСТИЧЕСКИЙ ТРАКТ                             */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <div className="text-[10px] md:text-[11px] font-black text-[#ffb000] border-b border-[#3d2607] pb-1 flex items-center justify-between">
              <span>1. АКУСТИЧЕСКИЙ ТРАКТ И СИНТЕЗ ЗВУКА</span>
              <span className="text-[8.5px] text-[#8c5b0f] uppercase">УЗЕЛ ЗВУКОУСИЛЕНИЯ</span>
            </div>

            <div className="space-y-1.5">
              <div>
                <div className="text-[9.5px] text-[#8c5b0f] mb-1 font-bold">
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
                <div className="text-[9.5px] text-[#8c5b0f] mb-1 font-bold">
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
            <div className="text-[10px] md:text-[11px] font-black text-[#ffb000] border-b border-[#3d2607] pb-1 flex items-center justify-between">
              <span>2. ОПТИКА И ЛЮМИНОФОР КИНЕСКОПА</span>
              <span className="text-[8.5px] text-[#8c5b0f] uppercase">ЭЛТ ТИПА 31ЛН</span>
            </div>

            {/* Phosphor Palette Switcher */}
            <div className="p-2 border border-[#3d2607] bg-[#0c0803] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-[#ffb000]">ТИП ЛЮМИНОФОРА:</div>
                <div className="text-[9px] text-[#8c5b0f]">
                  Спектр свечения электронно-лучевой трубки
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 shrink-0">
                {(
                  [
                    { id: 'amber', label: 'ЯНТАРЬ', color: '#ffb000' },
                    { id: 'green', label: 'ЗЕЛЕНЫЙ', color: '#33ff33' },
                    { id: 'mono', label: 'МОНОХРОМ', color: '#e5e7eb' },
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
                      className={`px-2 py-1.5 border text-[9.5px] font-black transition cursor-pointer ${
                        isSelected
                          ? 'border-[#ffb000] bg-[#ffb000] text-black shadow-[0_0_8px_rgba(255,176,0,0.5)]'
                          : 'border-[#4a341b] text-[#8c5b0f] hover:border-[#ffb000]/60 hover:text-[#ffb000]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scanlines Density */}
            <div className="p-2 border border-[#3d2607] bg-[#0c0803] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-[#ffb000]">РАЗВЕРТКА КИНЕСКОПА:</div>
                <div className="text-[9px] text-[#8c5b0f]">
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
                      className={`px-2 py-1 border text-[9.5px] font-black transition cursor-pointer ${
                        isSelected
                          ? 'border-[#ffb000] bg-[#ffb000] text-black'
                          : 'border-[#4a341b] text-[#8c5b0f] hover:border-[#ffb000]/60 hover:text-[#ffb000]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Screen Curvature */}
            <div className="p-2 border border-[#3d2607] bg-[#0c0803] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#ffb000]">СФЕРИЧЕСКАЯ ГЕОМЕТРИЯ:</div>
                <div className="text-[9px] text-[#8c5b0f]">
                  Выпуклая форма стекла колбы и тень корпуса
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('screenCurvature', !settings.screenCurvature);
                }}
                className={`px-3 py-1 border text-[10px] font-black transition cursor-pointer ${
                  settings.screenCurvature
                    ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000]'
                    : 'border-[#6e470b] text-[#8c5b0f]'
                }`}
              >
                {settings.screenCurvature ? '[ ВЫПУКЛЫЙ ]' : '[ ПЛОСКИЙ ]'}
              </button>
            </div>

            {/* Voltage Glitches */}
            <div className="p-2 border border-[#3d2607] bg-[#0c0803] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#ffb000]">СЕТЕВЫЕ СБОИ И ПОМЕХИ:</div>
                <div className="text-[9px] text-[#8c5b0f]">
                  Микро-просадки яркости и мерцания при кризисах
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('voltageGlitches', !settings.voltageGlitches);
                }}
                className={`px-3 py-1 border text-[10px] font-black transition cursor-pointer ${
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
            <div className="text-[10px] md:text-[11px] font-black text-[#ffb000] border-b border-[#3d2607] pb-1 flex items-center justify-between">
              <span>3. ТЕЛЕТАЙП, МАСШТАБ И АСУ-ПОДСКАЗКИ</span>
              <span className="text-[8.5px] text-[#8c5b0f] uppercase">ТЕРМИНАЛЬНЫЙ СЕРВЕР</span>
            </div>

            {/* Teletype Speed */}
            <div className="p-2 border border-[#3d2607] bg-[#0c0803] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-[#ffb000]">СКОРОСТЬ ПЕЧАТИ:</div>
                <div className="text-[9px] text-[#8c5b0f]">
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
                      className={`px-2 py-1 border text-[9px] font-black transition cursor-pointer ${
                        isSelected
                          ? 'border-[#ffb000] bg-[#ffb000] text-black'
                          : 'border-[#4a341b] text-[#8c5b0f] hover:border-[#ffb000]/60 hover:text-[#ffb000]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Predictive Hints */}
            <div className="p-2 border border-[#3d2607] bg-[#0c0803] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#ffb000]">РАСЧЕТНЫЕ ПОДСКАЗКИ АСУ:</div>
                <div className="text-[9px] text-[#8c5b0f]">
                  Отображение точных цифровых модификаторов на выборах
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('predictiveHints', !settings.predictiveHints);
                }}
                className={`px-3 py-1 border text-[10px] font-black transition cursor-pointer ${
                  settings.predictiveHints
                    ? 'border-[#33ff33] text-[#33ff33] bg-[#33ff33]/15'
                    : 'border-[#6e470b] text-[#8c5b0f]'
                }`}
              >
                {settings.predictiveHints ? '[ ВИДИМЫ ]' : '[ СКРЫТЫ ]'}
              </button>
            </div>

            {/* Terminal Scale */}
            <div className="p-2 border border-[#3d2607] bg-[#0c0803] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#ffb000]">МАСШТАБ СИСТЕМЫ:</div>
                <div className="text-[9px] text-[#8c5b0f]">
                  Плотность отображения текста и элементов кабинета
                </div>
              </div>
              <button
                onClick={() => {
                  terminalAudio.playSwitchClick();
                  handleUpdate('terminalScale', settings.terminalScale === 'compact' ? 'normal' : 'compact');
                }}
                className={`px-3 py-1 border text-[10px] font-black transition cursor-pointer ${
                  settings.terminalScale === 'compact'
                    ? 'border-[#ffb000] bg-[#ffb000]/20 text-[#ffb000]'
                    : 'border-[#6e470b] text-[#8c5b0f]'
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
        <div className="pt-3 mt-3 border-t border-[#6e470b] space-y-2 shrink-0">
          {showClearConfirm ? (
            <div className="p-2.5 border-2 border-[#ff2a00] bg-[#ff2a00]/15 space-y-2 text-center">
              <div className="text-[10px] sm:text-[11px] font-bold text-[#ff2a00]">
                ⚠ ВНИМАНИЕ: Все открытые архивные дела (13 финалов) будут безвозвратно удалены!
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleConfirmClearArchive}
                  className="flex-1 py-1.5 border border-[#ff2a00] bg-[#ff2a00] text-black font-black text-xs hover:bg-[#ff2a00]/80 transition cursor-pointer"
                >
                  [ ПОДТВЕРДИТЬ ОЧИСТКУ ]
                </button>
                <button
                  onClick={() => {
                    terminalAudio.playKeyClick();
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-1.5 border border-[#6e470b] text-[#ffb000] hover:border-[#ffb000] font-bold text-xs cursor-pointer"
                >
                  [ ОТМЕНА ]
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleResetDefaults}
                className="flex-1 py-2 border border-[#6e470b] hover:border-[#ffb000] text-[#ffb000] font-bold text-xs hover:bg-[#ffb000]/10 transition cursor-pointer"
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
            className="w-full py-2.5 border-2 border-[#ffb000] bg-[#ffb000] text-black font-black text-xs md:text-sm hover:bg-[#ffb000]/80 tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(255,176,0,0.3)]"
          >
            [ ◄ ВОЗВРАТ В СИСТЕМУ ]
          </button>
        </div>
      </div>
    </div>
  );
};
