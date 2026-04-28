import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { toast } from "sonner";

type Msg = { id: string; sender_id: string; content: string; created_at: string };

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meId, setMeId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState("...");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate("/auth", { replace: true });
      setMeId(user.id);

      const { data: conv } = await supabase
        .from("conversations")
        .select("user_a, user_b")
        .eq("id", id)
        .maybeSingle();
      if (!conv) return navigate("/", { replace: true });
      const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;
      const { data: prof } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", otherId)
        .maybeSingle();
      setOtherName(prof?.nickname ?? "مجهول");

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      setMessages(msgs ?? []);
    })();

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Msg).id)
              ? prev
              : [...prev, payload.new as Msg]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !meId || !id) return;
    setSending(true);
    const content = text.trim().slice(0, 2000);
    setText("");
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: meId, content });
    if (error) toast.error(error.message);
    setSending(false);
  };

  return (
    <main className="starfield min-h-screen flex flex-col relative">
      <header className="relative z-10 border-b border-border bg-background/70 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center font-display text-primary bg-primary/5">
          {otherName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="font-display text-lg leading-tight">{otherName}</div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" /> محادثة مشفّرة
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-3 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-12 font-display">
            ابدأ الحوار مع توأمك...
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-cosmic ${
                  mine
                    ? "bg-gradient-to-l from-primary/90 to-accent/90 text-primary-foreground rounded-br-sm"
                    : "bg-card/80 border border-border rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="relative z-10 border-t border-border bg-background/70 backdrop-blur-xl p-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="اكتب لتوأمك..."
            className="bg-input/60 border-border"
          />
          <Button
            onClick={send}
            disabled={sending || !text.trim()}
            className="bg-gradient-to-l from-primary to-accent text-primary-foreground gap-1 shadow-violet-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </main>
  );
}
