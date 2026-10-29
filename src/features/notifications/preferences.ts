import type { Translate } from '@/lib/count';

import type { NotificationPreferences } from './schema';

/** The switches, in Settings' order: each row's title and body, and the kind's name in a summary. */
export const NOTIFICATION_SWITCHES = [
	{ key: 'resultsIn', title: 'settings.notifyResultsIn', body: 'settings.notifyResultsInBody', name: 'notifications.kindName.resultsIn' },
	{ key: 'invitations', title: 'settings.notifyInvitations', body: 'settings.notifyInvitationsBody', name: 'notifications.kindName.invitations' },
	{ key: 'comments', title: 'settings.notifyComments', body: 'settings.notifyCommentsBody', name: 'notifications.kindName.comments' },
	{ key: 'mentions', title: 'settings.notifyMentions', body: 'settings.notifyMentionsBody', name: 'notifications.kindName.mentions' },
	{ key: 'likes', title: 'settings.notifyLikes', body: 'settings.notifyLikesBody', name: 'notifications.kindName.likes' },
	{ key: 'closingSoon', title: 'settings.notifyClosingSoon', body: 'settings.notifyClosingSoonBody', name: 'notifications.kindName.closingSoon' },
] as const satisfies readonly { key: keyof NotificationPreferences; title: string; body: string; name: string }[];

/** "Results, invitations, comments on · closing soon off" */
export function preferencesSummary(preferences: NotificationPreferences, t: Translate) {
	const names = (on: boolean) =>
		NOTIFICATION_SWITCHES.filter((item) => preferences[item.key] === on).map((item) => t(item.name));
	const text = (
		[
			[names(true), 'notifications.summaryOn'],
			[names(false), 'notifications.summaryOff'],
		] as const
	)
		.filter(([kinds]) => kinds.length > 0)
		.map(([kinds, key]) => t(key, { kinds: kinds.join(t('notifications.summarySeparator')) }))
		.join(' · ');
	return text.charAt(0).toUpperCase() + text.slice(1);
}
