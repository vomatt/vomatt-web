'use client';

import Link from 'next/link';

import { rowLinkClassName, RowText, SettingsCard } from '@/components/SettingsCard';
import { Button } from '@/components/ui/Button';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { cn } from '@/lib/utils';

import { useSwitchAccount } from './ActingProvider';
import { accountName, canActAs, communityMembersHref, type MyCommunity } from './schema';

/**
 * Settings' community accounts: each one the user belongs to, opening its members page,
 * with Act as beside it (the way in on phones, which have no sidebar switcher).
 */
export function CommunityAccountsCard({ communities }: { communities: MyCommunity[] }) {
	const { t } = useLanguage();
	const { switchTo, busy } = useSwitchAccount();
	return (
		<SettingsCard as="ul">
			{communities.map((community) => {
				const name = accountName(community);
				return (
					<li key={community.communityId} className="flex items-center">
						<Link href={communityMembersHref(community.communityId)} className={cn(rowLinkClassName, 'min-w-0 flex-1')}>
							<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-9" />
							<RowText title={name} body={t('communities.yourRole', { role: t(`communities.roles.${community.role}`) })} />
							<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
						</Link>
						{canActAs(community.role) && (
							<Button
								variant="outline"
								size="sm"
								className="me-4.5 shrink-0"
								aria-label={t('communities.acting.actAsLabel', { name })}
								aria-disabled={busy}
								onClick={() => switchTo(community)}
							>
								{t('communities.acting.actAs')}
							</Button>
						)}
					</li>
				);
			})}
		</SettingsCard>
	);
}
