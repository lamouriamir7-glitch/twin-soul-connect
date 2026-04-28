import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { WisdomBox } from "@/components/WisdomBox";
import {
  TRAIT_GROUPS,
  DIMENSION_KEYS,
  calculateMatchPercentage,
} from "@/lib/twin-engine";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, MessageCircle, SlidersHorizontal } from "lucide-react";

type Profile = {
  id: string;
  nickname: string;
  vector: number[];
};

interface Props {
  me: Profile;
  priorities: Record<string, number>;
  onPrioritiesChange: (p: Record<string, number>) => void;
  onBack: () => void;
}

export default function MatchesScreen({
  me,
  priorities,
  onPrioritiesChange,
  onBack,
}: Props) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Array<Profile & { score: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [showPriorities, setShowPriorities] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, vector")
        .neq("id", me.id);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const scored = (data ?? [])
        .map((p) => ({
          ...p,
          vector: p.vector as unknown as number[],
          score: calculateMatchPercentage(me.vector, p.vector as unknown as number[], priorities),
        }))
        .sort((a, b) => b.score - a.score);
      setMatches(scored);
      setLoading(false);
    })();
  }, [me, priorities]);

  const openChat = async (other: Profile) => {
    const [a, b] = [me.id, other.id].sort();
    let conv;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    if (existing) {
      conv = existing;
    } else {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ user_a: a, user_b: b })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      conv = created;
    }
    navigate(`/chat/${conv.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" /> الرسائل
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPriorities((v) => !v)}
          className="gap-2 border-primary/40"
        >
          <SlidersHorizontal className="w-4 h-4" /> الأولويات
        </Button>
      </div>

      <div className="text-center">
        <Sparkles className="w-10 h-10 mx-auto text-primary animate-shimmer mb-2" />
        <h1 className="font-display text-3xl md:text-4xl text-gradient-primary">
          توائمك في الكون
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          مرتّبة حسب صدى روحك
        </p>
      </div>

      {showPriorities && (
        <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-cosmic space-y-4">
          <h2 className="font-display text-lg">رجّح ما يهمك</h2>
          <p className="text-xs text-muted-foreground">
            الصفات ذات الأولوية الأعلى ترفع توائمها في القائمة.
          </p>
          {DIMENSION_KEYS.map((key) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-display">{TRAIT_GROUPS[key].label}</span>
                <span className="text-primary font-mono text-xs">
                  ×{(priorities[key] ?? 1).toFixed(1)}
                </span>
              </div>
              <Slider
                min={0.5}
                max={3}
                step={0.1}
                value={[priorities[key] ?? 1]}
                onValueChange={(v) =>
                  onPrioritiesChange({ ...priorities, [key]: v[0] })
                }
              />
            </div>
          ))}
        </section>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-12">جارٍ البحث...</p>
      ) : matches.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          لا يوجد توائم بعد. ادعُ أصدقاءك للانضمام.
        </p>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => openChat(m)}
                className="w-full text-right rounded-xl border border-border hover:border-primary/60 bg-card/50 hover:bg-card/80 p-4 transition group flex items-center gap-4 shadow-cosmic"
              >
                <div className="w-12 h-12 rounded-full border border-primary/40 flex items-center justify-center font-display text-lg text-primary bg-primary/5">
                  {m.nickname.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg truncate">{m.nickname}</div>
                  <div className="text-xs text-muted-foreground">
                    صدى الروح
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-mono text-2xl text-gradient-primary">
                    {m.score.toFixed(1)}%
                  </div>
                </div>
                <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <WisdomBox />
    </div>
  );
}
