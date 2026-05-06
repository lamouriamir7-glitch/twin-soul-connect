// ============================================================
// src/pages/Fingerprint.tsx
// ============================================================
// ميكانيكا الملف (Developer Notes):
// ------------------------------------------------------------
// هذه الصفحة هي المسؤولة عن "تشفير البصمة النفسية".
// سير العمل:
//
// 1. ينسخ المستخدم الـ Prompt (AI_PROMPT).
// 2. يلصقه في ChatGPT/Claude/Gemini.
// 3. يكتب نصاً حراً يعبر عن أفكاره.
// 4. يستلم Base64 String من الـ AI.
// 5. يلصق الـ Base64 في هذا التطبيق.
// 6. التطبيق يفك التشفير إلى Vector مكون من 30 قيمة.
// 7. يخزن الـ Vector في جدول profiles.
// 8. يعود للمستخدم إلى الصفحة الرئيسية.
//
// الحماية:
// - المستخدم غير المسجل لا يمكنه الوصول (توجيه إلى /auth).
// - الـ Vector يمر عبر processUserVector() للتحقق من صحته.
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/lib/use-current-user";
import { AI_PROMPT, processUserVector } from "@/lib/wind-engine";
import { toast } from "sonner";

// أيقونات (افتراضية بسيطة - استبدلها بمكوناتك الفعلية)
const CopyIcon = () => <span>📋</span>;
const SparklesIcon = () => <span>✨</span>;
const FingerprintIcon = () => <span>🔍</span>;
const ArrowLeftIcon = () => <span>⬅️</span>;

export default function Fingerprint() {
  const navigate = useNavigate();
  const { id: userId, isAuthenticated, isLoading: authLoading } = useCurrentUser();

  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // حماية: تحقق من أن المستخدم مسجل الدخول
  // --------------------------------------------------
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !userId) {
      // غير مسجل → ارجعه لصفحة الدخول
      navigate("/auth", { replace: true });
      return;
    }

    // تحقق إذا كان يحتاج إلى اسم مستعار
    checkIfNeedsNickname();
  }, [authLoading, isAuthenticated, userId]);

  // --------------------------------------------------
  // فحص: هل المستخدم لديه nickname؟
  // --------------------------------------------------
  const checkIfNeedsNickname = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", userId)
        .single();

      if (!data?.nickname || data.nickname === "Unknown") {
        setNeedsNickname(true);
      }
    } catch {
      // إذا لم يوجد profile بعد، يحتاج nickname
      setNeedsNickname(true);
    }
  };

  // --------------------------------------------------
  // نسخ الـ Prompt إلى الحافظة
  // --------------------------------------------------
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      toast.success("✅ تم نسخ النص. ألصقه في ChatGPT أو Claude");
    } catch {
      toast.error("❌ فشل النسخ. انسخ النص يدوياً من الأسفل");
    }
  };

  // --------------------------------------------------
  // إرسال البصمة: فك التشفير + تخزين في Supabase
  // --------------------------------------------------
  const submit = async () => {
    // (1) تحقق من الـ Nickname
    const trimmedNick = nickname.trim();
    if (needsNickname && !trimmedNick) {
      toast.error("⚠️ الرجاء اختيار اسم مستعار أولاً");
      return;
    }

    // (2) تحقق من الكود المدخل
    if (!code.trim()) {
      toast.error("⚠️ الرجاء لصق كود Base64 من الذكاء الاصطناعي");
      return;
    }

    // (3) فك تشفير الـ Vector
    const vector = processUserVector(code.trim());
    if (!vector || vector.length !== 30) {
      toast.error("❌ الكود غير صالح. تأكد من لصق كود Base64 كاملاً");
      return;
    }

    // (4) تأكد أن الـ Vector ليس كله أصفار
    const hasValues = vector.some((v) => v !== 0);
    if (!hasValues) {
      toast.error("❌ البصمة فارغة. أعد المحاولة مع نص أطول");
      return;
    }

    // (5) تخزين في قاعدة البيانات
    setLoading(true);
    try {
      const finalNickname = trimmedNick || "User_" + userId.substring(0, 6);

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          nickname: finalNickname,
          vector: vector,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("✅ تم تسجيل بصمتك النفسية بنجاح!");
      // العودة للرئيسية مع إشارة أن التحليل تم
      navigate("/", { replace: true, state: { justAnalyzed: true } });
    } catch (e: any) {
      console.error("Submit error:", e);
      toast.error("❌ فشل في حفظ البصمة: " + (e.message || "خطأ غير معروف"));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // شاشة تحميل
  // --------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  // --------------------------------------------------
  // الواجهة
  // --------------------------------------------------
  return (
    <main className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-3xl mx-auto">

        {/* ----- شريط علوي: رجوع + لغة ----- */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeftIcon />
            <span>رجوع</span>
          </button>
        </div>

        {/* ----- العنوان ----- */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">
            <FingerprintIcon />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            تحليل البصمة النفسية
          </h1>
          <p className="text-gray-400 max-w-md mx-auto">
            حول شخصيتك إلى مصفوفة رقمية مكونة من 30 بعداً لتجد توأم روحك
          </p>
        </div>

        {/* ----- الخطوات ----- */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <SparklesIcon />
            كيفية الحصول على الكود
          </h2>
          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold text-lg">1.</span>
              <div>
                <p className="font-semibold text-white">انسخ النص التحليلي</p>
                <p className="text-sm text-gray-400">
                  اضغط الزر أدناه لنسخ الـ Prompt الخاص بالمحلل النفسي
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold text-lg">2.</span>
              <div>
                <p className="font-semibold text-white">أرسله للذكاء الاصطناعي</p>
                <p className="text-sm text-gray-400">
                  افتح ChatGPT أو Claude وألصق النص، ثم اكتب أفكارك بحرية
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold text-lg">3.</span>
              <div>
                <p className="font-semibold text-white">انسخ كود Base64</p>
                <p className="text-sm text-gray-400">
                  سيعطيك الذكاء الاصطناعي كوداً طويلاً، انسخه كاملاً
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-purple-400 font-bold text-lg">4.</span>
              <div>
                <p className="font-semibold text-white">ألصقه هنا</p>
                <p className="text-sm text-gray-400">
                  عد إلى هذه الصفحة وألصق الكود في المربع أدناه
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* ----- نسخ الـ Prompt ----- */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">
              نص المحلل النفسي
            </h2>
            <Button
              onClick={copyPrompt}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <CopyIcon />
              نسخ
            </Button>
          </div>
          <div className="bg-gray-950 rounded-lg p-4 max-h-32 overflow-y-auto">
            <p className="text-gray-400 text-xs whitespace-pre-wrap">
              {AI_PROMPT.substring(0, 300)}...
            </p>
          </div>
        </div>

        {/* ----- الاسم المستعار (إذا لزم) ----- */}
        {needsNickname && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-3">
              اختر اسماً مستعاراً
            </h2>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="مثلاً: المتأمل الحزين"
              maxLength={30}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        )}

        {/* ----- لصق الكود ----- */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-3">
            ألصق كود Base64 هنا
          </h2>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ألصق الكود الذي حصلت عليه من الذكاء الاصطناعي..."
            className="min-h-[120px] bg-gray-950 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {/* ----- زر الإرسال ----- */}
        <Button
          onClick={submit}
          disabled={loading}
          className="w-full py-6 text-lg font-bold"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              جاري تحليل البصمة...
            </span>
          ) : (
            "تسجيل البصمة النفسية"
          )}
        </Button>

      </div>
    </main>
  );
}
