import { SUPPORTED_LANGUAGES } from '../i18n-config';

export type Language = 'en' | 'zh';
export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
export type PageStatusType =
	| 'STATUS_LOG_IN'
	| 'STATUS_SIGN_UP'
	| 'STATUS_VERIFICATION';

export interface RefreshTokenResponse {
	accessToken: string;
	refreshToken: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}
