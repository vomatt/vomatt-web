'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { LegalLinks } from '@/components/layout/LegalLinks';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { Switch } from '@/components/ui/Switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFieldPublic } from '@/features/account/visibility';
import { BlockedUsersPanel } from '@/features/blocks/BlockedUsersPanel';
import { GroupsPanel } from '@/features/groups/GroupsPanel';
import { NOTIFICATION_SWITCHES } from '@/features/notifications/preferences';
import type { NotificationPreferences } from '@/features/notifications/schema';
import { updateNotificationPreferences } from '@/features/notifications/service';
import { useUnreadCount } from '@/features/notifications/UnreadCountProvider';
import { PasskeysPanel } from '@/features/passkeys/PasskeysPanel';
import { SessionsPanel } from '@/features/sessions/SessionsPanel';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import { useHydrated } from '@/hooks/useHydrated';
import { htmlLang, SUPPORTED_LANGUAGES } from '@/i18n-config';
import { apiErrorText } from '@/lib/api/error-text';
import { signout } from '@/lib/api/services/auth';
import { deleteMyAccount, editProfile, exportMyData } from '@/lib/api/services/users';
import { countText } from '@/lib/count';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { MyProfile } from '@/types/user';

/** The page's sections, in order; the On this page list links to each. */
export const SETTINGS_SECTIONS = ['voting', 'notifications', 'appearance', 'privacy', 'account'] as const;

const rowClassName = 'flex min-h-15 items-center gap-4 px-4.5 py-3';
const rowLinkClassName = cn(
	rowClassName,
	'transition-colors hover:bg-surface-soft outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring'
);

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
	return (
		<section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 space-y-2.5">
			<h2 id={`${id}-title`} className="text-[16px] font-medium tracking-[-0.01em]">
				{title}
			</h2>
			{children}
		</section>
	);
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
	return <div className={cn('divide-y divide-border rounded-2xl border border-border bg-card', className)}>{children}</div>;
}

function RowText({ title, body, id }: { title: React.ReactNode; body?: React.ReactNode; id?: string }) {
	return (
		<span className="min-w-0 flex-1">
			<span id={id && `${id}-label`} className="block font-medium">
				{title}
			</span>
			{body && (
				<span id={id && `${id}-body`} className="block text-[13px] leading-[1.45] text-muted-foreground">
					{body}
				</span>
			)}
		</span>
	);
}

