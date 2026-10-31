'use client';

import { useEffect, useState } from 'react';

import { emailSchema } from '@/components/auth/auth-schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import type { Group } from '@/features/groups/schema';
import { getGroups } from '@/features/groups/service';
import { useDebouncedLookup } from '@/hooks/useDebouncedLookup';
import { searchUsers } from '@/lib/api/services/users';
import type { UserDto } from '@/schemas/user';

import { SEARCH_DEBOUNCE_MS } from '../constants';
import type { InviteeSelection, PickedUser } from '../invitees';

const MAX_SUGGESTIONS = 5;

const findUsers = async (term: string): Promise<UserDto[]> => (await searchUsers(term)).items;

type InviteePickerProps = {
	value: InviteeSelection;
	onChange: (value: InviteeSelection) => void;
	/** Offer the signed-in user's Groups as one-tap additions. */
	withGroups?: boolean;
	/** For the field's label. */
	id?: string;
	invalid?: boolean;
	/** The id of the field's error text. */
	describedBy?: string;
};

/**
 * Picks people by username (search) or email, and optionally whole Groups.
 * Emails are kept the way the API compares them: trimmed and lower-cased.
 */
export function InviteePicker({
	value,
	onChange,
	withGroups = false,
	id,
	invalid,
	describedBy,
}: InviteePickerProps) {
	const { t } = useLanguage();
	const [query, setQuery] = useState('');
	const [groups, setGroups] = useState<Group[]>([]);

	const term = query.trim();
	const email = term.toLowerCase();
	// The sign-in rule, so an address is accepted here exactly when it can sign up
	const isEmail = emailSchema.shape.email.safeParse(email).success;
	const looksLikeEmail = term.includes('@');
	const isSearching = !!term && !looksLikeEmail;
	const results = useDebouncedLookup(isSearching ? term : null, findUsers, SEARCH_DEBOUNCE_MS);
	const isLoading = isSearching && results?.term !== term;
	const suggestions =
		isSearching && results?.term === term
			? results.items
					.filter((user) => !value.users.some((picked) => picked.id === user.id))
					.slice(0, MAX_SUGGESTIONS)
			: [];

	useEffect(() => {
		if (!withGroups) return;
		let ignore = false;
		getGroups().then((result) => {
			if (!ignore && result.ok) setGroups(result.data);
		});
		return () => {
			ignore = true;
		};
	}, [withGroups]);

	const addUser = (user: PickedUser) => {
		const picked = { id: user.id, username: user.username, avatarUrl: user.avatarUrl };
		onChange({ ...value, users: [...value.users, picked] });
		setQuery('');
	};

	const addEmail = () => {
		if (!value.emails.includes(email)) onChange({ ...value, emails: [...value.emails, email] });
		setQuery('');
	};

	const toggleGroup = (group: Group) => {
		const picked = value.groups.some((g) => g.id === group.id);
		onChange({
			...value,
			groups: picked
				? value.groups.filter((g) => g.id !== group.id)
				: [...value.groups, { id: group.id, name: group.name, memberCount: group.memberCount }],
		});
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter') return;
		// Enter that commits IME text (Zhuyin etc.) isn't a choice
		if (e.nativeEvent.isComposing || e.keyCode === 229) return;
		// Never submits the surrounding form
		e.preventDefault();
		if (isEmail) addEmail();
		else if (suggestions[0]) addUser(suggestions[0]);
	};

	const chips: { key: string; label: string; user?: PickedUser; remove: () => void }[] = [
		...value.users.map((user) => ({
			key: `user:${user.id}`,
			label: user.username,
			user,
			remove: () => onChange({ ...value, users: value.users.filter((u) => u.id !== user.id) }),
		})),
		...value.emails.map((address) => ({
			key: `email:${address}`,
			label: address,
			remove: () => onChange({ ...value, emails: value.emails.filter((e) => e !== address) }),
		})),
		// A picked Group without a pill (deleted since a draft was saved, or Groups didn't load)
		...value.groups
			.filter((picked) => !groups.some((group) => group.id === picked.id))
			.map((group) => ({
				key: `group:${group.id}`,
				label: group.name,
				remove: () => onChange({ ...value, groups: value.groups.filter((g) => g.id !== group.id) }),
			})),
	];

	return (
		<div className="space-y-3">
			{withGroups && groups.length > 0 && (
				<div className="space-y-2">
					<p className="text-caption-2 text-muted-foreground">{t('invitees.groups')}</p>
					<div className="flex flex-wrap gap-2">
						{groups.map((group) => {
							const picked = value.groups.some((g) => g.id === group.id);
							return (
								<Button
									key={group.id}
									type="button"
									size="sm"
									variant={picked ? 'default' : 'outline'}
									aria-pressed={picked}
									className="rounded-full"
									onClick={() => toggleGroup(group)}
									// The count is set apart visually; the label says what it counts
									aria-label={t('invitees.groupPill', { name: group.name, count: group.memberCount })}
								>
									{group.name}
									<span className="ml-1 tabular-nums">{group.memberCount}</span>
								</Button>
							);
						})}
					</div>
				</div>
			)}

			<div className="space-y-1">
				<Input
					id={id}
					type="text"
					inputMode="email"
					autoComplete="off"
					autoCapitalize="none"
					spellCheck={false}
					placeholder={t('invitees.placeholder')}
					value={query}
					aria-invalid={invalid}
					aria-describedby={describedBy}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				{isEmail && (
					<button
						type="button"
						onClick={addEmail}
						className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-body-4 hover:bg-muted"
					>
						{t('invitees.inviteEmail', { email })}
					</button>
				)}
				{isLoading && (
					<div className="flex justify-center py-2">
						<Spinner />
					</div>
				)}
				{suggestions.length > 0 && (
					<ul aria-label={t('invitees.suggestions')}>
						{suggestions.map((user) => (
							<li key={user.id}>
								<button
									type="button"
									onClick={() => addUser(user)}
									className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-body-4 hover:bg-muted"
								>
									<UserAvatar username={user.username} avatarUrl={user.avatarUrl} />
									<span className="truncate">{user.username}</span>
									{user.displayName && (
										<span className="truncate text-caption-2 text-muted-foreground">{user.displayName}</span>
									)}
								</button>
							</li>
						))}
					</ul>
				)}
				{isSearching && !isLoading && suggestions.length === 0 && (
					<p className="px-3 py-2 text-caption-2 text-muted-foreground">
						{t(results?.failed ? 'invitees.searchFailed' : 'invitees.noUsers')}
					</p>
				)}
			</div>

			{chips.length > 0 && (
				<ul aria-label={t('invitees.picked')} className="flex flex-wrap gap-1.5">
					{chips.map((chip) => (
						<li
							key={chip.key}
							className="inline-flex min-h-8 items-center gap-1 rounded-full bg-secondary pl-3 text-caption-2"
						>
							{chip.user && (
								<UserAvatar username={chip.user.username} avatarUrl={chip.user.avatarUrl} className="-ml-2 size-6" />
							)}
							<span className="max-w-56 truncate">{chip.label}</span>
							<button
								type="button"
								aria-label={t('invitees.remove', { name: chip.label })}
								onClick={chip.remove}
								className="-my-1.5 grid size-11 place-items-center rounded-full text-muted-foreground hover:text-foreground"
							>
								<X className="size-3.5" />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
