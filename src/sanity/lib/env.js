export const apiVersion =
	process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-08';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const useCdn = process.env.NODE_ENV === 'production';
export const token = process.env.SANITY_API_READ_TOKEN;
export const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET;

// This is the document id used for the preview secret that's stored in your dataset.
// The secret protects against unauthorized access to your draft content and have a lifetime of 60 minutes, to protect against bruteforcing.

export const previewSecretId = 'preview.secret';
