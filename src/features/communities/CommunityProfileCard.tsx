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
import { isFieldPublic, visibilityChanges } from '@/features/account/visibility';
import { VisibilityPill } from '@/features/account/VisibilityPill';
import { AVATAR_UPLOAD_TYPES, avatarFileProblem } from '@/features/avatars/catalog';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { type ActionFailure } from '@/lib/api/action';
import { apiErrorText } from '@/lib/api/error-text';
import { updateVisibility } from '@/lib/api/services/users';
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
const fieldHeaderClassName = 'flex min-h-7 items-center justify-between gap-2';

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

export function EditCommunityProfile({
	community,
	bio: savedBio,
	defaultOpen = false,
	actingVisibility: savedVisibility,
}: {
	community: MyCommunity;
	bio: string;
	defaultOpen?: boolean;
	actingVisibility?: Record<string, boolean>;
}) {
	const { t } = useLanguage();
	const router = useRouter();
	const savedName = community.displayName ?? '';
	const [open, setOpen] = useState(defaultOpen);
	const [name, setName] = useState(savedName);
	const [bio, setBio] = useState(savedBio);
	const [visibility, setVisibility] = useState(savedVisibility ?? {});
	const [nameError, setNameError] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [cropFile, setCropFile] = useState<File | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	const openChange = (next: boolean) => {
		if (next) {
			setName(savedName);
			setBio(savedBio);
			setVisibility(savedVisibility ?? {});
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
		const detailsChanged = Object.keys(changes).length > 0;
		const visibilityChanged = savedVisibility ? visibilityChanges(savedVisibility, visibility) : {};
		if (!detailsChanged && Object.keys(visibilityChanged).length === 0) {
			setOpen(false);
			return;
		}
		const refuse = (failure: ActionFailure, fallbackKey: string) => {
			if (failure.errorCode === 'community.role_forbidden') {
				toast.error(t('communities.editForbidden'), { duration: Infinity });
			} else {
				toast.error(apiErrorText(t, failure, fallbackKey), { duration: Infinity });
			}
			if (failure.errorCode && STALE_MEMBERSHIP_CODES.includes(failure.errorCode)) {
				setOpen(false);
				router.refresh();
			}
		};
		setIsSaving(true);
		try {
			if (detailsChanged) {
				const result = await updateCommunity(community.communityId, changes);
				if (!result.ok) {
					if (result.errorCode === 'common.validation_failed' && changes.displayName !== undefined) setNameError(true);
					else refuse(result, 'account.saveFailed');
					return;
				}
			}
			if (Object.keys(visibilityChanged).length > 0) {
				const result = await updateVisibility(visibilityChanged);
				if (!result.ok) {
					if (detailsChanged) router.refresh();
					refuse(result, detailsChanged ? 'profile.visibilitySaveFailed' : 'account.saveFailed');
					return;
				}
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

	const pill = (fieldLabel: string, field: string) =>
		savedVisibility && (
			<VisibilityPill
				label={fieldLabel}
				isPublic={isFieldPublic(visibility, field)}
				onToggle={() => setVisibility((current) => ({ ...current, [field]: !isFieldPublic(current, field) }))}
			/>
		);

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
									<div className={fieldHeaderClassName}>
										<label htmlFor="community-profile-name" className={labelClassName}>
											{t('communities.nameLabel')}
										</label>
										{pill(t('communities.nameLabel'), 'displayName')}
									</div>
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
									<div className={fieldHeaderClassName}>
										<label htmlFor="community-profile-bio" className={labelClassName}>
											{t('profile.bio')}
										</label>
										{pill(t('profile.bio'), 'bio')}
									</div>
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
