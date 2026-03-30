import { cookies, headers } from 'next/headers';

import type { LanguageCode } from '@/types';

import { toPayloadLocale } from './locale';

/**
 * Reads the user's preferred language from cookies/headers
 * and returns both the frontend code and the Payload locale.
 */
export async function getServerLocale(): Promise<{
	language: LanguageCode;
	payloadLocale: string;
}> {
	let lang: LanguageCode = 'en';

	try {
		const cookieStore = await cookies();
		const headersList = await headers();

		const cookieLanguage = cookieStore.get('preferred-language')?.value;
		if (cookieLanguage) {
			lang = cookieLanguage.startsWith('zh') ? 'zh' : 'en';
		} else {
			const detectedLanguage = headersList.get('x-detected-language');
			if (detectedLanguage) {
				lang = detectedLanguage.startsWith('zh') ? 'zh' : 'en';
			}
		}
	} catch {
		// fallback to 'en'
	}

	return {
		language: lang,
		payloadLocale: toPayloadLocale(lang),
	};
}
