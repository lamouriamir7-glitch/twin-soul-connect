// ============================================================
// src/pages/Auth.tsx
// ============================================================
// ميكانيكا الملف (Developer Notes):
// ------------------------------------------------------------
// صفحة تسجيل الدخول. تقوم بـ:
// 1. فحص حالة المصادقة من useCurrentUser.
// 2. إذا كان المستخدم مسجلاً بالفعل → توجيه فوري للرئيسية.
// 3. عرض زر "تسجيل الدخول بـ Google" عبر Supabase OAuth.
// 4. عرض شاشة تحميل أثناء فحص الجلسة لمنع الـ Flash.
// ============================================================

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/use-current-user";

export default function Auth() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useCurrentUser();

  // إذا كان المستخدم مسجلاً بالفعل، وجهه للرئيسية
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // تسجيل الدخول بـ Google عبر Supabase
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // بعد تسجيل الدخول، يعود المستخدم لنفس التطبيق
        redirectTo: window.location.origin,
      },
    });
  };

  // ⏳ عرض شاشة تحميل أثناء فحص الجلسة
  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg animate-pulse">جاري التحميل...</p>
      </main>
    );
  }

  // ✅ إذا تم التحقق من أنه مسجل، لا تعرض شيئاً (سيتم التوجيه)
  if (isAuthenticated) {
    return null;
  }

  // 🔓 واجهة تسجيل الدخول
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* العنوان */}
        <h1 className="text-4xl font-bold text-white mb-2">
          Twin Soul Connect
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          اكتشف توأم روحك الرقمي
        </p>

        {/* بطاقة تسجيل الدخول */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-8">
          <Button
            onClick={signInWithGoogle}
            className="w-full"
            type="button"
          >
            تسجيل الدخول بـ Google
          </Button>
        </div>
      </div>
    </main>
  );
}
