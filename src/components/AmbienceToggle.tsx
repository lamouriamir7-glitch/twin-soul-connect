import { Volume2, VolumeX } from "lucide-react";
import { useAmbience } from "@/contexts/AmbienceContext";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const AmbienceToggle = ({ className }: Props) => {
  const { playing, toggle, trackTitle } = useAmbience();
  return (
    <button
      onClick={toggle}
      aria-label={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
      title={playing ? `إيقاف: ${trackTitle}` : "تشغيل الموسيقى الهادئة"}
      className={cn(
        "transition-colors",
        playing ? "text-gold" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {playing ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
    </button>
  );
};

export default AmbienceToggle;
