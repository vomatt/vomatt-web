import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId, studioUrl } from '../env';

export const client = createClient({
	projectId,
	dataset,
	apiVersion,
	useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
	perspective: 'published',
	stega: {
		studioUrl,
	},
	requestTagPrefix: 'website',
});
