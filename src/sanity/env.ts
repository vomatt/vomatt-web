export const apiVersion =
	process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-08-08';

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export const useCdn = process.env.NODE_ENV === 'production';
export const token = process.env.SANITY_API_READ_TOKEN;

/** Only production receives vomatt-admin's invalidate-tags calls; elsewhere nothing expires the cache on publish. */
export const revalidatesOnPublish = () =>
	process.env.VERCEL_ENV === 'production' &&
	Boolean(process.env.SANITY_REVALIDATE_SECRET);
