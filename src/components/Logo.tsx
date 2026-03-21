import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Yin-Yang Symbol */}
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-gold/30 rounded-full animate-pulse-gold" />
        <div className={cn("relative text-gradient-gold", sizeClasses[size])}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_12px_hsl(var(--gold)/0.5)]">
            <defs>
              <linearGradient id="yinYangGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--gold))" />
                <stop offset="100%" stopColor="hsl(var(--gold-glow))" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="49" fill="url(#yinYangGold)" />
            <path d="M50 1A49 49 0 0 1 50 99A24.5 24.5 0 0 1 50 50A24.5 24.5 0 0 0 50 1" fill="#0a0118" />
            <circle cx="50" cy="25.5" r="7" fill="url(#yinYangGold)" />
            <circle cx="50" cy="74.5" r="7" fill="#0a0118" />
          </svg>
        </div>
      </div>
      
      {/* Logo Text */}
      <div className="flex flex-col items-center">
        <h1 className={cn(
          "font-display font-bold tracking-wide text-gradient-gold",
          size === "lg" ? "text-5xl" : size === "md" ? "text-3xl" : "text-xl"
        )}>
          TỬ VI
        </h1>
        <p className={cn(
          "text-muted-foreground tracking-[0.3em] uppercase font-body",
          size === "lg" ? "text-sm" : "text-xs"
        )}>
          Việt Nam
        </p>
      </div>
    </div>
  );
};

export default Logo;
