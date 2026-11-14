import type { PortableTextBlock } from '@portabletext/react';
import { cache } from 'react';

import { sanityFetch } from '@/sanity/lib/live';
import { announcementQuery } from '@/sanity/lib/queries';

import type { Announcement } from './schema';

type AnnouncementDoc = {
	id: string;
	message: PortableTextBlock[] | null;
	messageZh: PortableTextBlock[] | null;
} | null;

function toAnnouncement(doc: AnnouncementDoc): Announcement | null {
	if (!doc?.message?.length) return null;
	return { id: doc.id, message: doc.message, messageZh: doc.messageZh?.length ? doc.messageZh : null };
}

/** The announcement to show, fetched once per request; null when it is off, empty, or Sanity fails. */
export const getAnnouncement = cache(() =>
	sanityFetch({ query: announcementQuery })
		.then(({ data }) => toAnnouncement(data))
		.catch((error) => {
			console.error('Failed to load the announcement from Sanity', error);
			return null;
		})
);