export default function AccountSettings({
	profile,
	inviteListCount,
	notificationPreferences,
}: {
	profile: MyProfile;
	/** How many invite lists the user has; null when they couldn't be loaded. */
	inviteListCount: number | null;
	/** Null when they couldn't be loaded. */
	notificationPreferences: NotificationPreferences | null;
}) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const [anonymousDefault, setAnonymousDefault] = useState(profile.anonymousBallotByDefault);
	// The last value the server confirmed; quick toggles can answer out of order
	const savedAnonymousDefault = useRef(profile.anonymousBallotByDefault);
	const [invitesOpen, setInvitesOpen] = useState(false);
	// Read out by screen readers after each save; the switch itself shows the change
	const [announcement, setAnnouncement] = useState('');
	const visibility = profile.visibilitySettings ?? {};
	// One per Edit profile setting; the real name shows when either half does
	const settings = [['displayName'], ['bio'], ['firstName', 'lastName']];
	const shownCount = settings.filter((fields) => fields.some((field) => isFieldPublic(visibility, field))).length;

	const toggleAnonymousDefault = async (value: boolean) => {
		setAnonymousDefault(value);
		const result = await editProfile({ anonymousBallotByDefault: value });
		if (result.ok) {
			savedAnonymousDefault.current = value;
			setAnnouncement(t(value ? 'account.anonymousDefaultOn' : 'account.anonymousDefaultOff'));
		} else {
			setAnonymousDefault(savedAnonymousDefault.current);
			toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
		}
	};

	return (
		<div className="space-y-8">
			<p role="status" className="sr-only">
				{announcement}
			</p>

			<Section id="voting" title={t('settings.voting')}>
				<Card>
					<label htmlFor="anonymous-default" className={cn(rowClassName, 'cursor-pointer')}>
						<RowText id="anonymous-default" title={t('account.anonymousDefault')} body={t('account.anonymousDefaultBody')} />
						<Switch
							id="anonymous-default"
							aria-labelledby="anonymous-default-label"
							aria-describedby="anonymous-default-body"
							checked={anonymousDefault}
							onCheckedChange={toggleAnonymousDefault}
						/>
					</label>
					<button type="button" onClick={() => setInvitesOpen(true)} className={cn(rowLinkClassName, 'w-full text-left')}>
						<RowText title={t('account.tabGroups')} body={t('settings.inviteListsBody')} />
						{inviteListCount !== null && (
							<span className="text-[14px] whitespace-nowrap text-muted-foreground">
								{countText(t, 'settings.inviteListCount', inviteListCount, currentLanguage)}
							</span>
						)}
						<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
					</button>
				</Card>
				<Dialog
					open={invitesOpen}
					onOpenChange={(open) => {
						setInvitesOpen(open);
						// The lists may have changed inside; the count comes from the server page
						if (!open) router.refresh();
					}}
				>
					<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg" closeLabel={t('common.close')}>
						<DialogHeader>
							<DialogTitle>{t('account.tabGroups')}</DialogTitle>
						</DialogHeader>
						<GroupsPanel />
					</DialogContent>
				</Dialog>
			</Section>

			<Section id="notifications" title={t('notifications.title')}>
				{notificationPreferences ? (
					<NotificationSwitches initial={notificationPreferences} announce={setAnnouncement} />
				) : (
					<Card>
						<p className={cn(rowClassName, 'text-[14px] text-muted-foreground')}>{t('settings.notificationsFailed')}</p>
					</Card>
				)}
			</Section>

			<Section id="appearance" title={t('settings.appearanceAndLanguage')}>
				<Card>
					<div className={cn(rowClassName, 'flex-wrap')}>
						<RowText title={t('settings.theme')} body={t('settings.themeBody')} />
						<ThemeChoice />
					</div>
					<Link href="/settings/language" className={rowLinkClassName}>
						<RowText title={t('settings.language')} body={t('settings.languageBody')} />
						<span lang={htmlLang(currentLanguage)} className="text-[14px] text-muted-foreground">
							{SUPPORTED_LANGUAGES[currentLanguage]}
						</span>
						<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
					</Link>
				</Card>
			</Section>

			<Section id="privacy" title={t('settings.privacy')}>
				<Card>
					<Link href={`${profileHref(profile.username)}?edit=1`} className={rowLinkClassName}>
						<RowText title={t('account.privacyTitle')} body={t('settings.whatOthersSeeBody')} />
						<span className="text-[14px] text-muted-foreground">
							{t('settings.shownCount', { shown: shownCount, total: settings.length })}
						</span>
						<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
					</Link>
					<div className={cn(rowClassName, 'flex-col items-stretch')}>
						<BlockedUsersPanel />
					</div>
				</Card>
			</Section>

			<Section id="account" title={t('settings.account')}>
				<Card>
					<div className={cn(rowClassName, 'flex-wrap')}>
						<RowText title={t('account.signOutTitle')} body={<span className="wrap-anywhere">{profile.email ?? profile.phoneNumber}</span>} />
						<Button variant="outline" size="md" onClick={() => signout()}>
							{t('account.signOut')}
						</Button>
					</div>
					<div className={cn(rowClassName, 'flex-col items-stretch')}>
						<PasskeysPanel />
					</div>
					<div className={cn(rowClassName, 'flex-col items-stretch')}>
						<SessionsPanel />
					</div>
					<ExportData />
				</Card>
			</Section>

			{/* Kept apart, at the end, and quiet until opened */}
			<DeleteAccount username={profile.username} />

			<LegalLinks className="flex gap-4.5 text-[13px] text-muted-foreground" />
		</div>
	);
}

