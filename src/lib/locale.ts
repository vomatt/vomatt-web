import type { LanguageCode } from '@/types';

/**
 * Maps frontend language codes to Payload CMS locale codes.
 * Frontend uses 'zh', Payload uses 'zh-TW'.
 */
const FRONTEND_TO_PAYLOAD: Record<LanguageCode, string> = {
	en: 'en',
	zh: 'zh-TW',
};

const PAYLOAD_TO_FRONTEND: Record<string, LanguageCode> = {
	en: 'en',
	'zh-TW': 'zh',
};

export function toPayloadLocale(lang: LanguageCode): string {
	return FRONTEND_TO_PAYLOAD[lang] ?? 'en';
}

export function toFrontendLocale(payloadLocale: string): LanguageCode {
	return PAYLOAD_TO_FRONTEND[payloadLocale] ?? 'en';
}
