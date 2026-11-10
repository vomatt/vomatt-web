'use client';

import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { OfficialBadge } from '@/features/profiles/OfficialBadge';
import type { UserDto } from '@/schemas/user';

import type { UserSearch } from '../hooks/useUserSearch';

/**
 * A `useUserSearch`'s answer: a spinner, the people to pick, or why there are none.
 * Official accounts are shown with their badge but can't be picked; `officialNote` says why.
 */
export function UserSuggestions({
	search,
	onPick,
	officialNote,
}: {
	search: UserSearch;
	onPick: (user: UserDto) => void;
	officialNote: string;
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
				{t(search.failed ? 'invitees.searchFailed' : 'invitees.noUsers')}
			</p>
		);
	return (
		<ul aria-label={t('invitees.suggestions')}>
			{search.users.map((user) => (
				<li key={user.id}>
					<button
						type="button"
						disabled={user.official}
						aria-describedby={user.official ? `${user.id}-official` : undefined}
						onClick={() => onPick(user)}
						className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-body-4 enabled:hover:bg-muted disabled:text-muted-foreground"
					>
						<UserAvatar username={user.username} avatarUrl={user.avatarUrl} />
						<span className="flex min-w-0 flex-col">
							<span className="flex min-w-0 items-center gap-1">
								<span className="truncate">{user.username}</span>
								{user.official && <OfficialBadge />}
								{user.displayName && (
									<span className="ml-2 truncate text-caption-2 text-muted-foreground">{user.displayName}</span>
								)}
							</span>
							{user.official && (
								<span id={`${user.id}-official`} className="text-caption-2 text-muted-foreground">
									{officialNote}
								</span>
							)}
						</span>
					</button>
				</li>
			))}
		</ul>
	);
}
