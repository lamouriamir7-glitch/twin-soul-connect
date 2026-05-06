// ✅ src/lib/use-current-user.ts
// ============================================================
// ميكانيكا الملف (Developer Notes):
// ------------------------------------------------------------
// هذا الـ Hook هو المدخل الوحيد للمصادقة في التطبيق.
// يقوم بـ:
// 1. الاستماع لتغيرات جلسة Supabase Auth.
// 2. جلب الجلسة الحالية عند أول تحميل.
// 3. إرجاع كائن يحتوي على:
//    - id:        الـ UUID الخاص بالمستخدم من Supabase Auth.
//    - user:      كائن المستخدم الكامل من Supabase.
//    - isAuthenticated: هل يوجد مستخدم مسجل دخوله.
//    - isLoading: هل ما زلنا ننتظر رد Supabase.
//    - logout:    دالة تسجيل الخروج.
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // (1) الاشتراك في تغييرات المصادقة
    // هذا listener يعمل عندما يسجل المستخدم دخوله أو يخرج
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // (2) جلب الجلسة الحالية (لحظة فتح التطبيق)
    // هذا يضمن أننا لا ننتظر حدث تغيير إذا كان المستخدم مسجلاً مسبقاً
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // (3) تنظيف: إلغاء الاشتراك عند إزالة الـ Component
    return () => {
      data.subscription.unsubscribe();
    };
  }, []); // [] تعني: شغل هذا مرة واحدة فقط عند Mount

  // دالة تسجيل الخروج
  const logout = async () => {
    await supabase.auth.signOut();
    // بعد الخروج، إعادة التوجيه لصفحة المصادقة
    window.location.href = "/auth";
  };

  // الكائن المُعاد: تستخدمه كل صفحات التطبيق
  return {
    id: user?.id ?? null,
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
  };
};
