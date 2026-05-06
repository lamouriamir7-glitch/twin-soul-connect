// ============================================================
// src/lib/wind-engine.ts
// ============================================================
// ميكانيكا الملف (Developer Notes):
// ------------------------------------------------------------
// هذا الملف هو "محرك الرياح" - قلب التحليل النفسي للتطبيق.
// يحتوي على:
// 1. AI_PROMPT: النص الذي يوجه الذكاء الاصطناعي لتحليل الشخصية.
// 2. SECRET_KEY = 7.5: مفتاح الضرب/القسمة للتشفير وفك التشفير.
// 3. processUserVector(): يفك تشفير Base64 → مصفوفة 30 قيمة.
// 4. reduceTo10(): يختزل الـ 30 بعد إلى 10 أبعاد.
// 5. calculateMatchPercentage(): يحسب نسبة التطابق بين متجهين.
// ============================================================

// --------------------------------------------------
// الثوابت
// --------------------------------------------------
export const VECTOR_LENGTH = 30;
const SECRET_KEY = 7.5;
const RANGE = 10; // المجال: -5 إلى +5 بعد فك التشفير

// --------------------------------------------------
// AI_PROMPT: نص توجيه الذكاء الاصطناعي
// --------------------------------------------------
export const AI_PROMPT = `You are a "Psychological Vector Engine" operator.

Core Logic (The Cold Analyst):
- Zero-Flattery Mandate: You are strictly prohibited from generating "socially desirable" results.
- Abstract Neutrality: If a user attempts to project a "perfect" or "saintly" persona, correct for it.
- Antagonistic Scaling: High values in one extreme (e.g., Logical Thinking) should naturally suppress the opposite.
- Definitive Mapping: Avoid the center (0.0). Take a stand.
- Multiply each value by 7.5.
- Create a raw JSON array of these 30 numbers.
- Encode the JSON array into Base64.
- Output ONLY the raw Base64 string. No preamble, no explanation, no markdown.

The 30 Bipolar Dimensions (Order is Critical):
1.  Logical Thinking (+) vs Intuitive Feeling (-)
2.  Methodological Skepticism (+) vs Blind Faith (-)
3.  Intellectual Precision (+) vs Generalization (-)
4.  Existential Reflection (+) vs Materialistic Focus (-)
5.  Philosophical Depth (+) vs Superficiality (-)
6.  Search for Meaning (+) vs Pursuit of Utility (-)
7.  Non-Conformity (+) vs Social Compliance (-)
8.  Intellectual Audacity (+) vs Intellectual Caution (-)
9.  Breaking Patterns (+) vs Adhering to Norms (-)
10. Empathy (+) vs Emotional Detachment (-)
11. Kindness (+) vs Harshness (-)
12. Emotional Understanding (+) vs Emotional Blindness (-)
13. Lust for Knowledge (+) vs Contentment with Ignorance (-)
14. Humility (+) vs Arrogance/Ego (-)
15. Emotional Purity (+) vs Narcissism/Selfishness (-)
16. Artistic Creativity (+) vs Literal Thinking (-)
17. Symbolic Imagination (+) vs Concrete Realism (-)
18. Aesthetic Sensitivity (+) vs Aesthetic Indifference (-)
19. Self-Monitoring (+) vs Lack of Self-Awareness (-)
20. Emotional Intelligence (+) vs Reactive Impulsivity (-)
21. Internal Honesty (+) vs Self-Deception (-)
22. Grit/Willpower (+) vs Fragility (-)
23. Self-Discipline (+) vs Self-Indulgence (-)
24. Long-term Vision (+) vs Short-term Gratification (-)
25. Social Openness (+) vs Social Reclusiveness (-)
26. Collective Loyalty (+) vs Individualistic Isolation (-)
27. Communicative Simplicity (+) vs Communicative Complexity/Pretension (-)
28. Creative Chaos (+) vs Rigid Order (-)
29. Spontaneity (+) vs Calculated Reserve (-)
30. Mood Stability (+) vs High Volatility (-)`;

