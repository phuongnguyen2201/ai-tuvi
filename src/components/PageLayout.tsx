import { cn } from "@/lib/utils";
import { ArrowLeft, LogIn, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  className?: string;
}

const PageLayout = ({ children, title, showBack = true, className }: PageLayoutProps) => {
  const navigate = useNavigate();
  const { user, displayName, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
            <div className="container max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
              {showBack && (
                <Link 
                  to="/" 
                  className="w-10 h-10 rounded-full bg-surface-3 border border-border flex items-center justify-center hover:border-gold/50 hover:bg-surface-4 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Link>
              )}
              {title && (
                <h1 className="font-display text-lg font-semibold text-gradient-gold truncate">
                  {title}
                </h1>
              )}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 rounded-lg bg-surface-3 border border-border px-2 py-1.5 hover:border-gold/50 transition-all">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-foreground max-w-[80px] truncate hidden sm:inline">
                          {displayName}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Xin chào, {displayName}!
                      </div>
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        Hồ sơ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                        <LogIn className="mr-2 h-4 w-4 rotate-180" />
                        Đăng xuất
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="goldOutline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate("/auth")}
                  >
                    <LogIn className="h-3.5 w-3.5 mr-1" />
                    Đăng nhập
                  </Button>
                )}
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
