'use client';

import { Menu } from '@base-ui/react/menu';
import { useState } from 'react';

import { menuItemClassName, menuPopupClassName } from '@/components/ui/menu';
import { SidebarMenuAction } from '@/components/ui/Sidebar';
import { Check, ChevronDown, Plus, User } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { META_GAP } from '@/lib/rich';
import { cn } from '@/lib/utils';
import type { MyProfile } from '@/types/user';

import { useActing, useSwitchAccount } from './ActingProvider';
import { CreateCommunityDialog } from './CreateCommunityDialog';
import { accountName, canActAs } from './schema';

// Two-line rows: the shared menu item, grown to fit a name over a handle or role
const itemClassName = cn(menuItemClassName, 'group h-auto min-h-12 py-1.5 text-left md:h-auto');

/** A radio mark on every account row, filled on the one the user is acting as. */
function SelectedMark() {
	return (
		<span
			aria-hidden
			className="grid size-5 shrink-0 place-items-center rounded-full border border-border text-background group-data-checked:border-foreground group-data-checked:bg-foreground"
		>
			<Check className="size-3! opacity-0 group-data-checked:opacity-100" strokeWidth={3} />
		</span>
	);
}

/**
 * The chevron at the end of the sidebar's Profile row: opens the accounts the user can switch between.
 * Hidden unless they can act as a community account.
 */
export function AccountSwitcher({ profile }: { profile: MyProfile | null }) {
	const { t } = useLanguage();
	const { acting, me, communities } = useActing();
	const { switchTo, busy } = useSwitchAccount();
	const [creating, setCreating] = useState(false);
	const actable = (communities ?? []).filter((c) => canActAs(c.role));
	if (actable.length === 0) return null;
	// Acting, the profile is the community account's, so the person's quota is unknown and the API decides
	const quota = acting ? undefined : profile?.communityQuota;
	const atLimit = quota && quota.owned >= quota.limit ? { free: profile?.plan === 'FREE' } : undefined;

	return (
		<Menu.Root modal={false}>
			<Menu.Trigger
				aria-label={t('communities.acting.switcher')}
				aria-busy={busy}
				render={
					<SidebarMenuAction className="top-1/2! right-1.5 size-7 w-7 -translate-y-1/2 rounded-md text-muted-foreground data-popup-open:bg-sidebar-accent" />
				}
			>
				<ChevronDown aria-hidden />
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner side="bottom" align="start" sideOffset={6} positionMethod="fixed" className="z-50">
					<Menu.Popup className={cn(menuPopupClassName, 'w-72')}>
						<Menu.RadioGroup
							value={acting?.communityId ?? ''}
							onValueChange={(value: string) => switchTo(actable.find((c) => c.communityId === value) ?? null)}
						>
							<Menu.Group>
								<Menu.GroupLabel className="px-2.5 pt-1.5 pb-1 text-caption-2 text-muted-foreground">
									{t('communities.acting.you')}
								</Menu.GroupLabel>
								<Menu.RadioItem value="" closeOnClick className={itemClassName}>
									{me ? (
										<UserAvatar username={me.username} avatarUrl={me.avatarUrl} className="size-8 shrink-0" />
									) : (
										// The person's profile didn't load while acting: the row still switches back
										<User aria-hidden className="size-8! shrink-0 rounded-full bg-field p-1.5 text-muted-foreground" />
									)}
									<span className="min-w-0 flex-1">
										<span className="block truncate text-body-4 font-medium">
											{me ? accountName(me) : t('communities.acting.you')}
										</span>
										{me && <span className="block truncate text-caption-3 text-muted-foreground">@{me.username}</span>}
									</span>
									<SelectedMark />
								</Menu.RadioItem>
							</Menu.Group>
							<Menu.Group>
								<Menu.GroupLabel className="px-2.5 pt-2.5 pb-1 text-caption-2 text-muted-foreground">
									{t('communities.title')}
								</Menu.GroupLabel>
								{actable.map((c) => (
									<Menu.RadioItem key={c.communityId} value={c.communityId} closeOnClick className={itemClassName}>
										<UserAvatar username={c.username} avatarUrl={c.avatarUrl} className="size-8 shrink-0" />
										<span className="min-w-0 flex-1">
											<span className="block truncate text-body-4 font-medium">{accountName(c)}</span>
											<span className="block text-caption-3 text-muted-foreground">
												{t('communities.yourRole', { role: t(`communities.roles.${c.role}`) })}
												{c.locked && (
													<>
														{META_GAP}
														{t('communities.locked')}
													</>
												)}
											</span>
										</span>
										<SelectedMark />
									</Menu.RadioItem>
								))}
							</Menu.Group>
						</Menu.RadioGroup>
						<Menu.Separator className="-mx-1.5 my-1.5 h-px bg-border" />
						<Menu.Item onClick={() => setCreating(true)} className={cn(menuItemClassName, 'font-medium')}>
							<Plus aria-hidden />
							{t('communities.createTitle')}
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
			<CreateCommunityDialog open={creating} onOpenChange={setCreating} atLimit={atLimit} />
		</Menu.Root>
	);
}
