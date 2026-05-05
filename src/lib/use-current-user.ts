import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";

/**
 * هاد الخطاف (Hook) بيجيب المستخدم الحالي من Auth0 
 * وبيرسل الـ ID الأصلي بدون أي تحويلات UUID معقدة
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const currentUser = useMemo(() => {
    // نستخدم الـ sub القادم من Auth0 كـ ID أساسي
    // الـ ID رح يكون بصيغة مثل 'auth0|12345' وهي مقبولة الآن في القاعدة
    const id = isAuthenticated && user?.sub ? user.sub : null;

    return {
      id,
      user,
      isAuthenticated,
      isLoading,
    };
  }, [user, isAuthenticated, isLoading]);

  return currentUser;
};
