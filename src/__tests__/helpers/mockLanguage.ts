import { interpolate, type TranslationValues } from '@/lib/interpolate';
import en from '@/locales/en.json';

/** useLanguage() backed by the real English strings. */
export function useLanguage() {
	const t = (key: string, values?: string | TranslationValues) => {
		const value = key.split('.').reduce<any>((node, part) => node?.[part], en);
		if (typeof value !== 'string') return key;
		return typeof values === 'object' ? interpolate(value, values) : value;
	};
	return { t, currentLanguage: 'en' as const };
}
