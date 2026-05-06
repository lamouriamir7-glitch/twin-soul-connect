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
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useGlobalMessageNotifications(me?.id ?? null);

  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      // 1. منطق الضيف: إذا لم يجد Auth، ينشئ هوية ضيف ولا يطردك
      if (!isAuthenticated || !id) {
        if (!me || !me.id.startsWith("guest_")) {
          const guestId = "guest_" + Math.random().toString(36).substr(2, 9);
          setMe(buildFallback(guestId));
        }
        setLoading(false);
        return;
      }

      if (initialized.current) return;
      initialized.current = true;

      // 2. منطق المستخدم المسجل: جلب البيانات من Supabase
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (data) {
          setMe(data as Profile);
          setPriorities((data.priorities as Record<string, number>) ?? {});
          
          // فحص البصمة: إذا كانت أصفار، نرسله للتحليل
          if (!data.vector || data.vector.every((v: number) => v === 0)) {
            navigate("/fingerprint");
          }
        } else {
          // إذا كان مسجلاً ولا يملك بروفايل، ننشئ واحداً افتراضياً ونرسله للتحليل
          navigate("/fingerprint");
        }
      } catch (e) {
        console.error("Init error:", e);
        setMe(buildFallback(id)); // خيار احتياطي عند حدوث خطأ
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [authLoading, isAuthenticated, id, navigate]);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me && !me.id.startsWith("guest_")) {
      await supabase.from("profiles").update({ priorities: p }).eq("id", me.id);
    }
  };

  if (loading || !me) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        <div className="animate-pulse">INITIALIZING SYSTEM...</div>
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
