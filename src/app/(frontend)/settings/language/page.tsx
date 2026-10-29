import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { getServerMessages } from '@/lib/getServerLocale';

import { LanguagePreferences } from './_components/LanguagePreferences';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.settings.languageTitle };
}

export default function LanguagePage() {
	return (
		<PageShell>
			<LanguagePreferences />
		</PageShell>
	);
}
