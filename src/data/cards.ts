/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card } from '../types';

export const GAME_CARDS: Card[] = [
  // ==========================================================
  // АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ (Октябрь 1989 — Март 1990)
  // ==========================================================
  {
    id: 'act1_tobacco_riot',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ЗАВ. ОТДЕЛОМ ТОРГОВЛИ И СНАБЖЕНИЯ ЦК',
    archetype: 'crisis_deficit',
    region: 'capital',
    text: 'В СТОЛИЦЕ ВСПЫХНУЛ ТАБАЧНЫЙ БУНТ! ОЧЕРЕДИ ПЕРЕКРЫЛИ ПРОСПЕКТ, ОПРОКИНУТЫ ТРОЛЛЕЙБУСЫ. ТРЕБУЮТ РАСПЕЧАТАТЬ СКЛАДЫ НЕПРИКОСНОВЕННОГО РЕЗЕРВА ЛИБО СРОЧНО ЗАКУПИТЬ ИМПОРТ ЗА ВАЛЮТУ.',
    leftChoice: {
      label: 'ОТКРЫТЬ ГОСРЕЗЕРВ',
      stats: { moscow: -6, people: 9, economy: -8, kgb: 5 },
      profile: { market: 8, autocracy: -6 },
      decreeBadge: 'РЕЗЕРВ-ТАБАК',
      effectNote: 'Толпа успокоилась, но резервы исчерпаны'
    },
    rightChoice: {
      label: 'ВЫСТАВИТЬ МИЛИЦИЮ',
      stats: { moscow: 6, people: -9, economy: 5, kgb: 8 },
      profile: { autocracy: 10 },
      effectNote: 'Проспект разблокирован силой, растет злоба'
    },
    daysElapsed: 20,
    isCrisis: true
  },
  {
    id: 'act1_miner_strike',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ПРЕДСЕДАТЕЛЬ СТАЧКОМА СТЕПАН КОВАЛЬ',
    archetype: 'miner',
    region: 'miners',
    text: 'МЫ ПОДНЯЛИСЬ НА-ГОРА И НЕ СПУСТИМСЯ В ЗАБОЙ! ТРЕБУЕМ МЫЛО В ДУШЕВЫЕ, 40-ЧАСОВУЮ НЕДЕЛЮ И ПРЯМУЮ ВЫПЛАТУ ВАЛЮТЫ ЗА АНТРАЦИТ. ВЫ С НАМИ ИЛИ С МОСКОВСКИМИ ЧИНОВНИКАМИ?',
    leftChoice: {
      label: 'УДОВЛЕТВОРИТЬ СТАЧКОМ',
      stats: { moscow: -7, people: 8, economy: -6, kgb: -4 },
      profile: { sovereignty: 10, autocracy: -8 },
      decreeBadge: 'ЛЬГОТЫ-ШАХТА',
      effectNote: 'Коваль жмет руку, забой работает, Москва шлет выговор'
    },
    rightChoice: {
      label: 'ОБЪЯВИТЬ САБОТАЖЕМ',
      stats: { moscow: 7, people: -9, economy: 5, kgb: 8 },
      profile: { autocracy: 12 },
      effectNote: 'Коваль уходит в подполье, растет ненависть к ЦК'
    },
    setFlagsOnLeft: ['koval_ally'],
    setFlagsOnRight: ['koval_enemy'],
    daysElapsed: 22
  },
  {
    id: 'act1_voronov_secret_channel',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ПОЛКОВНИК КГБ АЛЕКСЕЙ ВОРОНОВ',
    archetype: 'kgb_general',
    region: 'capital',
    text: 'В АППАРАТЕ ЦК ЗРЕЕТ ЗАГОВОР СТОРОННИКОВ ЛУБЯНКИ. ПРЕДЛАГАЮ СОЗДАТЬ СЕКРЕТНЫЙ КАНАЛ СВЯЗИ ЛИЧНО ДЛЯ ВАС В ОБХОД СТОЛИЧНОГО ИНСПЕКТОРА. ВЫ ГОТОВЫ ОПЕРЕТЬСЯ НА МОИ КАДРЫ?',
    leftChoice: {
      label: 'ОПЕРЕТЬСЯ НА ВОРОНОВА',
      stats: { kgb: 7, moscow: -6, people: -4, economy: 4 },
      profile: { autocracy: 8 },
      effectNote: 'Воронов становится вашим доверенным офицером'
    },
    rightChoice: {
      label: 'НЕ ДОВЕРЯТЬ ЧЕКИСТУ',
      stats: { kgb: -7, people: 6, moscow: 5, economy: 0 },
      profile: { autocracy: -6 },
      effectNote: 'Вы осадили полковника. Воронов берет вас в разработку'
    },
    setFlagsOnLeft: ['voronov_ally'],
    setFlagsOnRight: ['voronov_enemy'],
    daysElapsed: 20
  },
  {
    id: 'act1_samizdat_newspaper',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ПУБЛИЦИСТ НАРОДНОГО ФРОНТА ЛЕВ МИРСКИЙ',
    archetype: 'popular_front',
    region: 'capital',
    text: 'НАША САМИЗДАТОВСКАЯ ГАЗЕТА «ВОЗРОЖДЕНИЕ» РАЗОБЛАЧАЕТ СПЕЦРАСПРЕДЕЛИТЕЛИ НОМЕНКЛАТУРЫ И ТРЕБУЕТ ГЛАСНОСТИ. ВЫ АРЕСТУЕТЕ ТИРАЖ ИЛИ РАЗРЕШИТЕ НАМ ПЕЧАТАТЬСЯ ЛЕГАЛЬНО?',
    leftChoice: {
      label: 'АРЕСТОВАТЬ МИРСКОГО',
      stats: { moscow: 6, people: -8, kgb: 8, economy: 0 },
      profile: { autocracy: 12 },
      effectNote: 'Мирский в СИЗО, площадь бурлит и скандирует его имя'
    },
    rightChoice: {
      label: 'РАЗРЕШИТЬ ПЕЧАТЬ',
      stats: { moscow: -7, people: 8, kgb: -7, economy: 4 },
      profile: { autocracy: -10, sovereignty: 6 },
      decreeBadge: 'СВОБОДА-ПЕЧАТИ',
      effectNote: 'Мирский благодарит ЦК, гласность расширяется'
    },
    setFlagsOnLeft: ['mirsky_arrested'],
    setFlagsOnRight: ['mirsky_freed'],
    daysElapsed: 22
  },
  {
    id: 'act1_eco_rally',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ЛИДЕР ДВИЖЕНИЯ «ЗЕЛЕНЫЙ ЛУЧ»',
    archetype: 'popular_front',
    region: 'agrarian',
    text: 'ВЫБРОСЫ ХИМКОМБИНАТА «АЗОТ» ОТРАВЛЯЮТ ГЛАВНУЮ РЕКУ! У ПРОХОДНОЙ СОБРАЛОСЬ 40 ТЫСЯЧ ГОРОЖАН. ТРЕБУЕМ НЕМЕДЛЕННО ОСТАНОВИТЬ ЦЕХ КАРБАМИДА ДО НЕЗАВИСИМОЙ ЭКСПЕРТИЗЫ!',
    leftChoice: {
      label: 'ОСТАНОВИТЬ ПРОИЗВОДСТВО',
      stats: { moscow: -5, people: 8, economy: -8, kgb: -4 },
      profile: { sovereignty: 6, market: -6 },
      decreeBadge: 'ЭКО-КОНТРОЛЬ',
      effectNote: 'Горожане ликуют, план союзного Минхимпрома сорван'
    },
    rightChoice: {
      label: 'ПРОДОЛЖИТЬ ВЫПУСК',
      stats: { moscow: 6, people: -7, economy: 8, kgb: 4 },
      profile: { autocracy: 6 },
      effectNote: 'Экологи угрожают палаточным городком протеста'
    },
    daysElapsed: 20
  },
  {
    id: 'act1_article_six',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ВТОРОЙ СЕКРЕТАРЬ ЦК (КУРАТОР ИЗ МОСКВЫ)',
    archetype: 'moscow_inspector',
    region: 'capital',
    text: 'ДЕПУТАТЫ ВАШЕГО ВЕРХОВНОГО СОВЕТА НАМЕРЕНЫ ПОСТАВИТЬ НА ГОЛОСОВАНИЕ ОТМЕНУ 6-Й СТАТЬИ КОНСТИТУЦИИ О РУКОВОДЯЩЕЙ РОЛИ ПАРТИИ! ПОЛИТБЮРО ТРЕБУЕТ СНЯТЬ ВОПРОС С ПОВЕСТКИ.',
    leftChoice: {
      label: 'ПОДЧИНИТЬСЯ МОСКВЕ',
      stats: { moscow: 8, people: -8, kgb: 5, economy: 0 },
      profile: { sovereignty: -10, autocracy: 10 },
      effectNote: 'Москва довольна, на площади скандируют «Долой КПСС!»'
    },
    rightChoice: {
      label: 'ДОПУСТИТЬ ПЛЮРАЛИЗМ',
      stats: { moscow: -9, people: 9, kgb: -6, economy: 0 },
      profile: { sovereignty: 12, autocracy: -12 },
      decreeBadge: 'ОТМЕНА-СТ6',
      effectNote: 'Исторический шаг: компартия теряет монополию'
    },
    daysElapsed: 24
  },
  {
    id: 'act1_sugar_coupons',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ПРЕДСЕДАТЕЛЬ ГОСПЛАНА РЕСПУБЛИКИ',
    archetype: 'party_boss',
    region: 'agrarian',
    text: 'САХАР, ПОРОШОК И СЛИВОЧНОЕ МАСЛО ИСЧЕЗЛИ С ПРИЛАВКОВ. СПЕКУЛЯНТЫ ВЫВОЗЯТ ТОВАРЫ В СОСЕДНИЕ ОБЛАСТИ. ПРЕДЛАГАЮ ВВЕСТИ КАРТОЧНУЮ СИСТЕМУ И ВИЗИТНЫЕ КАРТОЧКИ ПОКУПАТЕЛЯ.',
    leftChoice: {
      label: 'ВВЕСТИ ТАЛОННУЮ СИСТЕМУ',
      stats: { moscow: 4, people: -5, economy: 7, kgb: 4 },
      profile: { market: -10 },
      decreeBadge: 'ТАЛОНЫ-89',
      effectNote: 'Установлен жесткий учет, но в магазинах серый быт'
    },
    rightChoice: {
      label: 'ОТПУСТИТЬ ЦЕНЫ В КООПЕРАТИВАХ',
      stats: { moscow: -5, people: -6, economy: 8, kgb: -4 },
      profile: { market: 14 },
      decreeBadge: 'КООП-ТОРГ',
      effectNote: 'Товары появились по тройным ценам, люди ропщут'
    },
    daysElapsed: 22
  },
  {
    id: 'act1_video_salon',
    act: 1,
    actTitle: 'АКТ I: ИСПЫТАНИЕ ГЛАСНОСТЬЮ',
    senderTitle: 'ПРЕДСЕДАТЕЛЬ СОЮЗА КООПЕРАТОРОВ',
    archetype: 'cooperator',
    region: 'autonomy',
    text: 'МЫ ОТКРЫВАЕМ СЕТЬ КООПЕРАТИВНЫХ КАФЕ, АТЕЛЬЕ И ВИДЕОСАЛОНОВ. ОБХСС И ИНСПЕКТОРЫ ОБЛАГАЮТ НАС 65% ПОБОРАМИ! ДАЙТЕ НАМ НАЛОГОВЫЕ ЛЬГОТЫ, И МЫ ЗАВАЛИМ РЫНОК ТОВАРАМИ.',
    leftChoice: {
      label: 'СНИЗИТЬ НАЛОГ КООПЕРАТИВАМ',
      stats: { moscow: -5, people: 6, economy: 8, kgb: -5 },
      profile: { market: 14, autocracy: -5 },
      decreeBadge: 'ЛЬГОТЫ-КООП',
      effectNote: 'Расцвет малого бизнеса, комсомольцы открывают кафе'
    },
    rightChoice: {
      label: 'УСИЛИТЬ РЕЙДЫ ОБХСС',
      stats: { moscow: 5, people: -6, economy: -7, kgb: 7 },
      profile: { market: -10, autocracy: 8 },
      effectNote: 'Цеховики уходят в глубокое подполье'
    },
    daysElapsed: 22
  },

  // ==========================================================
  // АКТ II: ПАРАД СУВЕРЕНИТЕТОВ (Апрель 1990 — Февраль 1991)
  // ==========================================================
  {
    id: 'act2_koval_coal_aid',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'СТЕПАН КОВАЛЬ, ШАХТЕРСКИЙ СТАЧКОМ',
    archetype: 'miner',
    region: 'miners',
    text: 'МОСКВА УРЕЗАЛА ФОНДЫ ТОПЛИВА ДЛЯ НАШИХ ЗАВОДОВ. В ЗНАК БЛАГОДАРНОСТИ ЗА ВАШЕ ДОВЕРИЕ МЫ ДАЕМ 3 ЭШЕЛОНА УГЛЯ В РЕСПУБЛИКАНСКИЙ ФОНД ВНЕ ПЛАНА СОЮЗНОГО МИНИСТЕРСТВА!',
    leftChoice: {
      label: 'ПРИНЯТЬ ЭШЕЛОНЫ УГЛЯ',
      stats: { economy: 7, people: 6, moscow: -6, kgb: 0 },
      profile: { sovereignty: 12 },
      effectNote: 'Коваль спас заводы от остановки, Москва шлет ноту'
    },
    rightChoice: {
      label: 'ОТКЛОНИТЬ (ЖДАТЬ МОСКВУ)',
      stats: { moscow: 6, economy: -7, people: -5, kgb: 4 },
      profile: { sovereignty: -8 },
      effectNote: 'Шахтеры разочарованы вашей нерешительностью'
    },
    requiredFlags: ['koval_ally'],
    bannedFlags: ['koval_enemy'],
    setFlagsOnLeft: ['koval_solidarity'],
    daysElapsed: 22
  },
  {
    id: 'act2_koval_blockade',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'СТЕПАН КОВАЛЬ, ПОДПОЛЬНЫЙ СТАЧКОМ',
    archetype: 'miner',
    region: 'miners',
    text: 'ВЫ ОТКАЗАЛИ НАМ В МЫЛЕ И ХЛЕБЕ. ШАХТЫ ОБЪЯВИЛИ СТАЧКУ, ПУТИ К МЕТАЛЛУРГИЧЕСКОМУ КОМБИНАТУ ЗАБЛОКИРОВАНЫ. ПЕЧИ ВОТ-ВОТ ОСТЫНУТ! ТРЕБУЕМ ПРЯМЫХ ПЕРЕГОВОРОВ!',
    leftChoice: {
      label: 'ПОЙТИ НА ПЕРЕГОВОРЫ',
      stats: { economy: -6, people: 6, moscow: -6, kgb: -4 },
      profile: { autocracy: -8, sovereignty: 6 },
      effectNote: 'Стачка приостановлена, Коваль добился уступок'
    },
    rightChoice: {
      label: 'ВВЕСТИ ОМОН И РАЗОГНАТЬ',
      stats: { kgb: 8, people: -9, economy: -7, moscow: 6 },
      profile: { autocracy: 14 },
      effectNote: 'Столкновения на путях, шахтеры уходят в радикалы'
    },
    requiredFlags: ['koval_enemy'],
    bannedFlags: ['koval_ally'],
    setFlagsOnLeft: ['koval_truce'],
    setFlagsOnRight: ['koval_radicalized'],
    daysElapsed: 22
  },
  {
    id: 'act2_voronov_moscow_leak',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'ПОЛКОВНИК КГБ АЛЕКСЕЙ ВОРОНОВ',
    archetype: 'kgb_general',
    region: 'capital',
    text: 'ШИФРОВКА С ЛУБЯНКИ: КРЮЧКОВ ГОТОВИТ ТАЙНУЮ РЕВИЗИЮ ДЛЯ ПОИСКА КОМПРОМАТА НА ВАС И ПАРТАППАРАТ. Я МОГУ ПЕРЕХВАТИТЬ ДОКУМЕНТЫ РЕВИЗОРОВ ДО ИХ ОТПРАВКИ В КРЕМЛЬ.',
    leftChoice: {
      label: 'ПЕРЕХВАТИТЬ МАТЕРИАЛЫ',
      stats: { kgb: 7, moscow: -7, economy: 5, people: 4 },
      profile: { autocracy: 8, sovereignty: 8 },
      effectNote: 'Компромат уничтожен, Воронов доказал преданность'
    },
    rightChoice: {
      label: 'НЕ ВМЕШИВАТЬСЯ В РЕВИЗИЮ',
      stats: { moscow: 6, kgb: -6, people: -5, economy: -4 },
      profile: { sovereignty: -8 },
      effectNote: 'Ревизоры копают под вас, Воронов удивлен слабостью'
    },
    requiredFlags: ['voronov_ally'],
    bannedFlags: ['voronov_enemy'],
    setFlagsOnLeft: ['voronov_shield'],
    daysElapsed: 20
  },
  {
    id: 'act2_voronov_wiretap',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'НАЧАЛЬНИК ОХРАНЫ ПРАВИТЕЛЬСТВА',
    archetype: 'kgb_general',
    region: 'capital',
    text: 'В ВАШЕМ КАБИНЕТЕ И СПЕЦАВТОМОБИЛЕ ОБНАРУЖЕНЫ МИКРОФОНЫ! ЗА ПРОСЛУШКОЙ СТОИТ ПОЛКОВНИК ВОРОНОВ, ДЕЙСТВУЮЩИЙ ПО ЗАДАНИЮ 2-ГО ГЛАВНОГО УПРАВЛЕНИЯ КГБ СССР.',
    leftChoice: {
      label: 'ПУБЛИЧНО УВОЛИТЬ ВОРОНОВА',
      stats: { people: 7, kgb: -8, moscow: -6, economy: 0 },
      profile: { autocracy: -8, sovereignty: 10 },
      effectNote: 'Воронов с позором изгнан, но готовит месть'
    },
    rightChoice: {
      label: 'ЗАПУСТИТЬ ДЕЗИНФОРМАЦИЮ',
      stats: { kgb: 6, moscow: -4, economy: 4, people: -5 },
      profile: { autocracy: 8 },
      effectNote: 'Вы водите чекистов за нос, но заговор зреет'
    },
    requiredFlags: ['voronov_enemy'],
    bannedFlags: ['voronov_ally'],
    setFlagsOnLeft: ['voronov_disgraced'],
    setFlagsOnRight: ['voronov_plot'],
    daysElapsed: 20
  },
  {
    id: 'act2_mirsky_press_support',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'РЕДАКТОР ГАЗЕТЫ ЛЕВ МИРСКИЙ',
    archetype: 'popular_front',
    region: 'capital',
    text: 'МОСКВА РАЗВЕРНУЛА КАМПАНИЮ ТРАВЛИ РЕСПУБЛИКИ В ПРОГРАММЕ «ВРЕМЯ». МОЯ РЕДАКЦИЯ ГОТОВА ВЫПУСТИТЬ СПЕЦВЫПУСК В ЗАЩИТУ НАШЕГО СУВЕРЕНИТЕТА, НО ГОСКОМПЕЧАТЬ ГРОЗИТ ЗАКРЫТЬ ТИПОГРАФИЮ!',
    leftChoice: {
      label: 'ОТСТОЯТЬ ТИПОГРАФИЮ МИРСКОГО',
      stats: { people: 8, moscow: -8, economy: 4, kgb: -5 },
      profile: { sovereignty: 14, autocracy: -6 },
      effectNote: 'Мирский мобилизует прессу в вашу защиту'
    },
    rightChoice: {
      label: 'ПРИОСТАНОВИТЬ СПЕЦВЫПУСК',
      stats: { moscow: 7, people: -7, economy: -4, kgb: 5 },
      profile: { sovereignty: -8 },
      effectNote: 'Пресса обвиняет руководство ЦК в трусости'
    },
    requiredFlags: ['mirsky_freed'],
    bannedFlags: ['mirsky_arrested'],
    setFlagsOnLeft: ['mirsky_voice_of_republic'],
    daysElapsed: 22
  },
  {
    id: 'act2_mirsky_hunger_strike',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'КОМИТЕТ В ЗАЩИТУ ПОЛИТЗЕКА МИРСКОГО',
    archetype: 'popular_front',
    region: 'capital',
    text: 'ЛЕВ МИРСКИЙ ДЕРЖИТ СУХУЮ ГОЛОДОВКУ В СИЗО УЖЕ 18-Й ДЕНЬ! СТУДЕНТЫ РАЗБИЛИ ПАЛАТОЧНЫЙ ГОРОДОК НА ПЛОЩАДИ, ТРЕБУЯ ЕГО ОСВОБОЖДЕНИЯ. СИТУАЦИЯ НА ГРАНИ ВЗРЫВА!',
    leftChoice: {
      label: 'ПОМИЛОВАТЬ И ВЫПУСТИТЬ',
      stats: { people: 8, kgb: -7, moscow: -5, economy: 0 },
      profile: { autocracy: -10, sovereignty: 6 },
      effectNote: 'Мирский выходит кумиром толпы, КГБ недоволен'
    },
    rightChoice: {
      label: 'ОСТАВИТЬ ПОД СТРАЖЕЙ',
      stats: { kgb: 8, people: -9, moscow: 5, economy: -4 },
      profile: { autocracy: 12 },
      effectNote: 'Мирский становится мучеником, площадь кипит'
    },
    requiredFlags: ['mirsky_arrested'],
    bannedFlags: ['mirsky_freed'],
    setFlagsOnLeft: ['mirsky_released_martyr'],
    setFlagsOnRight: ['mirsky_martyr'],
    daysElapsed: 22
  },
  {
    id: 'act2_state_language',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'ПРЕДСЕДАТЕЛЬ ВЕРХОВНОГО СОВЕТА',
    archetype: 'popular_front',
    region: 'autonomy',
    text: 'СЕССИЯ ГОТОВА ПРИНЯТЬ ЗАКОН О ГОСУДАРСТВЕННОМ ЯЗЫКЕ! ДИРЕКТОРАТ ЗАВОДОВ УГРОЖАЕТ СТАЧКОЙ, А НАРОДНЫЙ ФРОНТ ПРИВЕЛ ПОД ОКНА 50 ТЫСЯЧ СТОРОННИКОВ.',
    leftChoice: {
      label: 'УТВЕРДИТЬ ГОСЯЗЫК',
      stats: { moscow: -8, people: 9, economy: -5, kgb: -5 },
      profile: { sovereignty: 16, autocracy: -5 },
      decreeBadge: 'ГОС-ЯЗЫК',
      effectNote: 'Население торжествует, союзные заводы волнуются'
    },
    rightChoice: {
      label: 'ОСТАВИТЬ ДВУЯЗЫЧИЕ',
      stats: { moscow: 8, people: -8, economy: 5, kgb: 4 },
      profile: { sovereignty: -12 },
      effectNote: 'Народный фронт обвиняет ЦК в предательстве'
    },
    daysElapsed: 22
  },
  {
    id: 'act2_declaration_sovereignty',
    act: 2,
    actTitle: 'АКТ II: ПАРАД СУВЕРЕНИТЕТОВ',
    senderTitle: 'ПРЕЗИДИУМ ВЕРХОВНОГО СОВЕТА',
    archetype: 'popular_front',
    region: 'capital',
    text: 'РОССИЯ И ДРУГИЕ РЕСПУБЛИКИ УЖЕ ПРИНЯЛИ СУВЕРЕНИТЕТ. ПАРЛАМЕНТ ТРЕБУЕТ ОБЪЯВИТЬ ВЕРХОВЕНСТВО ЗАКОНОВ РЕСПУБЛИКИ НАД СОЮЗНЫМИ И СОБСТВЕННОСТЬ НА НЕДРА.',
    leftChoice: {
      label: 'ПРИНЯТЬ ДЕКЛАРАЦИЮ',
      stats: { moscow: -10, people: 10, economy: 5, kgb: -6 },
      profile: { sovereignty: 22, autocracy: -5 },
      decreeBadge: 'СУВЕРЕНИТЕТ',
      effectNote: 'Митинг победы! Кремль шлет грозную ноту протеста'
    },
    rightChoice: {
      label: 'ВЕТИРОВАТЬ ДЕКЛАРАЦИЮ',
      stats: { moscow: 9, people: -10, economy: -4, kgb: 6 },
      profile: { sovereignty: -18, autocracy: 10 },
      effectNote: 'Штурм кордонов, депутаты объявляют недоверие ЦК'
    },
    daysElapsed: 28,
    isCrisis: true
  },

  // ==========================================================
  // АКТ III: РАЗЛОМ ИМПЕРИИ (Март 1991 — Август 1991)
  // ==========================================================
  {
    id: 'act3_voronov_coup_warning',
    act: 3,
    actTitle: 'АКТ III: РАЗЛОМ ИМПЕРИИ',
    senderTitle: 'ПОЛКОВНИК КГБ АЛЕКСЕЙ ВОРОНОВ',
    archetype: 'kgb_general',
    region: 'capital',
    text: 'ШИФРОВКА: МОСКВА ГОТОВИТ ВВЕДЕНИЕ ЧРЕЗВЫЧАЙНОГО ПОЛОЖЕНИЯ! Я ЗАБЛОКИРОВАЛ СВЯЗЬ ЛУБЯНКИ С НАШИМ ГАРНИЗОНОМ. ЧЕКИСТЫ ГОТОВЫ ЗАЩИТИТЬ ЗДАНИЕ ЦК ОТ АРЕСТА!',
    leftChoice: {
      label: 'ПРИКАЗАТЬ ЗАНЯТЬ ОБОРОНУ',
      stats: { kgb: 8, people: 8, moscow: -8, economy: 0 },
      profile: { sovereignty: 16, autocracy: 8 },
      decreeBadge: 'ЩИТ-РЕСПУБЛИКИ',
      effectNote: 'Воронов взял периметр, спецназ Москвы отступает'
    },
    rightChoice: {
      label: 'СОБЛЮДАТЬ НЕЙТРАЛИТЕТ',
      stats: { moscow: 6, people: -6, kgb: -5, economy: 4 },
      profile: { autocracy: 5 },
      effectNote: 'Воронов разочарован вашей нерешительностью'
    },
    requiredFlags: ['voronov_ally'],
    setFlagsOnLeft: ['voronov_loyal_guard'],
    daysElapsed: 20
  },
  {
    id: 'act3_referendum_1991',
    act: 3,
    actTitle: 'АКТ III: РАЗЛОМ ИМПЕРИИ',
    senderTitle: 'ПРЕДСЕДАТЕЛЬ ЦЕНТРАЛЬНОЙ ИЗБИРАТЕЛЬНОЙ КОМИССИИ',
    archetype: 'party_boss',
    region: 'autonomy',
    text: '17 МАРТА 1991 ГОДА: РЕФЕРЕНДУМ О СОХРАНЕНИИ СССР. МОСКВА ТРЕБУЕТ ГОЛОСОВАТЬ ТОЛЬКО ПО СОЮЗНОМУ ВОПРОСУ. ВЕРХОВНЫЙ СОВЕТ ТРЕБУЕТ СВОЙ БЮЛЛЕТЕНЬ О СУВЕРЕНИТЕТЕ!',
    leftChoice: {
      label: 'ДОБАВИТЬ СВОЙ БЮЛЛЕТЕНЬ',
      stats: { moscow: -8, people: 9, kgb: -6, economy: 0 },
      profile: { sovereignty: 20, autocracy: -6 },
      decreeBadge: 'РЕФЕРЕНДУМ-91',
      effectNote: '92% граждан поддержали независимость республики'
    },
    rightChoice: {
      label: 'ПРОВЕСТИ ТОЛЬКО СОЮЗНЫЙ',
      stats: { moscow: 8, people: -8, kgb: 6, economy: 0 },
      profile: { sovereignty: -16, autocracy: 8 },
      effectNote: 'Оппозиция бойкотирует голосование, Москва хвалит'
    },
    daysElapsed: 24
  },
  {
    id: 'act3_pavlov_reform',
    act: 3,
    actTitle: 'АКТ III: РАЗЛОМ ИМПЕРИИ',
    senderTitle: 'УПРАВЛЯЮЩИЙ ОТДЕЛЕНИЕМ ГОСБАНКА',
    archetype: 'factory_director',
    region: 'miners',
    text: 'ПРЕМЬЕР ПАВЛОВ ОБЪЯВИЛ ИЗЪЯТИЕ 50 И 100-РУБЛЕВЫХ КУПЮР ЗА 3 ДНЯ! СБЕРКАССЫ БЕРУТ ШТУРМОМ, ЛЮДИ ТЕРЯЮТ НАКОПЛЕНИЯ. МЫ МОЖЕМ ПРОДЛИТЬ СРОКИ ОБМЕНА СВОИМ УКАЗОМ.',
    leftChoice: {
      label: 'ПРОДЛИТЬ ОБМЕН ДЕНЕГ',
      stats: { moscow: -8, people: 9, economy: -6, kgb: -5 },
      profile: { sovereignty: 14, autocracy: -5 },
      decreeBadge: 'ЗАЩИТА-ВКЛАДОВ',
      effectNote: 'Люди спасли сбережения, Минфин СССР грозит судом'
    },
    rightChoice: {
      label: 'ИСПОЛНИТЬ ПРИКАЗ ПАВЛОВА',
      stats: { moscow: 7, people: -10, economy: 6, kgb: 5 },
      profile: { sovereignty: -10, autocracy: 8 },
      effectNote: 'Деньги сгорели, старики плачут у закрытых касс'
    },
    daysElapsed: 20,
    isCrisis: true
  },
  {
    id: 'act3_gkchp_day1_morning',
    act: 3,
    actTitle: 'АКТ III: РАЗЛОМ ИМПЕРИИ',
    senderTitle: 'ШИФРОВКА КГБ СССР — ПРЯМОЙ ПРОВОД ВЧ',
    archetype: 'crisis_tank',
    region: 'capital',
    text: '19 АВГУСТА, 06:00. ПО ТВ — «ЛЕБЕДИНОЕ ОЗЕРО». СООБЩЕНИЕ ГКЧП: ГОРБАЧЕВ ОТСТРАНЕН. ВЛАСТЬ ПЕРЕШЛА К КОМИТЕТУ (ЯНАЕВ, КРЮЧКОВ, ЯЗОВ). ВАМ ПРИКАЗАНО ВВЕСТИ ЧП В РЕСПУБЛИКЕ!',
    leftChoice: {
      label: 'ОБЪЯВИТЬ РЕЖИМ ЧП ГКЧП',
      stats: { moscow: 10, people: -10, kgb: 9, economy: -5 },
      profile: { autocracy: 22, sovereignty: -20 },
      decreeBadge: 'РЕЖИМ-ГКЧП',
      effectNote: 'Вы поддержали путчистов! Города замерли в шоке'
    },
    rightChoice: {
      label: 'ОТКАЗАТЬСЯ ВВОДИТЬ ЧП',
      stats: { moscow: -10, people: 10, kgb: -9, economy: 4 },
      profile: { sovereignty: 22, autocracy: -16 },
      decreeBadge: 'ОТПОР-ГКЧП',
      effectNote: 'Вы открыто бросили вызов хунте! Народ на улицах'
    },
    daysElapsed: 12,
    isCrisis: true,
    isGkchp: true
  },
  {
    id: 'act3_gkchp_day1_afternoon',
    act: 3,
    actTitle: 'АКТ III: РАЗЛОМ ИМПЕРИИ',
    senderTitle: 'КОМАНДУЮЩИЙ ВОЕННЫМ ОКРУГОМ ГЕНЕРАЛ',
    archetype: 'kgb_general',
    region: 'capital',
    text: '19 АВГУСТА, 14:00. ТАНКИ ВЫШЛИ ИЗ КАЗАРМ К ЦЕНТРУ СТОЛИЦЫ. ПЕРЕД ЦК СОБРАЛОСЬ 80 ТЫСЯЧ БЕЗОРУЖНЫХ ЛЮДЕЙ, СТРОЯТ БАРРИКАДЫ. ВАШ ПРИКАЗ: РАЗОГНАТЬ ИЛИ ВЕРНУТЬ БРОНЮ В ЧАСТИ?',
    leftChoice: {
      label: 'ПРИКАЗАТЬ ТАНКАМ УЙТИ',
      stats: { moscow: -9, people: 10, kgb: -8, economy: 0 },
      profile: { sovereignty: 20, autocracy: -18 },
      effectNote: 'Танки развернулись! Площадь ликует'
    },
    rightChoice: {
      label: 'РАЗОГНАТЬ МИТИНГ БРОНЕЙ',
      stats: { moscow: 9, people: -11, kgb: 9, economy: -6 },
      profile: { autocracy: 24, sovereignty: -18 },
      effectNote: 'Трагедия на баррикадах. Народ не простит крови'
    },
    daysElapsed: 12,
    isCrisis: true,
    isGkchp: true
  },
  {
    id: 'act3_gkchp_day2_yeltsin',
    act: 3,
    actTitle: 'АКТ III: РАЗЛОМ ИМПЕРИИ',
    senderTitle: 'ВЧ-ТЕЛЕГРАММА ИЗ БЕЛОГО ДОМА (ЕЛЬЦИН)',
    archetype: 'yeltsin',
    region: 'capital',
    text: '19 АВГУСТА. ЕЛЬЦИН С БРОНИ ТАНКА: "ДЕЙСТВИЯ ГКЧП — ГОСУДАРСТВЕННЫЙ ПЕРЕВОРОТ! ПРИЗЫВАЮ РУКОВОДСТВО РЕСПУБЛИК К БЕССРОЧНОЙ СТАЧКЕ И НЕПОДЧИНЕНИЮ ХУНТЕ!"',
    leftChoice: {
      label: 'ПРИСОЕДИНИТЬСЯ К ЕЛЬЦИНУ',
      stats: { moscow: -8, people: 9, kgb: -6, economy: -4 },
      profile: { sovereignty: 18, autocracy: -14 },
      decreeBadge: 'СОЮЗ-С-ЕЛЬЦИНЫМ',
      effectNote: 'Единый фронт сопротивления путчу сформирован'
    },
    rightChoice: {
      label: 'ВЫЖИДАТЬ В НЕЙТРАЛИТЕТЕ',
      stats: { moscow: 5, people: -7, kgb: 5, economy: 4 },
      profile: { autocracy: 8 },
      effectNote: 'Ваша осторожность выглядит трусостью для всех'
    },
    daysElapsed: 12,
    isCrisis: true,
    isGkchp: true
  },
  {
    id: 'act3_gkchp_day3_collapse',
    act: 3,
    actTitle: 'АКТ III: РАЗЛОМ ИМПЕРИИ',
    senderTitle: 'ЭКСТРЕННЫЙ ВЫПУСК ТАСС',
    archetype: 'crisis_radar',
    region: 'capital',
    text: '21 АВГУСТА. ПУТЧ ГКЧП ПРОВАЛИЛСЯ! ЧЛЕНЫ ХУНТЫ АРЕСТОВАНЫ. В МОСКВЕ СВАЛИЛИ ДЗЕРЖИНСКОГО. В НАШЕЙ СТОЛИЦЕ ТОЛПА ТРЕБУЕТ ОПЕЧАТАТЬ КГБ И ЗАПРЕТИТЬ КОМПАРТИЮ!',
    leftChoice: {
      label: 'ПРИОСТАНОВИТЬ КПСС',
      stats: { moscow: -9, people: 10, kgb: -8, economy: 5 },
      profile: { sovereignty: 22, autocracy: -16 },
      decreeBadge: 'РОСПУСК-КПСС',
      effectNote: 'Конец эпохи: партийные архивы опечатаны'
    },
    rightChoice: {
      label: 'ЗАЩИТИТЬ АППАРАТ ЦК',
      stats: { moscow: 8, people: -10, kgb: 6, economy: -5 },
      profile: { autocracy: 16, sovereignty: -12 },
      effectNote: 'Толпа швыряет камни, осада здания продолжается'
    },
    daysElapsed: 14,
    isCrisis: true,
    isGkchp: true
  },

  // ==========================================================
  // АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ (Сентябрь 1991 — Декабрь 1991)
  // ==========================================================
  {
    id: 'act4_koval_winter_rescue',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'СТЕПАН КОВАЛЬ, ДЕПУТАТ ШАХТЕРОВ',
    archetype: 'miner',
    region: 'miners',
    text: 'ТЭЦ СТОЛИЦЫ ЗАМЕРЗАЮТ БЕЗ ТЮМЕНСКОГО МАЗУТА! ШАХТЕРЫ ОБЪЯВЛЯЮТ ТРУДОВОЙ ШТУРМ: 50 ТЫСЯЧ ТОНН УГЛЯ ПОЙДУТ НА ЭЛЕКТРОСТАНЦИИ ВНЕ СОЮЗНОГО ПЛАНА!',
    leftChoice: {
      label: 'ПРИНЯТЬ ШАХТЕРСКИЙ УГОЛЬ',
      stats: { economy: 8, people: 8, moscow: -7, kgb: 0 },
      profile: { sovereignty: 14 },
      decreeBadge: 'ШАХТЕР-СПАС',
      effectNote: 'Города согреты, Коваль выступает на митинге за вас'
    },
    rightChoice: {
      label: 'ОПЛАТИТЬ ИМПОРТ ВАЛЮТОЙ',
      stats: { economy: -8, people: 5, moscow: 6, kgb: 0 },
      profile: { market: 10 },
      effectNote: 'Казна истощена, но тепло в домах сохранено'
    },
    requiredFlags: ['koval_ally'],
    bannedFlags: ['koval_radicalized', 'koval_enemy'],
    daysElapsed: 22
  },
  {
    id: 'act4_koval_general_strike',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'СТЕПАН КОВАЛЬ, ШАХТЕРСКИЙ ФРОНТ',
    archetype: 'miner',
    region: 'miners',
    text: 'УЛЬТИМАТУМ! ШАХТЕРЫ ПЕРЕКРЫЛИ ЖЕЛЕЗНУЮ ДОРОГУ И ТРЕБУЮТ ОТСТАВКИ ПЕРВОГО СЕКРЕТАРЯ. БЕЗ ЭТОГО НИ ОДИН ЭШЕЛОН С ТОПЛИВОМ ИЛИ РУДОЙ НЕ ТРОНЕТСЯ!',
    leftChoice: {
      label: 'УСТУПИТЬ И СДАТЬ ШАХТЫ',
      stats: { economy: -7, people: 7, kgb: -7, moscow: -5 },
      profile: { autocracy: -12, sovereignty: 8 },
      effectNote: 'Магистраль открыта ценой сдачи контроля стачкому'
    },
    rightChoice: {
      label: 'ШТУРМ СПЕЦНАЗОМ НА ПУТЯХ',
      stats: { kgb: 8, people: -9, economy: -8, moscow: 6 },
      profile: { autocracy: 16 },
      effectNote: 'Кровавая стычка на рельсах, шахтеры объявляют войну'
    },
    requiredFlags: ['koval_enemy'],
    daysElapsed: 22,
    isCrisis: true
  },
  {
    id: 'act4_voronov_siloviki_plot',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'ПОЛКОВНИК ВОРОНОВ (ОППОЗИЦИЯ СИЛОВИКОВ)',
    archetype: 'kgb_general',
    region: 'capital',
    text: 'ОФИЦЕРСКОЕ СОБРАНИЕ КГБ ВЫРАЖАЕТ ВАМ НЕДОВЕРИЕ. УЗЛЫ СВЯЗИ И ТЕЛЕЦЕНТР ВЗЯТЫ ПОД КОНТРОЛЬ. ПРЕДЛАГАЕМ ДОБРОВОЛЬНО СДАТЬ ВЛАСТЬ СИЛОВОМУ КОМИТЕТУ СПАСЕНИЯ!',
    leftChoice: {
      label: 'ПОДНЯТЬ МИЛИЦИЮ И НАРОД',
      stats: { people: 9, kgb: -9, economy: -4, moscow: -6 },
      profile: { sovereignty: 14, autocracy: -16 },
      effectNote: 'Толпа окружила телецентр, заговорщики капитулируют'
    },
    rightChoice: {
      label: 'ПРИНЯТЬ УЛЬТИМАТУМ СИЛОВИКОВ',
      stats: { kgb: 9, people: -10, moscow: 7, economy: -6 },
      profile: { autocracy: 22, sovereignty: -14 },
      decreeBadge: 'РЕЖИМ-ХУНТЫ',
      effectNote: 'Власть перешла чекистам, Первый секретарь отстранен'
    },
    requiredFlags: ['voronov_enemy'],
    daysElapsed: 20,
    isCrisis: true
  },
  {
    id: 'act4_mirsky_international_forum',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'СОЮЗ ЖУРНАЛИСТОВ: ЛЕВ МИРСКИЙ',
    archetype: 'popular_front',
    region: 'autonomy',
    text: 'Я ПРИГЛАШЕН НА ВСЕМИРНЫЙ ФОРУМ ПРЕССЫ В ЖЕНЕВУ. ГОТОВ ЛИЧНО ПРЕДСТАВИТЬ ЗАПАДНЫМ СМИ ДЕКЛАРАЦИЮ О НЕЗАВИСИМОСТИ И УБЕДИТЬ ЗАПАД ПРИЗНАТЬ НАШУ РЕСПУБЛИКУ!',
    leftChoice: {
      label: 'НАПРАВИТЬ МИРСКОГО В ЖЕНЕВУ',
      stats: { people: 8, economy: 7, moscow: -7, kgb: -5 },
      profile: { sovereignty: 20, market: 12 },
      decreeBadge: 'ГОЛОС-ЖЕНЕВЫ',
      effectNote: 'Западные СМИ транслируют выступления Мирского'
    },
    rightChoice: {
      label: 'ЗАПРЕТИТЬ ВЫЕЗД ЗА РУБЕЖ',
      stats: { moscow: 6, people: -7, kgb: 6, economy: -4 },
      profile: { autocracy: 10 },
      effectNote: 'Запад обвиняет республику в цензуре и авторитаризме'
    },
    requiredFlags: ['mirsky_freed'],
    bannedFlags: ['mirsky_arrested', 'mirsky_martyr'],
    daysElapsed: 20
  },
  {
    id: 'act4_mirsky_radical_revolt',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'КОМИТЕТ ВОССТАНИЯ ИМЕНИ МИРСКОГО',
    archetype: 'popular_front',
    region: 'capital',
    text: 'РЕПРЕССИИ ПЕРЕПОЛНИЛИ ЧАШУ ТЕРПЕНИЯ! НАРОДНЫЙ ФРОНТ ИМЕНИ ПОЛИТЗЕКА МИРСКОГО ОБЪЯВИЛ ВСЕОБЩУЮ СТАЧКУ И ИДЕТ НА ШТУРМ ТЮРЬМЫ И ЗДАНИЯ ЦК!',
    leftChoice: {
      label: 'ВЫЙТИ С ПОКАЯНИЕМ К ТОЛПЕ',
      stats: { people: 8, economy: -5, kgb: -7, moscow: -5 },
      profile: { autocracy: -18, sovereignty: 10 },
      effectNote: 'Толпа отменила штурм, но авторитет ЦК сломлен'
    },
    rightChoice: {
      label: 'ПРИМЕНИТЬ ДУБИНКИ И ГАЗ',
      stats: { economy: -6, people: -10, kgb: 8, moscow: 6 },
      profile: { autocracy: 20 },
      effectNote: 'Баррикады в огне, столица погружается в хаос боев'
    },
    requiredFlags: ['mirsky_arrested'],
    daysElapsed: 22,
    isCrisis: true
  },
  {
    id: 'act4_nationalize_property',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'ПРЕДСЕДАТЕЛЬ КОМИТЕТА ПО ГОСИМУЩЕСТВУ',
    archetype: 'party_boss',
    region: 'miners',
    text: 'СОЮЗНЫЕ МИНИСТЕРСТВА ПАРАЛИЗОВАНЫ. ПРЕДЛАГАЮ ОДНИМ УКАЗОМ НАЦИОНАЛИЗИРОВАТЬ ВСЕ ЗАВОДЫ СОЮЗНОГО ПОДЧИНЕНИЯ, ЖЕЛЕЗНЫЕ ДОРОГИ И ТРУБОПРОВОДЫ В ПОЛЬЗУ РЕСПУБЛИКИ!',
    leftChoice: {
      label: 'НАЦИОНАЛИЗИРОВАТЬ АКТИВЫ',
      stats: { moscow: -9, people: 8, economy: 9, kgb: 5 },
      profile: { sovereignty: 22, market: -6 },
      decreeBadge: 'ГОССОБСТВЕННОСТЬ',
      effectNote: 'Промышленные гиганты перешли под контроль республики'
    },
    rightChoice: {
      label: 'СОХРАНИТЬ СТАТУС-КВО',
      stats: { moscow: 7, people: -6, economy: -8, kgb: -4 },
      profile: { sovereignty: -14 },
      effectNote: 'Директора растаскивают оборудование за границу'
    },
    daysElapsed: 22
  },
  {
    id: 'act4_republican_coupons',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'ПРЕДСЕДАТЕЛЬ НАЦБАНКА РЕСПУБЛИКИ',
    archetype: 'cooperator',
    region: 'agrarian',
    text: 'РУБЛЕВАЯ ЗОНА ТОНЕТ В ГИПЕРИНФЛЯЦИИ. МОСКВА ПЕЧАТАЕТ ТРИЛЛИОНЫ ПУСТЫХ ДЕНЕГ. МЫ ОТПЕЧАТАЛИ ВО ФРАНЦИИ ПАРТИЮ РЕСПУБЛИКАНСКИХ КУПОНОВ. ВВЕДЕМ ИХ КАК ВАЛЮТУ?',
    leftChoice: {
      label: 'ВВЕСТИ СВОИ КУПОНЫ',
      stats: { moscow: -9, people: 6, economy: 8, kgb: 4 },
      profile: { sovereignty: 22, market: 10 },
      decreeBadge: 'ВАЛЮТА-КУПОН',
      effectNote: 'Республика отгородилась от инфляционного цунами'
    },
    rightChoice: {
      label: 'ОСТАТЬСЯ В РУБЛЕВОЙ ЗОНЕ',
      stats: { moscow: 8, people: -7, economy: -9, kgb: -4 },
      profile: { sovereignty: -16 },
      effectNote: 'Обесцененные рубли хлынули со всех республик'
    },
    daysElapsed: 24
  },
  {
    id: 'act4_belovezha_finale',
    act: 4,
    actTitle: 'АКТ IV: БЕЛОВЕЖСКИЙ ЭНДШПИЛЬ',
    senderTitle: 'ПРАВИТЕЛЬСТВЕННАЯ СВЯЗЬ ИЗ ВИСКУЛЕЙ',
    archetype: 'crisis_radar',
    region: 'capital',
    text: '8 ДЕКАБРЯ 1991 ГОДА. ЕЛЬЦИН, КРАВЧУК И ШУШКЕВИЧ ПОДПИСАЛИ: «СОЮЗ ССР ПРЕКРАЩАЕТ СВОЕ СУЩЕСТВОВАНИЕ». ВАМ ПРЕДЛАГАЕТСЯ ПРИСОЕДИНИТЬСЯ К СОДРУЖЕСТВУ НЕЗАВИСИМЫХ ГОСУДАРСТВ (СНГ).',
    leftChoice: {
      label: 'ПОДПИСАТЬ СОГЛАШЕНИЕ СНГ',
      stats: { moscow: -10, people: 9, economy: 6, kgb: 5 },
      profile: { sovereignty: 26, autocracy: 0 },
      decreeBadge: 'АКТ-СНГ-1991',
      effectNote: 'СССР ушел в историю. Наша республика суверенна!'
    },
    rightChoice: {
      label: 'ОТКАЗАТЬСЯ (ЗА СОЮЗ ССР)',
      stats: { moscow: 9, people: -10, economy: -8, kgb: -5 },
      profile: { sovereignty: -26, autocracy: 10 },
      decreeBadge: 'ВЕРНОСТЬ-СССР',
      effectNote: 'Вы остаетесь последним советским руководителем в пустоте'
    },
    daysElapsed: 25,
    isCrisis: true
  }
];
