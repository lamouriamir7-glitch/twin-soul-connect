import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";

// هذه الدالة هي الحل: بدلاً من تحويل الـ ID لـ UUID، نرجعه كما هو
// هذا يرضي الكود ويرضي قاعدة البيانات في نفس الوقت
export const auth0SubToUuid = (sub: string) => sub;

// إرضاء نظام الضيف لكي لا ينهار Vercel كما حدث في سجلات الخطأ
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
      isGuest: false, // قيمة ثابتة لتعطيل نظام الضيف مؤقتاً وحل التعارض
      auth0User: user || null,
      logout: () => auth0Logout({ logoutParams: { returnTo: window.location.origin } })
    };
  }, [user, isAuthenticated, isLoading, auth0Logout]);

  return currentUser;
};
