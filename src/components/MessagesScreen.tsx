import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { WisdomBox } from "@/components/WisdomBox";
import { MessageCircle, Search, RefreshCw, LogOut, Brain } from "lucide-react";
import AmbienceToggle from "@/components/AmbienceToggle";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

type ConversationItem = {
  id: string;
  other_id: string;
  other_nickname: string;
  last_message?: string;
  last_at?: string;
};

interface Props {
  meId: string;
  onOpenMatches: () => void;
  onRenewFingerprint: () => void;
  onLogout: () => void;
}

export default function MessagesScreen({
  meId,
  onOpenMatches,
  onRenewFingerprint,
  onLogout,
}: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, user_a, user_b")
        .or(`user_a.eq.${meId},user_b.eq.${meId}`);

      if (!convs?.length) {
        setItems([]);
        setLoading(false);
        return;
      }

      const otherIds = convs.map((c) => (c.user_a === meId ? c.user_b : c.user_a));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nickname")
        .in("id", otherIds);
      const nameById = new Map(profiles?.map((p) => [p.id, p.nickname]) ?? []);

      // last messages
      const enriched: ConversationItem[] = await Promise.all(
        convs.map(async (c) => {
          const otherId = c.user_a === meId ? c.user_b : c.user_a;
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          return {
            id: c.id,
            other_id: otherId,
            other_nickname: nameById.get(otherId) ?? "مجهول",
            last_message: lastMsg?.content,
            last_at: lastMsg?.created_at,
          };
        })
      );

      enriched.sort((a, b) => (b.last_at ?? "").localeCompare(a.last_at ?? ""));
      setItems(enriched);
      setLoading(false);
    })();
  }, [meId]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-7 h-7 text-primary" />
          <h1 className="font-display text-2xl md:text-3xl title-gold-glow">
            التوأم الرقمي
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <AmbienceToggle />
          <button
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive transition"
            title="خروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onOpenMatches}
          className="relative overflow-hidden font-display gap-2 h-12 text-[hsl(38_70%_15%)] border-0 animate-pulse-gold tracking-wider"
          style={{
            background: "var(--gradient-gold)",
            boxShadow:
              "0 0 24px hsl(var(--gold) / 0.55), 0 0 48px hsl(var(--gold-glow) / 0.35), inset 0 1px 0 hsl(45 100% 85% / 0.5)",
          }}
        >
          <Search className="w-4 h-4" />
          <span className="font-bold">توائمي</span>
        </Button>
        <Button
          onClick={onRenewFingerprint}
          variant="outline"
          className="border-primary/40 hover:border-primary font-display gap-2 h-12"
        >
          <RefreshCw className="w-4 h-4" /> جدّد بصمتي
        </Button>
      </div>

      <section>
        <h2 className="font-display text-lg text-muted-foreground mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> الرسائل
        </h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-12">جارٍ التحميل...</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground mb-3">
              لا توجد محادثات بعد. ابدأ من قائمة توائمك.
            </p>
            <Button onClick={onOpenMatches} variant="outline" size="sm">
              اكتشف توائمك
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => navigate(`/chat/${it.id}`)}
                  className="w-full text-right rounded-xl border border-border hover:border-primary/60 bg-card/50 hover:bg-card/80 p-4 transition flex items-center gap-3 shadow-cosmic"
                >
                  <div className="w-11 h-11 rounded-full border border-primary/40 flex items-center justify-center font-display text-primary bg-primary/5">
                    {it.other_nickname.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base truncate">
                      {it.other_nickname}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {it.last_message ?? "لا رسائل بعد"}
                    </div>
                  </div>
                  {it.last_at && (
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(it.last_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WisdomBox />
    </div>
  );
}
