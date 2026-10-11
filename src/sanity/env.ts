export const apiVersion =
	process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-08-08';

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export const useCdn = process.env.NODE_ENV === 'production';
export const token = process.env.SANITY_API_READ_TOKEN;
export const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET;

/**
 * Used to configure edit intent links, for Presentation Mode, as well as to configure where the Studio is mounted in the router.
 */

export const studioUrl =
	process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || 'http://localhost:3000';
