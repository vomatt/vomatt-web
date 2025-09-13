'use client';

import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko';

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined
);

// Translation data - in a real app, you might load this from files
const translations: Record<Language, Record<string, string>> = {
	en: {
		welcome: 'Welcome',
		settings: 'Settings',
		language: 'Language',
		profile: 'Profile',
		home: 'Home',
		about: 'About',
		contact: 'Contact',
	},
	es: {
		welcome: 'Bienvenido',
		settings: 'Configuración',
		language: 'Idioma',
		profile: 'Perfil',
		home: 'Inicio',
		about: 'Acerca de',
		contact: 'Contacto',
	},
	fr: {
		welcome: 'Bienvenue',
		settings: 'Paramètres',
		language: 'Langue',
		profile: 'Profil',
		home: 'Accueil',
		about: 'À propos',
		contact: 'Contact',
	},
	de: {
		welcome: 'Willkommen',
		settings: 'Einstellungen',
		language: 'Sprache',
		profile: 'Profil',
		home: 'Startseite',
		about: 'Über uns',
		contact: 'Kontakt',
	},
	zh: {
		welcome: '欢迎',
		settings: '设置',
		language: '语言',
		profile: '个人资料',
		home: '首页',
		about: '关于',
		contact: '联系',
	},
	ja: {
		welcome: 'ようこそ',
		settings: '設定',
		language: '言語',
		profile: 'プロフィール',
		home: 'ホーム',
		about: 'について',
		contact: 'お問い合わせ',
	},
	ko: {
		welcome: '환영합니다',
		settings: '설정',
		language: '언어',
		profile: '프로필',
		home: '홈',
		about: '소개',
		contact: '연락처',
	},
};

// Detect browser language
const detectBrowserLanguage = (): Language => {
	if (typeof window === 'undefined') return 'en';

	const browserLang = navigator.language.split('-')[0] as Language;
	return Object.keys(translations).includes(browserLang) ? browserLang : 'en';
};

interface LanguageProviderProps {
	children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
	children,
}) => {
	const [language, setLanguageState] = useState<Language>('en');
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		// Load language from localStorage or detect browser language
		const savedLanguage = localStorage.getItem(
			'preferred-language'
		) as Language;
		const initialLanguage = savedLanguage || detectBrowserLanguage();
		setLanguageState(initialLanguage);
		setIsInitialized(true);
	}, []);

	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
		localStorage.setItem('preferred-language', lang);

		// Optional: Send to your backend API to save in user profile
		// if (user.isAuthenticated) {
		//   updateUserLanguagePreference(lang);
		// }
	};

	const t = (key: string): string => {
		return translations[language][key] || key;
	};

	// Don't render until initialized to prevent hydration issues
	if (!isInitialized) {
		return <div>Loading...</div>;
	}

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
};

export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};
