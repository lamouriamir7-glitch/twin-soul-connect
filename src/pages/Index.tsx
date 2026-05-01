import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MessagesScreen from "@/components/MessagesScreen";
import MatchesScreen from "@/components/MatchesScreen";
import AnalysisSuccess from "@/components/AnalysisSuccess";
import { toast } from "sonner";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";

type Profile = { id: string; nickname: string; vector: number[]; priorities: any };

const Index = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Profile | null>(null);
  const [view, setView] = useState<"messages" | "matches">("messages");
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState<Record<string, number>>({});

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, nickname, vector, priorities")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!profile) {
        navigate("/fingerprint", { replace: true });
        return;
      }
      const p: Profile = {
        id: profile.id,
        nickname: profile.nickname,
        vector: profile.vector as unknown as number[],
        priorities: profile.priorities ?? {},
      };
      setMe(p);
      setPriorities((profile.priorities as Record<string, number>) ?? {});
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useGlobalMessageNotifications(me?.id ?? null);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me) await supabase.from("profiles").update({ priorities: p }).eq("id", me.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("إلى لقاء آخر");
    navigate("/auth", { replace: true });
  };

  if (loading || !me) {
    return (
      <main className="starfield min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-shimmer font-display">
          يستيقظ توأمك...
        </p>
      </main>
    );
  }

  return (
    <main className="starfield min-h-screen px-4 py-8 relative">
      <div className="relative z-10 max-w-3xl mx-auto">
        {view === "messages" ? (
          <MessagesScreen
            meId={me.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => navigate("/fingerprint")}
            onLogout={logout}
          />
        ) : (
          <MatchesScreen
            me={me}
            priorities={priorities}
            onPrioritiesChange={savePriorities}
            onBack={() => setView("messages")}
          />
        )}
      </div>
    </main>
  );
};

export default Index;
