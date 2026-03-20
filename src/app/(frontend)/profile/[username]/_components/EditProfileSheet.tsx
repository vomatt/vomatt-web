'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { User as UserIcon } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { updateProfile } from '@/lib/api/services/users';

interface EditProfileSheetProps {
	initialDisplayName: string;
	initialBio: string;
	initialAvatarUrl: string | null;
}

export default function EditProfileSheet({
	initialDisplayName,
	initialBio,
	initialAvatarUrl,
}: EditProfileSheetProps) {
	const [open, setOpen] = useState(false);
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [bio, setBio] = useState(initialBio);
	const [isPending, setIsPending] = useState(false);

	const { avatarUrl, isUploading, upload, remove } = useAvatarUpload(initialAvatarUrl);

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
		setIsPending(true);
		try {
			await updateProfile({ displayName, bio });
			toast.success('Profile updated');
			setOpen(false);
		} catch {
			toast.error('Something went wrong. Please try again.');
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="outline" size="sm">
					Edit Profile
				</Button>
			</SheetTrigger>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Edit Profile</SheetTitle>
				</SheetHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
					{/* Avatar section */}
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium text-foreground">Photo</label>
						<div className="flex items-center gap-4">
							{/* Avatar preview */}
							<div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shrink-0">
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
							maxLength={64}
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
							maxLength={280}
							rows={4}
						/>
					</div>
				</form>
				<SheetFooter>
					<Button
						type="submit"
						disabled={isPending || isUploading}
						onClick={handleSubmit}
						className="w-full"
					>
						{isPending ? <Spinner className="mr-2" /> : null}
						Save Changes
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
