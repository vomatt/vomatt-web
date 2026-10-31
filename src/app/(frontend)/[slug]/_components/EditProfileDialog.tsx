'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { ChevronDown, Globe, Lock, TriangleAlert } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUsername, RESERVED_USERNAMES, USERNAME_MAX_LENGTH } from '@/features/account/username';
import { isFieldPublic, visibilityChanges } from '@/features/account/visibility';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import { apiErrorText } from '@/lib/api/error-text';
import { editProfile, updateVisibility } from '@/lib/api/services/users';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { MyProfile } from '@/types/user';

/** Refusals about the username itself, shown under its field. */
const USERNAME_ERROR_CODES = ['user.username.taken'];

const BIO_MAX_LENGTH = 500;
const BIRTHDAY_MIN = '1900-01-01';

/** Yesterday in Asia/Taipei as yyyy-MM-dd, the API's latest accepted birthday. */
const latestBirthday = () =>
	new Date(Date.now() - 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

const labelClassName = 'text-sm font-medium text-foreground';
const sublabelClassName = 'text-[12px] text-muted-foreground';

/**
 * Edit profile: each detail says who sees it, and the owner changes that right
 * where they type. Details and visibility save together with Save.
 */
export default function EditProfileDialog({ profile, defaultOpen = false }: { profile: MyProfile; defaultOpen?: boolean }) {
	const { t } = useLanguage();
	const router = useRouter();
	const initial = {
		username: profile.username,
		displayName: profile.displayName ?? '',
		bio: profile.bio ?? '',
		firstName: profile.firstName ?? '',
		lastName: profile.lastName ?? '',
		birthday: profile.birthday ?? '',
	};
	const savedVisibility = profile.visibilitySettings ?? {};
	const [open, setOpen] = useState(defaultOpen);
	const [values, setValues] = useState(initial);
	const [visibility, setVisibility] = useState(savedVisibility);
	const [birthdayError, setBirthdayError] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState(false);
	// A new username breaks old links, so it takes a second step
	const [confirming, setConfirming] = useState(false);
	const [usernameInput, focusUsername] = useFocusAfterRender<HTMLInputElement>();

	const set = (field: keyof typeof initial) => (value: string) => setValues((current) => ({ ...current, [field]: value }));
	// The input lowercases, so a legacy mixed-case username isn't renamed by a case-only edit
	const usernameChanged = values.username.toLowerCase() !== initial.username.toLowerCase();
	// A birthday can't be cleared, so an emptied field means unchanged
	const birthdayChanged = values.birthday !== '' && values.birthday !== initial.birthday;

	const openChange = (next: boolean) => {
		// Each visit starts from the saved profile, not abandoned edits
		if (next) {
			setValues(initial);
			setVisibility(savedVisibility);
			setBirthdayError(false);
			setUsernameError(null);
			setConfirming(false);
		}
		setOpen(next);
	};

	const showUsernameError = (message: string) => {
		setUsernameError(message);
		focusUsername();
	};

	const toggleVisibility = (...fields: string[]) => {
		const next = !isFieldPublic(visibility, fields[0]);
		setVisibility((current) => ({ ...current, ...Object.fromEntries(fields.map((field) => [field, next])) }));
	};

	const detailsChanged =
		usernameChanged ||
		birthdayChanged ||
		values.displayName !== initial.displayName ||
		values.bio !== initial.bio ||
		values.firstName !== initial.firstName ||
		values.lastName !== initial.lastName;
	const visibilityChanged = visibilityChanges(savedVisibility, visibility);

	function submit(event: React.FormEvent) {
		event.preventDefault();
		if (usernameChanged && !isValidUsername(values.username)) {
			// A reserved name already fits the format, so it gets its own reason
			showUsernameError(
				RESERVED_USERNAMES.has(values.username)
					? t('account.usernameReserved', { username: values.username })
					: t('account.usernameInvalid')
			);
			return;
		}
		if (birthdayChanged && (values.birthday < BIRTHDAY_MIN || values.birthday > latestBirthday())) {
			setBirthdayError(true);
			return;
		}
		if (!detailsChanged && Object.keys(visibilityChanged).length === 0) {
			setOpen(false);
			return;
		}
		if (usernameChanged) setConfirming(true);
		else save();
	}

	async function save() {
		setConfirming(false);
		setIsPending(true);
		try {
			if (detailsChanged) {
				const result = await editProfile({
					username: usernameChanged ? values.username : undefined,
					displayName: values.displayName,
					bio: values.bio,
					firstName: values.firstName !== initial.firstName ? values.firstName : undefined,
					lastName: values.lastName !== initial.lastName ? values.lastName : undefined,
					birthday: birthdayChanged ? values.birthday : undefined,
				});
				if (!result.ok) {
					// A refused username belongs next to its field; anything else is a toast
					if (usernameChanged && USERNAME_ERROR_CODES.includes(result.errorCode ?? '')) {
						showUsernameError(apiErrorText(t, result));
					} else {
						toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
					}
					return;
				}
			}
			// The details are saved now; a failed visibility change mustn't read as if they weren't
			const visibilitySaved =
				Object.keys(visibilityChanged).length === 0 ||
				(await updateVisibility(visibilityChanged).then(
					() => true,
					() => false
				));
			// The profile lives at /[username], so a new username moves the page
			if (usernameChanged) router.replace(profileHref(values.username));
			else router.refresh();
			if (!visibilitySaved) {
				// Stays open so the visibility can be saved again; the refreshed profile no longer counts the details as changed
				toast.error(t(detailsChanged ? 'profile.visibilitySaveFailed' : 'account.saveFailed'), { duration: Infinity });
				return;
			}
			toast.success(t('profile.updated'));
			setOpen(false);
		} catch {
			toast.error(t('account.saveFailed'), { duration: Infinity });
		} finally {
			setIsPending(false);
		}
	}

	const pill = (fieldLabel: string, fields: string[]) => (
		<VisibilityPill
			label={fieldLabel}
			isPublic={isFieldPublic(visibility, fields[0])}
			onToggle={() => toggleVisibility(...fields)}
		/>
	);

	return (
		<Dialog open={open} onOpenChange={openChange}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>{t('profile.editProfile')}</DialogTrigger>
			<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]" closeLabel={t('common.close')}>
				<DialogHeader>
					<DialogTitle>{t('profile.editProfile')}</DialogTitle>
					<DialogDescription>{t('profile.editIntro')}</DialogDescription>
				</DialogHeader>
				<form id="edit-profile" onSubmit={submit} noValidate className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<div className="flex min-h-7 items-center justify-between gap-2">
							<label htmlFor="username" className={labelClassName}>
								{t('account.usernameLabel')}
							</label>
							<span className="text-[12px] text-muted-foreground">{t('profile.alwaysShown')}</span>
						</div>
						<Input
							ref={usernameInput}
							id="username"
							value={values.username}
							onChange={(e) => {
								set('username')(e.target.value.trim().toLowerCase());
								setUsernameError(null);
							}}
							autoComplete="username"
							autoCapitalize="none"
							spellCheck={false}
							maxLength={USERNAME_MAX_LENGTH}
							leading="@"
							aria-invalid={!!usernameError}
							aria-describedby="username-hint"
						/>
						<p
							id="username-hint"
							className={cn(
								'flex items-start gap-2 wrap-anywhere text-xs',
								usernameError ? 'text-destructive' : 'text-muted-foreground'
							)}
						>
							{usernameError ??
								(usernameChanged && values.username ? (
									<>
										<TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-foreground" />
										<span className="min-w-0">
											{t('account.usernameConfirmBody', { newPath: `/${values.username}`, oldPath: `/${initial.username}` })}
										</span>
									</>
								) : (
									t('account.usernameHint', { path: `/${values.username || initial.username}` })
								))}
						</p>
					</div>
					{/* First and last name share one visibility setting, so they share one header */}
					<div role="group" aria-labelledby="realName" className="flex flex-col gap-1.5">
						<div className="flex min-h-7 items-center justify-between gap-2">
							<span id="realName" className={labelClassName}>
								{t('profile.realName')}
							</span>
							{pill(t('profile.realName'), ['firstName', 'lastName'])}
						</div>
						<div className="grid gap-2.5 sm:grid-cols-2">
							<div className="flex flex-col gap-1">
								<label htmlFor="firstName" className={sublabelClassName}>
									{t('profile.firstName')}
								</label>
								<Input
									id="firstName"
									value={values.firstName}
									onChange={(e) => set('firstName')(e.target.value)}
									autoComplete="given-name"
									maxLength={50}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label htmlFor="lastName" className={sublabelClassName}>
									{t('profile.lastName')}
								</label>
								<Input
									id="lastName"
									value={values.lastName}
									onChange={(e) => set('lastName')(e.target.value)}
									autoComplete="family-name"
									maxLength={50}
								/>
							</div>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<div className="flex min-h-7 items-center justify-between gap-2">
							<label htmlFor="displayName" className={labelClassName}>
								{t('profile.displayName')}
							</label>
							{pill(t('profile.displayName'), ['displayName'])}
						</div>
						<Input
							id="displayName"
							value={values.displayName}
							onChange={(e) => set('displayName')(e.target.value)}
							placeholder={t('profile.displayNamePlaceholder')}
							maxLength={100}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<div className="flex min-h-7 items-center justify-between gap-2">
							<label htmlFor="birthday" className={labelClassName}>
								{t('profile.birthday')}
							</label>
							{/* The API never shows a birthday to anyone else */}
							<span className={cn(pillClassName, 'border-border bg-secondary text-muted-foreground')}>
								<Lock aria-hidden className="size-3" />
								{t('profile.onlyYouShort')}
							</span>
						</div>
						<Input
							id="birthday"
							type="date"
							value={values.birthday}
							onChange={(e) => {
								set('birthday')(e.target.value);
								setBirthdayError(false);
							}}
							min={BIRTHDAY_MIN}
							max={latestBirthday()}
							autoComplete="bday"
							aria-invalid={birthdayError}
							aria-describedby={birthdayError ? 'birthday-error' : undefined}
						/>
						{birthdayError && (
							<p id="birthday-error" className="text-xs text-destructive">
								{t('profile.birthdayInvalid')}
							</p>
						)}
					</div>
					<div className="flex flex-col gap-1.5">
						<div className="flex min-h-7 items-center justify-between gap-2">
							<label htmlFor="bio" className={labelClassName}>
								{t('profile.bio')}
							</label>
							{pill(t('profile.bio'), ['bio'])}
						</div>
						<Textarea
							id="bio"
							value={values.bio}
							onChange={(e) => set('bio')(e.target.value)}
							placeholder={t('profile.bioPlaceholder')}
							maxLength={BIO_MAX_LENGTH}
							rows={3}
							aria-describedby="bio-count"
						/>
						<p id="bio-count" className="text-right text-xs tabular-nums text-muted-foreground">
							{values.bio.length} / {BIO_MAX_LENGTH}
						</p>
					</div>
				</form>
				<DialogFooter className="items-center">
					<p className="mr-auto hidden text-[12px] text-muted-foreground sm:block">{t('profile.visibilitySavesHint')}</p>
					<Button variant="outline" size="md" onClick={() => setOpen(false)} disabled={isPending}>
						{t('common.cancel')}
					</Button>
					<Button type="submit" form="edit-profile" size="md" loading={isPending}>
						{t('profile.saveChanges')}
					</Button>
				</DialogFooter>
			</DialogContent>
			<AlertDialog open={confirming} onOpenChange={(next) => !next && setConfirming(false)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('account.usernameConfirmTitle')}</AlertDialogTitle>
						<AlertDialogDescription className="wrap-anywhere">
							{t('account.usernameConfirmBody', { newPath: `/${values.username}`, oldPath: `/${initial.username}` })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						{/* Focus starts on the safe choice */}
						<AlertDialogCancel>{t('common.back')}</AlertDialogCancel>
						<AlertDialogAction onClick={save}>{t('account.usernameConfirmCta')}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}

const pillClassName =
	'inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[12px] font-medium';
// The pill stays small beside its label, but its hit area reaches 44px
const pillHitArea = "relative before:absolute before:-inset-y-2 before:inset-x-0 before:content-['']";

const PILL_LABELS = {
	everyone: 'profile.visibilityPillEveryone',
	onlyYou: 'profile.visibilityPillOnlyYou',
} as const;

/** Who sees a detail, as a pill that switches between Everyone and Only you. */
function VisibilityPill({
	label,
	isPublic,
	onToggle,
}: {
	label: string;
	isPublic: boolean;
	onToggle: () => void;
}) {
	const { t } = useLanguage();
	const state = t(isPublic ? 'profile.everyone' : 'profile.onlyYouShort');
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={t(PILL_LABELS[isPublic ? 'everyone' : 'onlyYou'], { field: label })}
			className={cn(
				pillClassName,
				pillHitArea,
				'cursor-pointer transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
				isPublic
					? 'border-border-strong bg-card hover:bg-surface-soft'
					: 'border-border bg-secondary text-muted-foreground hover:text-foreground'
			)}
		>
			{isPublic ? <Globe aria-hidden className="size-3" /> : <Lock aria-hidden className="size-3" />}
			{state}
			<ChevronDown aria-hidden className="size-2.5" />
		</button>
	);
}
