import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";

/**
 * هذا الخطاف (Hook) يقوم بجلب بيانات المستخدم من Auth0 
 * ويرسل الـ ID الأصلي مباشرة لضمان التوافق مع قاعدة بيانات Supabase
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const currentUser = useMemo(() => {
    // نستخدم الـ sub (المعرف) القادم من Auth0 مباشرة كـ id
    // هذا يمنع خطأ الـ Foreign Key لأننا عدلنا القاعدة لتقبل النصوص
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
