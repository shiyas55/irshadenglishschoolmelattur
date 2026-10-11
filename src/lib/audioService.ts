'use client';

class CeremonialAudioService {
  private audioElement: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private defaultVolume: number = 0.18; // Low sound volume as requested
  private chordInterval: number | null = null;
  private chimeInterval: number | null = null;
  private initialized: boolean = false;

  private baseFrequencies = [
    [146.83, 220.00, 293.66, 369.99, 440.00], // D Maj (D3, A3, D4, F#4, A4)
    [123.47, 185.00, 246.94, 293.66, 369.99], // B Min (B2, F#3, B3, D4, F#4)
    [98.00, 146.83, 196.00, 246.94, 293.66],  // G Maj (G2, D3, G3, B3, D4)
    [110.00, 164.81, 220.00, 277.18, 329.63], // A Maj (A2, E3, A3, C#4, E4)
  ];
  private chimeNotes = [587.33, 659.25, 739.99, 880.00, 1108.73, 1174.66]; // D5, E5, F#5, A5, C#6, D6
  private chordIndex = 0;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    try {
      // 1. Primary Engine: Official School Ceremonial Music Track
      this.audioElement = new Audio('/assets/audio/school-song.m4a');
      this.audioElement.loop = true;
      this.audioElement.volume = this.defaultVolume;
      this.audioElement.preload = 'auto';

      // Fallback if network or format decoding fails
      this.audioElement.addEventListener('error', () => {
        console.warn('Primary audio failed to load, falling back to anthem WAV');
        if (this.audioElement) {
          this.audioElement.src = '/assets/audio/ceremonial-anthem.wav';
          this.audioElement.load();
          if (this.isPlaying && !this.isMuted) {
            this.audioElement.play().catch(() => {});
          }
        }
      });

      // Keep playing state in sync if browser interrupts audio
      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
      });
      this.audioElement.addEventListener('pause', () => {
        if (!this.isMuted) {
          // If paused by external system
        }
      });
    } catch (err) {
      console.warn('Native AudioElement initialization failed:', err);
    }

    try {
      // 2. Secondary Engine: Web Audio API Synthesizer (Fallback & Ambient Enhancer)
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime); // Gentle low sound
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (err) {
      console.warn('Web Audio Context initialization failed:', err);
    }
  }

  public async start(): Promise<boolean> {
    this.init();
    this.isMuted = false;

    // Try HTML5 Audio First
    if (this.audioElement) {
      try {
        this.audioElement.volume = this.defaultVolume;
        await this.audioElement.play();
        this.isPlaying = true;
        return true;
      } catch (err) {
        console.info('HTML5 Audio play interrupted or blocked by autoplay policy, enabling fallback:', err);
      }
    }

    // Fallback to Web Audio Synthesizer
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          await this.ctx.resume();
        }
        if (this.masterGain) {
          this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
        }
        this.isPlaying = true;
        this.startSynthLoops();
        return true;
      }
    } catch (err) {
      console.warn('Web Audio Synthesizer fallback failed:', err);
    }

    return false;
  }

  private startSynthLoops() {
    if (this.chordInterval) clearInterval(this.chordInterval);
    if (this.chimeInterval) clearInterval(this.chimeInterval);

    // Play immediately
    this.playHarmonicPad();

    this.chordInterval = window.setInterval(() => {
      if (this.isPlaying && !this.isMuted) {
        this.playHarmonicPad();
      }
    }, 6000);

    this.chimeInterval = window.setInterval(() => {
      if (this.isPlaying && !this.isMuted && Math.random() > 0.3) {
        this.playChimeNote();
      }
    }, 2000);
  }

  private playHarmonicPad() {
    if (!this.ctx || !this.masterGain) return;
    const notes = this.baseFrequencies[this.chordIndex % this.baseFrequencies.length];
    this.chordIndex++;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      const duration = 5.8;
      const noteVol = 0.12 / (1 + idx * 0.3);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(noteVol, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  private playChimeNote() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const note = this.chimeNotes[Math.floor(Math.random() * this.chimeNotes.length)];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(note, this.ctx.currentTime);
    filter.Q.setValueAtTime(4, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.9);
  }

  public pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    this.isPlaying = false;
  }

  public resume() {
    if (this.audioElement && !this.isMuted) {
      this.audioElement.play().catch(() => {});
      this.isPlaying = true;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
      this.isPlaying = true;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    // Toggle HTML5 Audio
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.defaultVolume;
      if (!this.isMuted && this.audioElement.paused) {
        this.audioElement.play().catch(() => {});
        this.isPlaying = true;
      }
    }

    // Toggle Web Audio Synth
    if (this.masterGain && this.ctx) {
      if (this.ctx.state === 'suspended' && !this.isMuted) {
        this.ctx.resume().catch(() => {});
      }
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
    }

    return this.isMuted;
  }

  public stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.chordInterval) clearInterval(this.chordInterval);
    if (this.chimeInterval) clearInterval(this.chimeInterval);
    this.isPlaying = false;

    if (this.ctx) {
      try {
        this.ctx.suspend();
      } catch {
        // ignore
      }
    }
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
    };
  }
}

export const backgroundMusic = new CeremonialAudioService();
