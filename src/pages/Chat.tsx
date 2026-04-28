import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Send,
  Lock,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Pause,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
};

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meId, setMeId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState("...");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Image preview before send
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setMessages((msgs as Msg[]) ?? []);
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

  const insertMessage = async (
    content: string,
    media_url: string | null = null,
    media_type: string | null = null
  ) => {
    if (!meId || !id) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: meId,
      content,
      media_url,
      media_type,
    });
    if (error) toast.error(error.message);
  };

  const uploadFile = async (file: Blob, ext: string): Promise<string | null> => {
    if (!meId) return null;
    const path = `${meId}/${id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      toast.error("فشل الرفع: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const send = async () => {
    if (sending || uploading) return;
    const hasText = text.trim().length > 0;
    if (!hasText && !pendingImage) return;

    setSending(true);
    try {
      if (pendingImage) {
        setUploading(true);
        const ext = (pendingImage.name.split(".").pop() || "jpg").toLowerCase();
        const url = await uploadFile(pendingImage, ext);
        setUploading(false);
        if (!url) return;
        await insertMessage(text.trim(), url, "image");
        setPendingImage(null);
        setText("");
      } else {
        const content = text.trim().slice(0, 2000);
        setText("");
        await insertMessage(content);
      }
    } finally {
      setSending(false);
    }
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("اختر صورة فقط");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة أكبر من 5MB");
      return;
    }
    setPendingImage(f);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 500) return;
        setUploading(true);
        const url = await uploadFile(blob, "webm");
        setUploading(false);
        if (url) await insertMessage("", url, "audio");
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 60) {
            stopRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      toast.error("لم نستطع الوصول للميكروفون");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
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
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-cosmic ${
                  mine
                    ? "bg-gradient-to-l from-primary/90 to-accent/90 text-primary-foreground rounded-br-sm"
                    : "bg-card/80 border border-border rounded-bl-sm"
                }`}
              >
                {m.media_type === "image" && m.media_url && (
                  <a href={m.media_url} target="_blank" rel="noreferrer">
                    <img
                      src={m.media_url}
                      alt="مرفق"
                      className="rounded-xl max-h-72 object-cover mb-1"
                      loading="lazy"
                    />
                  </a>
                )}
                {m.media_type === "audio" && m.media_url && (
                  <AudioBubble url={m.media_url} mine={mine} />
                )}
                {m.content && <div className="px-1">{m.content}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="relative z-10 border-t border-border bg-background/70 backdrop-blur-xl p-3">
        <div className="max-w-3xl mx-auto space-y-2">
          {pendingImage && (
            <div className="flex items-center gap-2 bg-card/60 border border-border rounded-xl p-2">
              <img
                src={URL.createObjectURL(pendingImage)}
                alt="معاينة"
                className="w-12 h-12 rounded-md object-cover"
              />
              <span className="text-xs text-muted-foreground flex-1 truncate">
                {pendingImage.name}
              </span>
              <button
                onClick={() => setPendingImage(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {recording ? (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/40 rounded-xl p-3">
              <span className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-mono text-destructive">
                {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:
                {String(recordSeconds % 60).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground flex-1">
                جارٍ التسجيل... (حدّ أقصى 60 ث)
              </span>
              <Button
                size="sm"
                onClick={stopRecording}
                className="bg-destructive text-destructive-foreground gap-1"
              >
                <Square className="w-3.5 h-3.5" /> إرسال
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                className="text-muted-foreground hover:text-primary p-2 disabled:opacity-50"
                title="إرفاق صورة"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={startRecording}
                disabled={sending || uploading}
                className="text-muted-foreground hover:text-primary p-2 disabled:opacity-50"
                title="رسالة صوتية"
              >
                <Mic className="w-5 h-5" />
              </button>

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
                className="bg-input/60 border-border flex-1"
              />
              <Button
                onClick={send}
                disabled={sending || uploading || (!text.trim() && !pendingImage)}
                className="bg-gradient-to-l from-primary to-accent text-primary-foreground gap-1 shadow-violet-glow"
              >
                {uploading || sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}

function AudioBubble({ url, mine }: { url: string; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play();
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <button
        onClick={toggle}
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          mine ? "bg-primary-foreground/20" : "bg-primary/20"
        }`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className={`flex-1 h-1 rounded-full ${mine ? "bg-primary-foreground/30" : "bg-primary/30"}`}>
        <div className="h-full w-full bg-current opacity-40 rounded-full" />
      </div>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
