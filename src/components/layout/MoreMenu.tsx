'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { Menu as MenuIcon, Moon, Sun } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { ReportProblemDialog } from '@/features/feedback/ReportProblemDialog';
import { signout } from '@/lib/api/services/auth';
import { cn } from '@/lib/utils';

// next-themes' values; "system" follows prefers-color-scheme
const themes = [
	{ value: 'light', label: 'navigation.themeLight', icon: Sun },
	{ value: 'dark', label: 'navigation.themeDark', icon: Moon },
	{ value: 'system', label: 'navigation.themeAuto', icon: null },
] as const;

const itemClassName =
	'flex w-full items-center min-h-10 px-3 rounded-lg text-sm font-medium outline-none cursor-pointer select-none transition-colors duration-150 data-highlighted:bg-surface-soft';

export function MoreMenu({ signedIn }: { signedIn: boolean }) {
	const { t } = useLanguage();
	const { theme, setTheme } = useTheme();
	const [reportOpen, setReportOpen] = useState(false);

	return (
		<Menu.Root>
			<Menu.Trigger
				className={cn(
					'flex items-center gap-3 w-full h-11 px-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors',
					'hover:text-sidebar-foreground hover:bg-surface-soft data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground',
					'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring'
				)}
			>
				<MenuIcon className="size-5 shrink-0" />
				{t('navigation.more')}
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner
					side="top"
					align="start"
					sideOffset={8}
					className="z-50"
				>
					<Menu.Popup className="w-60 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none origin-(--transform-origin) data-starting-style:opacity-0 data-ending-style:opacity-0 transition-opacity duration-100">
						<Menu.Group>
							<Menu.GroupLabel className="px-3 pt-1.5 pb-2 text-xs text-muted-foreground">
								{t('navigation.appearance')}
							</Menu.GroupLabel>
							<Menu.RadioGroup
								value={theme}
								onValueChange={(value) => setTheme(value)}
								className="grid grid-cols-3 gap-1 rounded-lg bg-surface-soft p-1"
							>
								{themes.map(({ value, label, icon: Icon }) => (
									<Menu.RadioItem
										key={value}
										value={value}
										closeOnClick={false}
										aria-label={t(label)}
										className={cn(
											'flex h-8 items-center justify-center rounded-md text-xs font-medium text-muted-foreground outline-none cursor-pointer select-none transition-[color,background-color,box-shadow] duration-150',
											'data-highlighted:text-foreground data-highlighted:data-unchecked:bg-foreground/5',
											// The viewer's own choice: Volt tint, as on a selected ballot row
											'data-checked:bg-highlight-tint data-checked:text-foreground data-checked:shadow-xs data-checked:ring-1 data-checked:ring-foreground/15'
										)}
									>
										{Icon ? <Icon aria-hidden className="size-4" /> : t(label)}
									</Menu.RadioItem>
								))}
							</Menu.RadioGroup>
						</Menu.Group>
						<Menu.Separator className="-mx-1.5 my-1.5 h-px bg-border" />
						{signedIn && (
							<>
								<Menu.Item
									onClick={() => setReportOpen(true)}
									className={itemClassName}
								>
									{t('navigation.reportProblem')}
								</Menu.Item>
								<Menu.LinkItem
									render={<Link href="/settings" />}
									className={itemClassName}
								>
									{t('navigation.settings')}
								</Menu.LinkItem>
								<Menu.Item
									onClick={() => signout()}
									className={cn(itemClassName, 'text-destructive')}
								>
									{t('account.signOut')}
								</Menu.Item>
							</>
						)}
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
			<ReportProblemDialog open={reportOpen} onOpenChange={setReportOpen} />
		</Menu.Root>
	);
}
