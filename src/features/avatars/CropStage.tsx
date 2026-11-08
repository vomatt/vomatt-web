'use client';

import { useEffect, useRef, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { DialogBody, DialogFooter } from '@/components/ui/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';

import { cropToJpeg } from './cropImage';
import { uploadAvatar } from './service';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Framing the picked photo in a circle (drag to move, pinch, scroll or the slider to zoom, arrow keys on
 * the circle), then uploading just that square. Loaded on demand by `AvatarDialog`.
 */
export function CropStage({ file, onCancel, onDone }: { file: File; onCancel: () => void; onDone: () => void }) {
	const { t } = useLanguage();
	const [src, setSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	// In source pixels; null until the image has loaded
	const [area, setArea] = useState<Area | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const box = useRef<HTMLDivElement>(null);
	// False once the dialog closes, which also revokes the URL a pending crop is reading
	const mounted = useRef(false);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	useEffect(() => {
		const url = URL.createObjectURL(file);
		// eslint-disable-next-line react-hooks/set-state-in-effect -- made here so each URL is paired with its revoke, including Strict Mode's remount
		setSrc(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const upload = async () => {
		if (!src || !area || isUploading) return;
		setIsUploading(true);
		try {
			let blob: Blob;
			try {
				blob = await cropToJpeg(src, area);
			} catch {
				// Closing the dialog cancels the crop; that's not a bad image
				if (!mounted.current) return;
				toast.error(t('avatar.upload.unsupported'), { duration: Infinity });
				onCancel();
				return;
			}
			const formData = new FormData();
			formData.set('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
			const result = await uploadAvatar(formData);
			if (!result.ok) {
				toast.error(apiErrorText(t, result, 'account.saveFailed'), { duration: Infinity });
				return;
			}
			onDone();
			toast.success(t('avatar.savedToast'));
		} catch {
			toast.error(t('account.saveFailed'), { duration: Infinity });
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<>
			<DialogBody className="grid gap-4">
				<div ref={box} className="relative aspect-square w-full overflow-hidden rounded-xl bg-field">
					{src && (
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
							// The library's mousedown handler blocks focus, so a click wouldn't reach the arrow keys
							onInteractionStart={({ source }) =>
								source === 'mouse' &&
								box.current?.querySelector<HTMLElement>('.reactEasyCrop_CropArea')?.focus({ preventScroll: true })
							}
							classes={{
								cropAreaClassName:
									'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
							}}
							cropperProps={{ role: 'group', 'aria-label': t('avatar.crop.area') }}
						/>
					)}
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
			</DialogBody>

			<DialogFooter>
				<Button variant="outline" size="md" disabled={isUploading} onClick={onCancel}>
					{t('common.cancel')}
				</Button>
				<Button
					size="md"
					loading={isUploading}
					disabled={!src || !area}
					onClick={() => void upload()}
				>
					{t('avatar.crop.use')}
				</Button>
			</DialogFooter>
		</>
	);
}
