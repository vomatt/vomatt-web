'use server';

import { cookies } from 'next/headers';

import { USER_LANG } from '@/data/constants';
// import { i18n } from '@/languages';

export async function getUserLanguage() {
	const sessionUserLang = (await cookies()).get(USER_LANG)?.value;
	const lang = sessionUserLang || 'zh-TW';
	return lang;
}
