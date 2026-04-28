import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Listens to ALL new messages addressed to the current user (across all
 * conversations) and shows a toast + browser notification when one arrives.
 * Skips messages sent by the user, and skips notifications for the
 * conversation that is currently open.
 */
export function useGlobalMessageNotifications(meId: string | null) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location.pathname);

  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!meId) return;

    // Ask permission once
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const channel = supabase
      .channel(`global-msgs-${meId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            sender_id: string;
            conversation_id: string;
            content: string | null;
            media_type: string | null;
          };
          if (msg.sender_id === meId) return;

          // Verify the user is part of this conversation
          const { data: conv } = await supabase
            .from("conversations")
            .select("id, user_a, user_b")
            .eq("id", msg.conversation_id)
            .maybeSingle();
          if (!conv) return;
          if (conv.user_a !== meId && conv.user_b !== meId) return;

          // Skip if user is currently viewing this chat
          if (locationRef.current === `/chat/${msg.conversation_id}`) return;

          // Sender nickname
          const { data: sender } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", msg.sender_id)
            .maybeSingle();
          const name = sender?.nickname ?? "توأم";

          const preview =
            msg.media_type === "image"
              ? "📷 صورة"
              : msg.media_type === "audio"
                ? "🎙️ رسالة صوتية"
                : (msg.content ?? "").slice(0, 80);

          toast(`رسالة من ${name}`, {
            description: preview,
            action: {
              label: "فتح",
              onClick: () => navigate(`/chat/${msg.conversation_id}`),
            },
          });

          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted" &&
            document.visibilityState !== "visible"
          ) {
            try {
              new Notification(`رسالة من ${name}`, {
                body: preview,
                icon: "/favicon.ico",
                tag: msg.conversation_id,
              });
            } catch {
              /* ignore */
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meId, navigate]);
}
