import { cn } from "@/lib/utils";

const zodiacSigns = [
  { name: "Tý", label: "🐀", element: "Thủy" },
  { name: "Sửu", label: "🐂", element: "Thổ" },
  { name: "Dần", label: "🐅", element: "Mộc" },
  { name: "Mão", label: "🐇", element: "Mộc" },
  { name: "Thìn", label: "🐉", element: "Thổ" },
  { name: "Tỵ", label: "🐍", element: "Hỏa" },
  { name: "Ngọ", label: "🐎", element: "Hỏa" },
  { name: "Mùi", label: "🐐", element: "Thổ" },
  { name: "Thân", label: "🐒", element: "Kim" },
  { name: "Dậu", label: "🐓", element: "Kim" },
  { name: "Tuất", label: "🐕", element: "Thổ" },
  { name: "Hợi", label: "🐖", element: "Thủy" },
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
            <span className="text-2xl">{zodiac.label}</span>
            <span className={cn(
              "text-sm font-bold",
              value === zodiac.name ? "text-gold" : "text-foreground"
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
