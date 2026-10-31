'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserChip } from '@/features/profiles/UserChip';
import { collectPages, mergeById } from '@/lib/api/cursor';

import type { Voter } from '../schema';
import { getVoters } from '../service';

/** 50 per page, so up to 1,000 voters; a cap so a runaway cursor can't loop forever. */
export const MAX_VOTER_PAGES = 20;

type VoterRow = Voter & { id: string };

type VotersState = {
	status: 'idle' | 'loading' | 'ready' | 'hidden' | 'failed';
	/** Keyed by user (one Ballot each), so pages merge by id. */
	voters: VoterRow[];
	/** The next unread page; null once every voter is in. */
	nextCursor: string | null;
	pages: number;
};

const INITIAL: VotersState = { status: 'idle', voters: [], nextCursor: null, pages: 0 };

function fetchVoterPage(pollId: string) {
	return async (cursor: string | null) => {
		const result = await getVoters(pollId, cursor);
		if (!result.ok) throw result;
		return {
			items: result.data.items.map((voter) => ({ ...voter, id: voter.userId })),
			nextCursor: result.data.nextCursor,
		};
	};
}

/** True when the cap stopped paging before the last page. */
function isCapped(state: VotersState) {
	return state.nextCursor !== null && state.pages >= MAX_VOTER_PAGES;
}

/**
 * Voters of an Ended Poll. The API can't filter by option, so `load(option)`
 * reads pages only until that option's voters are in, and later calls resume
 * from there. Starts over when `viewerKey` (the session) changes.
 */
export function useVoters(pollId: string, viewerKey: string) {
	const [state, setState] = useState<VotersState>(INITIAL);
	// The source of truth across awaits; `state` mirrors it for rendering
	const data = useRef<VotersState>(INITIAL);
	// Bumped on unmount and session change, so a running load stops
	const generation = useRef(0);

	const commit = (next: VotersState) => {
		data.current = next;
		setState(next);
	};

	useEffect(
		() => () => {
			generation.current++;
			data.current = INITIAL;
			setState(INITIAL);
		},
		[pollId, viewerKey]
	);

	const load = useCallback(
		async (option: { id: string; votes: number }) => {
			const current = data.current;
			// With choices withheld (null optionId) the dialog lists everyone, so read to the last page
			const hasOption = (voters: VoterRow[]) =>
				!voters.some((voter) => voter.optionId === null) &&
				voters.filter((voter) => voter.optionId === option.id).length >= option.votes;
			if (current.status === 'loading' || current.status === 'hidden') return;
			if (current.status === 'ready') {
				if (current.nextCursor === null || isCapped(current) || hasOption(current.voters)) return;
			}

			const started = generation.current;
			const isStale = () => generation.current !== started;
			commit({ ...current, status: 'loading' });
			try {
				const page = await collectPages(fetchVoterPage(pollId), {
					cursor: current.nextCursor,
					maxPages: MAX_VOTER_PAGES - current.pages,
					until: (items) => isStale() || hasOption(mergeById(current.voters, items)),
				});
				if (isStale()) return;
				commit({
					status: 'ready',
					voters: mergeById(current.voters, page.items),
					nextCursor: page.nextCursor,
					pages: current.pages + page.pages,
				});
			} catch (failure) {
				if (isStale()) return;
				const hidden = (failure as { errorCode?: string }).errorCode === 'vote.voters.hidden';
				// 'failed' retries on the next open; 'hidden' is final
				commit({ ...current, status: hidden ? 'hidden' : 'failed' });
			}
		},
		[pollId]
	);

	return { ...state, load };
}

type VotersDialogProps = {
	option: { id: string; text: string; votes: number } | null;
	voters: ReturnType<typeof useVoters>;
	onClose: () => void;
};

/**
 * Who chose one option of an Ended Poll. Only opened when the Poll's Voter
 * Visibility lets this viewer see it; the API still has the final say.
 */
export function VotersDialog({ option, voters, onClose }: VotersDialogProps) {
	const { t } = useLanguage();
	// Keep the last option while the dialog animates closed
	const [shown, setShown] = useState(option);
	if (option && option !== shown) setShown(option);

	// With an Anonymous Ballot in the Poll the API withholds every choice: list who took part instead
	const choicesHidden = voters.voters.some((voter) => voter.optionId === null);
	const chose = choicesHidden ? voters.voters : voters.voters.filter((voter) => voter.optionId === shown?.id);
	const isLoading = voters.status === 'loading' || voters.status === 'idle';
	const failed = voters.status === 'hidden' || voters.status === 'failed';
	const truncated = voters.status === 'ready' && isCapped(voters) && (choicesHidden || chose.length < (shown?.votes ?? 0));
	const empty = voters.status === 'ready' && chose.length === 0 && !truncated;

	return (
		<Dialog open={!!option} onOpenChange={(open) => !open && onClose()}>
			<DialogContent closeLabel={t('common.close')} className="max-h-[80dvh] grid-rows-[auto_minmax(0,1fr)]">
				<DialogHeader className="pr-8">
					<DialogTitle className="leading-snug">{shown?.text}</DialogTitle>
					<DialogDescription>
						{t('poll.voted', { count: shown?.votes ?? 0 })}
					</DialogDescription>
				</DialogHeader>
				<div className="-mx-4 overflow-y-auto px-4">
					{choicesHidden && (
						<p className="pb-2 text-caption-2 text-muted-foreground">{t('poll.votersChoicesHidden')}</p>
					)}
					{chose.length > 0 && (
						<ul aria-label={t('poll.voters')} className="space-y-1">
							{chose.map((voter) => (
								<li key={voter.userId}>
									<UserChip
										username={voter.username}
										avatarUrl={voter.avatarUrl}
										className="-mx-2 flex min-h-11 gap-3 rounded-lg px-2 text-body-4 hover:bg-muted"
									/>
								</li>
							))}
						</ul>
					)}
					{isLoading && (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					)}
					{truncated && (
						<p className="py-2 text-caption-2 text-muted-foreground">
							{t('poll.votersTruncated', { count: voters.voters.length })}
						</p>
					)}
					{empty && <p className="py-2 text-caption-2 text-muted-foreground">{t('poll.votersNone')}</p>}
					{failed && (
						<p className="py-2 text-caption-2 text-muted-foreground">
							{t(voters.status === 'hidden' ? 'poll.votersHidden' : 'poll.votersFailed')}
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
