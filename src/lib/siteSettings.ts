import { cache } from 'react';

import { sanityFetch } from '@/sanity/lib/live';
import { siteSharingQuery } from '@/sanity/lib/queries';

/** The settingsGeneral singleton, fetched once per request; null when Sanity fails. */
export const getSiteSettings = cache(() =>
	sanityFetch({ query: siteSharingQuery })
		.then(({ data }) => data)
		.catch((error) => {
			console.error('Failed to load site settings from Sanity', error);
			return null;
		})
);
