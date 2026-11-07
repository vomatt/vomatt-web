'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
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
import { Check, Pencil } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { cn } from '@/lib/utils';

import {
	AVATAR_UPLOAD_TYPES,
	type AvatarChoice,
	avatarCopyKey,
	BOT_KINDS,
	type BotKind,
	NO_BOT,
	resolveAvatar,
	uploadedAvatarSrc,
} from './catalog';
import { cropToJpeg } from './cropImage';
import { chooseAvatar, uploadAvatar } from './service';
import { ChosenAvatar, UploadedAvatar } from './UserAvatar';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/** Choosing from the cast (or picking a file), or framing the picked photo; `src` is the file's object URL. */
type Stage = { kind: 'pick' } | { kind: 'crop'; src: string };

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
	const [isUploading, setIsUploading] = useState(false);
	const [stage, setStage] = useState<Stage>({ kind: 'pick' });
	const fileInput = useRef<HTMLInputElement>(null);
	// Tile tooltips stay inside the scrolling grid, so they flip or shift rather than cover the header
	const [grid, setGrid] = useState<HTMLDivElement | null>(null);
	const unchanged = selected === saved;

	useEffect(() => {
		if (stage.kind !== 'crop') return;
		return () => URL.revokeObjectURL(stage.src);
	}, [stage]);

	const openChange = (next: boolean) => {
		// Each visit starts from the saved bot, not an abandoned pick
		if (next) setSelected(saved);
		else setStage({ kind: 'pick' });
		setOpen(next);
	};

	const pickFile = (file: File) => {
		if (isSaving || isUploading) return;
		if (file.size === 0 || !AVATAR_UPLOAD_TYPES.includes(file.type)) {
			toast.error(t('avatar.upload.unsupported'), { duration: Infinity });
			return;
		}
		setStage({ kind: 'crop', src: URL.createObjectURL(file) });
	};

	const upload = async (src: string, area: Area) => {
		if (isSaving || isUploading) return;
		setIsUploading(true);
		try {
			const blob = await cropToJpeg(src, area).catch(() => null);
			if (!blob) {
				toast.error(t('avatar.upload.unsupported'), { duration: Infinity });
				setStage({ kind: 'pick' });
				return;
			}
			const formData = new FormData();
			formData.set('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
			const result = await uploadAvatar(formData);
			if (!result.ok) {
				toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
				return;
			}
			openChange(false);
			toast.success(t('avatar.savedToast'));
		} catch {
			toast.error(t('account.saveFailed'), { duration: Infinity });
		} finally {
			setIsUploading(false);
		}
	};

	const surprise = () => {
		const others = BOT_KINDS.filter((kind) => kind !== selected);
		setSelected(others[Math.floor(Math.random() * others.length)]);
	};

	const save = async () => {
		// Enabled even when unchanged, so it never drops focus; nothing to save just closes
		if (isUploading) return;
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
		<Dialog open={open} onOpenChange={openChange}>
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
					stage.kind === 'pick' && 'grid-rows-[auto_auto_minmax(0,1fr)_auto] md:max-w-2xl'
				)}
			>
				{stage.kind === 'crop' ? (
					<CropStage
						src={stage.src}
						isUploading={isUploading}
						onCancel={() => setStage({ kind: 'pick' })}
						onUse={(area) => void upload(stage.src, area)}
					/>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{t('avatar.title')}</DialogTitle>
							<DialogDescription>{t('avatar.body')}</DialogDescription>
						</DialogHeader>

						<div className="flex flex-wrap items-center gap-4">
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
							<div className="flex w-full gap-2 *:flex-1 md:w-auto md:*:flex-none">
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
									onClick={() => fileInput.current?.click()}
								>
									{t('avatar.upload.button')}
								</Button>
								<Button variant="outline" size="sm" onClick={surprise}>
									{t('avatar.surprise')}
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
						</div>

						<div ref={setGrid} className="-mx-4 overflow-y-auto overscroll-contain px-4 pb-1">
							{/* Six and ten across, so the cast of 60 fills every row */}
							<div className="grid grid-cols-6 gap-1.5 md:grid-cols-10 md:gap-2">{BOT_KINDS.map(renderTile)}</div>
						</div>

						<DialogFooter showCloseButton closeLabel={t('common.close')}>
							<Button onClick={save} loading={isSaving} disabled={isUploading}>
								{t('avatar.save')}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

/** Framing the picked photo in a circle: drag to move, pinch, scroll or the slider to zoom, arrow keys on the circle. */
function CropStage({
	src,
	isUploading,
	onCancel,
	onUse,
}: {
	src: string;
	isUploading: boolean;
	onCancel: () => void;
	onUse: (area: Area) => void;
}) {
	const { t } = useLanguage();
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	// In source pixels; null until the image has loaded
	const [area, setArea] = useState<Area | null>(null);

	return (
		<>
			<DialogHeader>
				<DialogTitle>{t('avatar.crop.title')}</DialogTitle>
				<DialogDescription>{t('avatar.crop.body')}</DialogDescription>
			</DialogHeader>

			<div className="relative aspect-square w-full overflow-hidden rounded-xl bg-field">
				<Cropper
					image={src}
					crop={crop}
					zoom={zoom}
					minZoom={MIN_ZOOM}
					maxZoom={MAX_ZOOM}
					aspect={1}
					cropShape="round"
					showGrid={false}
					objectFit="cover"
					keyboardStep={10}
					onCropChange={setCrop}
					onZoomChange={setZoom}
					onCropComplete={(_, pixels) => setArea(pixels)}
					classes={{
						cropAreaClassName:
							'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
					}}
					cropperProps={{ role: 'group', 'aria-label': t('avatar.crop.area') }}
				/>
			</div>

			<label className="flex items-center gap-3 text-body-4 text-muted-foreground">
				{t('avatar.crop.zoom')}
				<input
					type="range"
					min={MIN_ZOOM}
					max={MAX_ZOOM}
					step={0.01}
					value={zoom}
					onChange={(event) => setZoom(Number(event.target.value))}
					className="h-11 min-w-0 flex-1 accent-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
				/>
			</label>

			<DialogFooter>
				<Button variant="outline" size="md" disabled={isUploading} onClick={onCancel}>
					{t('common.cancel')}
				</Button>
				<Button size="md" loading={isUploading} disabled={!area} onClick={() => area && onUse(area)}>
					{t('avatar.crop.use')}
				</Button>
			</DialogFooter>
		</>
	);
}
