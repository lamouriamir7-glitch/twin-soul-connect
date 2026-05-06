import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MessagesScreen from "@/components/MessagesScreen";
import MatchesScreen from "@/components/MatchesScreen";
import AnalysisSuccess from "@/components/AnalysisSuccess";
import { useCurrentUser } from "@/lib/use-current-user";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: msUserId, isAuthenticated, isLoading: authLoading } = useCurrentUser();
  
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"messages" | "matches" | "success">("messages");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate("/auth"); return; }

    const init = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", msUserId)
        .maybeSingle();

      // إذا لم تكن المصفوفة (Vector) موجودة أو كلها أصفار، نرسله للتحليل فوراً
      if (!profile || !profile.vector || profile.vector.every((v: number) => v === 0)) {
        navigate("/fingerprint");
        return;
      }

      setMe(profile);
      setLoading(false);
    };

    init();
  }, [authLoading, isAuthenticated, msUserId, navigate]);

  if (loading) return <div className="bg-black min-h-screen" />;

  return (
    <main className="starfield min-h-screen px-4 py-8">
      {view === "messages" && (
        <MessagesScreen 
          meId={me.id} 
          onOpenMatches={() => setView("matches")} 
          onRenewFingerprint={() => navigate("/fingerprint")} 
          onLogout={() => {}} 
        />
      )}
      {view === "matches" && (
        <MatchesScreen 
          me={me} 
          priorities={{}} 
          onPrioritiesChange={() => {}} 
          onBack={() => setView("messages")} 
        />
      )}
    </main>
  );
};

export default Index;
