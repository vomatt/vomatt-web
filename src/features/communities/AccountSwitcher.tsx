'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';

import { menuItemClassName, menuPopupClassName } from '@/components/ui/menu';
import { Check, ChevronDown, Plus, User } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { CommunityBadge } from '@/features/profiles/CommunityBadge';
import { cn } from '@/lib/utils';

import { useActing, useSwitchAccount } from './ActingProvider';
import { accountName, canActAs } from './schema';

// Two-line rows: the shared menu item, grown to fit a name over a handle or role
const itemClassName = cn(menuItemClassName, 'h-auto min-h-12 py-1.5 text-left md:h-auto');

/** The sidebar's account chip: who the user is acting as, and the accounts they can switch to. Hidden without any. */
export function AccountSwitcher() {
	const { t } = useLanguage();
	const { acting, me, communities } = useActing();
	const { switchTo, busy } = useSwitchAccount();
	const actable = (communities ?? []).filter((c) => canActAs(c.role));
	const current = acting ?? me;
	if (!current || actable.length === 0) return null;

	return (
		<Menu.Root modal={false}>
			<Menu.Trigger
				aria-label={t('communities.acting.switcher')}
				aria-busy={busy}
				className={cn(
					'flex w-full items-center gap-2.5 rounded-xl border bg-card px-2.5 py-2 text-left transition-colors',
					acting ? 'border-foreground' : 'border-sidebar-border',
					'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring'
				)}
			>
				<UserAvatar username={current.username} avatarUrl={current.avatarUrl} className="size-8 shrink-0" />
				<span className="min-w-0 flex-1">
					{acting && <span className="block text-caption-3 text-muted-foreground">{t('communities.acting.actingAs')}</span>}
					<span className="block truncate text-body-4 font-medium text-foreground">{accountName(current)}</span>
				</span>
				<ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
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
										<User aria-hidden className="size-8 shrink-0 rounded-full bg-field p-1.5 text-muted-foreground" />
									)}
									<span className="min-w-0 flex-1">
										<span className="block truncate text-body-4 font-medium">
											{me ? accountName(me) : t('communities.acting.you')}
										</span>
										{me && <span className="block truncate text-caption-3 text-muted-foreground">@{me.username}</span>}
									</span>
									<Menu.RadioItemIndicator>
										<Check aria-hidden className="size-4" />
									</Menu.RadioItemIndicator>
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
											<span className="flex items-center gap-1.5 text-body-4 font-medium">
												<span className="truncate">{accountName(c)}</span>
												<CommunityBadge />
											</span>
											<span className="block text-caption-3 text-muted-foreground">
												{t('communities.yourRole', { role: t(`communities.roles.${c.role}`) })}
											</span>
										</span>
										<Menu.RadioItemIndicator>
											<Check aria-hidden className="size-4" />
										</Menu.RadioItemIndicator>
									</Menu.RadioItem>
								))}
							</Menu.Group>
						</Menu.RadioGroup>
						<Menu.Separator className="-mx-1.5 my-1.5 h-px bg-border" />
						<Menu.Item render={<Link href="/settings#communities" />} className={cn(menuItemClassName, 'font-medium')}>
							<Plus aria-hidden className="size-4" />
							{t('communities.createTitle')}
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}
