import { cn } from "@/lib/utils";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * اسم التطبيق ثابت بالعربي بلون ذهبي في كل اللغات،
 * مع عنوان فرعي إنجليزي صغير "Digital twin".
 */
export const AppTitle = ({ size = "md", className }: Props) => {
  const sizes = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl",
  } as const;
  const subSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  } as const;

  return (
    <div className={cn("inline-flex flex-col items-center leading-none", className)} dir="rtl">
      <h1 className={cn("font-display title-gold-glow", sizes[size])}>
        التوأم الرقمي
      </h1>
      <span
        className={cn(
          "tracking-[0.3em] uppercase mt-1 text-gold/70 font-display",
          subSizes[size]
        )}
        dir="ltr"
      >
        Digital twin
      </span>
    </div>
  );
};
