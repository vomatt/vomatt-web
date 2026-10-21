'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUsername, RESERVED_USERNAMES, USERNAME_MAX_LENGTH } from '@/features/account/username';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
import { apiErrorText } from '@/lib/api/error-text';
import { editProfile } from '@/lib/api/services/users';
import { profileHref } from '@/lib/routes';

/** Refusals about the username itself, shown under its field. */
const USERNAME_ERROR_CODES = ['user.username.taken'];

interface EditProfileDialogProps {
	initialUsername: string;
	initialDisplayName: string;
	initialBio: string;
	initialFirstName: string;
	initialLastName: string;
	/** yyyy-MM-dd, or empty when never set */
	initialBirthday: string;
}

const BIRTHDAY_MIN = '1900-01-01';

/** Yesterday in Asia/Taipei as yyyy-MM-dd, the API's latest accepted birthday. */
const latestBirthday = () =>
	new Date(Date.now() - 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

export default function EditProfileDialog({
	initialUsername,
	initialDisplayName,
	initialBio,
	initialFirstName,
	initialLastName,
	initialBirthday,
}: EditProfileDialogProps) {
	const { t } = useLanguage();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [username, setUsername] = useState(initialUsername);
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [bio, setBio] = useState(initialBio);
	const [firstName, setFirstName] = useState(initialFirstName);
	const [lastName, setLastName] = useState(initialLastName);
	const [birthday, setBirthday] = useState(initialBirthday);
	const [birthdayError, setBirthdayError] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);
	// A new username breaks old links, so it takes a second step
	const [confirming, setConfirming] = useState(false);
	const [isPending, setIsPending] = useState(false);
	const [usernameInput, focusUsername] = useFocusAfterRender<HTMLInputElement>();

	// The input lowercases, so a legacy mixed-case username isn't renamed by a case-only edit
	// A birthday can't be cleared, so an emptied field means unchanged
	const birthdayChanged = birthday !== '' && birthday !== initialBirthday;
	const usernameChanged = username.toLowerCase() !== initialUsername.toLowerCase();

	const openChange = (next: boolean) => {
		// Each visit starts from the saved profile, not abandoned edits
		if (next) {
			setUsername(initialUsername);
			setDisplayName(initialDisplayName);
			setBio(initialBio);
			setFirstName(initialFirstName);
			setLastName(initialLastName);
			setBirthday(initialBirthday);
			setBirthdayError(false);
			setUsernameError(null);
			setConfirming(false);
		}
		setOpen(next);
	};

	// The confirm step's focused button unmounts; the field takes focus once the form is back
	const backToForm = () => {
		setConfirming(false);
		focusUsername();
	};

	const showUsernameError = (message: string) => {
		setUsernameError(message);
		backToForm();
	};

	function handleSubmit(e?: React.FormEvent) {
		e?.preventDefault();
		if (usernameChanged && !isValidUsername(username)) {
			// A reserved name already fits the format, so it gets its own reason
			showUsernameError(
				RESERVED_USERNAMES.has(username)
					? t('account.usernameReserved', { username })
					: t('account.usernameInvalid')
			);
			return;
		}
		if (birthdayChanged && (birthday < BIRTHDAY_MIN || birthday > latestBirthday())) {
			setBirthdayError(true);
			return;
		}
		if (
			!usernameChanged &&
			!birthdayChanged &&
			displayName === initialDisplayName &&
			bio === initialBio &&
			firstName === initialFirstName &&
			lastName === initialLastName
		) {
			setOpen(false);
			return;
		}
		if (usernameChanged) setConfirming(true);
		else save();
	}

	async function save() {
		setIsPending(true);
		try {
			const result = await editProfile({
				username: usernameChanged ? username : undefined,
				displayName,
				bio,
				firstName,
				lastName,
				birthday: birthdayChanged ? birthday : undefined,
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
			// The profile lives at /[username], so a new username moves the page
			if (usernameChanged) router.replace(profileHref(username));
			toast.success(t('profile.updated'));
			setOpen(false);
		} catch {
			toast.error(t('common.errorBody'), { duration: Infinity });
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={openChange}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				{t('profile.editProfile')}
			</DialogTrigger>
			<DialogContent className="sm:max-w-md" closeLabel={t('common.close')}>
				{confirming ? (
					<>
						<DialogHeader>
							<DialogTitle>{t('account.usernameConfirmTitle')}</DialogTitle>
							<DialogDescription className="wrap-anywhere">
								{t('account.usernameConfirmBody', {
									newPath: `/${username}`,
									oldPath: `/${initialUsername}`,
								})}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							{/* Focus starts on the safe choice */}
							<Button variant="outline" autoFocus onClick={backToForm} disabled={isPending}>
								{t('common.back')}
							</Button>
							<Button onClick={save} loading={isPending}>
								{t('account.usernameConfirmCta')}
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{t('profile.editProfile')}</DialogTitle>
						</DialogHeader>
						<form id="edit-profile" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
							<div className="flex flex-col gap-1.5">
								<label htmlFor="username" className="text-sm font-medium text-foreground">
									{t('account.usernameLabel')}
								</label>
								<Input
									ref={usernameInput}
									id="username"
									value={username}
									onChange={(e) => {
										setUsername(e.target.value.trim().toLowerCase());
										setUsernameError(null);
									}}
									autoComplete="username"
									autoCapitalize="none"
									spellCheck={false}
									maxLength={USERNAME_MAX_LENGTH}
									aria-invalid={!!usernameError}
									aria-describedby={usernameError ? 'username-error' : 'username-hint'}
								/>
								{usernameError ? (
									<p id="username-error" className="wrap-anywhere text-xs text-destructive">
										{usernameError}
									</p>
								) : (
									<p id="username-hint" className="wrap-anywhere text-xs text-muted-foreground">
										{t('account.usernameHint', { path: `/${username || initialUsername}` })}
									</p>
								)}
							</div>
							<div className="flex flex-col gap-1.5">
								<label htmlFor="displayName" className="text-sm font-medium text-foreground">
									{t('profile.displayName')}
								</label>
								<Input
									id="displayName"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder={t('profile.displayNamePlaceholder')}
									maxLength={100}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label htmlFor="bio" className="text-sm font-medium text-foreground">
									{t('profile.bio')}
								</label>
								<Textarea
									id="bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									placeholder={t('profile.bioPlaceholder')}
									maxLength={500}
									rows={4}
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1.5">
									<label htmlFor="firstName" className="text-sm font-medium text-foreground">
										{t('profile.firstName')}
									</label>
									<Input
										id="firstName"
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										autoComplete="given-name"
										maxLength={50}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label htmlFor="lastName" className="text-sm font-medium text-foreground">
										{t('profile.lastName')}
									</label>
									<Input
										id="lastName"
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										autoComplete="family-name"
										maxLength={50}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-1.5">
								<label htmlFor="birthday" className="text-sm font-medium text-foreground">
									{t('profile.birthday')}
								</label>
								<Input
									id="birthday"
									type="date"
									value={birthday}
									onChange={(e) => {
										setBirthday(e.target.value);
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
						</form>
						<DialogFooter showCloseButton closeLabel={t('common.close')}>
							<Button type="submit" form="edit-profile" loading={isPending}>
								{t('profile.saveChanges')}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
