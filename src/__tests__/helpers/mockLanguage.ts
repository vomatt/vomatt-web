import en from '@/locales/en.json';

/** useLanguage() backed by the real English strings. */
export function useLanguage() {
	const t = (key: string) => {
		const value = key.split('.').reduce<any>((node, part) => node?.[part], en);
		return typeof value === 'string' ? value : key;
	};
	return { t, currentLanguage: 'en' as const };
}
