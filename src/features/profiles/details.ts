import type { useLanguage } from '@/contexts/LanguageContext';
import { formatMonthYear } from '@/features/polls/format';
import { toPayloadLocale } from '@/lib/locale';
import type { LanguageCode } from '@/types';
import type { UserProfile } from '@/types/user';

type Translate = ReturnType<typeof useLanguage>['t'];

/** The "location · points · membership · joined" line; fields the owner hid come back null and drop out. */
export function profileDetails(
	profile: Pick<UserProfile, 'location' | 'points' | 'membershipLevel' | 'joinedAt'>,
	t: Translate,
	language: LanguageCode
) {
	return [
		profile.location,
		profile.points != null
			? t('profile.points', { count: profile.points.toLocaleString(toPayloadLocale(language)) })
			: null,
		profile.membershipLevel ? t('profile.membership', { level: profile.membershipLevel }) : null,
		t('profile.joined', { date: formatMonthYear(profile.joinedAt, language) }),
	].filter(Boolean);
}
