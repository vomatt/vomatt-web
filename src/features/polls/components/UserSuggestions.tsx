'use client';

import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { handle } from '@/features/profiles/name';
import type { UserDto } from '@/schemas/user';

import type { UserSearch } from '../hooks/useUserSearch';

/**
 * A `useUserSearch`'s answer: a spinner, the people to pick, or why there are none.
 * Community accounts are listed but can't be picked; `communityNote` says why.
 */
export function UserSuggestions({
	search,
	onPick,
	communityNote,
}: {
	search: UserSearch;
	onPick: (user: UserDto) => void;
	communityNote: string;
}) {
	const { t } = useLanguage();
	if (!search.term) return null;
	if (search.isLoading)
		return (
			<div className="flex justify-center py-2">
				<Spinner />
			</div>
		);
	if (search.users.length === 0)
		return (
			<p className="px-3 py-2 text-caption-2 text-muted-foreground">
				{t(search.failed ? 'invitees.searchFailed' : search.allExcluded ? 'invitees.alreadyAdded' : 'invitees.noUsers')}
			</p>
		);
	return (
		<ul aria-label={t('invitees.suggestions')}>
			{search.users.map((user) => (
				<li key={user.id}>
					<button
						type="button"
						disabled={user.community}
						aria-describedby={user.community ? `${user.id}-community` : undefined}
						onClick={() => onPick(user)}
						className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-body-4 enabled:hover:bg-muted disabled:text-muted-foreground"
					>
						<UserAvatar username={user.username} avatarUrl={user.avatarUrl} />
						<span className="flex min-w-0 flex-col">
							<span className="truncate">{handle(user.username)}</span>
							{user.community && (
								<span id={`${user.id}-community`} className="text-caption-2 text-muted-foreground">
									{communityNote}
								</span>
							)}
						</span>
					</button>
				</li>
			))}
		</ul>
	);
}
