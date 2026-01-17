"use client";

import { Language } from "@/lib/i18n";

interface LanguageSwitcherProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSwitcher({ currentLang, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg glass-card">
      <button
        onClick={() => onLanguageChange("en")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          currentLang === "en"
            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onLanguageChange("hi")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          currentLang === "hi"
            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}
