'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { rowClassName, SettingsCard } from '@/components/SettingsCard';
import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogBody,
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
import { AVATAR_UPLOAD_TYPES, avatarFileProblem } from '@/features/avatars/catalog';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { apiErrorText } from '@/lib/api/error-text';
import { cn } from '@/lib/utils';

import { canEditProfile } from './permissions';
import { accountName, type MyCommunity } from './schema';
import { updateCommunity, uploadCommunityAvatar } from './service';

const loadCropStage = () => import('@/features/avatars/CropStage').then((module) => module.CropStage);
const CropStage = dynamic(loadCropStage, {
	ssr: false,
	loading: () => <div className="aspect-square w-full rounded-xl bg-field" />,
});

const NAME_MAX_LENGTH = 100;
const BIO_MAX_LENGTH = 500;
const labelClassName = 'text-caption-1 font-medium text-foreground';

export function CommunityProfileCard({ community, bio }: { community: MyCommunity; bio: string | null }) {
	const { t } = useLanguage();
	return (
		<section aria-labelledby="profile-title" className="space-y-2.5">
			<h2 id="profile-title" className="text-title-4">
				{t('communities.profile')}
			</h2>
			<SettingsCard>
				<div className={cn(rowClassName, 'items-start gap-3')}>
					<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-12" />
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium">{accountName(community)}</p>
						<p className="truncate text-caption-2 text-muted-foreground">@{community.username}</p>
						{bio && <p className="mt-1.5 text-body-4 whitespace-pre-line wrap-anywhere">{bio}</p>}
					</div>
					{canEditProfile(community.role) && <EditCommunityProfile community={community} bio={bio ?? ''} />}
				</div>
			</SettingsCard>
		</section>
	);
}

const STALE_MEMBERSHIP_CODES = ['community.role_forbidden', 'community.not_member'];

/** Name, bio and avatar, through the community's own endpoints: its username never changes. */
export function EditCommunityProfile({
	community,
	bio: savedBio,
	defaultOpen = false,
}: {
	community: MyCommunity;
	bio: string;
	defaultOpen?: boolean;
}) {
	const { t } = useLanguage();
	const router = useRouter();
	const savedName = community.displayName ?? '';
	const [open, setOpen] = useState(defaultOpen);
	const [name, setName] = useState(savedName);
	const [bio, setBio] = useState(savedBio);
	const [nameError, setNameError] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [cropFile, setCropFile] = useState<File | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	const openChange = (next: boolean) => {
		if (next) {
			setName(savedName);
			setBio(savedBio);
			setNameError(false);
		}
		setOpen(next);
	};

	const pickFile = (file: File) => {
		const problem = avatarFileProblem(file);
		if (problem) toast.error(t(problem), { duration: Infinity });
		else setCropFile(file);
	};

	async function save(event: React.FormEvent) {
		event.preventDefault();
		const displayName = name.trim();
		if (!displayName) {
			setNameError(true);
			return;
		}
		const changes = {
			...(displayName !== savedName && { displayName }),
			...(bio !== savedBio && { bio }),
		};
		if (Object.keys(changes).length === 0) {
			setOpen(false);
			return;
		}
		setIsSaving(true);
		try {
			const result = await updateCommunity(community.communityId, changes);
			if (!result.ok) {
				if (result.errorCode === 'common.validation_failed' && changes.displayName !== undefined) {
					setNameError(true);
				} else if (result.errorCode === 'community.role_forbidden') {
					toast.error(t('communities.editForbidden'), { duration: Infinity });
				} else {
					toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
				}
				// The role or membership changed meanwhile: the refreshed page shows what they can still do
				if (result.errorCode && STALE_MEMBERSHIP_CODES.includes(result.errorCode)) {
					setOpen(false);
					router.refresh();
				}
				return;
			}
			toast.success(t('profile.updated'));
			setOpen(false);
			router.refresh();
		} catch {
			toast.error(t('account.saveFailed'), { duration: Infinity });
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={openChange}
			onOpenChangeComplete={(isOpen) => !isOpen && setCropFile(null)}
		>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>{t('profile.editProfile')}</DialogTrigger>
			<DialogContent className="sm:max-w-md" closeLabel={t('common.close')}>
				{cropFile ? (
					<>
						<DialogHeader>
							<DialogTitle>{t('avatar.crop.title')}</DialogTitle>
							<DialogDescription>{t('avatar.crop.body')}</DialogDescription>
						</DialogHeader>
						<CropStage
							file={cropFile}
							upload={(formData) => uploadCommunityAvatar(community.communityId, formData)}
							onCancel={() => setCropFile(null)}
							onDone={() => {
								setCropFile(null);
								router.refresh();
							}}
						/>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{t('profile.editProfile')}</DialogTitle>
							<DialogDescription>{t('communities.editIntro', { name: community.username })}</DialogDescription>
						</DialogHeader>
						<DialogBody>
							<form id="edit-community" onSubmit={save} noValidate className="flex flex-col gap-4">
								<div className="flex items-center gap-4">
									<UserAvatar username={community.username} avatarUrl={community.avatarUrl} className="size-16" />
									<input
										ref={fileInput}
										type="file"
										accept={AVATAR_UPLOAD_TYPES.join(',')}
										hidden
										data-testid="community-avatar-file"
										onChange={(event) => {
											const file = event.target.files?.[0];
											// Cleared so choosing the same file again still fires
											event.target.value = '';
											if (file) pickFile(file);
										}}
									/>
									<Button
										variant="outline"
										size="sm"
										disabled={isSaving}
										onClick={() => {
											void loadCropStage();
											fileInput.current?.click();
										}}
									>
										{t('avatar.upload.button')}
									</Button>
								</div>
								<div className="flex flex-col gap-1.5">
									<label htmlFor="community-profile-name" className={labelClassName}>
										{t('communities.nameLabel')}
									</label>
									<Input
										id="community-profile-name"
										value={name}
										onChange={(event) => {
											setName(event.target.value);
											setNameError(false);
										}}
										maxLength={NAME_MAX_LENGTH}
										aria-invalid={nameError}
										aria-describedby={nameError ? 'community-profile-name-error' : undefined}
									/>
									{nameError && (
										<p id="community-profile-name-error" className="text-caption-3 text-destructive">
											{t('communities.nameRequired')}
										</p>
									)}
								</div>
								<div className="flex flex-col gap-1.5">
									<label htmlFor="community-profile-bio" className={labelClassName}>
										{t('profile.bio')}
									</label>
									<Textarea
										id="community-profile-bio"
										value={bio}
										onChange={(event) => setBio(event.target.value)}
										placeholder={t('communities.bioPlaceholder')}
										maxLength={BIO_MAX_LENGTH}
										rows={3}
										aria-describedby="community-profile-bio-count"
									/>
									<p id="community-profile-bio-count" className="text-right text-caption-3 tabular-nums text-muted-foreground">
										{bio.length} / {BIO_MAX_LENGTH}
									</p>
								</div>
							</form>
						</DialogBody>
						<DialogFooter>
							<Button variant="outline" size="md" onClick={() => setOpen(false)} disabled={isSaving}>
								{t('common.cancel')}
							</Button>
							<Button type="submit" form="edit-community" size="md" loading={isSaving}>
								{t('profile.saveChanges')}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
