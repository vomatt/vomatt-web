/** Profile fields other people can see, in the order Settings lists them. */
export const VISIBILITY_FIELDS = ['displayName', 'bio', 'location', 'points', 'membershipLevel', 'birthday'] as const;

/** Public until the owner turns them off; the rest stay hidden until turned on (the API's defaults). */
const PUBLIC_BY_DEFAULT: readonly string[] = ['displayName', 'bio'];

/** Whether visitors see `field`, falling back to the API's default when the setting is missing. */
export const isFieldPublic = (visibility: Record<string, boolean>, field: string) =>
	visibility[field] ?? PUBLIC_BY_DEFAULT.includes(field);
