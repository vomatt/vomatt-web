import type { Gender } from '@/types/user';

export type NameParts = {
	username: string;
	displayName?: string | null;
	firstName?: string | null;
	lastName?: string | null;
};

// Chinese, Japanese kanji and Korean names put the family name first
const FAMILY_FIRST = /[\p{Script=Han}\p{Script=Hangul}]/u;

/** First and last name as one string; a name written in Han or Hangul (both parts) reads family name first with no space (陳小明, 김민준). Null when neither is set. */
export function realName({ firstName, lastName }: Pick<NameParts, 'firstName' | 'lastName'>) {
	const first = firstName?.trim();
	const last = lastName?.trim();
	if (!first || !last) return first || last || null;
	return FAMILY_FIRST.test(first) && FAMILY_FIRST.test(last) ? `${last}${first}` : `${first} ${last}`;
}

/**
 * The name a profile leads with: the real name, then the display name after it when both are set;
 * otherwise whichever one is set, falling back to the username.
 */
export function profileName(profile: NameParts) {
	const real = realName(profile);
	const display = profile.displayName?.trim() || null;
	return {
		primary: real ?? display ?? profile.username,
		// A display name that repeats the real name isn't shown twice
		secondary: real && display && display.toLowerCase() !== real.toLowerCase() ? display : null,
	};
}

/** How the site writes a person wherever it names them: their @handle. */
export const handle = (username: string) => `@${username}`;

/** The gender as the viewer's language words it. */
export function genderLabel(t: (key: string) => string, gender: Gender) {
	return t(`profile.genders.${gender}`);
}
