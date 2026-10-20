import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { T } from '@/components/T';
import { getMyProfile } from '@/data/auth';
import { getServerLocale } from '@/lib/getServerLocale';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

import AccountSettings from './_components/AccountSettings';

export async function generateMetadata(): Promise<Metadata> {
	const { language } = await getServerLocale();
	return { title: (language === 'zh' ? zh : en).navigation.settings };
}

export default async function SettingsPage() {
	const profile = await getMyProfile();
	if (!profile) redirect('/login?redirect=/settings');

	return (
		<div className="px-contain mx-auto max-w-2xl py-6">
			<h1 className="mb-6 display-heading text-[32px] text-foreground md:text-[44px]">
				<T k="navigation.settings" />
			</h1>
			<AccountSettings profile={profile} />
		</div>
	);
}
