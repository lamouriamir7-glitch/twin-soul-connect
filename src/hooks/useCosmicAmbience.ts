import { useCallback, useEffect, useRef, useState } from "react";

/**
 * موسيقى تأملية كونية مولّدة عبر Web Audio API.
 * بدون أي حقوق ملكية — كل النغمات تُولَّد رياضياً في المتصفح.
 * نغمات Drone بطيئة + تذبذبات نجمية + تردد Pad أثيري.
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

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Reverb بسيط عبر convolver مع ضوضاء مولّدة
    const convolver = ctx.createConvolver();
    const irLength = ctx.sampleRate * 3;
    const ir = ctx.createBuffer(2, irLength, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < irLength; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLength, 2.5);
      }
    }
    convolver.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    convolver.connect(wet).connect(master);

    const dry = ctx.createGain();
    dry.gain.value = 0.45;
    dry.connect(master);

    // Drone أساسي — تردد منخفض يوحي بعمق الكون
    // مقام تأملي: D (ري) — D2, A2, F3, A3, C4, E4
    const freqs = [73.42, 110.0, 174.61, 220.0, 261.63, 329.63];
    const oscs: OscillatorNode[] = [];
    const lfos: OscillatorNode[] = [];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i < 2 ? "sine" : i < 4 ? "triangle" : "sine";
      osc.frequency.value = f;

      // detune بسيط حي
      osc.detune.value = (Math.random() - 0.5) * 8;

      const g = ctx.createGain();
      g.gain.value = 0;

      // فلتر منخفض لجعل الصوت أثيرياً
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200 + i * 200;
      filter.Q.value = 0.8;

      // LFO على الـ gain — تنفس بطيء كأمواج كونية
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.04 + i * 0.015; // بطيء جداً
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.045;
      lfo.connect(lfoGain).connect(g.gain);

      osc.connect(filter).connect(g);
      g.connect(dry);
      g.connect(convolver);

      osc.start();
      lfo.start();
      oscs.push(osc);
      lfos.push(lfo);

      // قيمة أساس للـ gain (مع LFO يضيف إليها)
      g.gain.value = 0.05 + (i < 2 ? 0.04 : 0);
    });

    // ومضات نجمية عشوائية — نغمات عالية تظهر وتختفي
    const sparkleInterval = setInterval(() => {
      if (!nodesRef.current) return;
      const now = ctx.currentTime;
      const star = ctx.createOscillator();
      star.type = "sine";
      // نغمات من السلم: D5, F5, A5, C6, E6
      const starFreqs = [587.33, 698.46, 880.0, 1046.5, 1318.51];
      star.frequency.value =
        starFreqs[Math.floor(Math.random() * starFreqs.length)];
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0, now);
      sg.gain.linearRampToValueAtTime(0.025, now + 1.5);
      sg.gain.linearRampToValueAtTime(0, now + 5);
      star.connect(sg);
      sg.connect(convolver);
      star.start(now);
      star.stop(now + 5.2);
    }, 4500);

    // Fade in بطيء
    const now = ctx.currentTime;
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.35, now + 4);

    nodesRef.current = {
      stop: () => {
        clearInterval(sparkleInterval);
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0, t + 1.2);
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
            convolver.disconnect();
            wet.disconnect();
            dry.disconnect();
          } catch {}
        }, 1400);
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
