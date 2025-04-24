import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/theme-provider"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative h-9 w-9 p-0"
    >
      <Sun 
        className={`h-[1.2rem] w-[1.2rem] transition-transform duration-200 ${
          theme === "dark" ? "absolute scale-0 rotate-90" : "rotate-0 scale-100 text-amber-500"
        }`}
      />
      <Moon 
        className={`h-[1.2rem] w-[1.2rem] transition-transform duration-200 ${
          theme === "light" ? "absolute scale-0 -rotate-90" : "rotate-0 scale-100 text-blue-300"
        }`}
      />
      <span className="sr-only">{t("Toggle theme")}</span>
    </Button>
  )
}
