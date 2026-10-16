/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ====================================================================
// АУДИОДВИЖОК «АСУ-РЕСПУБЛИКА 1989» (ЧИСТЫЕ MP3 СЭМПЛЫ БЕЗ СИНТЕЗА)
// ====================================================================

export type MusicMood = 'peace' | 'crisis' | 'off';

class TerminalAudioEngine {
  private isMuted: boolean = false;
  private currentMusicMood: MusicMood = 'off';

  // Уровни громкости (0..100)
  private ambientVolume: number = 70;
  private sfxVolume: number = 80;

  // Фоновая музыка (HTMLAudioElement с плавным кроссфейдом)
  private peaceAudio: HTMLAudioElement | null = null;
  private crisisAudio: HTMLAudioElement | null = null;
  private musicFadeInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('asu_sound_enabled');
      this.isMuted = savedMute === 'false';

      // Чтение сохраненных уровней громкости
      try {
        const savedSettings = localStorage.getItem('asu_system_settings_v1');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (typeof parsed.ambientVolume === 'number') {
            this.ambientVolume = Math.max(0, Math.min(100, parsed.ambientVolume));
          }
          if (typeof parsed.sfxVolume === 'number') {
            this.sfxVolume = Math.max(0, Math.min(100, parsed.sfxVolume));
          }
        }
      } catch {
        // Fallback to default
      }

      this.initMusicTracks();
    }
  }

  private initMusicTracks() {
    try {
      this.peaceAudio = new Audio('/audio/ambient_peace.mp3');
      this.peaceAudio.loop = true;
      this.peaceAudio.volume = 0;
      this.peaceAudio.preload = 'auto';

      this.crisisAudio = new Audio('/audio/ambient_crisis.mp3');
      this.crisisAudio.loop = true;
      this.crisisAudio.volume = 0;
      this.crisisAudio.preload = 'auto';
    } catch {
      // Игнорируем в средах без Audio
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
      this.silenceAllMusic();
    } else {
      this.playSwitchToggle();
      this.applyMusicMood(this.currentMusicMood, true);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('asu_sound_enabled', String(!muted));
    if (muted) {
      this.silenceAllMusic();
    } else {
      this.applyMusicMood(this.currentMusicMood, true);
    }
  }

  // ------------------------------------------------------------------
  // УПРАВЛЕНИЕ ГРОМКОСТЬЮ (СИСТЕМНЫЕ НАСТРОЙКИ)
  // ------------------------------------------------------------------
  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public setAmbientVolume(percent: number) {
    this.ambientVolume = Math.max(0, Math.min(100, Math.round(percent / 10) * 10));
    if (this.ambientVolume === 0) {
      this.silenceAllMusic();
    } else {
      if (!this.isMuted && this.currentMusicMood !== 'off') {
        this.applyMusicMood(this.currentMusicMood, true);
      }
    }
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setSfxVolume(percent: number) {
    this.sfxVolume = Math.max(0, Math.min(100, Math.round(percent / 10) * 10));
  }

  // ------------------------------------------------------------------
  // ПРОИГРЫВАНИЕ MP3 СЭМПЛОВ (БЕЗ СИНТЕЗАТОРОВ И ПИЩАЛОК)
  // ------------------------------------------------------------------
  private playSfx(src: string, volume: number = 0.5) {
    if (this.isMuted || this.sfxVolume === 0 || typeof window === 'undefined') return;
    try {
      const audio = new Audio(src);
      const effectiveVolume = volume * (this.sfxVolume / 100);
      audio.volume = Math.max(0, Math.min(1, effectiveVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Тихо игнорируем отсутствие файла (404) или запрет автовоспроизведения
        });
      }
    } catch {
      // Quietly ignore
    }
  }

  /**
   * Клик по кнопкам и выбору вариантов
   */
  public playKeyClick() {
    this.playSfx('/audio/sfx/key_click.mp3', 0.4);
  }

  /**
   * Тумблер открытия карты, окон и переключения вкладок
   */
  public playSwitchToggle() {
    this.playSfx('/audio/sfx/switch_toggle.mp3', 0.45);
  }

  public playSwitchClick() {
    this.playSwitchToggle();
  }

  /**
   * Телетайп / частые щелчки печати
   */
  public playTeletype() {
    this.playSfx('/audio/sfx/key_click.mp3', 0.35);
  }

  public playTeletypeClick() {
    this.playKeyClick();
  }

  /**
   * Выдача новой карточки на стол / свайп / под сукно
   */
  public playPaperSlide() {
    this.playSfx('/audio/sfx/paper_slide.mp3', 0.45);
  }

  public playSwipeImpulse() {
    this.playPaperSlide();
  }

  /**
   * Удар гербовой печати об стол (утверждение Первого секретаря, подписание указов)
   */
  public playStampPress() {
    this.playSfx('/audio/sfx/stamp_press.mp3', 0.5);
  }

  /**
   * Тревога / сирена ЧП / бунт
   */
  public playSiren(critical?: boolean) {
    this.playSfx('/audio/sfx/siren_alert.mp3', critical ? 0.5 : 0.35);
  }

  public playEmergencyAlarm() {
    this.playSiren(true);
  }

  /**
   * Запуск директивы АСУ
   */
  public playDirectiveLaunch() {
    this.playSfx('/audio/sfx/switch_toggle.mp3', 0.5);
  }

  public playTriumphChime() {
    this.playSfx('/audio/sfx/stamp_press.mp3', 0.4);
  }

  public playHotlineTone() {
    this.playSfx('/audio/sfx/switch_toggle.mp3', 0.4);
  }

  // Заглушки для совместимости
  public startMachineAmbient() {}
  public stopMachineAmbient() {}
  public startHum() {}
  public stopHum() {}

  // ------------------------------------------------------------------
  // АДАПТИВНАЯ МУЗЫКА И ПЛАВНЫЙ КРОССФЕЙД
  // ------------------------------------------------------------------
  public updateAdaptiveMusic(inGame: boolean, isCrisis: boolean) {
    if (!inGame) {
      this.setMusicMood('off');
    } else if (isCrisis) {
      this.setMusicMood('crisis');
    } else {
      this.setMusicMood('peace');
    }
  }

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
    if (this.isMuted || this.ambientVolume === 0 || typeof window === 'undefined') {
      this.silenceAllMusic();
      return;
    }

    if (this.musicFadeInterval !== null) {
      clearInterval(this.musicFadeInterval);
      this.musicFadeInterval = null;
    }

    const volScale = this.ambientVolume / 100;
    const targetPeaceVol = mood === 'peace' ? 0.35 * volScale : 0;
    const targetCrisisVol = mood === 'crisis' ? 0.4 * volScale : 0;

    if (mood === 'peace' && this.peaceAudio) {
      if (this.peaceAudio.paused && targetPeaceVol > 0) {
        this.peaceAudio.volume = immediate ? targetPeaceVol : 0;
        this.peaceAudio.play().catch(() => {});
      }
    } else if (mood === 'crisis' && this.crisisAudio) {
      if (this.crisisAudio.paused && targetCrisisVol > 0) {
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

    // Плавный кроссфейд за 1800 мс
    const steps = 36;
    const intervalMs = 50;
    let step = 0;

    const startPeace = this.peaceAudio ? this.peaceAudio.volume : 0;
    const startCrisis = this.crisisAudio ? this.crisisAudio.volume : 0;

    this.musicFadeInterval = window.setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);

      if (this.peaceAudio) {
        const currentPeace = startPeace + (targetPeaceVol - startPeace) * progress;
        this.peaceAudio.volume = Math.max(0, Math.min(1, currentPeace));
        if (progress >= 1 && targetPeaceVol === 0) {
          this.peaceAudio.pause();
        }
      }

      if (this.crisisAudio) {
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
