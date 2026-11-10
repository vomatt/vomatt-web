import type { Metadata } from 'next';

import { EmptyCard } from '@/components/EmptyCard';
import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { getMyProfile, redirectToLogin } from '@/data/auth';
import { OfficialMembers } from '@/features/officials/OfficialMembers';
import { officialMembersHref } from '@/features/officials/schema';
import { listMembers, listMyOfficials } from '@/features/officials/service';
import { getServerMessages } from '@/lib/getServerLocale';

import { SettingsSubpageHeader } from '../../../_components/SettingsSubpageHeader';

type Props = { params: Promise<{ officialId: string }> };

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.officials.members };
}

export default async function OfficialMembersPage({ params }: Props) {
	const { officialId } = await params;
	const [profile, officials, members] = await Promise.all([
		getMyProfile(),
		listMyOfficials(),
		listMembers(officialId),
	]);
	if (!profile) return redirectToLogin(officialMembersHref(officialId));

	const official = officials.ok ? officials.data.find((o) => o.officialId === officialId) : undefined;
	// Not a member (removed, never was, or the account is gone): 403 `official.not_member`
	const notMember = (officials.ok && !official) || (!members.ok && members.errorCode === 'official.not_member');

	return (
		<PageShell>
			<div className="flex flex-col gap-8">
				<SettingsSubpageHeader title={official ? official.displayName || official.username : <T k="officials.members" />} />
				{official && members.ok ? (
					<OfficialMembers official={official} viewerId={profile.id} members={members.data} />
				) : notMember ? (
					<EmptyCard title={<T k="officials.notMemberTitle" />} body={<T k="officials.notMemberBody" />} />
				) : (
					<EmptyCard title={<T k="common.error" />} body={<T k="common.errorBody" />} />
				)}
			</div>
		</PageShell>
	);
}
