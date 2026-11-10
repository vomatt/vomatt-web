'use client';

import Link from 'next/link';

import { rowLinkClassName, RowText, SettingsCard } from '@/components/SettingsCard';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';

import { communityMembersHref,type MyCommunity } from './schema';

/** Settings' community accounts: each one the user belongs to, opening its members page. */
export function CommunityAccountsCard({ communities }: { communities: MyCommunity[] }) {
	const { t } = useLanguage();
	return (
		<SettingsCard as="ul">
			{communities.map((community) => (
				<li key={community.communityId}>
					<Link
						href={communityMembersHref(community.communityId)}
						className={rowLinkClassName}
					>
						<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-9" />
						<RowText
							title={community.displayName || community.username}
							body={t('communities.yourRole', { role: t(`communities.roles.${community.role}`) })}
						/>
						<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
					</Link>
				</li>
			))}
		</SettingsCard>
	);
}
