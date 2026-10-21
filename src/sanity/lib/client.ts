import { createClient } from '@sanity/client';

import { apiVersion, dataset, projectId, revalidatesOnPublish } from '../env';

export const client = createClient({
	projectId,
	dataset,
	apiVersion,
	// A refetch right after publish must not get a stale CDN copy; timer-based refreshes can
	useCdn: !revalidatesOnPublish(),
	perspective: 'published',
	requestTagPrefix: 'website',
});
