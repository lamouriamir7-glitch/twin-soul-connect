import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WisdomBox } from "@/components/WisdomBox";
import { GEMINI_PROMPT, processUserVector } from "@/lib/twin-engine";
import { toast } from "sonner";
import { Copy, Fingerprint, ArrowLeft } from "lucide-react";

export default function Fingerprint() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/auth", { replace: true });
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      setHasExisting(!!data);
    })();
  }, [navigate]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(GEMINI_PROMPT);
    toast.success("تم نسخ الوصفة. الصقها في Gemini");
  };

  const submit = async () => {
    const vector = processUserVector(code);
    if (!vector) {
      toast.error("الكود غير صحيح. تأكد من نسخه كاملاً من Gemini");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("الجلسة منتهية");
      const nickname =
        localStorage.getItem("pending_nickname") ||
        user.user_metadata?.nickname ||
        user.email?.split("@")[0] ||
        "مجهول";

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname, vector }, { onConflict: "id" });
      if (error) throw error;
      localStorage.removeItem("pending_nickname");
      toast.success("تم تسجيل بصمتك النفسية");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="starfield min-h-screen px-4 py-10 relative">
      <div className="relative z-10 max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> رجوع
        </button>

        <div className="text-center mb-8">
          <Fingerprint className="w-14 h-14 mx-auto text-primary animate-float-slow mb-3" />
          <h1 className="font-display text-3xl md:text-5xl text-gradient-primary mb-2">
            {hasExisting ? "تجديد البصمة" : "بصمتك النفسية"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {hasExisting
              ? "تطوّر حواراتك يستحق بصمة جديدة. ستحتفظ بكل رسائلك وروابطك."
              : "اطلب من ذكائك الاصطناعي أن يحلّلك، ثم الصق الكود الناتج هنا."}
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-foreground">١. انسخ الوصفة</h2>
            <Button onClick={copyPrompt} variant="outline" size="sm" className="gap-2">
              <Copy className="w-4 h-4" /> نسخ
            </Button>
          </div>
          <div className="rounded-lg bg-muted/40 border border-border p-4 max-h-44 overflow-y-auto font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {GEMINI_PROMPT}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4 mt-6">
          <h2 className="font-display text-xl">٢. الصق كود البصمة</h2>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="نص Base64 المُستخرج من Gemini..."
            rows={5}
            className="font-mono text-xs bg-input/60 border-border"
          />
          <Button
            onClick={submit}
            disabled={loading || !code.trim()}
            className="w-full bg-gradient-to-l from-primary to-accent text-primary-foreground font-display tracking-wider shadow-violet-glow"
          >
            {loading ? "جارٍ التحليل..." : hasExisting ? "تجديد البصمة" : "تثبيت البصمة"}
          </Button>
        </section>

        <WisdomBox />
      </div>
    </main>
  );
}
