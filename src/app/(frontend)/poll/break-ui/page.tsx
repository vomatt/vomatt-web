import { notFound } from 'next/navigation';

import { BreakUiView } from './BreakUiView';
import { DATA_STATES, type DataState, getFixture } from './fixtures';

const VIEWS = ['feed', 'poll', 'profile', 'own', 'edit', 'creator'] as const;
export type View = (typeof VIEWS)[number];

/** Dev only: poll, comment and profile UI rendered with demo or worst-case fixtures (`?view=&data=`). */
export default async function BreakUiPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
	if (process.env.NODE_ENV !== 'development') notFound();
	const params = await searchParams;
	const data = (DATA_STATES as readonly string[]).includes(params.data ?? '') ? (params.data as DataState) : 'demo';
	const view = (VIEWS as readonly string[]).includes(params.view ?? '') ? (params.view as View) : 'feed';
	// Built once on the server, so the client hydrates the same dates
	return <BreakUiView data={data} view={view} views={VIEWS} fixture={getFixture(data)} />;
}
