'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';

import type { Poll, Voter } from '../schema';
import { getVoters } from '../service';

type State =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'hidden' }
	| { status: 'failed' }
	| { status: 'ready'; voters: Voter[]; nextCursor: string | null };

/**
 * Who chose what on an Ended Poll. Only rendered when the Poll's Voter
 * Visibility lets this viewer see it; the API still has the final say.
 */
export function VoterList({ poll }: { poll: Pick<Poll, 'id' | 'options'> }) {
	const { t } = useLanguage();
	const [state, setState] = useState<State>({ status: 'idle' });

	const load = async (cursor: string | null) => {
		const previous = state.status === 'ready' ? state.voters : [];
		if (!cursor) setState({ status: 'loading' });
		const result = await getVoters(poll.id, cursor);
		if (result.ok) {
			setState({
				status: 'ready',
				// One Ballot per user, and cursor pages don't overlap
				voters: [...previous, ...result.data.items],
				nextCursor: result.data.nextCursor,
			});
		} else {
			setState({ status: result.errorCode === 'vote.voters.hidden' ? 'hidden' : 'failed' });
		}
	};

	if (state.status === 'idle') {
		return (
			<Button size="sm" variant="ghost" className="px-0 text-xs text-muted-foreground" onClick={() => load(null)}>
				{t('poll.showVoters')}
			</Button>
		);
	}
	if (state.status === 'loading') return <Spinner />;
	if (state.status === 'hidden') {
		return <p className="text-xs text-muted-foreground">{t('poll.votersHidden')}</p>;
	}
	if (state.status === 'failed') {
		return <p className="text-xs text-muted-foreground">{t('poll.votersFailed')}</p>;
	}

	return (
		<section aria-label={t('poll.voters')} className="space-y-2 text-xs">
			{poll.options.map((option) => {
				const chose = state.voters.filter((voter) => voter.optionId === option.id);
				if (chose.length === 0) return null;
				return (
					<div key={option.id}>
						<p className="font-medium text-foreground">{option.text}</p>
						<p className="text-muted-foreground">
							{chose.map((voter, index) => (
								<span key={voter.userId}>
									{index > 0 && ', '}
									<Link href={`/profile/${voter.username}`} className="hover:underline">
										{voter.username}
									</Link>
								</span>
							))}
						</p>
					</div>
				);
			})}
			{state.voters.length === 0 && <p className="text-muted-foreground">{t('poll.noVotes')}</p>}
			{state.nextCursor && (
				<Button size="sm" variant="ghost" className="px-0 text-xs" onClick={() => load(state.nextCursor)}>
					{t('common.loadMore')}
				</Button>
			)}
		</section>
	);
}
