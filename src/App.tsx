// ============================================================
// src/App.tsx
// ============================================================
// ميكانيكا الملف (Developer Notes):
// ------------------------------------------------------------
// هذا هو المكون الجذري للتطبيق. يقوم بـ:
// 1. تغليف التطبيق بـ QueryClientProvider (لإدارة البيانات).
// 2. تعريف مسارات الصفحات (Routes):
//    - "/"            → Index (بوابة العبور).
//    - "/auth"        → Auth (تسجيل الدخول).
//    - "/fingerprint" → Fingerprint (تحليل البصمة).
//    - "/chat/:id"    → Chat (محادثة فردية).
//    - "*"            → NotFound (404).
// ============================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Fingerprint from "./pages/Fingerprint";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// إنشاء عميل react-query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/fingerprint" element={<Fingerprint />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
