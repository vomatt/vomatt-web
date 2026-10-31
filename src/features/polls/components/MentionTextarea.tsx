'use client';

import { Popover } from '@base-ui/react/popover';
import { useCallback, useId, useImperativeHandle, useRef, useState } from 'react';

import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { getFollowing } from '@/features/follows/service';
import { useDebouncedLookup } from '@/hooks/useDebouncedLookup';
import { searchUsers } from '@/lib/api/services/users';
import { cn } from '@/lib/utils';
import type { UserDto } from '@/schemas/user';

import { SEARCH_DEBOUNCE_MS } from '../constants';
import { activeMention, insertMention } from '../mention';

const MAX_SUGGESTIONS = 6;

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
	// The highlighted row, for the term it was moved on
	const [highlighted, setHighlighted] = useState({ term: '', index: 0 });
	// Escape closes the list for the handle starting here, until that handle is gone
	const [dismissedAt, setDismissedAt] = useState<number | null>(null);

	const mention = viewerUsername && caret !== null ? activeMention(value, caret) : null;
	if (dismissedAt !== null && mention?.start !== dismissedAt) setDismissedAt(null);
	const term = mention && mention.start !== dismissedAt ? mention.term : null;

	const load = useCallback(
		async (term: string) => {
			let users: UserDto[];
			if (term) users = (await searchUsers(term, undefined, MAX_SUGGESTIONS + 1)).items;
			else {
				const page = await getFollowing(viewerUsername!);
				if (!page.ok) throw new Error(page.message);
				users = page.data.items;
			}
			return users.filter((user) => user.username !== viewerUsername);
		},
		[viewerUsername]
	);
	const lookup = useDebouncedLookup(term, load, term ? SEARCH_DEBOUNCE_MS : 0);
	const current = term !== null && lookup?.term === term ? lookup : null;
	const users = current?.items.slice(0, MAX_SUGGESTIONS) ?? [];
	const showList = users.length > 0;
	const isOpen = showList || !!current?.failed;
	// Each time the list opens, it starts on the first row
	if (!isOpen && highlighted.index !== 0) setHighlighted({ term: '', index: 0 });
	const active = highlighted.term === term ? Math.min(highlighted.index, users.length - 1) : 0;

	const choose = (user: UserDto) => {
		if (!mention) return;
		const next = insertMention(value, mention, user.username);
		onValueChange(next.text);
		setCaret(next.caret);
		requestAnimationFrame(() => fieldRef.current?.setSelectionRange(next.caret, next.caret));
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Keys that commit IME text (Zhuyin etc.) aren't choices
		if (isOpen && !event.nativeEvent.isComposing && event.keyCode !== 229) {
			if (showList && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
				event.preventDefault();
				const step = event.key === 'ArrowDown' ? 1 : -1;
				setHighlighted({ term: term!, index: (active + step + users.length) % users.length });
				return;
			}
			if (showList && ((event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) || event.key === 'Tab')) {
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
					'aria-expanded': isOpen,
					'aria-controls': isOpen ? listId : undefined,
					'aria-activedescendant': showList ? `${listId}-${active}` : undefined,
				})}
			/>
			{/* Open exactly while the field says so; the field already handles Escape and leaving it */}
			<Popover.Root open={isOpen} onOpenChange={() => {}}>
				<Popover.Portal>
					{/* Portalled and anchored to the field, so a clipping ancestor (Unfold) can't cut it off */}
					<Popover.Positioner anchor={fieldRef} side="bottom" align="start" sideOffset={4} className="z-50">
						<Popover.Popup
							initialFocus={false}
							finalFocus={false}
							className="max-h-[min(20rem,var(--available-height))] w-(--anchor-width) max-w-96 overflow-y-auto rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none"
						>
							{current?.failed ? (
								<p id={listId} role="status" className="px-3 py-2 text-caption-2 text-muted-foreground">
									{t('comments.mentionSearchFailed')}
								</p>
							) : (
								<ul id={listId} role="listbox" aria-label={t('comments.mentionSuggestions')}>
									{users.map((user, index) => (
										<li
											key={user.id}
											id={`${listId}-${index}`}
											role="option"
											aria-selected={index === active}
											// Keeps focus (and the caret) in the field
											onMouseDown={(event) => event.preventDefault()}
											onClick={() => choose(user)}
											onMouseMove={() => setHighlighted({ term: term!, index })}
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
						</Popover.Popup>
					</Popover.Positioner>
				</Popover.Portal>
			</Popover.Root>
		</>
	);
}
