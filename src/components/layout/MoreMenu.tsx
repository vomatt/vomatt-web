'use client';

import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { Menu as MenuIcon, Moon, Sun } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { ReportProblemDialog } from '@/features/feedback/ReportProblemDialog';
import { hoverMarkProps, useHoverMark } from '@/hooks/useHoverMark';
import { SUPPORTED_LANGUAGES } from '@/i18n-config';
import { signout } from '@/lib/api/services/auth';
import { cn } from '@/lib/utils';
import type { LanguageCode } from '@/types';

// next-themes' values; "system" follows prefers-color-scheme
const themes = [
	{ value: 'light', label: 'navigation.themeLight', icon: Sun },
	{ value: 'dark', label: 'navigation.themeDark', icon: Moon },
	{ value: 'system', label: 'navigation.themeAuto', icon: null },
] as const;

const itemClassName =
	'relative flex w-full items-center min-h-10 px-3 rounded-lg text-sm font-medium cursor-pointer select-none transition-colors duration-150 text-muted-foreground data-highlighted:text-popover-foreground outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

export function MoreMenu({ signedIn }: { signedIn: boolean }) {
	const { t } = useLanguage();
	const [reportOpen, setReportOpen] = useState(false);

	return (
		<Menu.Root>
			<Menu.Trigger
				className={cn(
					'flex items-center gap-3 w-full h-9 px-3 rounded-lg text-sm font-medium text-muted-foreground transition-colors duration-150',
					'hover:text-sidebar-foreground data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground',
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
							<ThemeOptions />
						</Menu.Group>
						{/* Works signed out too, as the theme does */}
						<Menu.Group>
							<Menu.GroupLabel className="px-3 pt-2.5 pb-2 text-xs text-muted-foreground">
								{t('settings.language')}
							</Menu.GroupLabel>
							<LanguageOptions />
						</Menu.Group>
						<Menu.Separator className="-mx-1.5 my-1.5 h-px bg-border" />
						{signedIn && <MoreActions onReport={() => setReportOpen(true)} />}
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
			<ReportProblemDialog open={reportOpen} onOpenChange={setReportOpen} />
		</Menu.Root>
	);
}

const segmentClassName = cn(
	'relative flex h-8 items-center justify-center rounded-md text-xs font-medium text-muted-foreground cursor-pointer select-none transition-[color,background-color,box-shadow] duration-150',
	'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
	'data-highlighted:text-foreground',
	// The viewer's own choice: Volt tint, as on a selected ballot row
	'data-checked:bg-highlight-tint data-checked:text-foreground data-checked:shadow-xs data-checked:ring-1 data-checked:ring-foreground/15'
);

/** English or 中文; the server parts re-render in the new language. */
function LanguageOptions() {
	const { currentLanguage, setLanguage } = useLanguage();
	const router = useRouter();
	return (
		<Menu.RadioGroup
			value={currentLanguage}
			onValueChange={(value) => {
				setLanguage(value as LanguageCode);
				router.refresh();
			}}
			className="grid grid-cols-2 gap-1 rounded-lg bg-surface-soft p-1"
		>
			{(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => (
				<Menu.RadioItem
					key={code}
					value={code}
					closeOnClick={false}
					lang={code === 'zh' ? 'zh-Hant' : 'en'}
					className={segmentClassName}
				>
					{code === 'zh' ? '中文' : 'English'}
				</Menu.RadioItem>
			))}
		</Menu.RadioGroup>
	);
}

/** The theme segments, with the hover mark gliding across them like the rows below. */
function ThemeOptions() {
	const { t } = useLanguage();
	const { theme, setTheme } = useTheme();
	const hover = useHoverMark('[role=menuitemradio]', 'x');

	return (
		<Menu.RadioGroup
			value={theme}
			onValueChange={(value) => setTheme(value)}
			className="relative grid grid-cols-3 gap-1 rounded-lg bg-surface-soft p-1"
			onPointerOver={hover.onPointerOver}
			onPointerLeave={hover.onPointerLeave}
			// Arrow keys move the highlight away from the pointer, so the mark steps aside
			onKeyDown={hover.onPointerLeave}
		>
			{hover.mark.rect && (
				<div
					aria-hidden
					{...hoverMarkProps(
						hover.mark,
						'pointer-events-none absolute inset-y-1 rounded-md bg-foreground/5'
					)}
				/>
			)}
			{themes.map(({ value, label, icon: Icon }) => (
				<Menu.RadioItem
					key={value}
					value={value}
					closeOnClick={false}
					aria-label={t(label)}
					className={segmentClassName}
				>
					{Icon ? <Icon aria-hidden className="size-4" /> : t(label)}
				</Menu.RadioItem>
			))}
		</Menu.RadioGroup>
	);
}

/** Mounted only while the popup is open, so hovering re-renders just these rows. */
function MoreActions({ onReport }: { onReport: () => void }) {
	const { t } = useLanguage();
	const hover = useHoverMark('[role=menuitem]', 'y');

	return (
		<div
			className="relative"
			onPointerOver={hover.onPointerOver}
			onPointerLeave={hover.onPointerLeave}
			onKeyDown={hover.onPointerLeave}
		>
			{hover.mark.rect && (
				<div
					aria-hidden
					data-slot="more-menu-hover-mark"
					{...hoverMarkProps(
						hover.mark,
						'pointer-events-none absolute inset-x-0 rounded-lg bg-foreground/5'
					)}
				/>
			)}
			<Menu.Item onClick={onReport} className={itemClassName}>
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
				className={cn(
					itemClassName,
					'text-destructive data-highlighted:text-destructive'
				)}
			>
				{t('account.signOut')}
			</Menu.Item>
		</div>
	);
}
