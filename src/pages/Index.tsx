import { useEffect, useState, useRef } from "react";
import { useCurrentUser } from "@/lib/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import MessagesScreen from "@/components/MessagesScreen";
import MatchesScreen from "@/components/MatchesScreen";
import AnalysisSuccess from "@/components/AnalysisSuccess";
import { useGlobalMessageNotifications } from "@/hooks/useGlobalMessageNotifications";
import { useT } from "@/i18n/LanguageContext";

type Profile = {
  id: string;
  nickname: string;
  vector: number[];
  priorities: any;
};

const buildFallback = (id: string): Profile => ({
  id,
  nickname: "Amir",
  vector: Array(30).fill(0),
  priorities: {},
});

const Index = () => {
  const { id: msUserId, isAuthenticated, isLoading: authLoading, logout } = useCurrentUser();
  const { t } = useT();

  const [me, setMe] = useState<Profile | null>(null);
  const [view, setView] = useState<"messages" | "matches" | "success">("messages");
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const initialized = useRef(false);

  useGlobalMessageNotifications(me?.id ?? null);

  useEffect(() => {
    if (authLoading) return;

    if (!msUserId) {
      setMe(buildFallback("temp_user"));
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      setMe(buildFallback(msUserId));

      try {
        const { data, error } = await supabase
          .from("profiles")
          .upsert(
            {
              id: msUserId,
              nickname: "Amir",
              vector: Array(30).fill(0),
              priorities: {},
            },
            {
              onConflict: "id",
              ignoreDuplicates: false,
            }
          )
          .select("*")
          .maybeSingle();

        if (error) {
          console.error("Supabase upsert error:", error);
          return;
        }

        if (data) {
          setMe(data as Profile);
          setPriorities((data.priorities as Record<string, number>) ?? {});
        }
      } catch (e) {
        console.error("Init error:", e);
      }
    };

    init();
  }, [authLoading, msUserId]);

  const savePriorities = async (p: Record<string, number>) => {
    setPriorities(p);
    if (me && me.id !== "temp_user") {
      await supabase
        .from("profiles")
        .update({ priorities: p })
        .eq("id", me.id);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
        Authenticating...
      </div>
    );
  }

  const safeMe = me ?? buildFallback(msUserId ?? "temp_user");

  return (
    <main className="starfield min-h-screen px-4 py-8 relative">
      <div className="relative z-10 max-w-3xl mx-auto">
        {view === "success" ? (
          <AnalysisSuccess
            nickname={safeMe.nickname}
            onOpenMatches={() => setView("matches")}
            onOpenMessages={() => setView("messages")}
            onLogout={logout}
          />
        ) : view === "messages" ? (
          <MessagesScreen
            meId={safeMe.id}
            onOpenMatches={() => setView("matches")}
            onRenewFingerprint={() => setView("success")}
            onLogout={logout}
          />
        ) : (
          <MatchesScreen
            me={safeMe}
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
