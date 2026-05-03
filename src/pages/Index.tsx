import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { supabase } from "@/integrations/supabase/client";
import MessagesScreen from "@/components/MessagesScreen";
import MatchesScreen from "@/components/MatchesScreen";
import AnalysisSuccess from "@/components/AnalysisSuccess";
import { toast } from "sonner";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";

type Profile = { id: string; nickname: string; vector: number[]; priorities: any };

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, user, logout: auth0Logout } = useAuth0();
  const justAnalyzed = (location.state as { justAnalyzed?: boolean } | null)?.justAnalyzed === true;
  const [me, setMe] = useState<Profile | null>(null);
  const [view, setView] = useState<"messages" | "matches" | "success">(
    justAnalyzed ? "success" : "messages"
  );
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      navigate("/auth", { replace: true });
      return;
    }
    const init = async () => {
      // البحث عن البروفايل عبر البريد الإلكتروني (مخزن في nickname كـ fallback)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, nickname, vector, priorities")
        .eq("nickname", user.email ?? user.sub ?? "")
        .maybeSingle();
      if (!profile) {
        navigate("/fingerprint", { replace: true });
        return;
      }
      setMe({
        id: profile.id,
        nickname: profile.nickname,
        vector: profile.vector as unknown as number[],
        priorities: profile.priorities ?? {},
      });
      setPriorities((profile.priorities as Record<string, number>) ?? {});
      setLoading(false);
    };
    init();
  }, [authLoading, isAuthenticated, user, navigate]);

  useGlobalMessageNotifications(me?.id ?? null);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me) await supabase.from("profiles").update({ priorities: p }).eq("id", me.id);
  };

  const logout = async () => {
    await auth0Logout({ logoutParams: { returnTo: window.location.origin + "/auth" } });
    toast.success("إلى لقاء آخر");
  };

  if (loading || !me) {
    return (
      <main className="starfield min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-shimmer font-display">
          يستيقظ توأمك...
        </p>
      </main>
    );
  }

  return (
    <main className="starfield min-h-screen px-4 py-8 relative">
      <div className="relative z-10 max-w-3xl mx-auto">
        {view === "success" ? (
          <AnalysisSuccess
            nickname={me.nickname}
            onOpenMatches={() => setView("matches")}
            onOpenMessages={() => setView("messages")}
            onLogout={logout}
          />
        ) : view === "messages" ? (
          <MessagesScreen
            meId={me.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => navigate("/fingerprint")}
            onLogout={logout}
          />
        ) : (
          <MatchesScreen
            me={me}
            priorities={priorities}
            onPrioritiesChange={savePriorities}
            onBack={() => setView("messages")}
          />
        )}
      </div>
    </main>
  );
};

export default Index;
