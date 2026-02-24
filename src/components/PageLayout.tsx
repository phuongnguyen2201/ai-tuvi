import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { WalletStatus } from "@/components/WalletStatus";
import ThemeToggle from "@/components/ThemeToggle";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  className?: string;
}

const PageLayout = ({ children, title, showBack = true, className }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-deep/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-gold/3 rounded-full blur-3xl" />
      </div>
      
      {/* Content */}
      <div className={cn("relative z-10 min-h-screen", className)}>
        {/* Header */}
        {(showBack || title) && (
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="container max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
              {showBack && (
                <Link 
                  to="/" 
                  className="w-10 h-10 rounded-full bg-surface-3 border border-border flex items-center justify-center hover:border-gold/50 hover:bg-surface-4 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
              )}
              {title && (
                <h1 className="font-display text-lg font-semibold text-gradient-gold">
                  {title}
                </h1>
              )}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <WalletStatus />
              </div>
            </div>
          </header>
        )}
        
        {/* Main content */}
        <main className="container max-w-lg mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
