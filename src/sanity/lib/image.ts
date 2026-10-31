import {
	createImageUrlBuilder,
	type ImageFormat,
	type SanityImageSource,
} from '@sanity/image-url';

import { dataset, projectId } from '../env';

// https://www.sanity.io/docs/image-url
export const imageBuilder = createImageUrlBuilder({
	projectId: projectId || '',
	dataset: dataset || '',
});

// Open Graph share image, 1200px wide
export function buildShareImageUrl(image: SanityImageSource) {
	return imageBuilder.image(image).format('webp').width(1200).url();
}

type BuildImageSrcOptions = {
	width?: number;
	height?: number;
	format?: ImageFormat;
	quality?: number;
};

export function buildImageSrc(
	image: SanityImageSource | null | undefined,
	{ width, height, format, quality = 80 }: BuildImageSrcOptions
) {
	if (!image) {
		return undefined;
	}

	let imgSrc = imageBuilder.image(image);

	if (width) {
		imgSrc = imgSrc.width(Math.round(width));
	}

	if (height) {
		imgSrc = imgSrc.height(Math.round(height));
	}

	if (format) {
		imgSrc = imgSrc.format(format);
	}

	return imgSrc.quality(quality).fit('max').auto('format').url();
}
