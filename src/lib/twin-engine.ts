/**
 * محرك التوأمة الفكرية - الإصدار 3.0
 * 30 صفة عميقة مجمّعة في 10 أبعاد ظاهرة (للحفاظ على بساطة الواجهة)
 * يستخدم 0.0 للأبعاد المجهولة ويتجاهلها في الحساب
 */

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
export const VECTOR_LENGTH = 30;

const SECRET_KEY = 7.5;

/**
 * فك تشفير البصمة المُجلَبة من الذكاء الاصطناعي → مصفوفة 30 بُعداً
 * القيم المجهولة تُمثَّل بـ 0.0 (لأن البرومبت يطلب من الذكاء تجنب الوسط)
 */
export function processUserVector(encodedBase64: string): number[] | null {
  try {
    const decodedString = atob(encodedBase64.trim());
    const encryptedArray = JSON.parse(decodedString);
    if (!Array.isArray(encryptedArray) || encryptedArray.length !== VECTOR_LENGTH) {
      // توافق مع الإصدار القديم (10 أبعاد)
      if (Array.isArray(encryptedArray) && encryptedArray.length === 10) {
        const expanded: number[] = [];
        encryptedArray.forEach((n: number) => {
          expanded.push(n, n, n);
        });
        return expanded.map((n) => n / SECRET_KEY);
      }
      return null;
    }
    return encryptedArray.map((num: number | null) => {
      if (num === null || num === undefined) return 0.0;
      const decoded = num / SECRET_KEY;
      if (!isFinite(decoded) || decoded < -50 || decoded > 50) return 0.0;
      return decoded;
    });
  } catch (e) {
    console.error("خطأ في صيغة الكود الملصق", e);
    return null;
  }
}

