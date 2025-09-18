import { SUPPORTED_LANGUAGES } from '../i18n-config';

export type Language = 'en' | 'zh-TW';
export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
export type PageStatusType =
	| 'STATUS_LOG_IN'
	| 'STATUS_SIGN_UP'
	| 'STATUS_VERIFICATION';
