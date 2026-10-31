/**
 * The API's mention rule: `@` and a username of `[a-z0-9_]`, case-insensitive, not preceded by a
 * letter or digit of any script, or `_`.
 */
const NOT_AFTER_WORD = '(?<![\\p{L}\\p{N}_])';

/** Each complete `@handle` in a text, as the API notifies them. */
export const MENTION = new RegExp(`${NOT_AFTER_WORD}@([a-z0-9_]{3,50})(?![a-z0-9_])`, 'giu');

// A handle still being typed: it ends at the caret and may be empty
const MENTION_BEFORE_CARET = new RegExp(`${NOT_AFTER_WORD}@([a-z0-9_]{0,50})$`, 'iu');

/** The `@handle` the caret is in: where its `@` sits and what follows it up to the caret. */
export type ActiveMention = { start: number; term: string };

export function activeMention(text: string, caret: number): ActiveMention | null {
	const match = MENTION_BEFORE_CARET.exec(text.slice(0, caret));
	return match ? { start: match.index, term: match[1].toLowerCase() } : null;
}

/** Replaces the whole handle the caret is in (also what follows the caret) with `@username `. */
export function insertMention(text: string, mention: ActiveMention, username: string) {
	const rest = text.slice(mention.start + 1).match(/^[a-z0-9_]*/i)![0].length;
	const end = mention.start + 1 + rest;
	const inserted = `@${username} `;
	const after = text.slice(end).replace(/^ /, '');
	return {
		text: text.slice(0, mention.start) + inserted + after,
		caret: mention.start + inserted.length,
	};
}
