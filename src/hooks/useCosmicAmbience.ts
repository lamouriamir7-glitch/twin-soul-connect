import { useCallback, useEffect, useRef, useState } from "react";

/**
 * موسيقى تأملية دافئة مولّدة عبر Web Audio API.
 * بدون أي حقوق ملكية — كل النغمات تُولَّد رياضياً في المتصفح.
 * نغمات ناعمة دافئة، بدون حدة، بدون تشويش.
 */
export const useCosmicAmbience = () => {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  const stop = useCallback(() => {
    nodesRef.current?.stop();
    nodesRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(async () => {
    if (nodesRef.current) return;
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();

    // ماستر هادئ جداً
    const master = ctx.createGain();
    master.gain.value = 0;

    // فلتر منخفض على المخرج كله — يقتل أي حدة
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = "lowpass";
    masterFilter.frequency.value = 900; // قطع الترددات العالية الحادة
    masterFilter.Q.value = 0.5;

    masterFilter.connect(master);
    master.connect(ctx.destination);

    // Reverb طويل ناعم
    const convolver = ctx.createConvolver();
    const irLength = ctx.sampleRate * 4;
    const ir = ctx.createBuffer(2, irLength, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < irLength; i++) {
        // ضوضاء ناعمة جداً مع انحلال أسي
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLength, 3.5) * 0.7;
      }
    }
    convolver.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.6;
    convolver.connect(wet).connect(masterFilter);

    const dry = ctx.createGain();
    dry.gain.value = 0.5;
    dry.connect(masterFilter);

    // مقام دافئ — C major مفتوح، نغمات منخفضة فقط
    // C2, G2, C3, E3, G3 — تجنّب النغمات العالية والتنافر
    const voices = [
      { freq: 65.41, gain: 0.06, type: "sine" as OscillatorType },   // C2
      { freq: 98.0,  gain: 0.05, type: "sine" as OscillatorType },   // G2
      { freq: 130.81, gain: 0.045, type: "sine" as OscillatorType }, // C3
      { freq: 196.0,  gain: 0.035, type: "sine" as OscillatorType }, // G3
      { freq: 261.63, gain: 0.025, type: "sine" as OscillatorType }, // C4
    ];

    const oscs: OscillatorNode[] = [];
    const lfos: OscillatorNode[] = [];

    voices.forEach((v, i) => {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.value = v.freq;
      // detune خفيف جداً — لا اهتزاز قوي
      osc.detune.value = (Math.random() - 0.5) * 3;

      const g = ctx.createGain();
      g.gain.value = 0;

      // فلتر منفصل لكل صوت لتنعيم أكثر
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 600 + i * 80;
      f.Q.value = 0.4;

      // LFO بطيء جداً — تنفس لطيف بدلاً من اهتزاز
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.025 + i * 0.008; // أبطأ بكثير
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = v.gain * 0.3; // عمق أقل
      lfo.connect(lfoGain).connect(g.gain);
      g.gain.value = v.gain;

      osc.connect(f).connect(g);
      g.connect(dry);
      g.connect(convolver);

      osc.start();
      lfo.start();
      oscs.push(osc);
      lfos.push(lfo);
    });

    // Fade in بطيء جداً — 6 ثوان
    const now = ctx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.22, now + 6);

    nodesRef.current = {
      stop: () => {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 1.5);
        setTimeout(() => {
          oscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {}
          });
          lfos.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {}
          });
          try {
            master.disconnect();
            masterFilter.disconnect();
            convolver.disconnect();
            wet.disconnect();
            dry.disconnect();
          } catch {}
        }, 1700);
      },
    };
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    if (playing) stop();
    else start();
  }, [playing, start, stop]);

  useEffect(() => {
    return () => {
      nodesRef.current?.stop();
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { playing, toggle, start, stop };
};
