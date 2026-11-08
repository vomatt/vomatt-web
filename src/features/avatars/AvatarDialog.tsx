'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { Check, Pencil } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { cn } from '@/lib/utils';

import {
	AVATAR_PICK_MAX_BYTES,
	AVATAR_UPLOAD_TYPES,
	type AvatarChoice,
	avatarCopyKey,
	BOT_KINDS,
	type BotKind,
	NO_BOT,
	resolveAvatar,
	uploadedAvatarSrc,
} from './catalog';
import { chooseAvatar } from './service';
import { ChosenAvatar, UploadedAvatar } from './UserAvatar';

// Profiles render this dialog for every visit; the cropper's code loads only once a photo is being picked
const loadCropStage = () => import('./CropStage').then((module) => module.CropStage);
const CropStage = dynamic(loadCropStage, {
	ssr: false,
	loading: () => <div className="aspect-square w-full rounded-xl bg-field" />,
});

/**
 * The owner's avatar, opening the cast to choose from. Size comes from `className`, as on `UserAvatar`.
 */
export function AvatarDialog({
	username,
	avatarUrl,
	className,
}: {
	username: string;
	avatarUrl: string | null;
	className?: string;
}) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	// What everyone sees now; saving refreshes the page, which passes the new avatarUrl
	const savedUpload = uploadedAvatarSrc(avatarUrl);
	// null while the uploaded photo is what's kept
	const saved: AvatarChoice | null = savedUpload ? null : resolveAvatar(username, avatarUrl);
	const [selected, setSelected] = useState<AvatarChoice | null>(saved);
	const [isSaving, setIsSaving] = useState(false);
	// The photo being framed; null while choosing from the cast
	const [cropFile, setCropFile] = useState<File | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	// Tile tooltips stay inside the scrolling grid, so they flip or shift rather than cover the header
	const [grid, setGrid] = useState<HTMLDivElement | null>(null);
	const unchanged = selected === saved;

	const openChange = (next: boolean) => {
		// Each visit starts from the saved bot, not an abandoned pick
		if (next) setSelected(saved);
		setOpen(next);
	};

	const pickFile = (file: File) => {
		if (file.size === 0 || !AVATAR_UPLOAD_TYPES.includes(file.type)) {
			toast.error(t('avatar.upload.unsupported'), { duration: Infinity });
			return;
		}
		if (file.size > AVATAR_PICK_MAX_BYTES) {
			toast.error(t('avatar.upload.tooLarge'), { duration: Infinity });
			return;
		}
		setCropFile(file);
	};

	const save = async () => {
		// Enabled even when unchanged, so it never drops focus; nothing to save just closes
		if (unchanged || selected === null) {
			setOpen(false);
			return;
		}
		setIsSaving(true);
		try {
			const result = await chooseAvatar(selected);
			if (!result.ok) {
				toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
				return;
			}
			setOpen(false);
			toast.success(t('avatar.savedToast'));
		} catch {
			// The action itself returns failures; this is the request to it failing (e.g. offline)
			toast.error(t('account.saveFailed'), { duration: Infinity });
		} finally {
			setIsSaving(false);
		}
	};

	const renderTile = (kind: BotKind) => (
		<button
			key={kind}
			type="button"
			aria-pressed={kind === selected}
			aria-label={t('avatar.choose', { name: t(`${avatarCopyKey(kind)}.name`) })}
			onClick={() => setSelected(kind)}
			className={cn(
				'relative aspect-square rounded-full p-0.5 transition-shadow outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
				kind === selected
					? // Forced colors drop the ring; the outline survives as the selection
						'ring-2 ring-primary forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-solid'
					: 'hover:bg-border-strong'
			)}
		>
			<ChosenAvatar kind={kind} className="size-full" tooltip tooltipBoundary={grid} />
			{kind === selected && (
				<span
					aria-hidden
					className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-popover"
				>
					<Check size={12} />
				</span>
			)}
		</button>
	);

	return (
		<Dialog
			open={open}
			onOpenChange={openChange}
			// Cleared once the close animation ends, so the photo isn't held and the next visit starts at the cast
			onOpenChangeComplete={(isOpen) => !isOpen && setCropFile(null)}
		>
			<DialogTrigger
				aria-label={t('avatar.change')}
				className="group relative shrink-0 rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
			>
				{savedUpload ? (
					<UploadedAvatar src={savedUpload} className={cn('transition-opacity group-hover:opacity-80', className)} />
				) : (
					<ChosenAvatar
						kind={saved ?? NO_BOT}
						className={cn('transition-opacity group-hover:opacity-80', className)}
					/>
				)}
				<span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-card text-foreground">
					<Pencil size={12} aria-hidden />
				</span>
			</DialogTrigger>
			<DialogContent
				closeLabel={t('common.close')}
				className={cn(
					'max-h-[calc(100dvh-2rem)] sm:max-w-md',
					!cropFile && 'grid-rows-[auto_auto_minmax(0,1fr)_auto] md:max-w-2xl'
				)}
			>
				{cropFile ? (
					<>
						{/* Here rather than in CropStage, so the dialog keeps its name while that code loads */}
						<DialogHeader>
							<DialogTitle>{t('avatar.crop.title')}</DialogTitle>
							<DialogDescription>{t('avatar.crop.body')}</DialogDescription>
						</DialogHeader>
						<CropStage file={cropFile} onCancel={() => setCropFile(null)} onDone={() => setOpen(false)} />
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{t('avatar.title')}</DialogTitle>
							<DialogDescription>{t('avatar.body')}</DialogDescription>
						</DialogHeader>

						{/* pb-3: with the grid's 4px top, the two sections stay 16px apart */}
						<DialogBody className="flex flex-wrap items-center gap-4 pb-3">
							{selected === null && savedUpload ? (
								<UploadedAvatar src={savedUpload} className="size-16 md:size-28" />
							) : (
								<ChosenAvatar kind={selected ?? NO_BOT} className="size-16 md:size-28" />
							)}
							<div className="min-w-0 flex-1" aria-live="polite">
								<p className="font-medium md:text-body-1">
									{selected === null ? t('avatar.upload.name') : t(`${avatarCopyKey(selected)}.name`)}
								</p>
								<p className="text-caption-2 text-muted-foreground">
									{selected === null ? t('avatar.upload.trait') : t(`${avatarCopyKey(selected)}.trait`)}
								</p>
							</div>
							<div className="grid w-full grid-cols-2 gap-2 *:whitespace-normal md:flex md:w-auto">
								<input
									ref={fileInput}
									type="file"
									accept={AVATAR_UPLOAD_TYPES.join(',')}
									hidden
									data-testid="avatar-file"
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
										// Fetched while the file chooser is open, so the crop step opens without a wait
										void loadCropStage();
										fileInput.current?.click();
									}}
								>
									{t('avatar.upload.button')}
								</Button>
								<Button
									variant="outline"
									size="sm"
									// Keeps focus once used; pointer-events-none drops the hover on the disabled look
									disabled={selected === NO_BOT}
									focusableWhenDisabled
									onClick={() => setSelected(NO_BOT)}
									className="aria-disabled:pointer-events-none"
								>
									{t('avatar.remove')}
								</Button>
							</div>
						</DialogBody>

						<DialogBody ref={setGrid} scroll>
							{/* Six and ten across, so the cast of 60 fills every row */}
							<div className="grid grid-cols-6 gap-1.5 md:grid-cols-10 md:gap-2">{BOT_KINDS.map(renderTile)}</div>
						</DialogBody>

						<DialogFooter showCloseButton closeLabel={t('common.close')}>
							<Button onClick={save} loading={isSaving}>
								{t('avatar.save')}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
