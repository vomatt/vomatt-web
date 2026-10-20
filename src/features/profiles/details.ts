import type { useLanguage } from '@/contexts/LanguageContext';
import { formatMonthYear } from '@/features/polls/format';
import { countText } from '@/lib/count';
import type { LanguageCode } from '@/types';
import type { UserProfile } from '@/types/user';

type Translate = ReturnType<typeof useLanguage>['t'];

/** The location, points, membership and joined details, each part with its field; fields the owner hid come back null and drop out. */
export function profileDetails(
	profile: Pick<UserProfile, 'location' | 'points' | 'membershipLevel' | 'joinedAt'>,
	t: Translate,
	language: LanguageCode
) {
	const parts = [
		{ field: 'location', text: profile.location },
		{
			field: 'points',
			text: profile.points != null ? countText(t, 'profile.points', profile.points, language) : null,
		},
		{
			field: 'membershipLevel',
			text: profile.membershipLevel ? t('profile.membership', { level: profile.membershipLevel }) : null,
		},
		{ field: 'joinedAt', text: t('profile.joined', { date: formatMonthYear(profile.joinedAt, language) }) },
	];
	return parts.filter((part): part is { field: string; text: string } => !!part.text);
}
