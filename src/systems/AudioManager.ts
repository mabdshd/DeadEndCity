export class AudioManager {
  private ctx: AudioContext | null = null;
  private sirenGain: GainNode | null = null;
  private sirenOscs: OscillatorNode[] = [];
  private engineOscs: OscillatorNode[] = [];
  private engineGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  init(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) {
      this.ctx = new Ctor();
      void this.ctx.resume();
      this.makeNoise();
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  private makeNoise(): void {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 0.3;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, sweepTo?: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), ctx.currentTime + dur);
    }
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  private noiseBurst(dur: number, vol: number, lowpass = 1200): void {
    const ctx = this.ctx;
    if (!ctx || !this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + dur + 0.02);
  }

  playClick(): void {
    this.tone(720, 0.06, "square", 0.06, 480);
  }

  playMissionStart(): void {
    this.tone(440, 0.12, "triangle", 0.12, 660);
    this.tone(660, 0.14, "triangle", 0.12, 880);
  }

  playMissionComplete(): void {
    this.tone(523, 0.12, "triangle", 0.13);
    this.tone(659, 0.12, "triangle", 0.13);
    this.tone(784, 0.22, "triangle", 0.14);
  }

  playCashBank(): void {
    this.tone(988, 0.07, "sine", 0.12);
    setTimeout(() => this.tone(1319, 0.12, "sine", 0.12), 70);
  }

  playCollision(intensity = 0.5): void {
    const v = Math.max(0.05, Math.min(1, intensity));
    this.noiseBurst(0.16 * v + 0.05, 0.5 * v, 900);
    this.tone(90, 0.18, "sine", 0.35 * v, 40);
  }

  playAlarm(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    for (let i = 0; i < 3; i++) {
      const t = ctx.currentTime + i * 0.28;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.setValueAtTime(760, t + 0.14);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    }
  }

  playBusted(): void {
    this.tone(220, 0.4, "sawtooth", 0.18, 80);
    this.tone(110, 0.5, "square", 0.16, 55);
  }

  playGunshot(): void {
    this.noiseBurst(0.12, 0.4, 2600);
    this.tone(160, 0.12, "square", 0.22, 60);
  }

  startEngine(): void {
    if (!this.ctx || this.engineGain) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 55;
    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.value = 27;
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    osc.connect(gain);
    osc2.connect(g2);
    g2.connect(gain);
    osc.start();
    osc2.start();
    gain.gain.setTargetAtTime(0.07, ctx.currentTime, 0.3);
    this.engineOscs = [osc, osc2];
    this.engineGain = gain;
  }

  setEngineSpeed(norm: number): void {
    if (!this.engineOscs.length) return;
    const f = 45 + Math.max(0, Math.min(1, norm)) * 130;
    this.engineOscs[0].frequency.setTargetAtTime(f, this.ctx!.currentTime, 0.08);
    this.engineOscs[1].frequency.setTargetAtTime(f / 2, this.ctx!.currentTime, 0.08);
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(0.045 + norm * 0.05, this.ctx!.currentTime, 0.1);
  }

  stopEngine(): void {
    for (const o of this.engineOscs) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
      o.disconnect();
    }
    this.engineOscs = [];
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
  }

  playSiren(): void {
    if (!this.ctx || this.sirenGain) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 680;
    const lfo = ctx.createOscillator();
    lfo.type = "triangle";
    lfo.frequency.value = 2.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 230;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    osc.start();
    lfo.start();

    this.sirenOscs = [osc, lfo];
    this.sirenGain = gain;
  }

  setSirenVolume(v: number): void {
    if (this.sirenGain) this.sirenGain.gain.value = Math.max(0, Math.min(0.3, v));
  }

  stopSiren(): void {
    for (const o of this.sirenOscs) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
      o.disconnect();
    }
    this.sirenOscs = [];
    if (this.sirenGain) {
      this.sirenGain.disconnect();
      this.sirenGain = null;
    }
  }
}
