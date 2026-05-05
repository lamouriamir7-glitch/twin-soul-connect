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
      try {
        // محاولة جلب البيانات
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", msUserId)
          .maybeSingle();

        if (profile) {
          setMe({
            ...profile,
            vector: Array.isArray(profile.vector) ? profile.vector : Array(30).fill(0)
          } as Profile);
          setPriorities((profile.priorities as Record<string, number>) ?? {});
        } else {
          // إذا لم يجد شيئاً، لا ننتظر؛ ننشئ هوية محلية فوراً
          const fallbackProfile = { 
            id: msUserId, 
            nickname: "Amir_Twin", 
            vector: Array(30).fill(0), 
            priorities: {} 
          };
          setMe(fallbackProfile);
          
          // محاولة الحفظ في الخلفية دون تعطيل الواجهة
          supabase.from("profiles").upsert(fallbackProfile).then(() => {
             console.log("Profile auto-created in background");
          });
        }
      } catch (err) {
        console.error("Silent recovery:", err);
        // في حالة الخطأ القاتل، اظهر كـ ضيف لكي لا تموت الشاشة
        setMe({ id: msUserId, nickname: "Guest", vector: [], priorities: {} });
      } finally {
        setLoading(false);
      }
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

  // تعديل ثوري: إذا انتهى التحميل، اظهر الواجهة مهما كان وضع 'me'
  if (loading && !me) {
    return (
      <main className="starfield min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-lg tracking-widest">
           {t("twin_awakening") || "INITIALIZING..."}
        </p>
      </main>
    );
  }

  // استخدام بيانات آمنة في حال فشل كل شيء
  const safeMe = me || { id: msUserId || "guest", nickname: "User", vector: [], priorities: {} };

  return (
    <main className="starfield min-h-screen px-4 py-8 relative overflow-x-hidden">
      <div className="relative z-10 max-w-3xl mx-auto">
        {view === "success" ? (
          <AnalysisSuccess
            nickname={safeMe.nickname}
            onOpenMatches={() => setView("matches")}
            onOpenMessages={() => setView("messages")}
            onLogout={onLogout}
          />
        ) : view === "messages" ? (
          <MessagesScreen
            meId={safeMe.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => setView("success")}
            onLogout={onLogout}
          />
        ) : (
          <MatchesScreen
            me={safeMe as Profile}
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
