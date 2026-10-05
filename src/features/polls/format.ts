import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';

import type { LanguageCode } from '@/types';

/** Replaces `{name}` placeholders in a translated string. */
export function fill(template: string, values: Record<string, string | number>) {
	return template.replace(/\{([\w-]+)\}/g, (match, key) =>
		key in values ? String(values[key]) : match
	);
}

/** "Oct 7, 22:00" in the reader's language and time zone. */
export function formatPollDate(iso: string, language: LanguageCode) {
	return new Intl.DateTimeFormat(language === 'zh' ? 'zh-TW' : 'en', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).format(new Date(iso));
}

/** "in 5 hours" / "5 小時內" */
export function formatFromNow(iso: string, language: LanguageCode) {
	return formatDistanceToNowStrict(new Date(iso), {
		addSuffix: true,
		locale: language === 'zh' ? zhTW : enUS,
	});
}
