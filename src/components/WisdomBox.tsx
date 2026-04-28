import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const QUOTES = [
  {
    text: "لم يكن هدفي سوى محاولة أن أحيا وفقاً للدوافع التي تنبع من ذاتي الحقيقية، فلماذا كان ذلك بهذه الصعوبة؟",
    author: "هيرمان هيسه",
  },
  {
    text: "وتحسبُ أنك جُرمٌ صغيرٌ.. وفيكَ انطوى العالمُ الأكبرُ.",
    author: "علي بن أبي طالب",
  },
  {
    text: "من ينظر إلى الخارج يحلم، ومن ينظر إلى الداخل يستيقظ.",
    author: "كارل يونغ",
  },
  { text: "معرفة نفسك هي بداية كل حكمة.", author: "أرسطو" },
  {
    text: "أنت لست قطرة في محيط، أنت المحيط بأكمله في قطرة.",
    author: "جلال الدين الرومي",
  },
  {
    text: "من يعرف الآخرين فهو عالم، ومن يعرف نفسه فهو حكيم.",
    author: "لاو تسو",
  },
  { text: "اعرف نفسك بنفسك.", author: "سقراط" },
];

export const WisdomBox = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 600);
    }, 9000);
    return () => clearInterval(t);
  }, []);

  const q = QUOTES[index];

  return (
    <div className="relative w-full max-w-2xl mx-auto my-8 group">
      {/* Ornate gold frame */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-gold opacity-60 blur-sm" />
      <div
        className="relative rounded-2xl border border-gold p-6 md:p-8 animate-pulse-gold overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(260 40% 7% / 0.95), hsl(265 45% 9% / 0.95))",
        }}
      >
        {/* Corner ornaments */}
        <CornerOrnament className="top-2 right-2" />
        <CornerOrnament className="top-2 left-2 scale-x-[-1]" />
        <CornerOrnament className="bottom-2 right-2 scale-y-[-1]" />
        <CornerOrnament className="bottom-2 left-2 scale-x-[-1] scale-y-[-1]" />

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/60" />
          <Sparkles className="w-4 h-4 text-gold animate-shimmer" />
          <span className="text-xs tracking-[0.3em] text-gold/80 font-display uppercase">
            حكمة
          </span>
          <Sparkles className="w-4 h-4 text-gold animate-shimmer" />
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/60" />
        </div>

        <div
          className={`transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <p className="text-center text-gradient-gold font-display text-lg md:text-2xl leading-relaxed font-medium">
            «{q.text}»
          </p>
          <p className="text-center mt-3 text-gold/70 font-display text-sm tracking-widest">
            — {q.author} —
          </p>
        </div>
      </div>
    </div>
  );
};

const CornerOrnament = ({ className = "" }: { className?: string }) => (
  <svg
    className={`absolute w-8 h-8 text-gold/50 ${className}`}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
  >
    <path d="M2 2 L14 2 M2 2 L2 14" />
    <circle cx="6" cy="6" r="1.2" fill="currentColor" />
    <path d="M2 8 Q 8 8 8 2" />
  </svg>
);
