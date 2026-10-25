import { Fragment, type ReactNode } from 'react';

/**
 * Fills `{name}` placeholders with elements, e.g. a bold option inside "{option} won".
 * Pass the untranslated template (`t(key)` without values keeps its placeholders).
 */
export function rich(template: string, values: Record<string, ReactNode>): ReactNode {
	return template.split(/(\{[\w-]+\})/).map((part, i) => {
		const name = part.match(/^\{([\w-]+)\}$/)?.[1];
		return <Fragment key={i}>{name && name in values ? values[name] : part}</Fragment>;
	});
}

/** "A, B and C" in the locale's own list style, each item wrapped by `wrap`. */
export function richList(items: string[], locale: string, wrap: (item: string) => ReactNode): ReactNode {
	return new Intl.ListFormat(locale).formatToParts(items).map((part, i) => (
		<Fragment key={i}>{part.type === 'element' ? wrap(part.value) : part.value}</Fragment>
	));
}
