// ============================================================
// src/pages/Index.tsx
// ============================================================
// ميكانيكا الملف (Developer Notes):
// ------------------------------------------------------------
// هذا الملف هو "بوابة العبور" (Guard) للتطبيق.
// منطقه كالتالي:
//
// 1. Default State: المتجه يبدأ بـ 30 صفراً [0,0,0...].
// 2. The Check:
//    - إذا كان vector === null أو كل قيمه أصفار
//      → المستخدم جديد أو لم يحلل بصمته بعد.
// 3. Action:
//    - توجيه إجباري إلى "/fingerprint".
//    - قفل واجهة المراسلة (Messages) حتى تكتمل البصمة.
// 4. إذا كان vector يحوي قيماً حقيقية:
//    - عرض شاشة المراسلة (MessagesScreen).
//
// حالات إضافية:
// - مستخدم غير مسجل → وضع ضيف مع زر تسجيل الدخول.
// - أثناء التحميل → شاشة "INITIALIZING SYSTEM...".
// ============================================================

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/use-current-user";
import MessagesScreen from "@/components/MessagesScreen";

// ----------------------------------------------------
// أنواع البيانات
// ----------------------------------------------------
type Profile = {
  id: string;
  nickname: string;
  vector: number[] | null;
  priorities: any;
};

// ----------------------------------------------------
// دوال مساعدة
// ----------------------------------------------------

// بناء Profile للزائر (ضيف)
const buildFallback = (id: string): Profile => ({
  id,
  nickname: "Guest",
  vector: Array(30).fill(0), // 30 صفراً
  priorities: {},
});

// فحص: هل المتجه صالح (يحتوي على قيم حقيقية غير صفرية)؟
// هذه الدالة هي قلب البوابة المنطقية.
const isValidVector = (vector: number[] | null | undefined): boolean => {
  // null أو undefined → غير صالح
  if (!vector || !Array.isArray(vector)) return false;

  // مصفوفة فارغة → غير صالح
  if (vector.length === 0) return false;

  // هل هناك أي قيمة لا تساوي صفر؟
  // إذا كل القيم 0 → false (توجيه إلى /fingerprint)
  // إذا أي قيمة ≠ 0 → true (عرض Messages)
  return vector.some((value) => value !== 0);
};

// ----------------------------------------------------
// المكون الرئيسي
// ----------------------------------------------------
const Index = () => {
  const navigate = useNavigate();
  const { id, isAuthenticated, isLoading: authLoading } = useCurrentUser();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // useRef يمنع إعادة التشغيل مرتين (في React Strict Mode)
  const initialized = useRef(false);

  useEffect(() => {
    // ⏳ انتظر حتى ينتهي فحص المصادقة
    if (authLoading) return;

    // 🛑 امنع التشغيل المزدوج
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // --------------------------------------------------
        // الحالة 1: مستخدم غير مسجل → وضع ضيف
        // --------------------------------------------------
        if (!isAuthenticated || !id) {
          const guestId = "guest_" + Math.random().toString(36).substr(2, 8);
          setProfile(buildFallback(guestId));
          setLoading(false);
          return;
        }

        // --------------------------------------------------
        // الحالة 2: مستخدم مسجل → جلب Profile من قاعدة البيانات
        // --------------------------------------------------
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("❌ Profile fetch error:", error);
          // إذا فشل الجلب، نتعامل معه كضيف
          setProfile(buildFallback(id));
          setLoading(false);
          return;
        }

        const profileData = data as Profile;
        setProfile(profileData);

        // --------------------------------------------------
        // الحالة 3: فحص البصمة - The Check
        // --------------------------------------------------
        if (!isValidVector(profileData.vector)) {
          // المتجه صفري أو فارغ → توجيه إجباري لتحليل البصمة
          console.log("🔒 Vector صفري → توجيه إلى /fingerprint");
          navigate("/fingerprint", { replace: true });
          return;
        }

        // --------------------------------------------------
        // الحالة 4: المتجه صالح → جاهز للعرض
        // --------------------------------------------------
        console.log("✅ Vector صالح → عرض MessagesScreen");
        setLoading(false);
      } catch (e) {
        console.error("❌ Init error:", e);
        setProfile(buildFallback(id || "guest_fallback"));
        setLoading(false);
      }
    };

    init();
  }, [authLoading, isAuthenticated, id, navigate]);

  // --------------------------------------------------
  // شاشة التحميل الأولية
  // --------------------------------------------------
  if (loading || authLoading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg animate-pulse">
            INITIALIZING SYSTEM...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // وضع الضيف: شاشة ترحيب مع زر تسجيل الدخول
  // --------------------------------------------------
  if (profile.id.startsWith("guest_")) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl text-white font-bold mb-4">
            Twin Soul Connect
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            اكتشف توأم روحك الرقمي من خلال تحليل البصمة النفسية
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-lg"
          >
            تسجيل الدخول
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // مستخدم مسجل + بصمة صالحة → الواجهة الرئيسية
  // --------------------------------------------------
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
      <MessagesScreen profile={profile} />
    </main>
  );
};

export default Index;
