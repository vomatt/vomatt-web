'use client';

import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';

import { htmlLang } from '@/i18n-config';
import { interpolate, type TranslationValues } from '@/lib/interpolate';
import { LanguageCode } from '@/types';

export interface Translations {
	[key: string]: string | Translations;
}

interface LanguageContextType {
	currentLanguage: LanguageCode;
	setLanguage: (language: LanguageCode) => void;
	t: (key: string, fallbackOrValues?: string | TranslationValues) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined
);

/** The active `t`, or null outside a LanguageProvider (e.g. the Sanity studio) for shared primitives. */
export const useOptionalTranslate = () => useContext(LanguageContext)?.t ?? null;

// Hook to use language context
export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};

// Set language cookie
const setLanguageCookie = (language: LanguageCode) => {
	const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
	document.cookie = `preferred-language=${language}; max-age=${maxAge}; path=/; samesite=lax`;
};

interface LanguageProviderProps {
	children: ReactNode;
	defaultTranslations: Translations;
	initialLanguage: LanguageCode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
	children,
	defaultTranslations,
	initialLanguage,
}) => {
	const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(initialLanguage);
	const [translations, setTranslations] =
		useState<Translations>(defaultTranslations);
	const setLanguage = (language: LanguageCode) => {
		setCurrentLanguage(language);
		setLanguageCookie(language); // Use cookie instead of localStorage
		loadTranslations(language);
	};
	// Load translations for a specific language
	const loadTranslations = async (language: LanguageCode) => {
		try {
			// Import translations dynamically
			const translationModule = await import(`../locales/${language}.json`);
			setTranslations(translationModule.default);
		} catch (error) {
			console.warn(
				`Failed to load translations for ${language}, using fallback`
			);
			// Load English as fallback
			try {
				const fallbackModule = await import('../locales/en.json');
				setTranslations(fallbackModule.default);
			} catch (fallbackError) {
				console.error('Failed to load fallback translations');
				setTranslations({});
			}
		}
	};
	// Update HTML attributes when language changes
	useEffect(() => {
		document.documentElement.lang = htmlLang(currentLanguage);
	}, [currentLanguage]);

	// Set language and persist to localStorage

	// Translation function with nested key support and `{name}` placeholders
	const t = (key: string, fallbackOrValues?: string | TranslationValues): string => {
		const keys = key.split('.');
		let value: any = translations;

		for (const k of keys) {
			value = value?.[k];
			if (value === undefined) break;
		}

		if (typeof value !== 'string') {
			return (typeof fallbackOrValues === 'string' && fallbackOrValues) || key;
		}
		return typeof fallbackOrValues === 'object' ? interpolate(value, fallbackOrValues) : value;
	};

	const value: LanguageContextType = {
		currentLanguage,
		setLanguage,
		t,
	};

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
};
