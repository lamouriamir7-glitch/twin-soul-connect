import { Button } from "@/components/ui/button";
import { Sparkles, Search, CheckCircle2, MessageCircle, LogOut } from "lucide-react";
import { WisdomBox } from "@/components/WisdomBox";
import { AppTitle } from "@/components/AppTitle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useT } from "@/i18n/LanguageContext";

interface Props {
  nickname: string;
  onOpenMatches: () => void;
  onOpenMessages: () => void;
  onLogout: () => void;
}

export default function AnalysisSuccess({
  nickname,
  onOpenMatches,
  onOpenMessages,
  onLogout,
}: Props) {
  const { t } = useT();
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-2">
        <AppTitle size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive transition"
            title={t("logout")}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <section className="text-center pt-8 pb-4 space-y-5">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl animate-pulse" />
          <CheckCircle2 className="w-20 h-20 text-gold relative animate-float-slow" />
        </div>

        <h2
          className="font-display text-3xl md:text-4xl text-gradient-primary mx-auto max-w-xl px-2 py-1"
          style={{ lineHeight: 1.6 }}
        >
          {t("fingerprint_analyzed")}
        </h2>

        <div className="space-y-2 max-w-md mx-auto px-4">
          <p className="text-foreground/90 text-base md:text-lg leading-loose">
            {t("welcome_user")} <span className="text-gold font-display font-bold">{nickname}</span>
          </p>
          <p className="text-muted-foreground text-sm md:text-base leading-loose">
            {t("fingerprint_saved")}
          </p>
          <p className="text-muted-foreground text-sm md:text-base leading-loose">
            {t("next_step_discover")}
          </p>
        </div>
      </section>

      <div className="flex flex-col items-center gap-4 pt-2">
        <Button
          onClick={onOpenMatches}
          className="relative overflow-hidden font-display gap-3 h-16 px-10 text-lg text-[hsl(38_70%_15%)] border-0 animate-pulse-gold tracking-wider rounded-2xl"
          style={{
            background: "var(--gradient-gold)",
            boxShadow:
              "0 0 32px hsl(var(--gold) / 0.7), 0 0 64px hsl(var(--gold-glow) / 0.45), inset 0 1px 0 hsl(45 100% 85% / 0.6)",
          }}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-bold">{t("discover_my_twins")}</span>
          <Search className="w-5 h-5" />
        </Button>

        <button
          onClick={onOpenMessages}
          className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-2 mt-2"
        >
          <MessageCircle className="w-4 h-4" />
          {t("or_browse_later")}
        </button>
      </div>

      <WisdomBox />
    </div>
  );
}
