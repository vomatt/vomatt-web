export type TranslationValues = Record<string, string | number>;

/** Replaces `{name}` placeholders in a translated string. */
export function interpolate(template: string, values: TranslationValues) {
	return template.replace(/\{([\w-]+)\}/g, (match, name) =>
		name in values ? String(values[name]) : match
	);
}
