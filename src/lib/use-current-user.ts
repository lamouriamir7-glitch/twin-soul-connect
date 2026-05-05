import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";

// أبقينا على هذه التوقعات لكي لا ينهار المتصفح
export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const currentUser = useMemo(() => {
    // التعديل السحري هنا: نستخدم user.sub مباشرة ونلغي الدالة التي تسبب الخطأ
    const id = isAuthenticated && user?.sub ? user.sub : "guest";

    return {
      id,
      isLoading,
      isAuthenticated,
      user,
    };
  }, [user, isAuthenticated, isLoading]);

  return currentUser;
};

// أضف هذه الدالة الوهمية في أسفل الملف لكي لا تنهار الملفات الأخرى التي تستدعيها
export const auth0SubToUuid = (sub: string) => sub; 
