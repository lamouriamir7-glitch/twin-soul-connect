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
import { useCurrentUser } from "@/lib/use-current-user";
import { useT } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function Fingerprint() {
  const navigate = useNavigate();
  const { id: meUserId, isAuthenticated, isLoading: authLoading, auth0User } = useCurrentUser();
  const { t } = useT();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [nickname, setNickname] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);

  useEffect(() => {
    (async () => {
      if (authLoading) return;
      if (!isAuthenticated || !meUserId) return navigate("/auth", { replace: true });
      const { data } = await supabase
        .from("profiles")
        .select("id, nickname")
        .eq("id", meUserId)
        .maybeSingle();
      setHasExisting(!!data);
      if (data?.nickname) {
        setNickname(data.nickname);
        setNeedsNickname(false);
      } else {
        const pending = localStorage.getItem("pending_nickname");
        if (pending) setNickname(pending);
        setNeedsNickname(true);
      }
    })();
  }, [navigate, authLoading, isAuthenticated, meUserId, auth0User]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    toast.success(t("copied_paste_at_ai"));
  };

  const submit = async () => {
    const trimmedNick = nickname.trim();
    if (needsNickname && !trimmedNick) {
      toast.error(t("pick_nickname"));
      return;
    }
    const vector = processUserVector(code);
    if (!vector) {
      toast.error(t("invalid_code"));
      return;
    }
    setLoading(true);
    try {
      if (!meUserId) throw new Error(t("session_expired"));
      const finalNickname = trimmedNick || nickname || t("unknown");

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: meUserId, nickname: finalNickname, vector }, { onConflict: "id" });
      if (error) throw error;
      localStorage.removeItem("pending_nickname");
      toast.success(t("fingerprint_registered"));
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
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </button>
          <LanguageSelector />
        </div>

        <div className="text-center mb-8">
          <FingerprintIcon className="w-14 h-14 mx-auto text-primary animate-float-slow mb-3" />
          <h1 className="font-display text-3xl md:text-5xl text-gradient-primary mb-2">
            {hasExisting ? t("renew_fingerprint_title") : t("your_fingerprint")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {hasExisting ? t("renew_desc") : t("three_steps")}
          </p>
        </div>

        {!hasExisting && (
          <section className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-6 shadow-cosmic mb-6">
            <h2 className="font-display text-lg text-gradient-primary mb-4 text-center">
              {t("how_to_get_code")}
            </h2>
            <ol className="space-y-4">
              <Step n="1" icon={<Copy className="w-4 h-4" />} title={t("step1_title")} desc={t("step1_desc")} />
              <Step n="2" icon={<MessageSquare className="w-4 h-4" />} title={t("step2_title")} desc={t("step2_desc")} />
              <Step n="3" icon={<ClipboardPaste className="w-4 h-4" />} title={t("step3_title")} desc={t("step3_desc")} />
            </ol>
          </section>
        )}

        {needsNickname && (
          <section className="rounded-2xl border border-gold/40 bg-card/60 backdrop-blur-xl p-6 shadow-gold-glow space-y-3 mb-6">
            <h2 className="font-display text-xl flex items-center gap-2">
              <UserCircle2 className="w-5 h-5 text-gold" /> {t("your_name_here")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("nickname_desc")}</p>
            <Label className="font-display sr-only">{t("your_name_here")}</Label>
            <Input
              value={nickname}
              maxLength={40}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("nickname_placeholder")}
              className="bg-input/60 border-border"
            />
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> {t("prompt_text")}
            </h2>
            <Button onClick={copyPrompt} variant="outline" size="sm" className="gap-2 border-primary/40">
              <Copy className="w-4 h-4" /> {t("copy_text")}
            </Button>
          </div>
          <div className="rounded-lg bg-muted/40 border border-border p-4 max-h-44 overflow-y-auto font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap" dir="rtl">
            {AI_PROMPT}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4 mt-6">
          <h2 className="font-display text-xl flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4 text-primary" /> {t("paste_code_here")}
          </h2>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("paste_placeholder")}
            rows={5}
            className="font-mono text-xs bg-input/60 border-border"
          />
          <Button
            onClick={submit}
            disabled={loading || !code.trim()}
            className="w-full bg-gradient-to-l from-primary to-accent text-primary-foreground font-display tracking-wider shadow-violet-glow"
          >
            {loading ? t("analyzing") : hasExisting ? t("renew_fingerprint_title") : t("save_fingerprint")}
          </Button>
        </section>

        <WisdomBox />
      </div>
    </main>
  );
}

function Step({ n, icon, title, desc }: { n: string; icon: React.ReactNode; title: string; desc: string }) {
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
