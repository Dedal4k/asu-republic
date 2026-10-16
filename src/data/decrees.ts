/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateDecree } from '../types';

export const INITIAL_DECREES: StateDecree[] = [
  {
    id: 'decree_coupons',
    title: '«Введение талонной системы распределения»',
    description: 'Нормированный отпуск ключевых товаров (сахар, масло, мыло, крупы, табачные изделия) по именным талонам и карточкам покупателя.',
    active: false,
    apCost: 1,
    monthlyImpact: {
      shelfSupplyPercent: 8,       // упорядочение распределения снижает панику
      rubleBudgetMillions: -5,     // печать и администрирование талонов
      tensionDelta: -4,            // люди уверены в гарантированном пайке
    },
  },
  {
    id: 'decree_free_prices',
    title: '«Легализация торговли кооперативов по свободным ценам»',
    description: 'Разрешение кооперативам и частным лицам продавать сельхозпродукцию и ширпотреб по рыночным договорным ценам на открытых рынках.',
    active: false,
    apCost: 1,
    monthlyImpact: {
      shelfSupplyPercent: 12,      // изобилие на рынках
      rubleBudgetMillions: 15,     // налоговые поступления от патентов
      tensionDelta: 6,             // недовольство пенсионеров и рабочих дороговизной
    },
  },
  {
    id: 'decree_curfew',
    title: '«Комендантский час и патрулирование городов силами ВВ»',
    description: 'Запрет ночного перемещения без спецпропусков, патрулирование улиц смешанными нарядами милиции и ВВ, оцепление стратегических объектов.',
    active: false,
    apCost: 1,
    monthlyImpact: {
      tensionDelta: -10,           // пресечение митингов и беспорядков
      rubleBudgetMillions: -10,    // расходы на снабжение и ГСМ подразделений
      moscowPlanFulfilled: 3,      // защита заводов от забастовочных пикетов
    },
  },
  {
    id: 'decree_food_embargo',
    title: '«Запрет на вывоз продовольствия за пределы республики»',
    description: 'Выставление таможенных постов на автотрассах и ж/д станциях. Вся продукция совхозов, мясокомбинатов и молокозаводов остается внутри региона.',
    active: false,
    apCost: 1,
    monthlyImpact: {
      shelfSupplyPercent: 15,      // резкое насыщение внутренних гастрономов
      moscowPlanFulfilled: -12,    // срыв союзных обязательств перед центром
      tensionDelta: -3,
    },
  },
  {
    id: 'decree_selffinancing',
    title: '«Введение хозрасчета на промышленных предприятиях»',
    description: 'Перевод шахт, комбинатов и заводов на полную самоокупаемость (модель №2). Предприятия оставляют себе до 40% валютной и рублевой выручки.',
    active: false,
    apCost: 1,
    monthlyImpact: {
      rubleBudgetMillions: 25,     // оживление деловой активности
      moscowPlanFulfilled: -8,     // отказ от жестких директив Госплана
      tensionDelta: -5,            // рабочие видят рост доходов
    },
  },
  {
    id: 'decree_stop_union_transfer',
    title: '«Приостановка союзных отчислений в Госплан»',
    description: 'Замораживание всех налоговых и валютных отчислений республиканских предприятий в общесоюзный бюджет СССР впредь до заключения нового Союзного договора.',
    active: false,
    apCost: 1,
    monthlyImpact: {
      rubleBudgetMillions: 50,     // все деньги остаются в республике
      hardCurrencyReserve: 2,      // валютная выручка не уходит в Москву
      moscowPlanFulfilled: -25,    // гнев союзного центра и Политбюро
      tensionDelta: 8,             // угроза союзных экономических санкций
    },
  },
];

export const createInitialDecrees = (): StateDecree[] => {
  return INITIAL_DECREES.map((d) => ({
    ...d,
    monthlyImpact: { ...d.monthlyImpact },
  }));
};
