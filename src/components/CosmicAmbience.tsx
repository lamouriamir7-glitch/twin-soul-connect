import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useCosmicAmbience } from "@/hooks/useCosmicAmbience";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cosmic-ambience-enabled";

const CosmicAmbience = () => {
  const { playing, start, stop } = useCosmicAmbience();
  const [armed, setArmed] = useState(false);

  // عند أول نقرة على الصفحة، شغّل الموسيقى تلقائياً
  // (المتصفحات تمنع التشغيل التلقائي بدون تفاعل)
  useEffect(() => {
    const wasEnabled = localStorage.getItem(STORAGE_KEY);
    if (wasEnabled === "false") return;

    const handler = () => {
      if (!armed) {
        setArmed(true);
        start();
        localStorage.setItem(STORAGE_KEY, "true");
      }
    };
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [armed, start]);

  const handleToggle = () => {
    if (playing) {
      stop();
      localStorage.setItem(STORAGE_KEY, "false");
    } else {
      start();
      setArmed(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={playing ? "إيقاف الموسيقى التأملية" : "تشغيل الموسيقى التأملية"}
      title={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى الكونية"}
      className={cn(
        "fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full",
        "flex items-center justify-center",
        "border border-gold/30 backdrop-blur-md",
        "bg-background/40 hover:bg-background/60",
        "transition-all duration-500",
        playing
          ? "shadow-[0_0_18px_hsl(var(--gold)/0.45)] text-gold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {playing ? (
        <Volume2 className="h-4 w-4 animate-pulse-gold" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      {playing && (
        <span className="absolute inset-0 rounded-full border border-gold/20 animate-ping" />
      )}
    </button>
  );
};

export default CosmicAmbience;
