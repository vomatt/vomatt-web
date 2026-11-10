import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { getMyProfile, redirectToLogin } from '@/data/auth';
import { PersonalSettings } from '@/features/communities/ActingSettingsNotice';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../_components/SettingsSubpageHeader';
import { VisibilitySettings } from './_components/VisibilitySettings';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.account.privacyTitle };
}

export default async function VisibilityPage() {
	const profile = await getMyProfile();
	if (!profile) return redirectToLogin('/settings/visibility');

	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={<T k="account.privacyTitle" />} />
				<PersonalSettings>
					<VisibilitySettings profile={profile} />
				</PersonalSettings>
			</div>
		</PageShell>
	);
}
