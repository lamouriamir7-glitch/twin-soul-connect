// ============================================================
// src/pages/Auth.tsx
// ============================================================
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/",
      },
    });
  };

  const continueAsGuest = () => {
    navigate("/", { replace: true });
  };

  // شاشة تحميل
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#1a0533] to-[#0d001a] flex items-center justify-center">
        <p className="text-purple-300 text-lg animate-pulse">جاري التحميل...</p>
      </main>
    );
  }

  // إذا مسجل، لا تعرض شيئاً (سيتم التوجيه)
  if (isAuthenticated) {
    return null;
  }

  // واجهة تسجيل الدخول
  return (
    <main className="starfield min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-[#1a0533] via-[#2d1060] to-[#0d001a] relative overflow-hidden">
      {/* تأثيرات نجوم */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-300 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute bottom-40 left-1/4 w-0.5 h-0.5 bg-yellow-400 rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-200 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* أيقونة */}
        <div className="mb-6">
          <span className="text-6xl">🔮</span>
        </div>

        {/* العنوان الرئيسي */}
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-300 via-purple-100 to-yellow-400 bg-clip-text text-transparent">
            Twin Soul Connect
          </span>
        </h1>

        {/* شعار */}
        <p className="text-yellow-400/80 text-lg mb-2 font-arabic">
          التـوأم الرقمـي
        </p>
        <p className="text-purple-300/70 text-sm mb-8">
          صدى روحك في الكون
        </p>

        {/* بطاقة تسجيل الدخول */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-900/20 backdrop-blur-sm p-6 space-y-4">
          {/* زر جوجل */}
          <button
            onClick={signInWithGoogle}
            className="w-full py-3 px-6 rounded-xl bg-white text-gray-800 font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            الدخول عبر جوجل
          </button>

          {/* فاصل */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-purple-500/30"></div>
            <span className="text-purple-300/50 text-sm">أو</span>
            <div className="flex-1 h-px bg-purple-500/30"></div>
          </div>

          {/* زر الضيف */}
          <button
            onClick={continueAsGuest}
            className="w-full py-3 px-6 rounded-xl border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 transition font-semibold"
          >
            الدخول كضيف
          </button>
        </div>

        {/* اقتباس */}
        <p className="text-purple-400/40 text-xs mt-8 italic">
          «اعرف نفسك بنفسك» — سقراط
        </p>
      </div>
    </main>
  );
}
