/**
 * محرك التوأمة الفكرية - الإصدار 2.0
 * 30 صفة عميقة مجمّعة في 10 أبعاد ظاهرة (للحفاظ على بساطة الواجهة)
 */

// التجميع: 30 صفة دقيقة → 10 أبعاد ظاهرة
// كل بُعد ظاهر = متوسط مرجّح لـ 3 صفات دقيقة
export const TRAIT_GROUPS: Record<string, { label: string; sub: string[] }> = {
  logic: { label: "المنطق التحليلي", sub: ["التفكير المنطقي", "الشك المنهجي", "الدقة الذهنية"] },
  existential: { label: "العمق الوجودي", sub: ["التأمل الوجودي", "الحس الفلسفي", "البحث عن المعنى"] },
  rebellion: { label: "روح التمرد", sub: ["رفض السائد", "الجرأة الفكرية", "كسر القوالب"] },
  empathy: { label: "الحساسية العاطفية", sub: ["التعاطف", "اللطف", "الفهم الوجداني"] },
  spiritual: { label: "الرنين الروحي", sub: ["حب المعرفة", "التواضع", "النقاء العاطفي ضد الأنانية والنرجسية والحب السطحي"] },
  creative: { label: "الخيال الخلّاق", sub: ["الإبداع الفني", "التخيّل الرمزي", "الحس الجمالي"] },
  introspection: { label: "الاستبطان", sub: ["مراقبة الذات", "الوعي الانفعالي", "الصدق الداخلي"] },
  ambition: { label: "الطموح والإرادة", sub: ["العزيمة", "الانضباط", "الرؤية بعيدة المدى"] },
  social: { label: "التوجّه الاجتماعي", sub: ["الانفتاح", "حب الجماعة", "البساطة في التواصل"] },
  chaos: { label: "العشوائية الإبداعية", sub: ["الفوضى الخلاقة", "العفوية", "تذبذب الحالة"] },
};

export const DIMENSION_KEYS = Object.keys(TRAIT_GROUPS) as Array<keyof typeof TRAIT_GROUPS>;
export const VECTOR_LENGTH = 30; // 10 × 3 صفات دقيقة

const SECRET_KEY = 7.5;

/** فك تشفير البصمة المُجلَبة من Gemini → مصفوفة 30 بُعداً */
export function processUserVector(encodedBase64: string): number[] | null {
  try {
    const decodedString = atob(encodedBase64.trim());
    const encryptedArray = JSON.parse(decodedString);
    if (!Array.isArray(encryptedArray) || encryptedArray.length !== VECTOR_LENGTH) {
      // محاولة توافقية مع الإصدار القديم (10 أبعاد)
      if (Array.isArray(encryptedArray) && encryptedArray.length === 10) {
        const expanded: number[] = [];
        encryptedArray.forEach((n: number) => {
          expanded.push(n, n, n);
        });
        return expanded.map((n) => n / SECRET_KEY);
      }
      return null;
    }
    return encryptedArray.map((num: number) => num / SECRET_KEY);
  } catch (e) {
    console.error("خطأ في صيغة الكود الملصق", e);
    return null;
  }
}

/** اختزال الـ 30 بُعداً إلى 10 أبعاد ظاهرة (متوسط) */
export function reduceTo10(vector30: number[]): number[] {
  const reduced: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = vector30[i * 3] ?? 0;
    const b = vector30[i * 3 + 1] ?? 0;
    const c = vector30[i * 3 + 2] ?? 0;
    reduced.push((a + b + c) / 3);
  }
  return reduced;
}

/** تشابه جيب التمام مع أوزان الأولوية */
export function calculateMatchPercentage(
  vectorA: number[],
  vectorB: number[],
  priorities?: Record<string, number>
): number {
  if (!vectorA?.length || !vectorB?.length) return 0;
  const len = Math.min(vectorA.length, vectorB.length);

  // weights لكل صفة دقيقة (نشر وزن البُعد على صفاته الثلاث)
  const weights: number[] = [];
  for (let i = 0; i < 10; i++) {
    const key = DIMENSION_KEYS[i];
    const w = priorities?.[key] ?? 1;
    weights.push(w, w, w);
  }

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < len; i++) {
    const w = weights[i] ?? 1;
    const a = vectorA[i] * w;
    const b = vectorB[i] * w;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (!normA || !normB) return 0;
  return (dot / (Math.sqrt(normA) * Math.sqrt(normB))) * 100;
}

/** برومبت تفصيلي يطلبه المستخدم من Gemini */
export const GEMINI_PROMPT = `أريد منك أن تحلّل شخصيتي بناءً على كامل محادثاتنا السابقة وكل ما تعرفه عني.
قم بتقييمي على المحاور الـ 30 التالية، وأعطِ لكل محور رقماً عشرياً بين 0.0 و 10.0 (يُقبل الكسر).

المحاور بالترتيب الدقيق (لا تغيّر الترتيب):
1) التفكير المنطقي
2) الشك المنهجي
3) الدقة الذهنية
4) التأمل الوجودي
5) الحس الفلسفي
6) البحث عن المعنى
7) رفض السائد
8) الجرأة الفكرية
9) كسر القوالب
10) التعاطف
11) اللطف
12) الفهم الوجداني
13) حب المعرفة
14) التواضع
15) النقاء العاطفي (عكس الأنانية والنرجسية والحب السطحي)
16) الإبداع الفني
17) التخيّل الرمزي
18) الحس الجمالي
19) مراقبة الذات
20) الوعي الانفعالي
21) الصدق الداخلي
22) العزيمة
23) الانضباط
24) الرؤية بعيدة المدى
25) الانفتاح الاجتماعي
26) حب الجماعة
27) البساطة في التواصل
28) الفوضى الخلاقة
29) العفوية
30) تذبذب الحالة

التعليمات:
- اضرب كل قيمة في 7.5
- ضع النتائج الـ 30 في مصفوفة JSON بنفس الترتيب
- شفّر المصفوفة بترميز Base64
- أعطني النتيجة النهائية فقط (نص Base64) بدون أي شرح أو علامات اقتباس`;
