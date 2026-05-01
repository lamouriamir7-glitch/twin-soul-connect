import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WisdomBox } from "@/components/WisdomBox";
import { AI_PROMPT, processUserVector } from "@/lib/twin-engine";
import { toast } from "sonner";
import { Copy, Fingerprint as FingerprintIcon, ArrowLeft, Sparkles, ClipboardPaste, MessageSquare, UserCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Fingerprint() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [nickname, setNickname] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/auth", { replace: true });
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname")
        .eq("id", user.id)
        .maybeSingle();
      setHasExisting(!!data);
      if (data?.nickname) {
        setNickname(data.nickname);
        setNeedsNickname(false);
      } else {
        // Always ask the user to choose their in-app nickname (don't reuse Google name)
        const pending = localStorage.getItem("pending_nickname");
        if (pending) setNickname(pending);
        setNeedsNickname(true);
      }
    })();
  }, [navigate]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    toast.success("تم نسخ النص. الصقه عند ذكائك الاصطناعي");
  };

  const submit = async () => {
    const trimmedNick = nickname.trim();
    if (needsNickname && !trimmedNick) {
      toast.error("اختر اسماً مستعاراً يميّزك في الفضاء");
      return;
    }
    const vector = processUserVector(code);
    if (!vector) {
      toast.error("الشيفرة غير صحيحة. تأكد من نسخها كاملةً");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("الجلسة منتهية");
      const finalNickname = trimmedNick || nickname || "مجهول";

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname: finalNickname, vector }, { onConflict: "id" });
      if (error) throw error;
      localStorage.removeItem("pending_nickname");
      toast.success("تم تسجيل بصمتك النفسية");
      navigate("/", { replace: true, state: { justAnalyzed: true } });
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
          <FingerprintIcon className="w-14 h-14 mx-auto text-primary animate-float-slow mb-3" />
          <h1 className="font-display text-3xl md:text-5xl text-gradient-primary mb-2">
            {hasExisting ? "تجديد البصمة" : "بصمتك النفسية"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {hasExisting
              ? "تطوّر حواراتك يستحق بصمة جديدة. ستحتفظ بكل رسائلك وروابطك."
              : "ثلاث خطوات تفصلك عن لقاء صدى روحك."}
          </p>
        </div>

        {!hasExisting && (
          <section className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 shadow-cosmic mb-6">
            <h2 className="font-display text-lg text-gradient-primary mb-4 text-center">
              كيف تحصل على شيفرتك؟
            </h2>
            <ol className="space-y-4">
              <Step
                n="١"
                icon={<Copy className="w-4 h-4" />}
                title="انسخ النص أدناه"
                desc="هذا هو الطلب الذي سيحلّل شخصيتك."
              />
              <Step
                n="٢"
                icon={<MessageSquare className="w-4 h-4" />}
                title="افتح ذكاءك الاصطناعي المفضّل"
                desc="ChatGPT، Gemini، Claude، DeepSeek، أو أيّ مساعد اعتدت الدردشة معه. كلما طالت محادثاتك السابقة معه كانت بصمتك أصدق."
              />
              <Step
                n="٣"
                icon={<ClipboardPaste className="w-4 h-4" />}
                title="الصق النص واطلب التحليل"
                desc="سيعطيك في الأخير شيفرة طويلة (نص Base64). انسخها كاملةً وارجع للصقها هنا."
              />
            </ol>
          </section>
        )}

        {needsNickname && (
          <section className="rounded-2xl border border-gold/40 bg-card/60 backdrop-blur-xl p-6 shadow-gold-glow space-y-3 mb-6">
            <h2 className="font-display text-xl flex items-center gap-2">
              <UserCircle2 className="w-5 h-5 text-gold" /> اسمك في هذا الفضاء
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              اختر اسماً مستعاراً يميّزك. لن يرى الآخرون اسمك الحقيقي، فقط هذا الاسم.
            </p>
            <Label className="font-display sr-only">اسم مستعار</Label>
            <Input
              value={nickname}
              maxLength={40}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="هويّتك في الفضاء..."
              className="bg-input/60 border-border"
            />
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> نصّ الطلب
            </h2>
            <Button onClick={copyPrompt} variant="outline" size="sm" className="gap-2 border-primary/40">
              <Copy className="w-4 h-4" /> نسخ النص
            </Button>
          </div>
          <div className="rounded-lg bg-muted/40 border border-border p-4 max-h-44 overflow-y-auto font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {AI_PROMPT}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4 mt-6">
          <h2 className="font-display text-xl flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4 text-primary" /> الصق شيفرتك هنا
          </h2>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="الصق هنا الشيفرة الطويلة التي أعطاك إياها ذكاؤك الاصطناعي..."
            rows={5}
            className="font-mono text-xs bg-input/60 border-border"
          />
          <Button
            onClick={submit}
            disabled={loading || !code.trim() || (needsNickname && !nickname.trim())}
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

function Step({
  n,
  icon,
  title,
  desc,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-4 items-start">
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full border border-primary/40 bg-primary/5 flex items-center justify-center font-display text-primary text-lg">
          {n}
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 font-display text-base text-foreground mb-0.5">
          <span className="text-primary/80">{icon}</span>
          {title}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </li>
  );
}

