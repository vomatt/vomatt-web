import { cookies } from 'next/headers';

import en from '@/locales/en.json';
import zh from '@/locales/zh.json';
import type { LanguageCode } from '@/types';

import { toLocaleTag } from './locale';

/**
 * Reads the user's preferred language from cookies/headers
 * and returns both the frontend code and its locale tag.
 */
export async function getServerLocale(): Promise<{
	language: LanguageCode;
	localeTag: string;
}> {
	let lang: LanguageCode = 'en';

	try {
		const cookieStore = await cookies();
		const cookieLanguage = cookieStore.get('preferred-language')?.value;
		// On a first visit the proxy sets this cookie on the response; Next shows it to cookies() too
		if (cookieLanguage) lang = cookieLanguage.startsWith('zh') ? 'zh' : 'en';
	} catch {
		// fallback to 'en'
	}

	return {
		language: lang,
		localeTag: toLocaleTag(lang),
	};
}

/** The user's language and its strings, for server-rendered text like page titles. */
export async function getServerMessages() {
	const { language } = await getServerLocale();
	return { language, messages: language === 'zh' ? zh : en };
}
