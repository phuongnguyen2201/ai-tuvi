import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 rounded-full bg-surface-3 border border-border flex items-center justify-center hover:border-gold/50 hover:bg-surface-4 transition-all"
      title={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-gold" />
      ) : (
        <Moon className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
};

export default ThemeToggle;