// --------------------------------------------------
// sanitizeDecodedJson: تنظيف النص من الشوائب
// --------------------------------------------------
function sanitizeDecodedJson(raw: string): string {
  // إزالة الأسطر الجديدة
  let s = raw.replace(/(\r\n|\n|\r)/g, "");
  // إزالة الرموز غير ASCII (احتياطي)
  s = s.replace(/[^\x00-\x7F]+/g, "");
  return s;
}

// --------------------------------------------------
// processUserVector: فك تشفير Base64 → 30 قيمة
// --------------------------------------------------
export function processUserVector(encodedBase64: string): number[] | null {
  try {
    // (1) فك Base64
    const decodedString = atob(encodedBase64.trim());

    // (2) تنظيف
    const sanitized = sanitizeDecodedJson(decodedString);

    // (3) تحويل إلى JSON
    const encryptedArray = JSON.parse(sanitized);

    // (4) تحقق أنه مصفوفة بالطول الصحيح
    if (!Array.isArray(encryptedArray) || encryptedArray.length !== VECTOR_LENGTH) {
      console.error("Invalid array length:", encryptedArray?.length);
      return null;
    }

    // (5) فك التشفير: قسمة على SECRET_KEY
    const result: number[] = encryptedArray.map((num: number) => {
      if (num === null || num === undefined) return 0;
      const decoded = num / SECRET_KEY;
      if (!isFinite(decoded) || decoded < -50 || decoded > 50) return 0;
      // تقريب إلى 4 منازل عشرية
      return Math.round(decoded * 10000) / 10000;
    });

    return result;
  } catch (e) {
    console.error("Error decoding the base64-encoded string:", e);
    return null;
  }
}

// --------------------------------------------------
// reduceTo10: اختزال 30 بعد → 10 أبعاد
// --------------------------------------------------
export function reduceTo10(vector30: number[]): number[] {
  const reduced: number[] = [];
  for (let i = 0; i < 10; i++) {
    const vals = [
      vector30[i * 3],
      vector30[i * 3 + 1],
      vector30[i * 3 + 2],
    ].filter((v) => v !== undefined && v !== 0) as number[];

    if (vals.length === 0) {
      reduced.push(0);
      continue;
    }
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    reduced.push(Math.round(avg * 10000) / 10000);
  }
  return reduced;
}

// --------------------------------------------------
// calculateMatchPercentage: حساب نسبة التطابق (Cosine Similarity)
// --------------------------------------------------
export function calculateMatchPercentage(
  vectorA: number[],
  vectorB: number[],
  priorities?: Record<string, number>
): number {
  const len = Math.min(vectorA.length, vectorB.length);
  if (len === 0) return 0;

  let weightedDistance = 0;
  let totalWeight = 0;
  let knownPairs = 0;

  for (let i = 0; i < len; i++) {
    const a = vectorA[i];
    const b = vectorB[i];

    if (a === undefined || b === undefined) continue;

    // الوزن من الأولويات (إن وجدت)
    const w = priorities ? (priorities[String(i)] ?? 1) : 1;

    if (a === b) {
      knownPairs++;
      totalWeight += w;
      continue;
    }

    const diff = Math.abs(a - b) / RANGE;
    const clipped = Math.min(1, diff);
    weightedDistance += clipped * w;
    totalWeight += w;
    knownPairs++;
  }

  // إذا لا توجد مقارنات كافية
  if (totalWeight === 0 || knownPairs < 6) {
    return knownPairs === 0 ? 0 : Math.max(15, knownPairs * 5);
  }

  const avgDist = weightedDistance / totalWeight;
  const k = 12;
  const mid = 0.3;
  const logistic = 1 / (1 + Math.exp(k * (avgDist - mid)));

  // تحويل إلى نسبة مئوية
  const percentage = Math.round(logistic * 10000) / 100;
  return Math.min(100, Math.max(0, percentage));
}
