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
    // 1. إذا كان النظام لا يزال يتأكد من هويتك، انتظر.
    if (authLoading) return;

    // 2. إذا لم تكن مسجلاً، اذهب لصفحة الدخول.
    if (!isAuthenticated || !msUserId) {
      navigate("/auth", { replace: true });
      return;
    }

    const init = async () => {
      try {
        // 3. جلب البيانات بالمعرف النصي الجديد
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", msUserId)
          .maybeSingle();

        if (profile) {
          setMe(profile as Profile);
          setPriorities((profile.priorities as Record<string, number>) ?? {});
        } else {
          // 4. إذا لم يجد بروفايل، ننشئه فوراً (هذا هو الإصلاح الجوهري)
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert({ 
              id: msUserId, 
              nickname: "Twin_User", 
              vector: Array(30).fill(0) 
            })
            .select()
            .single();
          
          if (newProfile) setMe(newProfile as Profile);
        }
      } catch (err) {
        console.error("Critical Init Error:", err);
      } finally {
        // 5. أهم سطر: توقف عن إظهار شاشة التحميل مهما حدث
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

  // 6. لا تجعل الشاشة السوداء تسيطر؛ إذا انتهى التحميل، اظهر الواجهة
  if (loading) {
    return (
      <main className="starfield min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-shimmer">{t("twin_awakening")}</p>
      </main>
    );
  }

  // إذا وصلنا هنا ولم يجهز 'me' بعد، نستخدم بروفايل مؤقت لكي لا ينهار التطبيق
  const activeMe = me || { id: msUserId || "", nickname: "User", vector: [], priorities: {} };

  return (
    <main className="starfield min-h-screen px-4 py-8 relative">
      <div className="relative z-10 max-w-3xl mx-auto">
        {view === "success" ? (
          <AnalysisSuccess
            nickname={activeMe.nickname}
            onOpenMatches={() => setView("matches")}
            onOpenMessages={() => setView("messages")}
            onLogout={onLogout}
          />
        ) : view === "messages" ? (
          <MessagesScreen
            meId={activeMe.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => setView("success")}
            onLogout={onLogout}
          />
        ) : (
          <MatchesScreen
            me={activeMe as Profile}
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
