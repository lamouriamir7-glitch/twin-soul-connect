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
  const justAnalyzed = (location.state as { justAnalyzed?: boolean } | null)?.justAnalyzed === true;
  const [me, setMe] = useState<Profile | null>(null);
  const [view, setView] = useState<"messages" | "matches" | "success">(
    justAnalyzed ? "success" : "messages"
  );
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !msUserId) {
      navigate("/auth", { replace: true });
      return;
    }

    const init = async () => {
      // 1. محاولة جلب البيانات بالـ ID النصي
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, nickname, vector, priorities")
        .eq("id", msUserId)
        .maybeSingle();

      if (!profile) {
        // 2. بدلاً من الطرد لصفحة fingerprint المكسورة، ننشئ الملف هنا فوراً
        const { data: newProfile, error } = await supabase
          .from("profiles")
          .upsert({ 
            id: msUserId, 
            nickname: "Twin_User",
            vector: Array(30).fill(0) 
          })
          .select()
          .single();

        if (newProfile) {
          setMe(newProfile as Profile);
        }
      } else {
        setMe(profile as Profile);
      }
      setLoading(false);
    };

    init();
  }, [authLoading, isAuthenticated, msUserId, navigate]);

  useGlobalMessageNotifications(me?.id ?? null);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me) await supabase.from("profiles").update({ priorities: p }).eq("id", me.id);
  };

  const onLogout = async () => {
    await logout();
    toast.success(t("bye"));
    navigate("/auth", { replace: true });
  };

  if (loading || !me) {
    return (
      <main className="starfield min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-shimmer font-display">
          {t("twin_awakening")}
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
            onLogout={onLogout}
          />
        ) : view === "messages" ? (
          <MessagesScreen
            meId={me.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => setView("success")}
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
