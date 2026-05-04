import { Globe } from "lucide-react";
import { useT } from "@/i18n/LanguageContext";
import { LANGUAGES, Lang } from "@/i18n/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "icon" | "full";
  className?: string;
}

export const LanguageSelector = ({ variant = "icon", className }: Props) => {
  const { lang, setLang, t } = useT();
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 backdrop-blur px-3 py-1.5 text-xs hover:border-primary/60 transition",
          className
        )}
        aria-label={t("language")}
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="font-display">{variant === "full" ? current?.label : current?.code.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur border-border z-50">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code as Lang)}
            className={cn(
              "cursor-pointer font-display gap-2",
              l.code === lang && "text-primary"
            )}
          >
            <span className="text-xs opacity-60 w-6">{l.code.toUpperCase()}</span>
            <span>{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
