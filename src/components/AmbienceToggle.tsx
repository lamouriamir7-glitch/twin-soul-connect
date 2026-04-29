import { Volume2, VolumeX, SkipForward } from "lucide-react";
import { useAmbience } from "@/contexts/AmbienceContext";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const AmbienceToggle = ({ className }: Props) => {
  const { playing, toggle, next, trackTitle } = useAmbience();
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        onClick={toggle}
        aria-label={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
        title={playing ? `إيقاف: ${trackTitle}` : "تشغيل الموسيقى الهادئة"}
        className={cn(
          "transition-colors",
          playing ? "text-gold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {playing ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
      <button
        onClick={next}
        aria-label="تغيير المقطوعة"
        title={`المقطوعة التالية (${trackTitle})`}
        className="text-muted-foreground hover:text-gold transition-colors"
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
};

export default AmbienceToggle;
