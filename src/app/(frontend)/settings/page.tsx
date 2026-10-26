import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { T } from '@/components/T';
import { getMyProfile } from '@/data/auth';
import { getGroups } from '@/features/groups/service';
import { getNotificationPreferences } from '@/features/notifications/service';
import { getServerLocale } from '@/lib/getServerLocale';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

import AccountSettings, { SettingsNav } from './_components/AccountSettings';

export async function generateMetadata(): Promise<Metadata> {
	const { language } = await getServerLocale();
	return { title: (language === 'zh' ? zh : en).navigation.settings };
}

export default async function SettingsPage() {
	const [profile, groups, notificationPreferences] = await Promise.all([
		getMyProfile(),
		getGroups(),
		getNotificationPreferences().catch(() => null),
	]);
	if (!profile) redirect('/login?redirect=/settings');

	return (
		<div className="px-contain mx-auto flex max-w-[1280px] items-start gap-10 pt-8 pb-16">
			<div className="flex min-w-0 max-w-[680px] flex-1 flex-col">
				<h1 className="mb-8 page-title text-foreground">
					<T k="navigation.settings" />
				</h1>
				<AccountSettings
					profile={profile}
					inviteListCount={groups.ok ? groups.data.length : null}
					notificationPreferences={notificationPreferences}
				/>
			</div>
			<aside className="sticky top-8 hidden max-w-[220px] flex-[1_0_200px] lg:block">
				<SettingsNav />
			</aside>
		</div>
	);
}
