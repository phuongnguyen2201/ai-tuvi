import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Dragon/Phoenix Symbol */}
      <div className="relative">
        <div className="absolute inset-0 blur-2xl bg-gold/30 rounded-full animate-pulse-gold" />
        <div className={cn(
          "relative font-display font-bold text-gradient-gold",
          sizeClasses[size]
        )}>
          ☯
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
