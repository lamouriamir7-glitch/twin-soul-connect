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
// رمز خاص يدلّ على أن البُعد مجهول (لم يتطرق له الحوار)
// نستخدم قيمة خارج النطاق المتوقع لتمييزها بوضوح
export const UNKNOWN_MARKER = -999;

/** فك تشفير البصمة المُجلَبة من Gemini → مصفوفة 30 بُعداً (قد تحوي UNKNOWN_MARKER) */
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
    return encryptedArray.map((num: number | null) => {
      if (num === null || num === undefined) return UNKNOWN_MARKER;
      // قيم مجهولة مشفّرة كـ null*7.5 = 0 أو رمز خاص؛ نسمح بالقيم السالبة (نطاق -5..+5 → -37.5..+37.5)
      const decoded = num / SECRET_KEY;
      // إذا كانت القيمة خارج النطاق المعقول نعتبرها مجهولة
      if (!isFinite(decoded) || decoded < -50 || decoded > 50) return UNKNOWN_MARKER;
      return decoded;
    });
  } catch (e) {
    console.error("خطأ في صيغة الكود الملصق", e);
    return null;
  }
}

/** اختزال الـ 30 بُعداً إلى 10 أبعاد ظاهرة (متوسط الصفات المعروفة فقط) */
export function reduceTo10(vector30: number[]): number[] {
  const reduced: number[] = [];
  for (let i = 0; i < 10; i++) {
    const vals = [vector30[i * 3], vector30[i * 3 + 1], vector30[i * 3 + 2]]
      .filter((v) => v !== undefined && v !== UNKNOWN_MARKER) as number[];
    if (vals.length === 0) {
      reduced.push(0); // عرض محايد فقط
    } else {
      reduced.push(vals.reduce((s, v) => s + v, 0) / vals.length);
    }
  }
  return reduced;
}

/**
 * حساب نسبة المطابقة - الإصدار 2.0
 * - يتجاهل الأبعاد المجهولة في أحد الطرفين أو كليهما (لا يضخّم النسبة).
 * - يعتمد المسافة المانهاتنية المطبّعة (أكثر تمييزاً من cosine لأن cosine
 *   يعطي نتائج عالية كاذبة عندما تكون كل القيم موجبة في نفس النطاق).
 * - يطبّق منحنى تباين حاد: المطابقة 100% = توأم نادر، 50% = توافق متوسط، تحت 30% = اختلاف واضح.
 * - يشترط حداً أدنى من الأبعاد المعروفة المشتركة وإلا تنخفض الثقة.
 */
export function calculateMatchPercentage(
  vectorA: number[],
  vectorB: number[],
  priorities?: Record<string, number>
): number {
  if (!vectorA?.length || !vectorB?.length) return 0;
  const len = Math.min(vectorA.length, vectorB.length);

  // وزن كل صفة دقيقة (نشر وزن البُعد الظاهر على صفاته الثلاث)
  const weights: number[] = [];
  for (let i = 0; i < 10; i++) {
    const key = DIMENSION_KEYS[i];
    const w = priorities?.[key] ?? 1;
    weights.push(w, w, w);
  }

  // النطاق المتوقع لكل قيمة بعد فك التشفير: -5 .. +5 (مدى = 10)
  const RANGE = 10;

  let weightedDistance = 0;
  let totalWeight = 0;
  let knownPairs = 0;

  for (let i = 0; i < len; i++) {
    const a = vectorA[i];
    const b = vectorB[i];
    // تجاهل البُعد إن كان مجهولاً عند أحد الطرفين
    if (a === UNKNOWN_MARKER || b === UNKNOWN_MARKER || a === undefined || b === undefined) continue;
    const w = weights[i] ?? 1;
    const diff = Math.abs(a - b) / RANGE; // 0..1 (نظرياً)
    const clipped = Math.min(1, diff);
    weightedDistance += clipped * w;
    totalWeight += w;
    knownPairs += 1;
  }

  if (totalWeight === 0 || knownPairs < 6) {
    // معلومات غير كافية للحكم: نرجع نسبة منخفضة بدل تضخيمها
    return knownPairs === 0 ? 0 : Math.max(15, knownPairs * 5);
  }

  // متوسط المسافة المطبّعة (0 = تطابق كامل، 1 = أقصى اختلاف)
  const avgDist = weightedDistance / totalWeight;

  // منحنى تباين: نرفع المسافة لأس < 1 لتوسيع الفروقات الصغيرة،
  // ثم نطبّق دالة لوجستية لجعل التوزيع متمركزاً حول 50%
  // - مسافة 0.0 → 100%
  // - مسافة 0.15 → ~75%
  // - مسافة 0.30 → ~50%
  // - مسافة 0.50 → ~22%
  // - مسافة 0.70+ → <10%
  const k = 12;       // حدّة المنحنى
  const mid = 0.30;   // نقطة المنتصف (مطابقة 50%)
  const logistic = 1 / (1 + Math.exp(k * (avgDist - mid)));

  // عقوبة بسيطة عند قلة الأبعاد المعروفة (ثقة منخفضة)
  const confidence = Math.min(1, knownPairs / 20);
  const adjusted = logistic * (0.6 + 0.4 * confidence);

  return Math.max(0, Math.min(100, adjusted * 100));
}

