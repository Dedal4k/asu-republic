/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InfrastructureNode } from '../types';

export const INITIAL_NODES: Record<string, InfrastructureNode> = {
  // ==========================================
  // СЕКТОР 1: СТОЛИЧНЫЙ ОКРУГ (capital)
  // ==========================================
  capital_tec3: {
    id: 'capital_tec3',
    name: 'ТЭЦ-3 Городская',
    sectorId: 'capital',
    type: 'power',
    status: 'operational',
    description: 'Главный источник тепла и электроэнергии правительственного квартала и жилых массивов. Критически зависит от поставок угля со станции "Угольная".',
    impact: {
      deficitDelta: 10,     // при сбое: рост дефицита +10%
      moscowPlanDelta: -10, // падение плана -10%
      tensionDelta: 12,     // рост напряженности +12%
    },
  },
  capital_distrib_base: {
    id: 'capital_distrib_base',
    name: 'Центральная распредбаза ГлавТорга',
    sectorId: 'capital',
    type: 'logistics',
    status: 'operational',
    description: 'Оптовые распределительные склады продовольствия, обуви и бытовой техники. Контролирует бесперебойное снабжение столичных универсамов.',
    impact: {
      deficitDelta: 15,
      moscowPlanDelta: -5,
      tensionDelta: 10,
    },
  },

  // ==========================================
  // СЕКТОР 2: ШАХТЕРСКИЙ БАССЕЙН (mines)
  // ==========================================
  mines_sorting_station: {
    id: 'mines_sorting_station',
    name: 'Сортировочная станция "Угольная"',
    sectorId: 'mines',
    type: 'logistics',
    status: 'operational',
    description: 'Крупнейший железнодорожный узел бассейна. Перекрытие путей бастующими шахтерами блокирует подачу угля на ТЭЦ-3 и эшелоны в центр страны.',
    impact: {
      deficitDelta: 15,
      moscowPlanDelta: -20,
      tensionDelta: 15,
    },
  },
  mines_kapitalnaya: {
    id: 'mines_kapitalnaya',
    name: 'Шахта "Капитальная-Глубокая"',
    sectorId: 'mines',
    type: 'production',
    status: 'operational',
    description: 'Крупнейший добывающий флагман бассейна (коксующийся уголь высшего сорта для союзных металлургических комбинатов Урала).',
    impact: {
      deficitDelta: 5,
      moscowPlanDelta: -25,
      tensionDelta: 12,
    },
  },

  // ==========================================
  // СЕКТОР 3: АГРАРНЫЙ ПОЯС (agrarian)
  // ==========================================
  agrarian_elevator_4: {
    id: 'agrarian_elevator_4',
    name: 'Элеваторный комплекс №4',
    sectorId: 'agrarian',
    type: 'logistics',
    status: 'operational',
    description: 'Хранилище государственного зернового резерва республики на 450 тыс. тонн. Срыв отгрузок мгновенно опустошает хлебозаводы.',
    impact: {
      deficitDelta: 20,
      moscowPlanDelta: -10,
      tensionDelta: 8,
    },
  },
  agrarian_feed_mill: {
    id: 'agrarian_feed_mill',
    name: 'Комбикормовый комбинат',
    sectorId: 'agrarian',
    type: 'production',
    status: 'operational',
    description: 'Обеспечивает комбикормами птицефабрики и животноводческие комплексы. Остановка ведет к забою скота и дефициту молока.',
    impact: {
      deficitDelta: 10,
      moscowPlanDelta: -5,
      tensionDelta: 6,
    },
  },

  // ==========================================
  // СЕКТОР 4: ОСОБАЯ АВТОНОМИЯ (autonomy)
  // ==========================================
  autonomy_garrison_arsenal: {
    id: 'autonomy_garrison_arsenal',
    name: 'Гарнизонный арсенал 144-й МСД',
    sectorId: 'autonomy',
    type: 'garrison',
    status: 'operational',
    description: 'Склады стрелкового оружия, боеприпасов и бронетехники Советской Армии. Риск осады радикальными военизированными формированиями.',
    impact: {
      deficitDelta: 5,
      moscowPlanDelta: -15,
      tensionDelta: 25,
    },
  },
  autonomy_customs_terminal: {
    id: 'autonomy_customs_terminal',
    name: 'Таможенный терминал / Перевал',
    sectorId: 'autonomy',
    type: 'logistics',
    status: 'operational',
    description: 'Горный автомобильный терминал на границе. Главная артерия для поступления импортного ширпотреба и пополнения валютного резерва.',
    impact: {
      deficitDelta: 12,
      moscowPlanDelta: -5,
      tensionDelta: 14,
    },
  },
};

export const createInitialNodes = (): Record<string, InfrastructureNode> => {
  const result: Record<string, InfrastructureNode> = {};
  for (const [key, node] of Object.entries(INITIAL_NODES)) {
    result[key] = {
      ...node,
      impact: { ...node.impact },
    };
  }
  return result;
};
