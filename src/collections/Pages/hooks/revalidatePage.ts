import type {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook,
} from 'payload';

import { revalidatePath, updateTag } from 'next/cache';

import type { Page } from '@/payload-types';

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
	doc,
	previousDoc,
	req: { payload, context },
}) => {
	if (!context.disableRevalidate) {
		if (doc._status === 'published') {
			const path = doc.slug === 'home' ? '/' : `/${doc.slug}`;

			payload.logger.info(`Revalidating page at path: ${path}`);

			revalidatePath(path, 'page');
			updateTag('pages-sitemap');
		}

		// If the page was previously published, we need to revalidate the old path
		if (previousDoc?._status === 'published' && doc._status !== 'published') {
			const oldPath =
				previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`;

			payload.logger.info(`Revalidating old page at path: ${oldPath}`);

			revalidatePath(oldPath, 'page');
			updateTag('pages-sitemap');
		}
	}
	return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({
	doc,
	req: { context },
}) => {
	if (!context.disableRevalidate) {
		const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`;
		revalidatePath(path, 'page');
		updateTag('pages-sitemap');
	}

	return doc;
};
