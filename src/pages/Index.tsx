// الجزء المحدث من ملف Index.tsx لضمان عمل "الضيف" والمسجل معاً

  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      // 1. إذا لم يكن هناك تسجيل دخول، لا نطرد المستخدم فوراً، بل نتحقق هل هو ضيف؟
      if (!isAuthenticated || !id) {
        // نتحقق إذا كان لدينا "معرف ضيف" محفوظ مسبقاً في الـ State
        if (!me || !me.id.startsWith("guest_")) {
           const guestId = "guest_" + Math.random().toString(36).substr(2, 9);
           setMe(buildFallback(guestId));
        }
        setLoading(false);
        return; 
      }

      // 2. إذا كان مسجلاً (Authenticated)، هنا فقط نكلم Supabase
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (profile) {
          setMe(profile);
          if (!profile.vector || profile.vector.every((v: number) => v === 0)) {
            navigate("/fingerprint");
          }
        } else {
          // إنشاء بروفايل أولي إذا كان جديداً تماماً
          navigate("/fingerprint");
        }
      } catch (e) {
        console.error("Supabase error:", e);
        // في حال فشل Supabase، لا نعلق الصفحة، بل نحوله لضيف كخيار احتياطي
        setMe(buildFallback("guest_fallback"));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [authLoading, isAuthenticated, id, navigate]);
