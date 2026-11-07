import {
	createImageUrlBuilder,
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