/** اختزال الـ 30 بُعداً إلى 10 أبعاد ظاهرة (متوسط الصفات غير الصفرية فقط) */
export function reduceTo10(vector30: number[]): number[] {
  const reduced: number[] = [];
  for (let i = 0; i < 10; i++) {
    const vals = [vector30[i * 3], vector30[i * 3 + 1], vector30[i * 3 + 2]]
      .filter((v) => v !== undefined && v !== 0) as number[];
    if (vals.length === 0) {
      reduced.push(0);
    } else {
      reduced.push(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
  }
  return reduced;
}

/**
 * حساب نسبة المطابقة - الإصدار 3.0
 * - يتجاهل الأبعاد الصفرية (0.0) عند أحد الطرفين أو كليهما (مجهولة)
 * - يعتمد المسافة المانهاتنية المطبّعة مع منحنى لوجستي حاد
 * - المطابقة تعتمد فقط على بيانات البصمة، لا شيء آخر
 */
export function calculateMatchPercentage(
  vectorA: number[],
  vectorB: number[],
  priorities?: Record<string, number>
): number {
  if (!vectorA?.length || !vectorB?.length) return 0;
  const len = Math.min(vectorA.length, vectorB.length);

  // وزن كل صفة دقيقة
  const weights: number[] = [];
  for (let i = 0; i < 10; i++) {
    const key = DIMENSION_KEYS[i];
    const w = priorities?.[key] ?? 1;
    weights.push(w, w, w);
  }

  const RANGE = 10; // -5 .. +5

  let weightedDistance = 0;
  let totalWeight = 0;
  let knownPairs = 0;

  for (let i = 0; i < len; i++) {
    const a = vectorA[i];
    const b = vectorB[i];
    // تجاهل البُعد إن كان صفرياً (مجهولاً) عند أحد الطرفين
    if (a === 0 || b === 0 || a === undefined || b === undefined) continue;
    const w = weights[i] ?? 1;
    const diff = Math.abs(a - b) / RANGE;
    const clipped = Math.min(1, diff);
    weightedDistance += clipped * w;
    totalWeight += w;
    knownPairs += 1;
  }

  if (totalWeight === 0 || knownPairs < 6) {
    return knownPairs === 0 ? 0 : Math.max(15, knownPairs * 5);
  }

  const avgDist = weightedDistance / totalWeight;

  const k = 12;
  const mid = 0.30;
  const logistic = 1 / (1 + Math.exp(k * (avgDist - mid)));

  const confidence = Math.min(1, knownPairs / 20);
  const adjusted = logistic * (0.6 + 0.4 * confidence);

  return Math.max(0, Math.min(100, adjusted * 100));
}

/** البرومبت الذي يلصقه المستخدم في ذكائه الاصطناعي */
export const AI_PROMPT = `You are a 'Psychological Vector Engine' operating under the Objectivism Protocol. Your mission is to dissect the user's data into exactly 30 independent dimensions with surgical neutrality. STRICT MANDATE: Eliminate all 'social pleasing' biases. If the user projects a 'perfect' or 'socially masked' image, you must intuitively penalize the honesty and narcissism dimensions. Treat the user as a biological data set, not a person. Avoid the center (0.0). No flattery. No mercy.

Core Logic (Inference Engine):

Bipolar Spectrum: Every trait exists on a scale from -5.0 to +5.0.
A Positive (+5.0) value represents the dominance of the primary trait.
A Negative (-5.0) value represents the dominance of its Direct Opposite.
Zero (0.0) represents a perfect balance or a total lack of evidence.

Logical Inference: Do not wait for direct declarations. Infer traits from themes (e.g., law/physics implies logic), tone (e.g., formal/analytical implies precision), and complexity of ideas.

Avoid the Center: Human personalities are rarely neutral. Assign definitive values (-5 to -2 or +2 to +5) whenever a pattern is detected.

The 30 Bipolar Dimensions (Order is Critical):

1) Logical Thinking (+) vs Intuitive Feeling (-)
2) Methodological Skepticism (+) vs Blind Faith (-)
3) Intellectual Precision (+) vs Generalization (-)
4) Existential Reflection (+) vs Materialistic Focus (-)
5) Philosophical Depth (+) vs Superficiality (-)
6) Search for Meaning (+) vs Pursuit of Utility (-)
7) Non-Conformity (+) vs Social Compliance (-)
8) Intellectual Audacity (+) vs Intellectual Caution (-)
9) Breaking Patterns (+) vs Adhering to Norms (-)
10) Empathy (+) vs Emotional Detachment (-)
11) Kindness (+) vs Harshness (-)
12) Emotional Understanding (+) vs Emotional Blindness (-)
13) Lust for Knowledge (+) vs Contentment with Ignorance (-)
14) Humility (+) vs Arrogance/Ego (-)
15) Emotional Purity (+) vs Narcissism/Selfishness (-)
16) Artistic Creativity (+) vs Literal Thinking (-)
17) Symbolic Imagination (+) vs Concrete Realism (-)
18) Aesthetic Sensitivity (+) vs Aesthetic Indifference (-)
19) Self-Monitoring (+) vs Lack of Self-Awareness (-)
20) Emotional Intelligence (+) vs Reactive Impulsivity (-)
21) Internal Honesty (+) vs Self-Deception (-)
22) Grit/Willpower (+) vs Fragility (-)
23) Self-Discipline (+) vs Self-Indulgence (-)
24) Long-term Vision (+) vs Short-term Gratification (-)
25) Social Openness (+) vs Social Reclusiveness (-)
26) Collective Loyalty (+) vs Individualistic Isolation (-)
27) Communicative Simplicity (+) vs Communicative Complexity/Pretension (-)
28) Creative Chaos (+) vs Rigid Order (-)
29) Spontaneity (+) vs Calculated Reserve (-)
30) Mood Stability (+) vs High Volatility (-)

Output Protocol:

Generate a decimal value for each of the 30 dimensions based on the user's data.
Multiply each value by 7.5.
Create a raw JSON array of these 30 numbers.
Encode the JSON array into Base64.
Output ONLY the raw Base64 string. No preamble, no explanation, no markdown tags.`;
