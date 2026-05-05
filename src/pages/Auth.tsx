import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { WisdomBox } from "@/components/WisdomBox";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AppTitle } from "@/components/AppTitle";
import { useT } from "@/i18n/LanguageContext";
import { setGuestActive, ensureGuestId, isGuestActive } from "@/lib/use-current-user";

export default function Auth() {
  const navigate = useNavigate();
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const { t } = useT();

  useEffect(() => {
    if (isAuthenticated || isGuestActive()) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const signInWithGoogle = async () => {
    await loginWithRedirect({
      authorizationParams: {
        connection: "google-oauth2",
        redirect_uri: window.location.origin,
      },
    });
  };

  const continueAsGuest = () => {
    ensureGuestId();
    setGuestActive(true);
    navigate("/", { replace: true });
  };

  return (
    <main className="starfield min-h-screen flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 inset-x-0 flex justify-center z-20">
        <LanguageSelector variant="full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 flex-col items-center gap-3">
          <AppTitle size="lg" />
          <p className="text-muted-foreground text-sm tracking-wide">
            {t("app_subtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-gold/40 bg-card/60 backdrop-blur-xl p-6 shadow-gold-glow space-y-3">
          <Button
            type="button"
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full hover:opacity-90 text-background font-display tracking-wider shadow-gold-glow"
            style={{ background: "var(--gradient-gold)" }}
          >
            {isLoading ? t("connecting") : t("sign_in_google")}
          </Button>

          <Button
            type="button"
            onClick={continueAsGuest}
            variant="outline"
            className="w-full border-primary/40 hover:border-primary font-display"
          >
            {t("continue_as_guest")}
          </Button>
        </div>

        <WisdomBox />
      </div>
    </main>
  );
}
