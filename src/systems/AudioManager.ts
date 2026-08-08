export class AudioManager {
  private ctx: AudioContext | null = null;
  private sirenGain: GainNode | null = null;
  private sirenOscs: OscillatorNode[] = [];

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
    }
  }

  resume(): void {
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
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
