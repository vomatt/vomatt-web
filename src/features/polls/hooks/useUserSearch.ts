'use client';

import { useEffect, useRef, useState } from 'react';

import { searchUsers } from '@/lib/api/services/users';
import type { UserDto } from '@/schemas/user';

import { SEARCH_DEBOUNCE_MS } from '../constants';

const MAX_SUGGESTIONS = 5;

/** Search results, tagged with the term they answer so stale ones never show. */
type Results = { term: string; users: UserDto[]; failed?: boolean };

export type UserSearch = {
	term: string;
	users: UserDto[];
	isLoading: boolean;
	failed: boolean;
	/** Matches were found, but every one is already on the list. */
	allExcluded: boolean;
};

/**
 * Debounced username search; an empty `term` searches nothing. `excludeIds` are left out of the suggestions;
 * null while that list is still loading, so nobody on it is offered in the meantime.
 */
export function useUserSearch(term: string, excludeIds: readonly string[] | null): UserSearch {
	const [results, setResults] = useState<Results>({ term: '', users: [] });
	// The last term answered successfully; a failed one is looked up again when it comes back
	const answeredTerm = useRef('');

	useEffect(() => {
		// Nothing to look up, or the term already answered (it went empty and came back)
		if (!term || term === answeredTerm.current) return;
		let ignore = false;
		const timer = setTimeout(async () => {
			try {
				const page = await searchUsers(term);
				if (ignore) return;
				answeredTerm.current = term;
				setResults({ term, users: page.items });
			} catch {
				if (!ignore) setResults({ term, users: [], failed: true });
			}
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			ignore = true;
			clearTimeout(timer);
		};
	}, [term]);

	const answered = !!term && results.term === term && excludeIds !== null;
	const users = answered ? results.users.filter((user) => !excludeIds.includes(user.id)) : [];
	return {
		term,
		users: users.slice(0, MAX_SUGGESTIONS),
		isLoading: !!term && !answered,
		failed: answered && !!results.failed,
		allExcluded: answered && results.users.length > 0 && users.length === 0,
	};
}
