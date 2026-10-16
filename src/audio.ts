/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ====================================================================
// АДАПТИВНАЯ РЕТРО-АУДИОСИСТЕМА «АСУ-РЕСПУБЛИКА 1989» (WEB AUDIO API)
// ====================================================================

export type MusicMood = 'peace' | 'crisis' | 'off';

class TerminalAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Machine hall ambient components (50Hz transformer + 100Hz harmonic + CRT hiss)
  private ambientHum50: OscillatorNode | null = null;
  private ambientHum100: OscillatorNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;
  private ambientMasterGain: GainNode | null = null;
  private isAmbientRunning: boolean = false;

  // External audio music tracks (HTMLAudioElement with crossfade)
  private peaceAudio: HTMLAudioElement | null = null;
  private crisisAudio: HTMLAudioElement | null = null;
  private peaceAvailable: boolean = true;
  private crisisAvailable: boolean = true;
  private currentMusicMood: MusicMood = 'off';
  private musicFadeInterval: number | null = null;

  // External SFX elements with procedural fallback
  private paperSfx: HTMLAudioElement | null = null;
  private stampSfx: HTMLAudioElement | null = null;
  private paperSfxAvailable: boolean = true;
  private stampSfxAvailable: boolean = true;

  constructor() {
    // Check saved audio preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('asu_sound_enabled');
      this.isMuted = saved === 'false';
      this.initMusicTracks();
      this.initSfxTracks();
    }
  }

  // Initialize Web Audio Context on user gesture
  private initCtx(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Preload external music tracks gracefully (fallback to silence if not present)
  private initMusicTracks() {
    try {
      this.peaceAudio = new Audio('/audio/ambient_peace.mp3');
      this.peaceAudio.loop = true;
      this.peaceAudio.volume = 0;
      this.peaceAudio.preload = 'auto';
      this.peaceAudio.addEventListener('error', () => {
        this.peaceAvailable = false;
      });

      this.crisisAudio = new Audio('/audio/ambient_crisis.mp3');
      this.crisisAudio.loop = true;
      this.crisisAudio.volume = 0;
      this.crisisAudio.preload = 'auto';
      this.crisisAudio.addEventListener('error', () => {
        this.crisisAvailable = false;
      });
    } catch {
      this.peaceAvailable = false;
      this.crisisAvailable = false;
    }
  }

  // Preload external SFX tracks gracefully
  private initSfxTracks() {
    try {
      this.paperSfx = new Audio('/audio/sfx/paper_slide.mp3');
      this.paperSfx.preload = 'auto';
      this.paperSfx.addEventListener('error', () => {
        this.paperSfxAvailable = false;
      });

      this.stampSfx = new Audio('/audio/sfx/stamp_press.mp3');
      this.stampSfx.preload = 'auto';
      this.stampSfx.addEventListener('error', () => {
        this.stampSfxAvailable = false;
      });
    } catch {
      this.paperSfxAvailable = false;
      this.stampSfxAvailable = false;
    }
  }

  // ------------------------------------------------------------------
  // ГЛОБАЛЬНЫЙ МЬЮТ И СОСТОЯНИЕ ЗВУКА
  // ------------------------------------------------------------------
  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('asu_sound_enabled', String(!this.isMuted));
    if (this.isMuted) {
      this.stopMachineAmbient();
      this.silenceAllMusic();
    } else {
      this.initCtx();
      this.playSwitchToggle();
      if (this.isAmbientRunning) {
        this.startMachineAmbient();
      }
      this.applyMusicMood(this.currentMusicMood, true);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('asu_sound_enabled', String(!muted));
    if (muted) {
      this.stopMachineAmbient();
      this.silenceAllMusic();
    } else {
      this.initCtx();
      if (this.isAmbientRunning) {
        this.startMachineAmbient();
      }
      this.applyMusicMood(this.currentMusicMood, true);
    }
  }

  // ------------------------------------------------------------------
  // 1. ПРОЦЕДУРНЫЙ СИНТЕЗ ЭФФЕКТОВ ИНТЕРФЕЙСА (СОВЕТСКАЯ АППАРАТУРА)
  // ------------------------------------------------------------------

  /**
   * Стук клавиши механической / герконовой клавиатуры.
   * Короткий импульс белого шума (10–15 мс) через Bandpass (~1200 Гц)
   * + низкочастотный глухой клик (130–160 Гц с рандомизацией ±5%).
   */
  public playKeyClick() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;

      // 1. Короткий импульс белого шума (12 мс)
      const bufferSize = Math.floor(ctx.sampleRate * 0.012);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200 + (Math.random() * 100 - 50), now);
      bandpass.Q.setValueAtTime(2.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.14, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      noiseNode.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.012);

      // 2. Низкочастотный глухой механический удар (130-160 Гц ±5%)
      const baseFreq = 145 * (0.95 + Math.random() * 0.1);
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.018);

      oscGain.gain.setValueAtTime(0.18, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch {
      // Игнорируем ограничения автовоспроизведения
    }
  }

  /**
   * Двойной металлический щелчок советского тумблера / реле (ТВ-1, П2Т).
   * Два резких щелчка с интервалом ~28 мс и резонансным металлическим телом.
   */
  public playSwitchToggle() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;

      // Клик 1: Срыв контакта и пружина (0 мс)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(420, now);
      osc1.frequency.exponentialRampToValueAtTime(80, now + 0.02);

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(1400, now);
      filter1.Q.setValueAtTime(4.0, now);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.02);

      // Клик 2: Фиксация сердечника и корпуса тумблера (+28 мс)
      const t2 = now + 0.028;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(190, t2);
      osc2.frequency.exponentialRampToValueAtTime(60, t2 + 0.04);

      gain2.gain.setValueAtTime(0.2, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.045);

      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'lowpass';
      filter2.frequency.setValueAtTime(950, t2);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(t2);
      osc2.stop(t2 + 0.045);
    } catch {
      // Ignore
    }
  }

  // Обратная совместимость для существующих вызовов
  public playSwitchClick() {
    this.playSwitchToggle();
  }

  /**
   * Серия частых сухих щелчков телетайпа / матричного аппарата (РТА-80 / СТА-М67).
   * Вызывается при обновлении сводки ТАСС или открытии правительственной депеши.
   */
  public playTeletype() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const clicks = 4;
      const interval = 0.032;

      for (let i = 0; i < clicks; i++) {
        const t = now + i * interval;
        const dur = 0.012;

        // Импульс ударника литеры
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + dur);

        oscGain.gain.setValueAtTime(0.12, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);

        // Шумовой шорох бумажной ленты
        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          output[j] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const bq = ctx.createBiquadFilter();
        bq.type = 'bandpass';
        bq.frequency.setValueAtTime(2800, t);
        bq.Q.setValueAtTime(3.5, t);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        noise.connect(bq);
        bq.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start(t);
        noise.stop(t + dur);
      }
    } catch {
      // Ignore
    }
  }

  public playTeletypeClick() {
    this.playKeyClick();
  }

  /**
   * Двухтональный тревожный сигнал АСУ «Республика».
   * @param critical false = мягкий предупредительный пульс (напряженность >= 70%)
   *                 true  = давящая глухая тревожная сирена (бунт >= 80% или путч ГКЧП)
   */
  public playSiren(critical: boolean = false) {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;

      if (!critical) {
        // Мягкий двухтональный пульс предостережения (480 Гц -> 580 Гц)
        [
          { freq: 480, start: 0, dur: 0.12 },
          { freq: 580, start: 0.14, dur: 0.14 },
        ].forEach((tone) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(tone.freq, now + tone.start);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, now + tone.start);

          gain.gain.setValueAtTime(0.001, now + tone.start);
          gain.gain.linearRampToValueAtTime(0.09, now + tone.start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + tone.start + tone.dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + tone.start);
          osc.stop(now + tone.start + tone.dur);
        });
      } else {
        // Давящая глухая сирена чрезвычайного положения АСУ (220 Гц <-> 340 Гц)
        [0, 0.22].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          const startFreq = idx === 0 ? 240 : 340;
          const endFreq = idx === 0 ? 340 : 220;

          osc.frequency.setValueAtTime(startFreq, now + offset);
          osc.frequency.linearRampToValueAtTime(endFreq, now + offset + 0.18);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(680, now + offset);
          filter.Q.setValueAtTime(3.0, now + offset);

          gain.gain.setValueAtTime(0.001, now + offset);
          gain.gain.linearRampToValueAtTime(0.16, now + offset + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.2);
        });
      }
    } catch {
      // Ignore
    }
  }

  // Обратная совместимость для аварийного зуммера
  public playEmergencyAlarm() {
    this.playSiren(true);
  }

  /**
   * Тяжелый низкий импульс запуска директивы АСУ:
   * Мощный лязг электромагнитного реле + низкочастотный суб-гул автоматики энергосети.
   */
  public playDirectiveLaunch() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;

      // 1. Удар соленоида / контактора (резкий спад 280 -> 40 Гц)
      const oscClack = ctx.createOscillator();
      const gainClack = ctx.createGain();
      oscClack.type = 'square';
      oscClack.frequency.setValueAtTime(280, now);
      oscClack.frequency.exponentialRampToValueAtTime(45, now + 0.06);

      const filterClack = ctx.createBiquadFilter();
      filterClack.type = 'lowpass';
      filterClack.frequency.setValueAtTime(800, now);

      gainClack.gain.setValueAtTime(0.22, now);
      gainClack.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      oscClack.connect(filterClack);
      filterClack.connect(gainClack);
      gainClack.connect(ctx.destination);

      oscClack.start(now);
      oscClack.stop(now + 0.07);

      // 2. Глубокий 55 Гц гул включения промышленной автоматики (500 мс)
      const oscHum = ctx.createOscillator();
      const gainHum = ctx.createGain();
      oscHum.type = 'sine';
      oscHum.frequency.setValueAtTime(55, now);

      gainHum.gain.setValueAtTime(0.001, now);
      gainHum.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gainHum.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      oscHum.connect(gainHum);
      gainHum.connect(ctx.destination);

      oscHum.start(now);
      oscHum.stop(now + 0.55);
    } catch {
      // Ignore
    }
  }

  /**
   * Шелест советской перфокарты / бумажной папки:
   * Проигрывает sfx `paper_slide.mp3`, а при его отсутствии — сочную процедурную симуляцию.
   */
  public playPaperSlide() {
    if (this.isMuted) return;

    if (this.paperSfx && this.paperSfxAvailable) {
      try {
        this.paperSfx.currentTime = 0;
        this.paperSfx.volume = 0.45;
        const playPromise = this.paperSfx.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.playProceduralPaperSlide();
          });
        }
        return;
      } catch {
        // Fallback to procedural
      }
    }
    this.playProceduralPaperSlide();
  }

  public playSwipeImpulse() {
    this.playPaperSlide();
  }

  private playProceduralPaperSlide() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.085;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const progress = i / bufferSize;
        const friction = Math.sin(progress * Math.PI);
        output[i] = (Math.random() * 2 - 1) * friction;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + duration);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Ignore
    }
  }

  /**
   * Удар гербовой печати с мастикой:
   * Проигрывает sfx `stamp_press.mp3` или процедурный плотный деревянный удар.
   */
  public playStampPress() {
    if (this.isMuted) return;

    if (this.stampSfx && this.stampSfxAvailable) {
      try {
        this.stampSfx.currentTime = 0;
        this.stampSfx.volume = 0.5;
        const playPromise = this.stampSfx.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.playProceduralStampPress();
          });
        }
        return;
      } catch {
        // Fallback to procedural
      }
    }
    this.playProceduralStampPress();
  }

  private playProceduralStampPress() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;

      // 1. Деревянный щелчок штампа
      const bufferSize = Math.floor(ctx.sampleRate * 0.015);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, now);
      bp.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      noise.connect(bp);
      bp.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.015);

      // 2. Глухой упругий удар резиновой мастики о стол
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.065);

      oscGain.gain.setValueAtTime(0.28, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }

  /**
   * Торжественный мажорный фанфарный аккорд при подписании указа или стабилизации.
   */
  public playTriumphChime() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.45);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Правительственная ВЧ-связь — двухтональный вызов кремлевского коммутатора.
   */
  public playHotlineTone() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(770, now);
      osc2.frequency.setValueAtTime(1336, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.setValueAtTime(0.12, now + 0.32);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.42);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.42);
      osc2.stop(now + 0.42);
    } catch {
      // Ignore
    }
  }

  // ------------------------------------------------------------------
  // 2. ПРОЦЕДУРНЫЙ ЭМБИЕНТ МАШИННОГО ЗАЛА (50 Гц + 100 Гц + ШИПЕНИЕ ЭЛТ)
  // ------------------------------------------------------------------

  /**
   * Запускает фоновый процедурный гул советского трансформатора (50 Гц + 100 Гц)
   * и едва слышное шипение кинескопа на громкости не более 5-7%.
   */
  public startMachineAmbient() {
    this.isAmbientRunning = true;
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || this.ambientMasterGain) return;

    try {
      const now = ctx.currentTime;

      // Мастер-фейдер эмбиента (плавный старт за 1.5 сек до 0.055)
      this.ambientMasterGain = ctx.createGain();
      this.ambientMasterGain.gain.setValueAtTime(0.001, now);
      this.ambientMasterGain.gain.linearRampToValueAtTime(0.055, now + 1.5);
      this.ambientMasterGain.connect(ctx.destination);

      // Осциллятор 1: 50 Гц синусоида (сетевой трансформатор)
      this.ambientHum50 = ctx.createOscillator();
      this.ambientHum50.type = 'sine';
      this.ambientHum50.frequency.setValueAtTime(50, now);

      const filter50 = ctx.createBiquadFilter();
      filter50.type = 'lowpass';
      filter50.frequency.setValueAtTime(120, now);

      this.ambientHum50.connect(filter50);
      filter50.connect(this.ambientMasterGain);
      this.ambientHum50.start(now);

      // Осциллятор 2: 100 Гц гармоника (двухполупериодный выпрямитель)
      this.ambientHum100 = ctx.createOscillator();
      this.ambientHum100.type = 'triangle';
      this.ambientHum100.frequency.setValueAtTime(100, now);

      const filter100 = ctx.createBiquadFilter();
      filter100.type = 'lowpass';
      filter100.frequency.setValueAtTime(180, now);

      const gain100 = ctx.createGain();
      gain100.gain.setValueAtTime(0.35, now);

      this.ambientHum100.connect(filter100);
      filter100.connect(gain100);
      gain100.connect(this.ambientMasterGain);
      this.ambientHum100.start(now);

      // Высокочастотное шипение строчной развертки кинескопа (7.5 кГц)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.ambientNoise = ctx.createBufferSource();
      this.ambientNoise.buffer = noiseBuffer;
      this.ambientNoise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(7200, now);
      noiseFilter.Q.setValueAtTime(4.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.03, now);

      this.ambientNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ambientMasterGain);
      this.ambientNoise.start(now);
    } catch {
      // Ignore
    }
  }

  /**
   * Плавно останавливает фоновый процедурный гул трансформатора (за 1.2 сек).
   */
  public stopMachineAmbient() {
    this.isAmbientRunning = false;
    if (!this.ctx || !this.ambientMasterGain) return;

    try {
      const now = this.ctx.currentTime;
      this.ambientMasterGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);

      setTimeout(() => {
        try {
          if (this.ambientHum50) {
            this.ambientHum50.stop();
            this.ambientHum50.disconnect();
            this.ambientHum50 = null;
          }
          if (this.ambientHum100) {
            this.ambientHum100.stop();
            this.ambientHum100.disconnect();
            this.ambientHum100 = null;
          }
          if (this.ambientNoise) {
            this.ambientNoise.stop();
            this.ambientNoise.disconnect();
            this.ambientNoise = null;
          }
          if (this.ambientMasterGain) {
            this.ambientMasterGain.disconnect();
            this.ambientMasterGain = null;
          }
        } catch {
          // Ignore
        }
      }, 1250);
    } catch {
      // Ignore
    }
  }

  // Алиасы для обратной совместимости
  public startHum() {
    this.startMachineAmbient();
  }

  public stopHum() {
    this.stopMachineAmbient();
  }

  // ------------------------------------------------------------------
  // 3. АДАПТИВНАЯ МУЗЫКА И КРОССФЕЙД (ADAPTIVE AUDIO CONTROLLER)
  // ------------------------------------------------------------------

  /**
   * Обновляет адаптивное настроение фоновой музыки в зависимости от геймплея:
   * @param inGame находимся ли в активной игровой сессии
   * @param isCrisis есть ли кризис / напряженность >= 70% / 1991 год
   */
  public updateAdaptiveMusic(inGame: boolean, isCrisis: boolean) {
    if (!inGame) {
      this.setMusicMood('off');
    } else if (isCrisis) {
      this.setMusicMood('crisis');
    } else {
      this.setMusicMood('peace');
    }
  }

  /**
   * Переключает фоновые дорожки с плавным 2-секундным перекрестным затуханием (crossfade).
   */
  public setMusicMood(mood: MusicMood) {
    if (this.currentMusicMood === mood) return;
    this.currentMusicMood = mood;
    this.applyMusicMood(mood, false);
  }

  private silenceAllMusic() {
    if (this.musicFadeInterval !== null) {
      clearInterval(this.musicFadeInterval);
      this.musicFadeInterval = null;
    }
    if (this.peaceAudio) {
      this.peaceAudio.pause();
      this.peaceAudio.volume = 0;
    }
    if (this.crisisAudio) {
      this.crisisAudio.pause();
      this.crisisAudio.volume = 0;
    }
  }

  private applyMusicMood(mood: MusicMood, immediate: boolean = false) {
    if (this.isMuted || typeof window === 'undefined') {
      this.silenceAllMusic();
      return;
    }

    if (this.musicFadeInterval !== null) {
      clearInterval(this.musicFadeInterval);
      this.musicFadeInterval = null;
    }

    const targetPeaceVol = mood === 'peace' ? 0.35 : 0;
    const targetCrisisVol = mood === 'crisis' ? 0.4 : 0;

    // Запускаем воспроизведение нужного трека
    if (mood === 'peace' && this.peaceAudio && this.peaceAvailable) {
      if (this.peaceAudio.paused) {
        this.peaceAudio.volume = immediate ? targetPeaceVol : 0;
        this.peaceAudio.play().catch(() => {});
      }
    } else if (mood === 'crisis' && this.crisisAudio && this.crisisAvailable) {
      if (this.crisisAudio.paused) {
        this.crisisAudio.volume = immediate ? targetCrisisVol : 0;
        this.crisisAudio.play().catch(() => {});
      }
    }

    if (immediate) {
      if (this.peaceAudio) {
        this.peaceAudio.volume = targetPeaceVol;
        if (targetPeaceVol === 0) this.peaceAudio.pause();
      }
      if (this.crisisAudio) {
        this.crisisAudio.volume = targetCrisisVol;
        if (targetCrisisVol === 0) this.crisisAudio.pause();
      }
      return;
    }

    // Плавный кроссфейд за 2000 мс (шаг 50 мс = 40 шагов)
    const steps = 40;
    const intervalMs = 50;
    let step = 0;

    const startPeace = this.peaceAudio ? this.peaceAudio.volume : 0;
    const startCrisis = this.crisisAudio ? this.crisisAudio.volume : 0;

    this.musicFadeInterval = window.setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);

      if (this.peaceAudio && this.peaceAvailable) {
        const currentPeace = startPeace + (targetPeaceVol - startPeace) * progress;
        this.peaceAudio.volume = Math.max(0, Math.min(1, currentPeace));
        if (progress >= 1 && targetPeaceVol === 0) {
          this.peaceAudio.pause();
        }
      }

      if (this.crisisAudio && this.crisisAvailable) {
        const currentCrisis = startCrisis + (targetCrisisVol - startCrisis) * progress;
        this.crisisAudio.volume = Math.max(0, Math.min(1, currentCrisis));
        if (progress >= 1 && targetCrisisVol === 0) {
          this.crisisAudio.pause();
        }
      }

      if (progress >= 1) {
        if (this.musicFadeInterval !== null) {
          clearInterval(this.musicFadeInterval);
          this.musicFadeInterval = null;
        }
      }
    }, intervalMs);
  }
}

export const terminalAudio = new TerminalAudioEngine();
