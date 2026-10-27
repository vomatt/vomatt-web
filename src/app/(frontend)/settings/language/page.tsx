import type { Metadata } from 'next';

import { getServerLocale } from '@/lib/getServerLocale';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

import { LanguagePreferences } from './_components/LanguagePreferences';

export async function generateMetadata(): Promise<Metadata> {
	const { language } = await getServerLocale();
	return { title: (language === 'zh' ? zh : en).settings.languageTitle };
}

export default function LanguagePage() {
	return (
		<div className="px-contain mx-auto max-w-[680px] pt-8 pb-16">
			<LanguagePreferences />
		</div>
	);
}
