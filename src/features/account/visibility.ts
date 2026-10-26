/** Profile fields other people can see once their owner allows it (the API's visibility keys). */
export const VISIBILITY_FIELDS = [
	'displayName',
	'bio',
	'firstName',
	'lastName',
	'location',
	'points',
	'membershipLevel',
] as const;

export type VisibilityField = (typeof VISIBILITY_FIELDS)[number];

/** Public until the owner turns them off; the rest stay hidden until turned on (the API's defaults). */
const PUBLIC_BY_DEFAULT: readonly string[] = ['displayName', 'bio'];

/** Whether visitors see `field`, falling back to the API's default when the setting is missing. */
export const isFieldPublic = (visibility: Record<string, boolean>, field: string) =>
	visibility[field] ?? PUBLIC_BY_DEFAULT.includes(field);

/** The settings that differ from `saved`, as `PATCH /users/me/visibility` takes them; empty when none do. */
export function visibilityChanges(saved: Record<string, boolean>, next: Record<string, boolean>) {
	return Object.fromEntries(
		VISIBILITY_FIELDS.filter((field) => isFieldPublic(next, field) !== isFieldPublic(saved, field)).map((field) => [
			field,
			isFieldPublic(next, field),
		])
	);
}
