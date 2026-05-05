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

type Profile = { 
  id: string; 
  nickname: string; 
  vector: number[]; 
  priorities: any 
};

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
        // محاولة جلب البروفايل بالـ ID النصي الجديد
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, nickname, vector, priorities")
          .eq("id", msUserId)
          .maybeSingle();

        if (!profile) {
          // إذا لم يجد بروفايل، ننشئه فوراً بالبيانات الأساسية لفتح الموقع
          const defaultVector = Array(30).fill(0);
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .upsert({ 
              id: msUserId, 
              nickname: "Twin_User",
              vector: defaultVector,
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (newProfile) {
            setMe(newProfile as Profile);
            setPriorities((newProfile.priorities as Record<string, number>) ?? {});
          }
        } else {
          // معالجة البيانات القادمة لضمان عدم انهيار الواجهة
          setMe({
            ...profile,
            vector: Array.isArray(profile.vector) ? profile.vector : Array(30).fill(0)
          } as Profile);
          setPriorities((profile.priorities as Record<string, number>) ?? {});
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        // ضمان خروج الموقع من حالة التحميل السوداء مهما حدث
        setLoading(false);
      }
    };

    init();
  }, [authLoading, isAuthenticated, msUserId, navigate]);

  useGlobalMessageNotifications(me?.id ?? null);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me) {
      await supabase.from("profiles").update({ priorities: p }).eq("id", me.id);
    }
  };

  const onLogout = async () => {
    await logout();
    toast.success(t("bye"));
    navigate("/auth", { replace: true });
  };

  // شاشة التحميل (ستختفي فور انتهاء الـ init)
  if (loading) {
    return (
      <main className="starfield min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-shimmer font-display">
          {t("twin_awakening") || "Awakening Your Twin..."}
        </p>
      </main>
    );
  }

  // إذا انتهى التحميل ولم نجد بروفايل (حالة نادرة جداً الآن)، نظهر رسالة خطأ بسيطة بدل الشاشة السوداء
  if (!me) {
    return (
      <main className="starfield min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-red-400 mb-4">Initial setup failed.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/10 rounded-lg"
          >
            Retry Connection
          </button>
        </div>
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
