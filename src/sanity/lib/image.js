import createImageUrlBuilder from '@sanity/image-url';
import { dataset, projectId } from '../env';

// https://www.sanity.io/docs/image-url
export const imageBuilder = createImageUrlBuilder({ projectId, dataset });

export const urlForImage = (source) => {
	return imageBuilder.image(source);
};
