import type { PortableTextBlock } from '@portabletext/react';

/** The published gAnnouncement while it is on. `id` is its revision, so each publish shows the bar again to people who dismissed the last one. */
export type Announcement = {
	id: string;
	message: PortableTextBlock[];
	messageZh: PortableTextBlock[] | null;
};

/** Holds the `id` of the announcement the visitor dismissed. */
export const ANNOUNCEMENT_DISMISSED_COOKIE = 'announcement-dismissed';
