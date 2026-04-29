import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

const STORAGE_KEY = "cosmic-ambience-enabled";

// مقطوعات هادئة جداً من Wikimedia Commons (Public Domain / CC)
// كلها بطيئة، بدون ذروات صاخبة، تحفز الاسترخاء
const TRACKS = [
  // Gymnopédie No. 1 - Erik Satie (بيانو، الأكثر هدوءاً على الإطلاق)
  "https://upload.wikimedia.org/wikipedia/commons/b/b7/Gymnopedie_No._1..ogg",
  // Clair de Lune - Debussy (بيانو حالم)
  "https://upload.wikimedia.org/wikipedia/commons/b/be/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg",
];

type Ctx = {
  playing: boolean;
  toggle: () => void;
};

const AmbienceContext = createContext<Ctx>({ playing: false, toggle: () => {} });

export const useAmbience = () => useContext(AmbienceContext);

export const AmbienceProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const trackIdxRef = useRef(0);

  useEffect(() => {
    const audio = new Audio(TRACKS[0]);
    audio.loop = true;
    audio.volume = 0.28;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    audio.onerror = () => {
      const next = (trackIdxRef.current + 1) % TRACKS.length;
      trackIdxRef.current = next;
      audio.src = TRACKS[next];
      if (playing) audio.play().catch(() => {});
    };

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <AmbienceContext.Provider value={{ playing, toggle }}>
      {children}
    </AmbienceContext.Provider>
  );
};
