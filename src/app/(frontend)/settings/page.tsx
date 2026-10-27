import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PageShell } from '@/components/layout/PageShell';
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
		<PageShell
			rail={
				<aside className="sticky top-8 hidden xl:block">
					<SettingsNav />
				</aside>
			}
		>
			<h1 className="mb-8 page-title text-foreground">
				<T k="navigation.settings" />
			</h1>
			<AccountSettings
				profile={profile}
				inviteListCount={groups.ok ? groups.data.length : null}
				notificationPreferences={notificationPreferences}
			/>
		</PageShell>
	);
}
