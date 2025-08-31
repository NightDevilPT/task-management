// lib/locales/config.ts
export const SUPPORTED_LANGUAGES: Record<
	string,
	{ name: string; flag: string }
> = {
	en: { name: "English", flag: "🇺🇳" },
	es: { name: "Español", flag: "🇪🇸" },
};

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const defaultLocale: SupportedLanguage = "en";

// Helper function to get language from path
export const getLanguageFromPath = (pathname: string): SupportedLanguage => {
	const pathSegments = pathname.split("/").filter(Boolean);
	const lang = pathSegments[0] as SupportedLanguage;
	return SUPPORTED_LANGUAGES[lang] ? lang : defaultLocale;
};
