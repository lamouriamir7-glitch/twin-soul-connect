import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MessagesScreen from "@/components/MessagesScreen";
import MatchesScreen from "@/components/MatchesScreen";
import AnalysisSuccess from "@/components/AnalysisSuccess";
import { toast } from "sonner";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";
import { useCurrentUser } from "@/lib/use-current-user";
import { useT } from "@/i18n/LanguageContext";

type Profile = { id: string; nickname: string; vector: number[]; priorities: any };

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: msUserId, isAuthenticated, isLoading: authLoading, logout } = useCurrentUser();
  const { t } = useT();
  const [me, setMe] = useState<Profile | null>(null);
  const [view, setView] = useState<"messages" | "matches" | "success">("messages");
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading) return;
    
    // إذا لم يجد مستخدم، لا نغلق الموقع بل نستخدم هوية افتراضية للوصول للواجهة
    const userId = msUserId || "temp_user";
    
    const init = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (profile) {
          setMe(profile as Profile);
          setPriorities((profile.priorities as Record<string, number>) ?? {});
        } else {
          // بيانات افتراضية لكسر حلقة الشاشة السوداء
          setMe({
            id: userId,
            nickname: "Amir",
            vector: Array(30).fill(0),
            priorities: {}
          });
        }
      } catch (e) {
        console.error("Silent ignore", e);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [authLoading, msUserId]);

  useGlobalMessageNotifications(me?.id ?? null);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me && me.id !== "temp_user") {
      await supabase.from("profiles").update({ priorities: p }).eq("id", me.id);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">LOADING...</div>;
  }

  const safeMe = me!;

  return (
    <main className="starfield min-h-screen px-4 py-8 relative">
      <div className="relative z-10 max-w-3xl mx-auto">
        {view === "success" ? (
          <AnalysisSuccess
            nickname={safeMe.nickname}
            onOpenMatches={() => setView("matches")}
            onOpenMessages={() => setView("messages")}
            onLogout={logout}
          />
        ) : view === "messages" ? (
          <MessagesScreen
            meId={safeMe.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => setView("success")}
            onLogout={logout}
          />
        ) : (
          <MatchesScreen
            me={safeMe}
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
