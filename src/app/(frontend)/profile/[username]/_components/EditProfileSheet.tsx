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
import { Textarea } from '@/components/ui/Textarea';

interface EditProfileSheetProps {
	initialDisplayName: string;
	initialBio: string;
}

export default function EditProfileSheet({ initialDisplayName, initialBio }: EditProfileSheetProps) {
	const [open, setOpen] = useState(false);
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [bio, setBio] = useState(initialBio);
	const [isPending, setIsPending] = useState(false);

	async function handleSubmit(e?: React.FormEvent) {
		e?.preventDefault();
		setIsPending(true);
		try {
			const res = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName, bio }),
			});
			if (!res.ok) throw new Error('Failed to save');
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
					<div className="flex flex-col gap-1.5">
						<label htmlFor="displayName" className="text-sm font-medium text-foreground">
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
						<label htmlFor="bio" className="text-sm font-medium text-foreground">
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
					<Button type="submit" disabled={isPending} onClick={handleSubmit} className="w-full">
						{isPending ? <Spinner className="mr-2" /> : null}
						Save Changes
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
