import { cn } from "@/lib/utils";

const zodiacSigns = [
  { name: "Tý", label: "Chuột", element: "Thủy" },
  { name: "Sửu", label: "Trâu", element: "Thổ" },
  { name: "Dần", label: "Hổ", element: "Mộc" },
  { name: "Mão", label: "Mèo", element: "Mộc" },
  { name: "Thìn", label: "Rồng", element: "Thổ" },
  { name: "Tỵ", label: "Rắn", element: "Hỏa" },
  { name: "Ngọ", label: "Ngựa", element: "Hỏa" },
  { name: "Mùi", label: "Dê", element: "Thổ" },
  { name: "Thân", label: "Khỉ", element: "Kim" },
  { name: "Dậu", label: "Gà", element: "Kim" },
  { name: "Tuất", label: "Chó", element: "Thổ" },
  { name: "Hợi", label: "Heo", element: "Thủy" },
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
            <span className={cn(
              "text-sm font-bold",
              value === zodiac.name ? "text-gold" : "text-foreground"
            )}>
              {zodiac.name}
            </span>
            <span className={cn(
              "text-[10px]",
              value === zodiac.name ? "text-gold/70" : "text-muted-foreground"
            )}>
              {zodiac.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export { ZodiacPicker, zodiacSigns };
