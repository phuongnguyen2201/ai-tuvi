import { cn } from "@/lib/utils";

const zodiacSigns = [
  { name: "Tý", emoji: "🐀", element: "Thủy" },
  { name: "Sửu", emoji: "🐂", element: "Thổ" },
  { name: "Dần", emoji: "🐅", element: "Mộc" },
  { name: "Mão", emoji: "🐇", element: "Mộc" },
  { name: "Thìn", emoji: "🐉", element: "Thổ" },
  { name: "Tỵ", emoji: "🐍", element: "Hỏa" },
  { name: "Ngọ", emoji: "🐴", element: "Hỏa" },
  { name: "Mùi", emoji: "🐑", element: "Thổ" },
  { name: "Thân", emoji: "🐵", element: "Kim" },
  { name: "Dậu", emoji: "🐔", element: "Kim" },
  { name: "Tuất", emoji: "🐕", element: "Thổ" },
  { name: "Hợi", emoji: "🐷", element: "Thủy" },
];

interface ZodiacPickerProps {
  value: string | null;
  onChange: (zodiac: string) => void;
  label?: string;
}

const ZodiacPicker = ({ value, onChange, label }: ZodiacPickerProps) => {
  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="grid grid-cols-4 gap-2">
        {zodiacSigns.map((zodiac) => (
          <button
            key={zodiac.name}
            type="button"
            onClick={() => onChange(zodiac.name)}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-xl",
              "border transition-all duration-300",
              "hover:scale-105 active:scale-95",
              value === zodiac.name
                ? "bg-gold/10 border-gold shadow-[0_0_20px_hsl(43,74%,53%,0.2)]"
                : "bg-surface-3 border-border hover:border-gold/30"
            )}
          >
            <span className="text-2xl">{zodiac.emoji}</span>
            <span className={cn(
              "text-xs font-medium",
              value === zodiac.name ? "text-gold" : "text-muted-foreground"
            )}>
              {zodiac.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export { ZodiacPicker, zodiacSigns };
