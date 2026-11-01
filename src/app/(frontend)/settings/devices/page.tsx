import type { Metadata } from 'next';

import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { SessionsPanel } from '@/features/sessions/SessionsPanel';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../_components/SettingsSubpageHeader';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.sessions.title };
}

export default function DevicesPage() {
	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={<T k="sessions.title" />} />
				<SessionsPanel />
			</div>
		</PageShell>
	);
}
