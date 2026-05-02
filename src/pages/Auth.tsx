import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WisdomBox } from "@/components/WisdomBox";
import { toast } from "sonner";
import { Brain, UserCircle2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [guestNickname, setGuestNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const signInAsGuest = async () => {
    const trimmed = guestNickname.trim();
    if (!trimmed) {
      toast.error("اختر اسماً مستعاراً أولاً");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      localStorage.setItem("pending_nickname", trimmed);
      toast.success("مرحباً بك يا " + trimmed);
      navigate("/fingerprint", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { nickname },
          },
        });
        if (error) throw error;
        if (data.session) {
          // store nickname temporarily for fingerprint screen
          localStorage.setItem("pending_nickname", nickname);
          toast.success("تم إنشاء توأمك الرقمي");
          navigate("/fingerprint", { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("أهلاً بعودتك");
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        toast.error(error.message ?? "تعذّر الدخول عبر جوجل");
        setLoading(false);
        return;
      }
      // Browser will redirect to Google
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
      setLoading(false);
    }
  };

  return (
    <main className="starfield min-h-screen flex items-center justify-center px-4 py-10 relative">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-primary/40 mb-4 shadow-violet-glow animate-float-slow">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl title-gold-glow mb-2">
            التوأم الرقمي
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            ابحث عن صدى روحك في الكون
          </p>
        </div>

        {/* Guest login - primary option */}
        <div className="rounded-2xl border border-gold/40 bg-card/60 backdrop-blur-xl p-6 shadow-gold-glow space-y-4 mb-4">
          <h2 className="font-display text-lg flex items-center gap-2 justify-center">
            <UserCircle2 className="w-5 h-5 text-gold" /> دخول سريع كضيف
          </h2>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            اختر اسماً مستعاراً وابدأ فوراً — بدون حساب أو كلمة سر
          </p>
          <Input
            maxLength={40}
            value={guestNickname}
            onChange={(e) => setGuestNickname(e.target.value)}
            placeholder="هويّتك في الفضاء..."
            className="bg-input/60 border-border"
          />
          <Button
            type="button"
            onClick={signInAsGuest}
            disabled={loading || !guestNickname.trim()}
            className="w-full hover:opacity-90 text-background font-display tracking-wider shadow-gold-glow"
            style={{ background: "var(--gradient-gold)" }}
          >
            {loading ? "جارٍ الدخول..." : "ابدأ الرحلة ✦"}
          </Button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground tracking-wider">أو سجّل بحساب</span>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4"
        >
          {mode === "signup" && (
            <div className="space-y-2">
              <Label className="font-display">اسم مستعار</Label>
              <Input
                required
                maxLength={40}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="هويّتك في الفضاء"
                className="bg-input/60 border-border"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="font-display">البريد الإلكتروني</Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input/60 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-display">كلمة المرور</Label>
            <Input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input/60 border-border"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-primary to-accent hover:opacity-90 text-primary-foreground font-display tracking-wider shadow-violet-glow"
          >
            {loading ? "جارٍ الاتصال..." : mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card/60 px-3 text-xs text-muted-foreground tracking-wider">أو</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            variant="outline"
            className="w-full bg-background/40 hover:bg-background/70 border-border font-display tracking-wide"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1s2.69-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.84 3.42 14.66 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.48 0 9.11-3.85 9.11-9.27 0-.62-.07-1.1-.16-1.53H12z"/>
              <path fill="#34A853" d="M3.88 7.34l3.2 2.35C7.94 7.7 9.81 6.4 12 6.4c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.84 3.42 14.66 2.5 12 2.5 8.24 2.5 5.0 4.62 3.88 7.34z" opacity="0"/>
            </svg>
            <span>الدخول عبر جوجل</span>
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === "signup" ? "لديك حساب؟ سجّل الدخول" : "جديد؟ أنشئ توأمك"}
          </button>
        </form>

        <WisdomBox />
      </div>
    </main>
  );
}
