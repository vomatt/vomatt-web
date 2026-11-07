import type { Area } from 'react-easy-crop';

import { AVATAR_CROP_QUALITY, AVATAR_CROP_SIZE } from './catalog';

/** `area` (source pixels) of the image at `src`, as the square JPEG the API stores. */
export async function cropToJpeg(src: string, area: Area): Promise<Blob> {
	const image = new Image();
	image.src = src;
	await image.decode();

	const canvas = document.createElement('canvas');
	canvas.width = AVATAR_CROP_SIZE;
	canvas.height = AVATAR_CROP_SIZE;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas 2D context unavailable');
	// JPEG has no alpha; white is what the API puts behind a transparent PNG
	context.fillStyle = 'white';
	context.fillRect(0, 0, AVATAR_CROP_SIZE, AVATAR_CROP_SIZE);
	context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, AVATAR_CROP_SIZE, AVATAR_CROP_SIZE);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Canvas could not encode the crop as JPEG'))),
			'image/jpeg',
			AVATAR_CROP_QUALITY
		);
	});
}
