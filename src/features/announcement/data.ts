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

// The Studio can keep an empty paragraph after the text is cleared
const hasText = (blocks: PortableTextBlock[] | null): blocks is PortableTextBlock[] =>
	!!blocks?.some((block) => block.children?.some((child) => typeof child.text === 'string' && child.text.trim()));

function toAnnouncement(doc: AnnouncementDoc): Announcement | null {
	if (!doc || !hasText(doc.message)) return null;
	return { id: doc.id, message: doc.message, messageZh: hasText(doc.messageZh) ? doc.messageZh : null };
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
