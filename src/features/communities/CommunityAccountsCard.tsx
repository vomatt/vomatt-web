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

import { useActing, useSwitchAccount } from './ActingProvider';
import { LockedChip } from './LockedChip';
import { accountName, canActAs, communityMembersHref, type MyCommunity } from './schema';
import { unlockCommunity } from './service';

const rowClassName = cn(rowLinkClassName, 'min-w-0 flex-1 text-start');
const switchRowClassName = cn(rowClassName, 'aria-disabled:cursor-wait aria-disabled:opacity-50');

/**
 * Settings' community accounts: each one the user belongs to. Picking one switches to it and opens its profile,
 * as the sidebar switcher does (the way in on phones, which have no sidebar); a role that can't act as it (an analyst)
 * opens its members page instead, where they can leave it. A locked one the user owns can be unlocked while their plan has room (`canUnlock`).
 */
export function CommunityAccountsCard({ communities, canUnlock = false }: { communities: MyCommunity[]; canUnlock?: boolean }) {
	const { t } = useLanguage();
	const { switchTo, busy } = useSwitchAccount();
	return (
		<SettingsCard as="ul">
			{communities.map((community) => {
				const row = (
					<>
						<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-9" />
						<RowText
							title={
								<span className="flex items-center gap-2">
									<span className="truncate">{accountName(community)}</span>
									{community.locked && <LockedChip />}
								</span>
							}
							body={t('communities.yourRole', { role: t(`communities.roles.${community.role}`) })}
						/>
						<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
					</>
				);
				return (
					<li key={community.communityId} className="flex items-center transition-colors has-[>:first-child:hover]:bg-surface-soft">
						{canActAs(community.role) ? (
							<button
								type="button"
								className={switchRowClassName}
								// The row reads as a name; say that picking it changes who the user posts as
								aria-describedby={`act-as-${community.communityId}`}
								aria-disabled={busy}
								onClick={() => switchTo(community, profileHref(community.username))}
							>
								{row}
								<span id={`act-as-${community.communityId}`} className="sr-only">
									{t('communities.acting.actAsLabel', { name: accountName(community) })}
								</span>
							</button>
						) : (
							<Link href={communityMembersHref(community.username)} className={rowClassName}>
								{row}
							</Link>
						)}
						{community.locked && community.role === 'OWNER' && canUnlock && <UnlockButton community={community} />}
					</li>
				);
			})}
		</SettingsCard>
	);
}

function UnlockButton({ community }: { community: MyCommunity }) {
	const { t } = useLanguage();
	const router = useRouter();
	const { reloadCommunities } = useActing();
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
		reloadCommunities();
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
