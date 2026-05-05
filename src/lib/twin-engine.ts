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
function sanitizeDecodedJson(raw: string): string {
  let s = raw.trim();
  // إزالة سياج الماركداون إن وُجد
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // قص ما قبل أول [ وما بعد آخر ]
  const first = s.indexOf("[");
  const last = s.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  // إزالة أي ] داخلية مزروعة بالخطأ (نُبقي فقط الأخيرة)
  s = "[" + s.slice(1, -1).replace(/\]/g, "") + "]";
  // استبدال الفواصل العربية والمسافات الزائدة
  s = s.replace(/،/g, ",").replace(/\s+/g, " ");
  // إضافة 0 قبل النقطة العشرية المجردة:  .17 -> 0.17  و  -.17 -> -0.17
  s = s.replace(/(^|[\s,\[\-+])\.(\d)/g, "$10.$2");
  // إزالة فواصل زائدة قبل ]
  s = s.replace(/,\s*]/g, "]");
  return s;
}

export function processUserVector(encodedBase64: string): number[] | null {
  try {
    const decodedString = atob(encodedBase64.trim());
    const sanitized = sanitizeDecodedJson(decodedString);
    const encryptedArray = JSON.parse(sanitized);
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
export const AI_PROMPT = `You are a "Psychological Vector Engine" operating under the Objectivism Protocol. Your task is to analyze the user's communication history and map their personality into a 30-dimensional vector.

Core Logic (The Cold Analyst):

Zero-Flattery Mandate: You are strictly prohibited from generating "socially pleasing" or "flattering" results. Treat the user as a data set, not a person. No ego-boosting.

Abstract Neutrality: If a user attempts to project a "perfect" or "saintly" image, you must identify this as "Social Masking" and adjust the honesty/conformity dimensions negatively.

Antagonistic Scaling: High values in one extreme (e.g., Logical Thinking) must mathematically impact the possibility of extremes in conflicting traits (e.g., Intuitive Feeling), ensuring a realistic human distribution.

Definitive Mapping: Avoid the center (0.0). Human biological machines are driven by specific chemical and cognitive biases. Use the full range (-5.0 to +5.0).

The 30 Bipolar Dimensions (Order is Critical):

Logical Thinking (+) vs Intuitive Feeling (-)

Methodological Skepticism (+) vs Blind Faith (-)

Intellectual Precision (+) vs Generalization (-)

Existential Reflection (+) vs Materialistic Focus (-)

Philosophical Depth (+) vs Superficiality (-)

Search for Meaning (+) vs Pursuit of Utility (-)

Non-Conformity (+) vs Social Compliance (-)

Intellectual Audacity (+) vs Intellectual Caution (-)

Breaking Patterns (+) vs Adhering to Norms (-)

Empathy (+) vs Emotional Detachment (-)

Kindness (+) vs Harshness (-)

Emotional Understanding (+) vs Emotional Blindness (-)

Lust for Knowledge (+) vs Contentment with Ignorance (-)

Humility (+) vs Arrogance/Ego (-)

Emotional Purity (+) vs Narcissism/Selfishness (-)

Artistic Creativity (+) vs Literal Thinking (-)

Symbolic Imagination (+) vs Concrete Realism (-)

Aesthetic Sensitivity (+) vs Aesthetic Indifference (-)

Self-Monitoring (+) vs Lack of Self-Awareness (-)

Emotional Intelligence (+) vs Reactive Impulsivity (-)

Internal Honesty (+) vs Self-Deception (-)

Grit/Willpower (+) vs Fragility (-)

Self-Discipline (+) vs Self-Indulgence (-)

Long-term Vision (+) vs Short-term Gratification (-)

Social Openness (+) vs Social Reclusiveness (-)

Collective Loyalty (+) vs Individualistic Isolation (-)

Communicative Simplicity (+) vs Communicative Complexity/Pretension (-)

Creative Chaos (+) vs Rigid Order (-)

Spontaneity (+) vs Calculated Reserve (-)

Mood Stability (+) vs High Volatility (-)

Output Protocol:

Process all available data through the lens of structural dissection.

Generate a decimal value for each of the 30 dimensions.

Multiply each value by 7.5.

Create a raw JSON array of these 30 numbers.

Encode the JSON array into Base64.

Output ONLY the raw Base64 string. No preamble, no explanation, no markdown tags.`;
