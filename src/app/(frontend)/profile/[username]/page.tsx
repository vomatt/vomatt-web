import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { User } from 'lucide-react';
import Link from 'next/link';

import { mockPolls } from '@/app/api/get-polls/mockData';
import { Poll } from '@/types/poll';

async function getUserPolls(username: string): Promise<Poll[]> {
	try {
		const url = `${process.env.API_URL}/api/v1/votes?creatorUsername=${encodeURIComponent(username)}`;
		const res = await fetch(url, { next: { revalidate: 60 } });
		const resData = await res.json();
		if (resData?.success) return resData.data?.content ?? [];
	} catch {
		// fall through to mock
	}
	return mockPolls.filter((p) => p.creatorUsername === username);
}

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;
	const polls = await getUserPolls(username);

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			{/* Avatar + username */}
			<div className="flex items-center gap-4 mb-8">
				<div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shrink-0">
					<User className="w-8 h-8 text-white" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-foreground">{username}</h1>
					<p className="text-sm text-muted-foreground">
						{polls.length} poll{polls.length !== 1 ? 's' : ''}
					</p>
				</div>
			</div>

			{/* Polls list */}
			<h2 className="text-lg font-semibold mb-4">Polls</h2>
			{polls.length === 0 ? (
				<p className="text-muted-foreground">No polls yet.</p>
			) : (
				<div className="space-y-3">
					{polls.map((poll) => (
						<Link key={poll.id} href={`/poll/${poll.id}`}>
							<div className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
								<p className="font-semibold text-foreground hover:underline">
									{poll.title}
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									{poll.totalVotes} votes ·{' '}
									{formatDistance(new Date(poll.createdAt), new Date(), {
										locale: enUS,
									})}{' '}
									ago
								</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
