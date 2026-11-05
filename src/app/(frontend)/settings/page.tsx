import type { Metadata } from 'next';

import { BackLink } from '@/components/BackLink';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { getMyProfile, redirectToLogin } from '@/data/auth';
import { getGroups } from '@/features/groups/service';
import { getNotificationPreferences } from '@/features/notifications/service';
import { getServerMessages } from '@/lib/getServerLocale';
import { profileHref } from '@/lib/routes';

import AccountSettings, { SettingsNav } from './_components/AccountSettings';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.navigation.settings };
}

export default async function SettingsPage() {
	const [profile, groups, notificationPreferences] = await Promise.all([
		getMyProfile(),
		getGroups(),
		getNotificationPreferences().catch(() => null),
	]);
	if (!profile) return redirectToLogin('/settings');

	return (
		<PageShell
			rail={
				<aside className="sticky top-8 hidden xl:block">
					<SettingsNav />
				</aside>
			}
		>
			{/* Phones reach Settings from the profile and have no sidebar to leave by */}
			<BackLink href={profileHref(profile.username)} className="md:hidden">
				<T k="common.back" />
			</BackLink>
			<h1 className="mt-8 mb-8 text-title-1 text-foreground md:mt-0">
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
