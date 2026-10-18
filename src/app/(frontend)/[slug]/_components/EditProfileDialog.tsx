'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUsername, USERNAME_MAX_LENGTH } from '@/features/account/username';
import { apiErrorText } from '@/lib/api/error-text';
import { editProfile } from '@/lib/api/services/users';
import { profileHref } from '@/lib/routes';

interface EditProfileDialogProps {
	initialUsername: string;
	initialDisplayName: string;
	initialBio: string;
}

export default function EditProfileDialog({
	initialUsername,
	initialDisplayName,
	initialBio,
}: EditProfileDialogProps) {
	const { t } = useLanguage();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [username, setUsername] = useState(initialUsername);
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [bio, setBio] = useState(initialBio);
	const [isPending, setIsPending] = useState(false);

	async function handleSubmit(e?: React.FormEvent) {
		e?.preventDefault();
		// The input lowercases, so a legacy mixed-case username isn't renamed by a case-only edit
		const usernameChanged = username.toLowerCase() !== initialUsername.toLowerCase();
		if (usernameChanged && !isValidUsername(username)) {
			toast.error(t('account.usernameInvalid'));
			return;
		}
		if (!usernameChanged && displayName === initialDisplayName && bio === initialBio) {
			setOpen(false);
			return;
		}
		setIsPending(true);
		try {
			const result = await editProfile({
				username: usernameChanged ? username : undefined,
				displayName,
				bio,
			});
			if (!result.ok) {
				toast.error(apiErrorText(t, result));
				return;
			}
			// The profile lives at /[username], so a new username moves the page
			if (usernameChanged) router.replace(profileHref(username));
			toast.success(t('profile.updated'));
			setOpen(false);
		} catch {
			toast.error(t('common.errorBody'));
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				{t('profile.editProfile')}
			</DialogTrigger>
			<DialogContent className="sm:max-w-md" closeLabel={t('common.close')}>
				<DialogHeader>
					<DialogTitle>{t('profile.editProfile')}</DialogTitle>
				</DialogHeader>
				<form id="edit-profile" onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="username"
							className="text-sm font-medium text-foreground"
						>
							{t('account.usernameLabel')}
						</label>
						<Input
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
							autoComplete="username"
							autoCapitalize="none"
							spellCheck={false}
							maxLength={USERNAME_MAX_LENGTH}
							aria-describedby="username-hint"
						/>
						<p id="username-hint" className="text-xs text-muted-foreground">
							{t('account.usernameHint', { path: `/${username || initialUsername}` })}
						</p>
					</div>
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="displayName"
							className="text-sm font-medium text-foreground"
						>
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
						<label
							htmlFor="bio"
							className="text-sm font-medium text-foreground"
						>
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
				</form>
				<DialogFooter showCloseButton closeLabel={t('common.close')}>
					<Button
						type="submit"
						form="edit-profile"
						disabled={isPending}
					>
						{isPending ? <Spinner className="mr-2" /> : null}
						{t('profile.saveChanges')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
