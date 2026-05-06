// ============================================================
// src/pages/Index.tsx
// ============================================================
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/use-current-user";

type Profile = {
  id: string;
  nickname: string;
  vector: number[] | null;
  priorities: any;
};

const buildFallback = (id: string): Profile => ({
  id,
  nickname: "Guest",
  vector: Array(30).fill(0),
  priorities: {},
});

const isValidVector = (vector: number[] | null | undefined): boolean => {
  if (!vector || !Array.isArray(vector) || vector.length === 0) return false;
  return vector.some((value) => value !== 0);
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, isAuthenticated, isLoading: authLoading } = useCurrentUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // مستخدم غير مسجل → وضع ضيف
        if (!isAuthenticated || !id) {
          const guestId = "guest_" + Math.random().toString(36).substr(2, 8);
          setProfile(buildFallback(guestId));
          setLoading(false);
          return;
        }

        // مستخدم مسجل → جلب Profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          setProfile(buildFallback(id));
          setLoading(false);
          return;
        }

        const profileData = data as Profile;
        setProfile(profileData);

        // فحص البصمة
        if (!isValidVector(profileData.vector)) {
          navigate("/fingerprint", { replace: true });
          return;
        }

        setLoading(false);
      } catch (e) {
        setProfile(buildFallback(id || "guest_fallback"));
        setLoading(false);
      }
    };

    init();
  }, [authLoading, isAuthenticated, id, navigate]);

  // شاشة تحميل
  if (loading || authLoading || !profile) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#1a0533] to-[#0d001a] flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-pulse">🔮</span>
          <p className="text-purple-300 mt-4 animate-pulse">INITIALIZING SYSTEM...</p>
        </div>
      </main>
    );
  }

  // وضع الضيف أو نجاح التحليل
  const justAnalyzed = location.state?.justAnalyzed;

  if (profile.id.startsWith("guest_") || justAnalyzed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#1a0533] via-[#2d1060] to-[#0d001a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* نجوم */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-60"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-purple-300 rounded-full opacity-40"></div>
          <div className="absolute bottom-40 left-1/4 w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-70"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-200 rounded-full opacity-50"></div>
          <div className="absolute bottom-20 right-10 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          {justAnalyzed ? (
            <>
              <span className="text-6xl">✅</span>
              <h2 className="text-2xl font-bold text-yellow-400 mt-4 mb-2">
                لقد تم تحليل بصمتك بنجاح
              </h2>
              <p className="text-purple-200 mb-2">أهلاً بك يا {profile.nickname}</p>
              <p className="text-purple-300/70 text-sm mb-8">
                بصمتك النفسية محفوظة في الفضاء
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/matches")}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:from-purple-500 hover:to-purple-400 transition"
                >
                  🔍 اكتشف توأمك
                </button>
                <button
                  onClick={() => setProfile({ ...profile, id: profile.id })}
                  className="w-full py-3 px-6 rounded-xl border border-purple-500/50 text-purple-300 hover:bg-purple-500/10 transition"
                >
                  أو تصفح رسائلك لاحقاً
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-6xl">🔮</span>
              <h1 className="text-4xl font-bold mt-4 mb-2">
                <span className="bg-gradient-to-r from-purple-300 via-purple-100 to-yellow-400 bg-clip-text text-transparent">
                  Twin Soul Connect
                </span>
              </h1>
              <p className="text-yellow-400/80 text-lg mb-2">التـوأم الرقمـي</p>
              <p className="text-purple-300/70 mb-8">
                اكتشف توأم روحك الرقمي من خلال تحليل البصمة النفسية
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-400 transition text-lg font-semibold"
              >
                تسجيل الدخول
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  // مستخدم مسجل + بصمة صالحة → شاشة الرسائل
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a0533] to-[#0d001a]">
      <p className="text-white text-center pt-20">Messages Screen (تحت الإنشاء)</p>
    </main>
  );
};

export default Index;
