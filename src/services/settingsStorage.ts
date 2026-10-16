/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemSettings, PhosphorColor } from '../types';

export const SETTINGS_STORAGE_KEY = 'asu_system_settings_v1';

export const DEFAULT_SETTINGS: SystemSettings = {
  ambientVolume: 70, // 0..100, шаг 10, по умолчанию 70
  sfxVolume: 80, // 0..100, шаг 10, по умолчанию 80
  phosphorColor: 'amber',
  scanlineDensity: 'med',
  screenCurvature: true,
  teletypeSpeed: 'normal',
  voltageGlitches: true,
  predictiveHints: false,
  terminalScale: 'normal',
};

export function loadSettings(): SystemSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return {
      ambientVolume:
        typeof parsed.ambientVolume === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.ambientVolume / 10) * 10))
          : DEFAULT_SETTINGS.ambientVolume,
      sfxVolume:
        typeof parsed.sfxVolume === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.sfxVolume / 10) * 10))
          : DEFAULT_SETTINGS.sfxVolume,
      phosphorColor: ['amber', 'green', 'mono'].includes(parsed.phosphorColor)
        ? parsed.phosphorColor
        : DEFAULT_SETTINGS.phosphorColor,
      scanlineDensity: ['off', 'low', 'med', 'high'].includes(parsed.scanlineDensity)
        ? parsed.scanlineDensity
        : DEFAULT_SETTINGS.scanlineDensity,
      screenCurvature:
        typeof parsed.screenCurvature === 'boolean'
          ? parsed.screenCurvature
          : DEFAULT_SETTINGS.screenCurvature,
      teletypeSpeed: ['instant', 'normal', 'slow'].includes(parsed.teletypeSpeed)
        ? parsed.teletypeSpeed
        : DEFAULT_SETTINGS.teletypeSpeed,
      voltageGlitches:
        typeof parsed.voltageGlitches === 'boolean'
          ? parsed.voltageGlitches
          : DEFAULT_SETTINGS.voltageGlitches,
      predictiveHints:
        typeof parsed.predictiveHints === 'boolean'
          ? parsed.predictiveHints
          : DEFAULT_SETTINGS.predictiveHints,
      terminalScale: ['compact', 'normal'].includes(parsed.terminalScale)
        ? parsed.terminalScale
        : DEFAULT_SETTINGS.terminalScale,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(newSettings: SystemSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  } catch {
    // Ignore storage quota or disabled localStorage
  }
}

export function resetToDefaults(): SystemSettings {
  const defaults = { ...DEFAULT_SETTINGS };
  saveSettings(defaults);
  return defaults;
}

export interface PhosphorThemeVars {
  '--term-main': string;
  '--term-color': string;
  '--term-glow': string;
  '--term-glow-low': string;
  '--term-dim': string;
  '--term-border': string;
  '--term-border-dark': string;
  '--term-bg': string;
  '--term-panel': string;
  '--term-panel-light': string;
  '--term-badge-bg': string;
  '--term-frame': string;
}

export function getPhosphorTheme(color: PhosphorColor): PhosphorThemeVars {
  switch (color) {
    case 'green':
      return {
        '--term-main': '#33ff66',
        '--term-color': '#33ff66',
        '--term-glow': 'rgba(51, 255, 102, 0.4)',
        '--term-glow-low': 'rgba(51, 255, 102, 0.15)',
        '--term-dim': '#2bd957',
        '--term-border': '#1f993d',
        '--term-border-dark': '#0e4a1d',
        '--term-bg': '#020f04',
        '--term-panel': '#051809',
        '--term-panel-light': '#0b2611',
        '--term-badge-bg': 'rgba(51, 255, 102, 0.12)',
        '--term-frame': '#081708',
      };
    case 'mono':
      return {
        '--term-main': '#f0f6fc',
        '--term-color': '#f0f6fc',
        '--term-glow': 'rgba(240, 246, 252, 0.3)',
        '--term-glow-low': 'rgba(240, 246, 252, 0.12)',
        '--term-dim': '#afb8c1',
        '--term-border': '#6e7681',
        '--term-border-dark': '#30363d',
        '--term-bg': '#0d1117',
        '--term-panel': '#161b22',
        '--term-panel-light': '#21262d',
        '--term-badge-bg': 'rgba(240, 246, 252, 0.12)',
        '--term-frame': '#141414',
      };
    case 'amber':
    default:
      return {
        '--term-main': '#ffb000',
        '--term-color': '#ffb000',
        '--term-glow': 'rgba(255, 176, 0, 0.4)',
        '--term-glow-low': 'rgba(255, 176, 0, 0.15)',
        '--term-dim': '#d99616',
        '--term-border': '#9e6b14',
        '--term-border-dark': '#4a320a',
        '--term-bg': '#0a0603',
        '--term-panel': '#120c06',
        '--term-panel-light': '#1a1208',
        '--term-badge-bg': 'rgba(255, 176, 0, 0.12)',
        '--term-frame': '#150f08',
      };
  }
}
