'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { AccountAvatar } from './AccountAvatar';

/**
 * An uploaded photo, already square; drawn in the same frame as the cast. A photo that fails to
 * load (deleted, or the API is down) shows `fallback` instead of an empty circle: the account icon
 * unless the caller passes the person's bot.
 */
export function UploadedAvatar({ src, className, fallback }: { src: string; className?: string; fallback?: ReactNode }) {
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	// Listens natively, from mount: a server-rendered image can fail before React hydrates, and one that
	// already failed is caught by the check. Both run in one task, so no error falls between them
	useEffect(() => {
		const img = imgRef.current;
		if (!img) return;
		const fail = () => setFailedSrc(src);
		if (img.complete && img.naturalWidth === 0) {
			fail();
			return;
		}
		img.addEventListener('error', fail);
		return () => img.removeEventListener('error', fail);
	}, [src]);

	if (failedSrc === src) return fallback ?? <AccountAvatar className={className} />;
	return (
		// eslint-disable-next-line @next/next/no-img-element -- a small fixed image served by the API
		<img ref={imgRef} src={src} alt="" loading="lazy" className={cn('avatar-frame object-cover', className)} />
	);
}