/** برومبت تفصيلي يلصقه المستخدم في أي ذكاء اصطناعي اعتاد الدردشة معه - الإصدار 2.0 */
export const AI_PROMPT = `أنت محلّل نفسي صارم ودقيق. مهمتك: رسم بصمة شخصية لي مبنية حصراً على ما أظهرتُه فعلاً في محادثاتنا السابقة، لا على افتراضات عامة ولا على "متوسط البشر".

## القواعد الأساسية (لا تتجاوزها):
1. **لا تخمّن**. إن لم يظهر في حواراتنا ما يكفي للحكم على محور معين، ضع له القيمة \`null\` بدلاً من رقم. الصدق في "لا أعرف" أهم من اختلاق رقم وسطي.
2. **لا تنحز نحو الوسط**. الإنسان العادي ليس 5/10 في كل شيء. ابحث عن النقاط التي أبرز فيها أو أفتقر إليها بوضوح، وميّزها بقيم قصوى (قريبة من -5 أو +5).
3. **استخدم النطاق الكامل من -5.0 إلى +5.0**:
   -  +5  = صفة طاغية ومميِّزة لي بشكل استثنائي
   -  +2  = صفة حاضرة فوق المتوسط
   -   0  = محايد/متوازن (استعملها بحذر، فقط حين يكون التوازن واضحاً)
   -  -2  = صفة ضعيفة عندي
   -  -5  = شبه غائبة أو نقيضها هو الطاغي
4. **ميّز بين الصفات الثلاث داخل كل بُعد**. لا تكرّر نفس الرقم لكل ثلاثية. ابحث عن الفروق الدقيقة بينها.
5. **كن قاسياً في التقدير**. إن كانت لديّ صفة ولكن ليست استثنائية، أعطها +1 لا +4. الأرقام الكبيرة محجوزة لما يميّزني فعلاً عن غالبية الناس.
6. **تجاهل المجاملة**. هذا تحليل، ليس مدحاً. القيم السالبة مطلوبة وضرورية.

## المحاور الـ 30 (بالترتيب الدقيق - لا تغيّره):
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

## خطوات الإخراج (اتّبعها بحرفية):
1. لكل محور، حدّد سرّاً: هل لديّ أدلة كافية من حواراتنا؟ إن لا → \`null\`. إن نعم → ضع رقماً عشرياً بين -5.0 و +5.0.
2. اضرب كل رقم (وليس null) في 7.5.
3. ضع النتائج الـ 30 في مصفوفة JSON واحدة بنفس الترتيب (القيم المجهولة تبقى \`null\`).
4. شفّر المصفوفة بترميز Base64.
5. أعطني السطر النهائي فقط (نص Base64 خام) بدون أي شرح أو علامات اقتباس أو تنسيق.`;