/** Which kinds the feed and the unread count include; each switch changes at once and goes back if the save fails. */
function NotificationSwitches({
	initial,
	announce,
}: {
	initial: NotificationPreferences;
	announce: (text: string) => void;
}) {
	const { t } = useLanguage();
	const { refresh } = useUnreadCount();
	const [preferences, setPreferences] = useState(initial);
	// One save per switch at a time, so the server can't apply an older toggle after a newer one
	const [saving, setSaving] = useState<ReadonlySet<keyof NotificationPreferences>>(new Set());
	const setSavingKey = (key: keyof NotificationPreferences, on: boolean) =>
		setSaving((current) => {
			const next = new Set(current);
			if (on) next.add(key);
			else next.delete(key);
			return next;
		});

	const toggle = async (key: keyof NotificationPreferences, value: boolean, name: string) => {
		setPreferences((current) => ({ ...current, [key]: value }));
		setSavingKey(key, true);
		const result = await updateNotificationPreferences({ [key]: value });
		setSavingKey(key, false);
		if (result.ok) {
			// Only this switch: another one may still be saving
			setPreferences((current) => ({ ...current, [key]: result.data[key] }));
			announce(t(value ? 'settings.notifyOn' : 'settings.notifyOff', { name }));
			// A kind switched off leaves the unread count
			refresh();
		} else {
			setPreferences((current) => ({ ...current, [key]: !value }));
			toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
		}
	};

	return (
		<Card>
			{NOTIFICATION_SWITCHES.map(({ key, title, body }) => {
				const id = `notify-${key}`;
				return (
					<label key={key} htmlFor={id} className={cn(rowClassName, 'cursor-pointer')}>
						<RowText id={id} title={t(title)} body={t(body)} />
						<Switch
							id={id}
							aria-labelledby={`${id}-label`}
							aria-describedby={`${id}-body`}
							checked={preferences[key]}
							disabled={saving.has(key)}
							onCheckedChange={(value) => toggle(key, value, t(title))}
						/>
					</label>
				);
			})}
		</Card>
	);
}

function ThemeChoice() {
	const { t } = useLanguage();
	const { theme, setTheme } = useTheme();
	// The saved theme is only known in the browser
	const isHydrated = useHydrated();
	return (
		<SegmentedControl
			label={t('settings.theme')}
			value={isHydrated ? (theme as 'system' | 'light' | 'dark') : undefined}
			onValueChange={setTheme}
			options={[
				{ value: 'system', label: t('navigation.themeAuto') },
				{ value: 'light', label: t('navigation.themeLight') },
				{ value: 'dark', label: t('navigation.themeDark') },
			]}
		/>
	);
}

/**
 * Highlights the section in view in the On this page list: the last one whose top has passed
 * the top fifth of the viewport, or the last section once a scrolling page reaches its end (its
 * top may never get that high). A clicked section stays marked until the page scrolls away
 * from where the click took it, as the page can't always bring it to the top.
 */
export function useSectionInView(ids: readonly string[]) {
	const [current, setCurrent] = useState<string>(ids[0]);
	// Where the page stood once the clicked link's jump was done; undefined until then
	const pin = useRef<{ y?: number } | null>(null);
	useEffect(() => {
		const update = () => {
			if (pin.current) {
				if (pin.current.y === undefined || Math.abs(window.scrollY - pin.current.y) < 1) return;
				pin.current = null;
			}
			const { scrollHeight } = document.documentElement;
			const scrolls = scrollHeight > window.innerHeight;
			if (scrolls && window.innerHeight + window.scrollY >= scrollHeight - 1) {
				setCurrent(ids[ids.length - 1]);
				return;
			}
			let passed = ids[0];
			for (const id of ids) {
				const element = document.getElementById(id);
				if (element && element.getBoundingClientRect().top <= window.innerHeight * 0.2) passed = id;
			}
			setCurrent(passed);
		};
		// Measured once per frame, however many scroll events it brings
		let frame = 0;
		const schedule = () => {
			if (!frame)
				frame = requestAnimationFrame(() => {
					frame = 0;
					update();
				});
		};
		update();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
		};
	}, [ids]);
	const select = (id: string) => {
		const clicked = { y: undefined as number | undefined };
		pin.current = clicked;
		setCurrent(id);
		// The link's jump happens after this handler, before the next frame
		requestAnimationFrame(() => {
			clicked.y = window.scrollY;
		});
	};
	return [current, select] as const;
}

