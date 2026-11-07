import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { BlockedUsersPanel } from '@/features/blocks/BlockedUsersPanel';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../_components/SettingsSubpageHeader';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.blocks.title };
}

export default function BlockedPage() {
	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={<T k="blocks.title" />} />
				<BlockedUsersPanel />
			</div>
		</PageShell>
	);
}
