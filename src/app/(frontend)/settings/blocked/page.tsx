import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { loadActingState } from '@/data/auth';
import { BlockedUsersPanel } from '@/features/blocks/BlockedUsersPanel';
import { accountName, communityMembersHref } from '@/features/communities/schema';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../_components/SettingsSubpageHeader';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.blocks.title };
}

export default async function BlockedPage() {
	const { acting } = await loadActingState();
	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader
					title={<T k="blocks.title" />}
					// While acting these are the account's blocks, reached from its members page; Settings is the person's own
					back={
						acting ? { href: communityMembersHref(acting.communityId), to: 'members', name: accountName(acting) } : undefined
					}
				/>
				<BlockedUsersPanel />
			</div>
		</PageShell>
	);
}
