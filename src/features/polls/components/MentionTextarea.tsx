'use client';

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { getFollowing } from '@/features/follows/service';
import { searchUsers } from '@/lib/api/services/users';
import { cn } from '@/lib/utils';
import type { UserDto } from '@/schemas/user';

import { SEARCH_DEBOUNCE_MS } from '../constants';

const MAX_SUGGESTIONS = 6;

/** The `@handle` the caret is in: where its `@` sits and what follows it up to the caret. */
type ActiveMention = { start: number; term: string };

/** Suggestions, tagged with the term they answer so stale ones never show. */
type Results = { term: string; users: UserDto[] };

// The API's mention rule: `@` not preceded by a letter or digit of any script, or `_`
const MENTION_BEFORE_CARET = /(?<![\p{L}\p{N}_])@([a-z0-9_]{0,50})$/iu;

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

const LIST_MAX_HEIGHT = 320;
const LIST_GAP = 4;
const VIEWPORT_MARGIN = 8;

/** Below the field, or above it when there is more room there; never taller than the room it has. */
function listPlacement(anchor: DOMRect) {
	const below = window.innerHeight - anchor.bottom - LIST_GAP - VIEWPORT_MARGIN;
	const above = anchor.top - LIST_GAP - VIEWPORT_MARGIN;
	return below >= LIST_MAX_HEIGHT || below >= above
		? { top: anchor.bottom + LIST_GAP, maxHeight: Math.min(LIST_MAX_HEIGHT, below) }
		: { bottom: window.innerHeight - anchor.top + LIST_GAP, maxHeight: Math.min(LIST_MAX_HEIGHT, above) };
}

type MentionTextareaProps = Omit<React.ComponentProps<'textarea'>, 'value' | 'onChange'> & {
	value: string;
	onValueChange: (value: string) => void;
	/** The signed-in viewer; a bare `@` suggests the people they follow. Guests get no suggestions. */
	viewerUsername?: string;
};

/** A Textarea that suggests people to mention while an `@handle` is being typed. */
export function MentionTextarea({
	value,
	onValueChange,
	viewerUsername,
	onKeyDown,
	onBlur,
	ref,
	...props
}: MentionTextareaProps) {
	const { t } = useLanguage();
	const listId = useId();
	const fieldRef = useRef<HTMLTextAreaElement>(null);
	useImperativeHandle(ref, () => fieldRef.current!);
	const [caret, setCaret] = useState<number | null>(null);
	const [results, setResults] = useState<Results | null>(null);
	const [highlighted, setHighlighted] = useState(0);
	// Escape closes the list for the handle at this position until a new one is started
	const [dismissedAt, setDismissedAt] = useState<number | null>(null);

	const mention = viewerUsername && caret !== null ? activeMention(value, caret) : null;
	const isOpen = !!mention && mention.start !== dismissedAt;
	const term = isOpen ? mention.term : null;
	const users = results && results.term === term ? results.users.slice(0, MAX_SUGGESTIONS) : [];
	const showList = isOpen && users.length > 0;
	const active = Math.min(highlighted, users.length - 1);
	// Where the field sits on screen; the list is fixed there so a clipping ancestor (Unfold) can't cut it off
	const [anchor, setAnchor] = useState<DOMRect | null>(null);

	useLayoutEffect(() => {
		if (!showList) return;
		const measure = () => setAnchor(fieldRef.current?.getBoundingClientRect() ?? null);
		measure();
		window.addEventListener('scroll', measure, true);
		window.addEventListener('resize', measure);
		return () => {
			window.removeEventListener('scroll', measure, true);
			window.removeEventListener('resize', measure);
		};
	}, [showList]);

	useEffect(() => {
		if (term === null || !viewerUsername) return;
		let ignore = false;
		const timer = setTimeout(
			async () => {
				let found: UserDto[] = [];
				try {
					if (term) found = (await searchUsers(term, undefined, MAX_SUGGESTIONS + 1)).items;
					else {
						const page = await getFollowing(viewerUsername);
						if (page.ok) found = page.data.items;
					}
				} catch {
					// A failed lookup just shows no suggestions; the text is still a valid mention
				}
				if (!ignore) {
					setResults({
						term,
						users: found.filter((user) => user.username !== viewerUsername),
					});
					setHighlighted(0);
				}
			},
			term ? SEARCH_DEBOUNCE_MS : 0
		);
		return () => {
			ignore = true;
			clearTimeout(timer);
		};
	}, [term, viewerUsername]);

	const choose = (user: UserDto) => {
		if (!mention) return;
		const next = insertMention(value, mention, user.username);
		onValueChange(next.text);
		setCaret(next.caret);
		requestAnimationFrame(() => fieldRef.current?.setSelectionRange(next.caret, next.caret));
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Keys that commit IME text (Zhuyin etc.) aren't choices
		if (showList && !event.nativeEvent.isComposing && event.keyCode !== 229) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				const step = event.key === 'ArrowDown' ? 1 : -1;
				setHighlighted((active + step + users.length) % users.length);
				return;
			}
			if ((event.key === 'Enter' && !event.metaKey && !event.ctrlKey) || event.key === 'Tab') {
				event.preventDefault();
				choose(users[active]);
				return;
			}
			if (event.key === 'Escape') {
				event.preventDefault();
				setDismissedAt(mention!.start);
				return;
			}
		}
		onKeyDown?.(event);
	};

	const trackCaret = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
		const field = event.currentTarget;
		setCaret(field.selectionStart === field.selectionEnd ? field.selectionStart : null);
	};

	return (
		<>
			<Textarea
				{...props}
				ref={fieldRef}
				value={value}
				onChange={(event) => {
					onValueChange(event.target.value);
					trackCaret(event);
				}}
				onSelect={trackCaret}
				onKeyDown={handleKeyDown}
				onBlur={(event) => {
					setCaret(null);
					onBlur?.(event);
				}}
				{...(viewerUsername && {
					role: 'combobox',
					'aria-autocomplete': 'list',
					'aria-expanded': showList,
					'aria-controls': showList ? listId : undefined,
					'aria-activedescendant': showList ? `${listId}-${active}` : undefined,
				})}
			/>
			{showList && anchor && (
				<ul
					id={listId}
					role="listbox"
					aria-label={t('comments.mentionSuggestions')}
					style={{
						left: anchor.left,
						width: Math.min(anchor.width, 384),
						...listPlacement(anchor),
					}}
					className="fixed z-50 overflow-y-auto rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10"
				>
					{users.map((user, index) => (
						<li
							key={user.id}
							id={`${listId}-${index}`}
							role="option"
							aria-selected={index === active}
							// Keeps focus (and the caret) in the field
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => choose(user)}
							onMouseMove={() => setHighlighted(index)}
							className={cn(
								'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
								index === active && 'bg-muted'
							)}
						>
							<UserAvatar username={user.username} avatarUrl={user.avatarUrl} className="size-8 shrink-0" />
							<span className="flex min-w-0 flex-col">
								<span className="truncate text-body-4 font-medium">{user.username}</span>
								{user.displayName && (
									<span className="truncate text-caption-2 text-muted-foreground">{user.displayName}</span>
								)}
							</span>
						</li>
					))}
				</ul>
			)}
		</>
	);
}
