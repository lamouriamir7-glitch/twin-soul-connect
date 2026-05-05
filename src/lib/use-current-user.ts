import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // جلب الجلسة الحالية فوراً
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // الاستماع لأي تغيير في حالة تسجيل الدخول
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return {
    id: user?.id ?? null,
    user,
    isAuthenticated: !!user,
    isLoading,
    isGuest: false,
    logout,
  };
};

// باقي الدوال المستخدمة في المشروع
export const ensureGuestId = () => "guest";
export const clearGuestId = () => ({});
export const isGuestActive = () => false;
export const setGuestActive = (v: boolean) => {};
