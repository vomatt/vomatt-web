'use client';

import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';

import { SUPPORTED_LANGUAGES } from '@/i18n-config';
import { LanguageCode } from '@/types';
export interface Translations {
	[key: string]: string | Translations;
}

interface LanguageContextType {
	currentLanguage: LanguageCode;
	setLanguage: (language: LanguageCode) => void;
	t: (key: string, fallback?: string) => string;
	isLoading: boolean;
	isInitialized: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined
);

// Hook to use language context
export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};

// Detect browser language
const detectBrowserLanguage = (): LanguageCode => {
	if (typeof window === 'undefined') return 'en';

	const browserLang = navigator.language.split('-')[0] as LanguageCode;
	return Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)
		? browserLang
		: 'en';
};

const getLanguageFromCookie = (): LanguageCode | null => {
	if (typeof document === 'undefined') return null;

	const cookies = document.cookie.split(';');
	const languageCookie = cookies.find((cookie) =>
		cookie.trim().startsWith('preferred-language=')
	);

	if (languageCookie) {
		const language = languageCookie.split('=')[1] as LanguageCode;
		return Object.keys(SUPPORTED_LANGUAGES).includes(language)
			? language
			: null;
	}

	return null;
};

// Set language cookie
const setLanguageCookie = (language: LanguageCode) => {
	const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
	document.cookie = `preferred-language=${language}; max-age=${maxAge}; path=/; samesite=lax`;
};

interface LanguageProviderProps {
	children: ReactNode;
	defaultTranslations?: Translations;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
	children,
	defaultTranslations = {},
}) => {
	const [isInitialized, setIsInitialized] = useState(false);
	const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
	const [translations, setTranslations] =
		useState<Translations>(defaultTranslations);
	const [isLoading, setIsLoading] = useState(true);
	const setLanguage = (language: LanguageCode) => {
		setCurrentLanguage(language);
		setLanguageCookie(language); // Use cookie instead of localStorage
		loadTranslations(language);
	};
	// Load translations for a specific language
	const loadTranslations = async (language: LanguageCode) => {
		setIsLoading(true);
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
		} finally {
			setIsLoading(false);
		}
	};
	// Initialize language on mount
	useEffect(() => {
		// Priority order: Cookie > Browser Detection > Default
		const cookieLanguage = getLanguageFromCookie();
		const browserLanguage = detectBrowserLanguage();
		const initialLanguage = cookieLanguage || browserLanguage;

		setCurrentLanguage(initialLanguage);
		loadTranslations(initialLanguage);
		setIsInitialized(true);
		// Update HTML attributes
		document.documentElement.lang = initialLanguage;
		const RTL_LANGUAGES: LanguageCode[] = ['ar', 'he', 'fa'] as any[];
		document.documentElement.dir = RTL_LANGUAGES.includes(initialLanguage)
			? 'rtl'
			: 'ltr';
	}, []);

	// Update HTML attributes when language changes
	useEffect(() => {
		document.documentElement.lang = currentLanguage;
		const RTL_LANGUAGES: LanguageCode[] = ['ar', 'he', 'fa'] as any[];
		document.documentElement.dir = RTL_LANGUAGES.includes(currentLanguage)
			? 'rtl'
			: 'ltr';
	}, [currentLanguage]);

	// Set language and persist to localStorage

	// Translation function with nested key support
	const t = (key: string, fallback?: string): string => {
		const keys = key.split('.');
		let value: any = translations;

		for (const k of keys) {
			value = value?.[k];
			if (value === undefined) break;
		}

		return typeof value === 'string' ? value : fallback || key;
	};

	const value: LanguageContextType = {
		currentLanguage,
		setLanguage,
		t,
		isLoading,
		isInitialized,
	};

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
};
