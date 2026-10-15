/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio API sound synthesizer for ASU-Republic terminal
class TerminalAudioEngine {
  private ctx: AudioContext | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved audio preference
    const saved = localStorage.getItem('asu_sound_enabled');
    this.isMuted = saved === 'false';
  }

  private initCtx(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('asu_sound_enabled', String(!this.isMuted));
    if (this.isMuted) {
      this.stopHum();
    } else {
      this.startHum();
      this.playSwitchClick();
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('asu_sound_enabled', String(!muted));
    if (muted) {
      this.stopHum();
    } else {
      this.startHum();
    }
  }

  // Teletype mechanical typewriter key click
  public playTeletypeClick() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      // High-passed snappy noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.015);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 + Math.random() * 800, now);
      filter.Q.setValueAtTime(3, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.015);

      // Deep mechanical relay click
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.02);

      oscGain.gain.setValueAtTime(0.12, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Ignore audio context errors on autoplay restrictions
    }
  }

  // Heavy mechanical toggle switch click
  public playSwitchClick() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // Rustling punch card read impulse when card is swiped
  public playSwipeImpulse() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.08;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Amplitude modulated fluttering noise for card friction
        const flutter = Math.sin((i / bufferSize) * Math.PI * 8);
        output[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * flutter);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + duration);

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

  // High-frequency government hotline (ВЧ-связь) dial tone / ring
  public playHotlineTone() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      // Dual-tone multi-frequency government style
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(770, now);
      osc2.frequency.setValueAtTime(1336, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.setValueAtTime(0.12, now + 0.35);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {
      // Ignore
    }
  }

  // Piercing emergency buzzer alarm when meters enter critical zone (<20 or >80)
  public playEmergencyAlarm() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      // Two beeps
      [0, 0.15].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(940, now + offset);
        osc.frequency.setValueAtTime(820, now + offset + 0.05);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now + offset);

        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.setValueAtTime(0.15, now + offset + 0.08);
        gain.gain.linearRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch {
      // Ignore
    }
  }

  // Stabilization / Decree triumph chime
  public playTriumphChime() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major chord fanfare
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  // Low frequency transformer 50Hz hum loop with harmonic
  public startHum() {
    const ctx = this.initCtx();
    if (!ctx || this.isMuted || this.humOsc1) return;

    try {
      this.humOsc1 = ctx.createOscillator();
      this.humOsc2 = ctx.createOscillator();
      this.humGain = ctx.createGain();

      this.humOsc1.type = 'sine';
      this.humOsc1.frequency.setValueAtTime(50, ctx.currentTime);

      this.humOsc2.type = 'triangle';
      this.humOsc2.frequency.setValueAtTime(100, ctx.currentTime);

      this.humGain.gain.setValueAtTime(0.015, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);

      this.humOsc1.connect(filter);
      this.humOsc2.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(ctx.destination);

      this.humOsc1.start();
      this.humOsc2.start();
    } catch {
      // Ignore
    }
  }

  public stopHum() {
    try {
      if (this.humOsc1) {
        this.humOsc1.stop();
        this.humOsc1.disconnect();
        this.humOsc1 = null;
      }
      if (this.humOsc2) {
        this.humOsc2.stop();
        this.humOsc2.disconnect();
        this.humOsc2 = null;
      }
      if (this.humGain) {
        this.humGain.disconnect();
        this.humGain = null;
      }
    } catch {
      // Ignore
    }
  }
}

export const terminalAudio = new TerminalAudioEngine();
