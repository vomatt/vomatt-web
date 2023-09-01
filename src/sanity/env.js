export const apiVersion =
	process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-08';

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const useCdn = process.env.NODE_ENV === 'production';
export const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET;
