'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { rowLinkClassName, RowText, SettingsCard } from '@/components/SettingsCard';
import { Button } from '@/components/ui/Button';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import { useSwitchAccount } from './ActingProvider';
import { LockedChip } from './LockedChip';
import { accountName, canActAs, communityMembersHref, type MyCommunity } from './schema';
import { unlockCommunity } from './service';

/**
 * Settings' community accounts: each one the user belongs to, opening its members page,
 * with Act as beside it (the way in on phones, which have no sidebar switcher). Act as lands on the account's profile,
 * since Settings itself is the person's. A locked one the user owns can be
 * unlocked while their plan has room (`canUnlock`).
 */
export function CommunityAccountsCard({ communities, canUnlock = false }: { communities: MyCommunity[]; canUnlock?: boolean }) {
	const { t } = useLanguage();
	const { switchTo, busy } = useSwitchAccount();
	return (
		<SettingsCard as="ul">
			{communities.map((community) => {
				const name = accountName(community);
				return (
					<li key={community.communityId} className="flex items-center transition-colors has-[>a:hover]:bg-surface-soft">
						<Link href={communityMembersHref(community.communityId)} className={cn(rowLinkClassName, 'min-w-0 flex-1')}>
							<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-9" />
							<RowText
								title={
									<span className="flex items-center gap-2">
										<span className="truncate">{name}</span>
										{community.locked && <LockedChip />}
									</span>
								}
								body={t('communities.yourRole', { role: t(`communities.roles.${community.role}`) })}
							/>
							<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
						</Link>
						{community.locked && community.role === 'OWNER' && canUnlock && <UnlockButton community={community} />}
						{canActAs(community.role) && (
							<Button
								variant="outline"
								size="sm"
								className="me-4.5 shrink-0"
								aria-label={t('communities.acting.actAsLabel', { name })}
								aria-disabled={busy}
								onClick={() => switchTo(community, profileHref(community.username))}
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

function UnlockButton({ community }: { community: MyCommunity }) {
	const { t } = useLanguage();
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const unlock = async () => {
		setBusy(true);
		const result = await settle(unlockCommunity(community.communityId));
		setBusy(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'communities.unlockFailed'), { duration: Infinity });
			return;
		}
		toast.success(t('communities.unlocked', { name: accountName(community) }));
		router.refresh();
	};
	return (
		<Button
			variant="outline"
			size="sm"
			className="me-2 shrink-0"
			aria-label={t('communities.unlockLabel', { name: accountName(community) })}
			loading={busy}
			onClick={unlock}
		>
			{t('communities.unlock')}
		</Button>
	);
}
