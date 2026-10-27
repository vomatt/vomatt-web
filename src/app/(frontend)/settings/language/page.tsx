import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
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
		<PageShell>
			<LanguagePreferences />
		</PageShell>
	);
}
