import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cosmic-ambience-enabled";

// مصادر مجانية بالكامل من Wikimedia Commons (Public Domain)
// كمان كلاسيكي تأملي بطيء
const TRACKS = [
  "https://upload.wikimedia.org/wikipedia/commons/5/55/Vivaldi_-_Four_Seasons_2_Summer_mvt_2_Adagio_-_John_Harrison_violin.oga",
  "https://upload.wikimedia.org/wikipedia/commons/0/07/Elman_74341_NR.ogg",
];

const CosmicAmbience = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);

  // إنشاء عنصر الصوت مرة واحدة
  useEffect(() => {
    const audio = new Audio(TRACKS[0]);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    // عند فشل التحميل، جرّب المسار التالي
    audio.onerror = () => {
      setTrackIdx((i) => {
        const next = (i + 1) % TRACKS.length;
        audio.src = TRACKS[next];
        if (playing) audio.play().catch(() => {});
        return next;
      });
    };

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تشغيل تلقائي بعد أول تفاعل من المستخدم
  useEffect(() => {
    const wasDisabled = localStorage.getItem(STORAGE_KEY) === "false";
    if (wasDisabled) return;

    const handler = () => {
      const a = audioRef.current;
      if (!a) return;
      a.play()
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

  const handleToggle = () => {
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
    <button
      onClick={handleToggle}
      aria-label={playing ? "إيقاف الموسيقى التأملية" : "تشغيل الموسيقى التأملية"}
      title={playing ? "إيقاف الموسيقى" : "تشغيل موسيقى الكمان"}
      className={cn(
        "fixed top-4 right-4 z-50 h-10 w-10 rounded-full",
        "flex items-center justify-center",
        "border border-gold/40 backdrop-blur-md",
        "bg-background/50 hover:bg-background/70",
        "transition-all duration-500",
        playing
          ? "shadow-[0_0_18px_hsl(var(--gold)/0.5)] text-gold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {playing ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </button>
  );
};

export default CosmicAmbience;
