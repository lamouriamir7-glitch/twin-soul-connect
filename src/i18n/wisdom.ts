import type { Lang } from "./translations";

export type Quote = { text: string; author: string };

export const WISDOM_LABEL: Record<Lang, string> = {
  ar: "حكمة",
  en: "Wisdom",
  fr: "Sagesse",
  ru: "Мудрость",
  zh: "智慧",
};

export const QUOTES: Record<Lang, Quote[]> = {
  ar: [
    { text: "لم يكن هدفي سوى محاولة أن أحيا وفقاً للدوافع التي تنبع من ذاتي الحقيقية، فلماذا كان ذلك بهذه الصعوبة؟", author: "هيرمان هيسه" },
    { text: "وتحسبُ أنك جُرمٌ صغيرٌ.. وفيكَ انطوى العالمُ الأكبرُ.", author: "علي بن أبي طالب" },
    { text: "من ينظر إلى الخارج يحلم، ومن ينظر إلى الداخل يستيقظ.", author: "كارل يونغ" },
    { text: "معرفة نفسك هي بداية كل حكمة.", author: "أرسطو" },
    { text: "أنت لست قطرة في محيط، أنت المحيط بأكمله في قطرة.", author: "جلال الدين الرومي" },
    { text: "من يعرف الآخرين فهو عالم، ومن يعرف نفسه فهو حكيم.", author: "لاو تسو" },
    { text: "اعرف نفسك بنفسك.", author: "سقراط" },
  ],
  en: [
    { text: "I wanted only to try to live in accord with the promptings which came from my true self. Why was that so very difficult?", author: "Hermann Hesse" },
    { text: "You think yourself a small body, while the greatest universe is folded within you.", author: "Ali ibn Abi Talib" },
    { text: "Who looks outside, dreams; who looks inside, awakes.", author: "Carl Jung" },
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi" },
    { text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu" },
    { text: "Know thyself.", author: "Socrates" },
  ],
  fr: [
    { text: "Je ne voulais qu'essayer de vivre selon ce qui voulait spontanément sortir de moi. Pourquoi était-ce si difficile ?", author: "Hermann Hesse" },
    { text: "Tu te crois un petit corps, alors que l'univers immense est replié en toi.", author: "Ali ibn Abi Talib" },
    { text: "Celui qui regarde au-dehors rêve, celui qui regarde au-dedans s'éveille.", author: "Carl Jung" },
    { text: "Se connaître soi-même est le début de toute sagesse.", author: "Aristote" },
    { text: "Tu n'es pas une goutte dans l'océan. Tu es l'océan tout entier dans une goutte.", author: "Roumi" },
    { text: "Connaître les autres, c'est intelligence ; se connaître soi-même, c'est sagesse.", author: "Lao Tseu" },
    { text: "Connais-toi toi-même.", author: "Socrate" },
  ],
  ru: [
    { text: "Я хотел лишь попытаться жить тем, что само рвалось из меня. Почему это было так трудно?", author: "Герман Гессе" },
    { text: "Ты считаешь себя малой плотью, а в тебе свернулась величайшая вселенная.", author: "Али ибн Абу Талиб" },
    { text: "Кто смотрит наружу — видит сны; кто смотрит внутрь — пробуждается.", author: "Карл Юнг" },
    { text: "Познание себя — начало всякой мудрости.", author: "Аристотель" },
    { text: "Ты не капля в океане. Ты весь океан в капле.", author: "Руми" },
    { text: "Знающий других — умён; знающий себя — мудр.", author: "Лао-цзы" },
    { text: "Познай самого себя.", author: "Сократ" },
  ],
  zh: [
    { text: "我只想按照内心真正的冲动去生活,为何如此艰难?", author: "赫尔曼·黑塞" },
    { text: "你以为自己只是渺小的躯壳,殊不知整个宇宙都蕴藏在你之中。", author: "阿里·本·阿比·塔利卜" },
    { text: "向外看的人在做梦,向内看的人才会觉醒。", author: "卡尔·荣格" },
    { text: "认识你自己,是一切智慧的开端。", author: "亚里士多德" },
    { text: "你不是海洋中的一滴水,你是一滴水中的整个海洋。", author: "鲁米" },
    { text: "知人者智,自知者明。", author: "老子" },
    { text: "认识你自己。", author: "苏格拉底" },
  ],
};
