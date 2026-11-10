'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { SEARCH_DEBOUNCE_MS } from '@/features/polls/constants';
import { searchUsers } from '@/lib/api/services/users';
import type { UserDto } from '@/schemas/user';

import { RolePicker } from './RolePicker';
import type { OfficialRole } from './schema';

const MAX_SUGGESTIONS = 5;

/** Search results, tagged with the term they answer so stale ones never show. */
type Results = { term: string; users: UserDto[]; failed?: boolean };

/** Picks one person by username (the search InviteePicker uses) and the role to give them. */
export function AddMemberDialog({
	open,
	onOpenChange,
	roles,
	memberIds,
	onAdd,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The roles the viewer may grant. */
	roles: readonly OfficialRole[];
	/** Already members, left out of the suggestions. */
	memberIds: string[];
	/** Resolves true once added, which closes the dialog. */
	onAdd: (user: UserDto, role: OfficialRole) => Promise<boolean>;
}) {
	const { t } = useLanguage();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<Results>({ term: '', users: [] });
	const [picked, setPicked] = useState<UserDto | null>(null);
	const [role, setRole] = useState<OfficialRole>('EDITOR');
	const [adding, setAdding] = useState(false);

	const term = query.trim().replace(/^@/, '');
	const isSearching = !!term && !picked;
	const isLoading = isSearching && results.term !== term;
	const suggestions =
		isSearching && results.term === term
			? results.users.filter((user) => !memberIds.includes(user.id)).slice(0, MAX_SUGGESTIONS)
			: [];

	useEffect(() => {
		if (!isSearching) return;
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
	}, [isSearching, term]);

	const reset = () => {
		setQuery('');
		setPicked(null);
		setRole('EDITOR');
	};

	const add = async () => {
		if (!picked) return;
		setAdding(true);
		const added = await onAdd(picked, role);
		setAdding(false);
		if (added) {
			onOpenChange(false);
			reset();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" closeLabel={t('common.close')}>
				<DialogHeader>
					<DialogTitle>{t('officials.addTitle')}</DialogTitle>
				</DialogHeader>
				<DialogBody className="space-y-5">
					{picked ? (
						<div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
							<UserAvatar username={picked.username} avatarUrl={picked.avatarUrl} className="size-9" />
							<span className="min-w-0 flex-1 truncate text-body-4">@{picked.username}</span>
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label={t('invitees.remove', { name: picked.username })}
								onClick={() => setPicked(null)}
							>
								<X aria-hidden />
							</Button>
						</div>
					) : (
						<div className="space-y-1">
							<Input
								type="text"
								autoComplete="off"
								autoCapitalize="none"
								spellCheck={false}
								aria-label={t('officials.searchLabel')}
								placeholder={t('officials.searchPlaceholder')}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
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
												onClick={() => setPicked(user)}
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
									{t(results.failed ? 'invitees.searchFailed' : 'invitees.noUsers')}
								</p>
							)}
						</div>
					)}
					<RolePicker roles={roles} value={role} onChange={setRole} />
				</DialogBody>
				<DialogFooter>
					<Button size="md" variant="outline" onClick={() => onOpenChange(false)}>
						{t('common.cancel')}
					</Button>
					<Button size="md" disabled={!picked} loading={adding} onClick={add}>
						{t('officials.add')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