function ExportData() {
	const { t } = useLanguage();
	const [isExporting, setIsExporting] = useState(false);

	const download = async () => {
		setIsExporting(true);
		let result: Awaited<ReturnType<typeof exportMyData>>;
		try {
			result = await exportMyData();
		} finally {
			setIsExporting(false);
		}
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'account.exportFailed'), { duration: Infinity });
			return;
		}
		const url = URL.createObjectURL(new Blob([result.data], { type: 'application/json' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = 'vomatt-data.json';
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};

	return (
		<div className={cn(rowClassName, 'flex-wrap')}>
			<RowText title={t('account.exportTitle')} body={t('account.exportBody')} />
			<Button variant="outline" size="md" loading={isExporting} onClick={download}>
				{t('account.exportCta')}
			</Button>
		</div>
	);
}

/** Deletion refusals with their own copy; anything else goes through apiErrorText. */
const DELETE_ERROR_KEYS: Record<string, string> = {
	'admin.last_admin': 'account.deleteLastAdmin',
};

function DeleteAccount({ username }: { username: string }) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [confirmation, setConfirmation] = useState('');
	const [mismatch, setMismatch] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmationInput, focusConfirmation] = useFocusAfterRender<HTMLInputElement>();

	const remove = async () => {
		// Enabled even before a match, so the button stays reachable and says what's missing
		if (confirmation.trim().toLowerCase() !== username.toLowerCase()) {
			setMismatch(true);
			focusConfirmation();
			return;
		}
		setIsDeleting(true);
		// Only returns on failure; success redirects
		const result = await deleteMyAccount();
		setIsDeleting(false);
		const key = result.errorCode && DELETE_ERROR_KEYS[result.errorCode];
		toast.error(key ? t(key) : apiErrorText(t, result, 'account.deleteFailed'), { duration: Infinity });
	};

	return (
		<section
			aria-labelledby="delete-title"
			className={cn(rowClassName, 'flex-wrap rounded-2xl border border-destructive/30 bg-card')}
		>
			<span className="min-w-0 flex-1">
				<h2 id="delete-title" className="font-medium text-destructive">
					{t('account.deleteTitle')}
				</h2>
				<span className="block text-[13px] leading-[1.45] text-muted-foreground">{t('account.deleteBody')}</span>
			</span>
			<Button variant="outline" size="md" className="border-destructive/45 text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
				{t('account.deleteCtaEllipsis')}
			</Button>
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('account.deleteConfirmTitle')}</AlertDialogTitle>
						<AlertDialogDescription className="wrap-anywhere">
							{t('account.deleteConfirmBody', { username })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-1.5">
						<Input
							ref={confirmationInput}
							value={confirmation}
							onChange={(event) => {
								setConfirmation(event.target.value);
								setMismatch(false);
							}}
							aria-label={t('account.deleteConfirmLabel')}
							aria-invalid={mismatch}
							aria-describedby={mismatch ? 'delete-confirm-error' : undefined}
							placeholder={username}
							autoComplete="off"
						/>
						{mismatch && (
							<p id="delete-confirm-error" className="wrap-anywhere text-xs text-destructive">
								{t('account.deleteConfirmMismatch', { username })}
							</p>
						)}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction
							loading={isDeleting}
							onClick={remove}
							variant="destructive"
						>
							{t('account.deleteCta')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}

const SECTION_TITLES: Record<(typeof SETTINGS_SECTIONS)[number], string> = {
	voting: 'settings.voting',
	notifications: 'notifications.title',
	appearance: 'settings.appearanceAndLanguage',
	privacy: 'settings.privacy',
	account: 'settings.account',
};

/** On this page: the sections as links, the one in view marked. */
export function SettingsNav() {
	const { t } = useLanguage();
	const [current, select] = useSectionInView(SETTINGS_SECTIONS);
	return (
		<nav aria-labelledby="settings-nav">
			<p id="settings-nav" className="mb-2 text-[12px] font-medium text-muted-foreground">
				{t('settings.onThisPage')}
			</p>
			<ul>
				{SETTINGS_SECTIONS.map((id) => (
					<li key={id}>
						<a
							href={`#${id}`}
							onClick={(event) => {
								// A modifier opens the link elsewhere and leaves this page where it is
								if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
								select(id);
							}}
							aria-current={current === id ? 'location' : undefined}
							className={cn(
								'block border-l-2 border-border px-3 py-1.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground',
								'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring',
								current === id && 'border-foreground font-medium text-foreground'
							)}
						>
							{t(SECTION_TITLES[id])}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
