import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";

// هذه الدالة هي "المفتاح"؛ ستقوم بتمرير الـ ID كما هو دون تحويله لـ UUID
export const auth0SubToUuid = (sub: string) => sub;

// دوال التحكم في نظام "الضيف" - أعدتها لكي لا ينهار ملف Auth.tsx
export const ensureGuestId = () => "guest_" + Math.random().toString(36).substr(2, 9);
export const clearGuestId = () => {};
export const isGuestActive = () => false;
export const setGuestActive = (v: boolean) => {};

export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading, logout: auth0Logout } = useAuth0();

  const currentUser = useMemo(() => {
    // نستخدم المعرف الحقيقي من Auth0 مباشرة
    const id = isAuthenticated && user?.sub ? user.sub : null;

    return {
      id,
      user,
      isAuthenticated,
      isLoading,
      isGuest: false,
      authUser: user || null,
      logout: () => auth0Logout({ logoutParams: { returnTo: window.location.origin } })
    };
  }, [user, isAuthenticated, isLoading, auth0Logout]);

  return currentUser;
};
