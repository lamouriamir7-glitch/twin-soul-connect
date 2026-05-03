import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { WisdomBox } from "@/components/WisdomBox";
import { Brain } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const signInWithGoogle = async () => {
    await loginWithRedirect({
      authorizationParams: {
        connection: "google-oauth2",
        redirect_uri: window.location.origin,
      },
    });
  };

  return (
    <main className="starfield min-h-screen flex items-center justify-center px-4 py-10 relative">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/40 mb-4 shadow-violet-glow animate-float-slow">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl title-gold-glow mb-2">
            التوأم الرقمي
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            ابحث عن صدى روحك في الكون
          </p>
        </div>

        <div className="rounded-2xl border border-gold/40 bg-card/60 backdrop-blur-xl p-6 shadow-gold-glow space-y-4">
          <Button
            type="button"
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full hover:opacity-90 text-background font-display tracking-wider shadow-gold-glow"
            style={{ background: "var(--gradient-gold)" }}
          >
            {isLoading ? "جارٍ الاتصال..." : "الدخول عبر جوجل ✦"}
          </Button>
        </div>

        <WisdomBox />
      </div>
    </main>
  );
}
