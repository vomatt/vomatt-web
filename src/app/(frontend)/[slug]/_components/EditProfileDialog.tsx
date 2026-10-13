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
import { User as UserIcon } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUsername, USERNAME_MAX_LENGTH } from '@/features/account/username';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { editProfile } from '@/lib/api/services/users';
import { profileHref } from '@/lib/routes';

interface EditProfileDialogProps {
	initialUsername: string;
	initialDisplayName: string;
	initialBio: string;
	/** `undefined` when the backend doesn't support avatars; the photo section is hidden then. */
	initialAvatarUrl?: string | null;
}

export default function EditProfileDialog({
	initialUsername,
	initialDisplayName,
	initialBio,
	initialAvatarUrl,
}: EditProfileDialogProps) {
	const { t } = useLanguage();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [username, setUsername] = useState(initialUsername);
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [bio, setBio] = useState(initialBio);
	const [isPending, setIsPending] = useState(false);

	const supportsAvatars = initialAvatarUrl !== undefined;
	const { avatarUrl, isUploading, upload, remove } = useAvatarUpload(initialAvatarUrl ?? null);

	async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const error = await upload(file);
		if (error) toast.error(error);
		else toast.success('Avatar updated');
		e.target.value = '';
	}

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
				toast.error(result.message);
				return;
			}
			// The profile lives at /[username], so a new username moves the page
			if (usernameChanged) router.replace(profileHref(username));
			toast.success('Profile updated');
			setOpen(false);
		} catch {
			toast.error('Something went wrong. Please try again.');
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				Edit Profile
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Profile</DialogTitle>
				</DialogHeader>
				<form id="edit-profile" onSubmit={handleSubmit} className="flex flex-col gap-4">
					{/* Avatar section */}
					{supportsAvatars && (
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium text-foreground">Photo</label>
						<div className="flex items-center gap-4">
							{/* Avatar preview */}
							<div className="w-16 h-16 rounded-full overflow-hidden bg-primary flex items-center justify-center shrink-0">
								{avatarUrl ? (
									<img src={avatarUrl} alt="Profile picture" className="w-full h-full object-cover" />
								) : (
									<span className="w-8 h-8 text-white flex items-center justify-center">
										<UserIcon size="2em" />
									</span>
								)}
							</div>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="edit-avatar-upload"
									className="text-sm text-primary underline cursor-pointer hover:opacity-70 transition-opacity"
								>
									{isUploading ? 'Uploading…' : 'Change photo'}
								</label>
								<input
									id="edit-avatar-upload"
									type="file"
									accept="image/jpeg,image/png,image/webp,image/gif"
									className="hidden"
									disabled={isUploading}
									onChange={handleAvatarChange}
								/>
								{avatarUrl && (
									<button
										type="button"
										onClick={remove}
										disabled={isUploading}
										className="text-sm text-destructive underline text-left hover:opacity-70 transition-opacity disabled:opacity-40"
									>
										Remove photo
									</button>
								)}
							</div>
						</div>
					</div>
					)}
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
							Display Name
						</label>
						<Input
							id="displayName"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder="Your display name"
							maxLength={100}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="bio"
							className="text-sm font-medium text-foreground"
						>
							Bio
						</label>
						<Textarea
							id="bio"
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Tell people about yourself"
							maxLength={500}
							rows={4}
						/>
					</div>
				</form>
				<DialogFooter showCloseButton>
					<Button
						type="submit"
						form="edit-profile"
						disabled={isPending || isUploading}
					>
						{isPending ? <Spinner className="mr-2" /> : null}
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
