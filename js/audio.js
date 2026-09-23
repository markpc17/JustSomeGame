'use strict';
// A quiet generative drone whose chord follows the ship's mood, plus UI blips.

const Audio2 = {
  ctx: null, master: null, voices: [], muted: false, mood: null,

  start() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.06;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 900;
    filter.connect(this.master); this.master.connect(this.ctx.destination);
    for (let i = 0; i < 4; i++) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = i % 2 ? 'sine' : 'triangle';
      o.frequency.value = 110;
      g.gain.value = 0.25;
      const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.03; lg.gain.value = 0.12;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      o.connect(g); g.connect(filter); o.start();
      this.voices.push(o);
    }
    this.setMood('hope');
  },

  // Each dominant emotion gets its own chord
  setMood(k) {
    if (!this.ctx || this.mood === k) return;
    this.mood = k;
    const chords = {
      joy: [220, 277.2, 329.6, 440], hope: [196, 246.9, 293.7, 392], love: [174.6, 220, 261.6, 349.2], wonder: [146.8, 220, 329.6, 440],
      sorrow: [110, 130.8, 164.8, 220], fear: [116.5, 138.6, 164.8, 233.1], anger: [98, 116.5, 146.8, 185], greed: [123.5, 155.6, 185, 246.9],
    };
    const c = chords[k] || chords.hope;
    this.voices.forEach((o, i) => o.frequency.setTargetAtTime(c[i], this.ctx.currentTime, 2.5));
  },

  blip(freq = 660, dur = 0.08) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur + 0.02);
  },

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.06;
    return this.muted;
  },
};
