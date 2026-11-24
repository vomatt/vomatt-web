'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { PageShell } from '@/components/layout/PageShell';
import { CommentThread } from '@/features/polls/components/CommentThread';
import { PollCard } from '@/features/polls/components/PollCard';
import { PollCreator } from '@/features/polls/components/PollCreator';
import type { CommentsState, ReplyList } from '@/features/polls/hooks/useComments';

import { OwnProfileView } from '../../[slug]/_components/OwnProfileView';
import { VisitorProfileView } from '../../[slug]/_components/VisitorProfileView';
import type { getFixture } from './fixtures';
import { DATA_STATES, type DataState, type Fixture, VIEWER_ID } from './fixtures';
import type { View } from './page';

const notSaved = async () => ({ ok: false as const, message: 'break-ui fixture' });

/** The thread useComments would return once its first page loaded, built from the fixture. */
function fixtureThread(fixture: Fixture): CommentsState {
	const replies: Record<string, ReplyList> = Object.fromEntries(
		fixture.comments
			.filter((c) => c.replies?.length)
			.map((c) => [c.id, { items: c.replies ?? [], nextCursor: c.repliesNextCursor ?? null, status: 'ready' as const }])
	);
	return {
		comments: fixture.comments,
		replies,
		total: fixture.commentTotal,
		status: 'ready',
		hasMore: fixture.comments.length >= 20,
		isLoadingMore: false,
		reload: () => {},
		refresh: async () => true,
		loadMore: async () => {},
		loadReplies: async () => {},
		add: notSaved,
		edit: notSaved,
		remove: notSaved,
		dropUser: () => {},
		toggleLike: notSaved,
		keyOf: (id: string) => id,
	} as unknown as CommentsState;
}

export function BreakUiView({
	data,
	view,
	views,
	fixture,
}: {
	data: DataState;
	view: View;
	views: readonly View[];
	fixture: ReturnType<typeof getFixture>;
}) {
	const thread = useMemo(() => fixtureThread(fixture), [fixture]);
	const requireAuth = (action: () => void) => action();

	let content: React.ReactNode;
	switch (view) {
		case 'feed':
			content = (
				<PageShell className="pt-4 md:pt-8">
					<div className="space-y-4">
						{fixture.polls.map((poll) => (
							<PollCard key={poll.id} poll={poll} viewerId={VIEWER_ID} />
						))}
					</div>
				</PageShell>
			);
			break;
		case 'poll': {
			const poll = fixture.polls[0];
			content = (
				<PageShell className="pt-4 md:pt-8">
					<div className="space-y-4">
						{poll && <PollCard poll={poll} viewerId={VIEWER_ID} commentCount={thread.total} headingLevel="h1" isPage />}
						<CommentThread
							thread={thread}
							pollId={poll?.id ?? 'none'}
							viewerId={VIEWER_ID}
							viewer={fixture.viewer}
							requireAuth={requireAuth}
						/>
					</div>
				</PageShell>
			);
			break;
		}
		case 'profile':
			content = (
				<VisitorProfileView
					profile={fixture.profile}
					polls={{ items: fixture.polls, nextCursor: null }}
					viewerId={VIEWER_ID}
				/>
			);
			break;
		case 'own':
		case 'edit':
			content = (
				<OwnProfileView
					key={`${data}-${view}`}
					profile={fixture.mine}
					polls={fixture.myPolls}
					openEdit={view === 'edit'}
				/>
			);
			break;
		case 'creator':
			content = (
				<PageShell className="pt-4 md:pt-8">
					{fixture.polls[0] ? (
						<PollCreator key={data} poll={fixture.polls[0]} open onOpenChange={() => {}} />
					) : (
						<PollCreator key={data} open onOpenChange={() => {}} />
					)}
				</PageShell>
			);
			break;
	}

	return (
		<>
			<div key={`${data}-${view}`}>{content}</div>
			<BreakUiToggle data={data} view={view} views={views} />
		</>
	);
}

/** Plain dev chrome, not part of the design under test. */
function BreakUiToggle({ data, view, views }: { data: DataState; view: View; views: readonly View[] }) {
	const segment = (active: boolean) => ({
		padding: '4px 10px',
		borderRadius: 999,
		background: active ? '#fff' : 'transparent',
		color: '#111',
		boxShadow: active ? '0 1px 2px rgba(0,0,0,.15)' : 'none',
		textDecoration: 'none',
		whiteSpace: 'nowrap' as const,
	});
	const row = { display: 'flex', gap: 2, padding: 3, borderRadius: 999, background: '#e5e5e5', overflowX: 'auto' as const };
	return (
		<div
			style={{
				position: 'fixed',
				bottom: 12,
				left: '50%',
				transform: 'translateX(-50%)',
				zIndex: 2147483647,
				display: 'flex',
				flexDirection: 'column',
				gap: 4,
				font: '12px/1.2 system-ui, sans-serif',
				maxWidth: 'calc(100vw - 16px)',
			}}
		>
			<nav aria-label="Fixture view" style={row}>
				{views.map((v) => (
					<Link key={v} href={`?view=${v}&data=${data}`} replace scroll={false} style={segment(v === view)}>
						{v}
					</Link>
				))}
			</nav>
			<nav aria-label="Fixture data" style={row}>
				{DATA_STATES.map((d) => (
					<Link key={d} href={`?view=${view}&data=${d}`} replace scroll={false} style={segment(d === data)}>
						{d === 'demo' ? 'Demo data' : d === 'worst' ? 'Worst case' : d === 'huge' ? '400–600 rows' : d[0].toUpperCase() + d.slice(1)}
					</Link>
				))}
			</nav>
		</div>
	);
}
