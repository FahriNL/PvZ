
import React, { useEffect, useRef, useState } from 'react';

interface AudioManagerProps {
  masterVolume: number;
  musicVolume: number;
}

export const AudioManager: React.FC<AudioManagerProps> = ({ masterVolume, musicVolume }) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  
  const isPlayingRef = useRef(false);
  
  // Scheduler state
  const nextNoteTimeRef = useRef(0);
  const current16thNoteRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  
  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // s
  const tempo = 128; // Slightly faster, more arcade-like

  // Update Volumes
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(masterVolume, audioCtxRef.current?.currentTime || 0, 0.1);
    }
    if (musicGainRef.current) {
      musicGainRef.current.gain.setTargetAtTime(musicVolume, audioCtxRef.current?.currentTime || 0, 0.1);
    }
  }, [masterVolume, musicVolume]);

  // --- SFX SYNTHESIZERS ---

  const playOscillator = (type: OscillatorType, freqStart: number, freqEnd: number, duration: number, vol: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !sfxGainRef.current) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    osc.connect(gain);
    gain.connect(sfxGainRef.current);
    
    osc.start(t);
    osc.stop(t + duration);
  };

  const playNoise = (duration: number, vol: number, filterFreq: number = 1000) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !sfxGainRef.current) return;
    const t = ctx.currentTime;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainRef.current);

    noise.start(t);
  };

  const handleSFX = (e: CustomEvent) => {
    if (!audioCtxRef.current) return;
    const type = e.detail;

    switch (type) {
      case 'shoot':
        // Retro PEW: Fast pitch drop square wave
        playOscillator('square', 800 + Math.random() * 200, 150, 0.15, 0.1);
        break;
      
      case 'shoot-fire':
        // Lower, buzzier shot
        playOscillator('sawtooth', 600, 100, 0.2, 0.1);
        break;

      case 'hit-flesh':
        // Short thud
        playNoise(0.1, 0.15, 600);
        break;

      case 'hit-metal':
        // Metallic Clang (High pitch ring + noise)
        playOscillator('triangle', 2000, 500, 0.2, 0.1);
        playNoise(0.05, 0.1, 4000);
        break;

      case 'explosion':
        // Boom
        playNoise(0.5, 0.4, 800);
        playOscillator('sawtooth', 100, 30, 0.4, 0.2);
        break;

      case 'powerup':
        // Magical Chime Up
        const ctx = audioCtxRef.current;
        if (ctx && sfxGainRef.current) {
          const now = ctx.currentTime;
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0.1, now + i * 0.05);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.3);
            osc.connect(g);
            g.connect(sfxGainRef.current!);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.3);
          });
        }
        break;

      case 'levelup':
        // Fanfare
        if (audioCtxRef.current && sfxGainRef.current) {
             const n = audioCtxRef.current.currentTime;
             playOscillator('square', 440, 440, 0.1, 0.2); // A4
             setTimeout(() => playOscillator('square', 554, 554, 0.1, 0.2), 100); // C#5
             setTimeout(() => playOscillator('square', 659, 659, 0.4, 0.2), 200); // E5
        }
        break;
        
      case 'gameover':
        // Sad slide
        playOscillator('sawtooth', 300, 50, 1.5, 0.3);
        break;
        
      case 'ui-click':
        playOscillator('sine', 800, 1200, 0.05, 0.05);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('terraplane-sfx' as any, handleSFX as any);
    return () => window.removeEventListener('terraplane-sfx' as any, handleSFX as any);
  }, []);


  // --- MUSIC SEQUENCER ---

  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioCtxRef.current || !musicGainRef.current) return;
    const ctx = audioCtxRef.current;

    const bar = Math.floor(beatNumber / 16);
    const step = beatNumber % 16;

    // --- DRUMS ---
    // Kick: 4 on the floor + syncopation
    if (step === 0 || step === 4 || step === 8 || step === 12) {
      // Kick
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      g.gain.setValueAtTime(0.7, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.connect(g);
      g.connect(musicGainRef.current);
      osc.start(time);
      osc.stop(time + 0.5);
    }
    
    // Snare
    if (step === 4 || step === 12) {
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 1000;
        g.gain.setValueAtTime(0.4, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        noise.connect(f);
        f.connect(g);
        g.connect(musicGainRef.current);
        noise.start(time);
    }

    // HiHat
    if (step % 2 === 0) {
       const osc = ctx.createOscillator();
       osc.type = 'square'; // Metallic
       const g = ctx.createGain();
       const f = ctx.createBiquadFilter();
       f.type = 'highpass';
       f.frequency.value = 8000;
       
       // Open hat on off-beat
       const dur = (step === 2 || step === 6 || step === 10 || step === 14) ? 0.1 : 0.03;
       
       osc.frequency.value = 400; // Actually noise-ish due to filter
       // Actually simpler to use noise for hats but square highpass works for chiptune feel
       
       g.gain.setValueAtTime(step % 4 === 2 ? 0.2 : 0.1, time);
       g.gain.exponentialRampToValueAtTime(0.01, time + dur);
       
       osc.connect(f);
       f.connect(g);
       g.connect(musicGainRef.current);
       osc.start(time);
       osc.stop(time + dur);
    }

    // --- BASS (Spooky Funk) ---
    // Progression: Am - F - Dm - E7 (Classic spooky)
    const notes: Record<string, number> = {
        'A1': 55, 'A2': 110, 'C2': 65.4, 'C3': 130.8, 'E2': 82.4, 'E3': 164.8,
        'F1': 43.6, 'F2': 87.3, 'D2': 73.4, 'G2': 98, 'B1': 61.7, 'G#2': 103.8
    };
    
    let note = 0;
    // Bar 0: Am
    if (bar % 4 === 0) {
        if (step === 0 || step === 6) note = notes['A1'];
        if (step === 2 || step === 10) note = notes['A2'];
        if (step === 4 || step === 12) note = notes['E2'];
        if (step === 14) note = notes['C3'];
    }
    // Bar 1: F
    else if (bar % 4 === 1) {
        if (step === 0) note = notes['F1'];
        if (step === 2 || step === 10) note = notes['F2'];
        if (step === 4 || step === 12) note = notes['C3'];
        if (step === 14) note = notes['A2'];
    }
    // Bar 2: Dm
    else if (bar % 4 === 2) {
        if (step === 0) note = notes['D2'];
        if (step === 2) note = notes['A2'];
        if (step === 4) note = notes['F2'];
        if (step === 8) note = notes['D2'];
        if (step === 14) note = notes['F2'];
    }
    // Bar 3: E7
    else if (bar % 4 === 3) {
        if (step === 0) note = notes['E2'];
        if (step === 2) note = notes['B1'];
        if (step === 4) note = notes['E3'];
        if (step === 8) note = notes['G#2'];
        if (step === 12) note = notes['B1'];
    }

    if (note) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        
        osc.frequency.value = note;
        
        // Envelope
        g.gain.setValueAtTime(0.4, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
        
        // Filter Envelope (Acid-ish)
        f.frequency.setValueAtTime(200, time);
        f.frequency.linearRampToValueAtTime(800, time + 0.05);
        f.frequency.exponentialRampToValueAtTime(200, time + 0.2);
        
        osc.connect(f);
        f.connect(g);
        g.connect(musicGainRef.current);
        osc.start(time);
        osc.stop(time + 0.3);
    }
  };

  const scheduler = () => {
    if (!isPlayingRef.current || !audioCtxRef.current) return;
    
    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
        scheduleNote(current16thNoteRef.current, nextNoteTimeRef.current);
        const secondsPerBeat = 60.0 / tempo;
        nextNoteTimeRef.current += 0.25 * secondsPerBeat;
        current16thNoteRef.current++;
        if (current16thNoteRef.current >= 16 * 4) { // 4 bars loop
            current16thNoteRef.current = 0;
        }
    }
    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  };

  const startMusic = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      
      const master = audioCtxRef.current.createGain();
      master.gain.value = masterVolume;
      master.connect(audioCtxRef.current.destination);
      masterGainRef.current = master;

      const musicMix = audioCtxRef.current.createGain();
      musicMix.gain.value = musicVolume;
      musicMix.connect(master);
      musicGainRef.current = musicMix;
      
      const sfxMix = audioCtxRef.current.createGain();
      sfxMix.gain.value = 1.0; // Controlled by master mostly, or can add sfxVolume prop
      sfxMix.connect(master);
      sfxGainRef.current = sfxMix;
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.1;
      current16thNoteRef.current = 0;
      scheduler();
    }
  };

  // Handle Autoplay Policy
  useEffect(() => {
    const handleInteract = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        startMusic();
      }
    };

    window.addEventListener('click', handleInteract);
    window.addEventListener('keydown', handleInteract);
    window.addEventListener('mousedown', handleInteract);
    return () => {
        window.removeEventListener('click', handleInteract);
        window.removeEventListener('keydown', handleInteract);
        window.removeEventListener('mousedown', handleInteract);
        if (timerIDRef.current) clearTimeout(timerIDRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [hasInteracted]);

  return null;
};
