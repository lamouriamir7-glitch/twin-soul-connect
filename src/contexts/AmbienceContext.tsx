import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

const STORAGE_KEY = "cosmic-ambience-enabled";
const TRACK_KEY = "cosmic-ambience-track";

// خمس مقطوعات هادئة وصافية من Public Domain (Musopen / Wikimedia Commons / Internet Archive)
// كلها بطيئة، شاعرية، بدون ذروات صاخبة، تسجيلات نظيفة بدون تشويش
export const TRACKS: { title: string; url: string }[] = [
  {
    title: "Bach – Prelude in C (بيانو هادئ)",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/61/Wtk1-prelude01.ogg/Wtk1-prelude01.ogg.mp3",
  },
  {
    title: "Chopin – Nocturne Op.9 No.2",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c3/Frederic_Chopin_-_nocturne_op_9_no_2.ogg/Frederic_Chopin_-_nocturne_op_9_no_2.ogg.mp3",
  },
  {
    title: "Debussy – Rêverie",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3d/Debussy_-_R%C3%AAverie.ogg/Debussy_-_R%C3%AAverie.ogg.mp3",
  },
  {
    title: "Satie – Gnossienne No.1",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/4/47/Erik_Satie_-_Gnossienne_No._1.ogg/Erik_Satie_-_Gnossienne_No._1.ogg.mp3",
  },
  {
    title: "Schumann – Träumerei",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d3/Schumann_Tr%C3%A4umerei.ogg/Schumann_Tr%C3%A4umerei.ogg.mp3",
  },
];

type Ctx = {
  playing: boolean;
  toggle: () => void;
  next: () => void;
  trackIndex: number;
  trackTitle: string;
};

const AmbienceContext = createContext<Ctx>({
  playing: false,
  toggle: () => {},
  next: () => {},
  trackIndex: 0,
  trackTitle: "",
});

export const useAmbience = () => useContext(AmbienceContext);

export const AmbienceProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem(TRACK_KEY) || "0", 10);
    return isNaN(saved) ? 0 : Math.max(0, Math.min(TRACKS.length - 1, saved));
  });

  // تهيئة عنصر الصوت مرة واحدة
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.28;
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // تحميل المقطوعة عند تغيير الفهرس
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const wasPlaying = playing;
    a.src = TRACKS[trackIndex].url;
    localStorage.setItem(TRACK_KEY, String(trackIndex));
    if (wasPlaying) {
      a.play().catch(() => {});
    }
    a.onerror = () => {
      // الانتقال للمقطوعة التالية تلقائياً عند فشل التحميل
      setTrackIndex((i) => (i + 1) % TRACKS.length);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]);

  // تشغيل تلقائي بعد أول تفاعل
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "false") return;
    const handler = () => {
      audioRef.current
        ?.play()
        .then(() => {
          setPlaying(true);
          localStorage.setItem(STORAGE_KEY, "true");
        })
        .catch(() => {});
    };
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  // إيقاف عند مغادرة التطبيق / استئناف عند العودة
  useEffect(() => {
    const onVisibility = () => {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) {
        if (!a.paused) a.pause();
      } else {
        if (localStorage.getItem(STORAGE_KEY) !== "false" && a.paused) {
          a.play().catch(() => {});
        }
      }
    };
    const onPageHide = () => audioRef.current?.pause();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("blur", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("blur", onPageHide);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      localStorage.setItem(STORAGE_KEY, "false");
    } else {
      a.play()
        .then(() => {
          setPlaying(true);
          localStorage.setItem(STORAGE_KEY, "true");
        })
        .catch(() => {});
    }
  };

  const next = () => {
    setTrackIndex((i) => (i + 1) % TRACKS.length);
    // إن كانت متوقفة، شغّلها عند التبديل
    if (!playing) {
      localStorage.setItem(STORAGE_KEY, "true");
      setPlaying(true);
    }
  };

  return (
    <AmbienceContext.Provider
      value={{ playing, toggle, next, trackIndex, trackTitle: TRACKS[trackIndex].title }}
    >
      {children}
    </AmbienceContext.Provider>
  );
};
