import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/lib/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import MessagesScreen from "@/components/MessagesScreen";
import MatchesScreen from "@/components/MatchesScreen";
import AnalysisSuccess from "@/components/AnalysisSuccess";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";
import { useT } from "@/i18n/LanguageContext";

type Profile = {
  id: string;
  nickname: string;
  vector: number[];
  priorities: any;
};

const buildFallback = (id: string): Profile => ({
  id,
  nickname: "Guest",
  vector: Array(30).fill(0),
  priorities: {},
});

const Index = () => {
  const navigate = useNavigate();
  const { id, isAuthenticated, isLoading: authLoading, logout } = useCurrentUser();
  const { t } = useT();
  const [me, setMe] = useState<Profile | null>(null);
  const [view, setView] = useState<"messages" | "matches" | "success">("messages");
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const initialized = useRef(false);

  useGlobalMessageNotifications(me?.id ?? null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !id) {
      navigate("/auth", { replace: true });
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!data) {
          navigate("/fingerprint", { replace: true });
          return;
        }

        setMe(data as Profile);
        setPriorities((data.priorities as Record<string, number>) ?? {});

        // إن جاء من صفحة البصمة لتوّه بعد التحليل، أظهر شاشة النجاح
        const state = (window.history.state && window.history.state.usr) || {};
        if (state.justAnalyzed) setView("success");
      } catch (e) {
        console.error("Init error:", e);
      }
    };

    init();
  }, [authLoading, isAuthenticated, id, navigate]);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me) {
      await supabase.from("profiles").update({ priorities: p }).eq("id", me.id);
    }
  };

  const onLogout = async () => {
    await logout();
  };

  if (authLoading || !me) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
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
            onLogout={onLogout}
          />
        ) : view === "messages" ? (
          <MessagesScreen
            meId={me.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => navigate("/fingerprint")}
            onLogout={onLogout}
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
