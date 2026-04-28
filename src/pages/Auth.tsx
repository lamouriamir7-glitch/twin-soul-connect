import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WisdomBox } from "@/components/WisdomBox";
import { toast } from "sonner";
import { Brain } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

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
            {loading ? "جارٍ الاتصال..." : mode === "signup" ? "ابدأ الرحلة" : "ادخل"}
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
