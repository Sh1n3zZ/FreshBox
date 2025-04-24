import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { languageNames, supportedLanguages, setLanguage } from '@/i18n/i18n';
import { useTheme } from '@/providers/theme-provider';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Globe className={`h-[1.2rem] w-[1.2rem] ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`} />
          <span className="sr-only">{t('Switch Language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={i18n.language === lang ? 'bg-accent font-medium' : ''}
          >
            {languageNames[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
