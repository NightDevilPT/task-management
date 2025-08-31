"use client";

import {
	defaultLocale,
	SUPPORTED_LANGUAGES,
	SupportedLanguage,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Dictionary {
	[key: string]: any;
}

interface LanguageContextType {
	language: SupportedLanguage;
	setLanguage: (lang: SupportedLanguage) => void;
	supportedLanguages: typeof SUPPORTED_LANGUAGES;
	dictionary: Dictionary | null;
	isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [language, setLanguage] = useState<SupportedLanguage>(defaultLocale);
	const [dictionary, setDictionary] = useState<Dictionary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const pathname = usePathname();

	// Load dictionary when language changes
	useEffect(() => {
		const loadDictionary = async () => {
			setIsLoading(true);
			try {
				const dict = await getDictionary(language);
				setDictionary(dict);
			} catch (error) {
				console.error("Failed to load dictionary:", error);
				// Fallback to default locale if current language fails
				if (language !== defaultLocale) {
					const defaultDict = await getDictionary(defaultLocale);
					setDictionary(defaultDict);
				}
			} finally {
				setIsLoading(false);
			}
		};

		loadDictionary();
	}, [language]);

	// Extract language from route on initial load
	useEffect(() => {
		const pathSegments = pathname.split("/").filter(Boolean);
		const routeLang = pathSegments[0] as SupportedLanguage;

		if (routeLang && SUPPORTED_LANGUAGES[routeLang]) {
			setLanguage(routeLang);
		} else {
			setLanguage(defaultLocale);
		}
	}, [pathname]);

	const handleSetLanguage = async (newLanguage: SupportedLanguage) => {
		setLanguage(newLanguage);

		// Update the route to reflect the new language
		const pathSegments = pathname.split("/").filter(Boolean);
		const currentLang = pathSegments[0] as SupportedLanguage;

		if (SUPPORTED_LANGUAGES[currentLang]) {
			// Replace the language segment in the URL
			pathSegments[0] = newLanguage;
			const newPath = `/${pathSegments.join("/")}`;
			router.push(newPath);
		} else {
			// Current path doesn't have a language prefix, add it
			const newPath = `/${newLanguage}${pathname}`;
			router.push(newPath);
		}
	};

	return (
		<LanguageContext.Provider
			value={{
				language,
				setLanguage: handleSetLanguage,
				supportedLanguages: SUPPORTED_LANGUAGES,
				dictionary,
				isLoading,
			}}
		>
			{children}
		</LanguageContext.Provider>
	);
};

export const useLanguage = (): LanguageContextType => {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
};

// Helper hook for components that need dictionary access
export const useDictionary = () => {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useDictionary must be used within a LanguageProvider");
	}

	if (context.isLoading || !context.dictionary) {
		throw new Error("Dictionary is not loaded yet");
	}

	return context.dictionary;
};
