class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;
  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  private tone(start:number,end:number,duration:number,volume:number,type:OscillatorType='sine') {
    if (!this.enabled) return;
    try { this.initCtx(); if(!this.ctx)return; const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),now=this.ctx.currentTime; osc.type=type;osc.frequency.setValueAtTime(start,now);osc.frequency.exponentialRampToValueAtTime(end,now+duration);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(this.ctx.destination);osc.start(now);osc.stop(now+duration+.01);} catch {}
  }
  playPop(){this.tone(520,1040,.08,.12)}
  playClick(){this.tone(800,200,.03,.06)}
  playChime(){if(!this.enabled)return;[659.25,830.61,987.77].forEach((f,i)=>setTimeout(()=>this.tone(f,f*.999,.3,.06,'triangle'),i*30))}
  playSuccess(){if(!this.enabled)return;[523.25,659.25,783.99,1046.5].forEach((f,i)=>setTimeout(()=>this.tone(f,f*.999,.35,.06),i*60))}
}
export const sounds = new SoundEngine();
