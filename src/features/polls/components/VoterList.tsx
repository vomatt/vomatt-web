'use client';

import Link from 'next/link';
import { useState } from 'react';

import { LoadMore } from '@/components/LoadMore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { profileHref } from '@/lib/routes';

import type { Poll, Voter } from '../schema';
import { getVoters } from '../service';

type VoterPoll = Pick<Poll, 'id' | 'options'>;

type State =
	| { status: 'idle' | 'loading' | 'hidden' | 'failed' }
	| { status: 'ready'; firstPage: CursorPage<Voter & { id: string }> };

/** Voters keyed by user (one Ballot each), so pages merge by id. */
async function fetchVoters(pollId: string, cursor: string | null) {
	const result = await getVoters(pollId, cursor);
	if (!result.ok) throw result;
	return {
		items: result.data.items.map((voter) => ({ ...voter, id: voter.userId })),
		nextCursor: result.data.nextCursor,
	};
}

/**
 * Who chose what on an Ended Poll. Only rendered when the Poll's Voter
 * Visibility lets this viewer see it; the API still has the final say.
 */
export function VoterList({ poll }: { poll: VoterPoll }) {
	const { t } = useLanguage();
	const [state, setState] = useState<State>({ status: 'idle' });

	const load = async () => {
		setState({ status: 'loading' });
		try {
			setState({ status: 'ready', firstPage: await fetchVoters(poll.id, null) });
		} catch (failure) {
			const hidden = (failure as { errorCode?: string }).errorCode === 'vote.voters.hidden';
			setState({ status: hidden ? 'hidden' : 'failed' });
		}
	};

	if (state.status === 'ready') return <VoterPages poll={poll} firstPage={state.firstPage} />;
	if (state.status === 'idle') {
		return (
			<Button size="sm" variant="ghost" className="px-0 text-xs text-muted-foreground" onClick={load}>
				{t('poll.showVoters')}
			</Button>
		);
	}
	if (state.status === 'loading') return <Spinner />;
	return (
		<p className="text-xs text-muted-foreground">
			{t(state.status === 'hidden' ? 'poll.votersHidden' : 'poll.votersFailed')}
		</p>
	);
}

function VoterPages({ poll, firstPage }: { poll: VoterPoll; firstPage: CursorPage<Voter & { id: string }> }) {
	const { t } = useLanguage();
	const list = useCursorList(firstPage, (cursor) => fetchVoters(poll.id, cursor));

	return (
		<section aria-label={t('poll.voters')} className="space-y-2 text-xs">
			{poll.options.map((option) => {
				const chose = list.items.filter((voter) => voter.optionId === option.id);
				if (chose.length === 0) return null;
				return (
					<div key={option.id}>
						<p className="font-medium text-foreground">{option.text}</p>
						<p className="text-muted-foreground">
							{chose.map((voter, index) => (
								<span key={voter.id}>
									{index > 0 && ', '}
									<Link href={profileHref(voter.username)} className="hover:underline">
										{voter.username}
									</Link>
								</span>
							))}
						</p>
					</div>
				);
			})}
			{list.items.length === 0 && <p className="text-muted-foreground">{t('poll.noVotes')}</p>}
			<LoadMore list={list} />
		</section>
	);
}
