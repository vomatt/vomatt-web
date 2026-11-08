import { SUPPORTED_LANGUAGES } from '../i18n-config';

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}
