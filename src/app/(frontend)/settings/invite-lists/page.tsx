import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { loadActingState } from '@/data/auth';
import { ActingSettingsNotice } from '@/features/communities/ActingSettingsNotice';
import { GroupsPanel } from '@/features/groups/GroupsPanel';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../_components/SettingsSubpageHeader';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.account.tabGroups };
}

export default async function InviteListsPage() {
	const { acting } = await loadActingState();
	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={<T k="account.tabGroups" />} />
				{/* As on Settings: while acting, these are the person's own and stay out of reach */}
				{acting ? <ActingSettingsNotice /> : <GroupsPanel />}
			</div>
		</PageShell>
	);
}
