import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface MenuCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  delay?: number;
}

const MenuCard = ({ title, description, icon: Icon, to, delay = 0 }: MenuCardProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br from-surface-3 to-surface-2",
        "border border-border hover:border-gold/50",
        "transition-all duration-500",
        "hover:shadow-[0_0_40px_hsl(43,74%,53%,0.15)]",
        "hover:scale-[1.02] active:scale-[0.98]",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-xl bg-surface-4 border border-border group-hover:border-gold/30 flex items-center justify-center transition-all duration-300">
          <Icon className="w-7 h-7 text-gold transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative">
        <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-gradient-gold transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      
      {/* Arrow indicator */}
      <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-surface-4 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
};

export default MenuCard;
