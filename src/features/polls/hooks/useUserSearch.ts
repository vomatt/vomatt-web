'use client';

import { useEffect, useState } from 'react';

import { searchUsers } from '@/lib/api/services/users';
import type { UserDto } from '@/schemas/user';

import { SEARCH_DEBOUNCE_MS } from '../constants';

const MAX_SUGGESTIONS = 5;

/** Search results, tagged with the term they answer so stale ones never show. */
type Results = { term: string; users: UserDto[]; failed?: boolean };

export type UserSearch = { term: string; users: UserDto[]; isLoading: boolean; failed: boolean };

/** Debounced username search; an empty `term` searches nothing. `excludeIds` are left out of the suggestions. */
export function useUserSearch(term: string, excludeIds: readonly string[]): UserSearch {
	const [results, setResults] = useState<Results>({ term: '', users: [] });

	useEffect(() => {
		// Nothing to look up, or the term just answered (it went empty and came back)
		if (!term || term === results.term) return;
		let ignore = false;
		const timer = setTimeout(async () => {
			try {
				const page = await searchUsers(term);
				if (!ignore) setResults({ term, users: page.items });
			} catch {
				if (!ignore) setResults({ term, users: [], failed: true });
			}
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			ignore = true;
			clearTimeout(timer);
		};
	}, [term, results.term]);

	const answered = !!term && results.term === term;
	return {
		term,
		users: answered ? results.users.filter((user) => !excludeIds.includes(user.id)).slice(0, MAX_SUGGESTIONS) : [],
		isLoading: !!term && !answered,
		failed: answered && !!results.failed,
	};
}
