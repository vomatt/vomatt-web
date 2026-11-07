/**
 * Profile fields other people can see once their owner allows it: the API's visibility keys this app
 * shows. Location, points and membership level are left out, since no page shows them.
 */
export const VISIBILITY_FIELDS = ['displayName', 'bio', 'firstName', 'lastName'] as const;

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

/**
 * The visibility settings a person sets, in the order Edit profile and Settings › What others see show them:
 * first and last name share one, Real name. `key` names its label, `profile.<key>`.
 */
export const VISIBILITY_SETTINGS = [
	{ key: 'realName', fields: ['firstName', 'lastName'] },
	{ key: 'displayName', fields: ['displayName'] },
	{ key: 'bio', fields: ['bio'] },
] as const satisfies readonly { key: string; fields: readonly VisibilityField[] }[];

export type VisibilitySetting = (typeof VISIBILITY_SETTINGS)[number];

/** Whether visitors see a setting; the real name shows when either half does. */
export const isSettingPublic = (visibility: Record<string, boolean>, setting: VisibilitySetting) =>
	setting.fields.some((field) => isFieldPublic(visibility, field));
