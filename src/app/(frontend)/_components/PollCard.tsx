'use client';
import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn, hasArrayValue } from '@/lib/utils';
import { Poll } from '@/types/poll';

const VOTED_STORAGE_KEY = 'vomatt_voted_polls';

function getVotedPolls(): Record<string, string> {
	try {
		return JSON.parse(localStorage.getItem(VOTED_STORAGE_KEY) ?? '{}');
	} catch {
		return {};
	}
}

function saveVote(pollId: string, optionId: string) {
	const voted = getVotedPolls();
	voted[pollId] = optionId;
	localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(voted));
}

function getPollStatus(poll: Poll): { label: string; color: string } | null {
	if (!poll.active || !poll.votingActive) {
		return { label: 'Ended', color: 'bg-muted text-muted-foreground' };
	}
	if (poll.endTime) {
		const end = new Date(poll.endTime);
		if (end < new Date()) {
			return { label: 'Ended', color: 'bg-muted text-muted-foreground' };
		}
		const hoursLeft = (end.getTime() - Date.now()) / 36e5;
		if (hoursLeft < 24) {
			return {
				label: `Ends in ${Math.ceil(hoursLeft)}h`,
				color: 'bg-yellow-100 text-yellow-800',
			};
		}
	}
	return null;
}

interface PollCardProps {
	pollData: Poll;
}

export const PollCard = ({ pollData }: PollCardProps) => {
	const {
		title,
		description,
		createdAt,
		id: pollId,
		options,
		creatorUsername,
	} = pollData;

	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [hasVoted, setHasVoted] = useState(false);
	const [totalVotes, setTotalVotes] = useState(pollData.totalVotes);
	const [voteOptions, setVoteOptions] = useState(options);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState(pollData.comments ?? []);
	const [commentText, setCommentText] = useState('');
	const [isPostingComment, setIsPostingComment] = useState(false);

	useEffect(() => {
		const voted = getVotedPolls();
		if (voted[pollId]) {
			setSelectedOption(voted[pollId]);
			setHasVoted(true);
		}
	}, [pollId]);

	const handleVote = async (optionId: string) => {
		if (hasVoted) return;

		// Optimistic update
		setSelectedOption(optionId);
		setHasVoted(true);
		setTotalVotes((prev) => prev + 1);
		setVoteOptions((prev) =>
			prev.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o))
		);
		saveVote(pollId, optionId);

		try {
			await fetch('/api/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pollId, optionId }),
			});
		} catch {
			// Vote persisted in localStorage; API sync is best-effort
		}
	};

	const handleComment = async () => {
		const text = commentText.trim();
		if (!text || isPostingComment) return;

		setIsPostingComment(true);
		const optimistic = {
			id: `local-${Date.now()}`,
			author: 'You',
			text,
			createdAt: new Date().toISOString(),
		};
		setComments((prev) => [...prev, optimistic]);
		setCommentText('');

		try {
			await fetch('/api/comment', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ pollId, text }),
			});
		} catch {
			// Comment shown optimistically; API sync is best-effort
		} finally {
			setIsPostingComment(false);
		}
	};

	const getPercentage = (votes: number) =>
		totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

	const status = getPollStatus(pollData);
	const isEnded = status?.label === 'Ended';

	return (
		<div className="p-6 hover:shadow-lg transition-all duration-300 rounded-xl border-border bg-card">
			<div className="space-y-4">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Link
								href={`/profile/${creatorUsername}`}
								className="font-medium text-foreground hover:underline"
							>
								{creatorUsername}
							</Link>
							<span>•</span>
							<time>
								{formatDistance(new Date(createdAt), new Date(), {
									includeSeconds: true,
									locale: enUS,
								})}
							</time>
						</div>
						{status && (
							<span
								className={cn(
									'text-xs font-medium px-2 py-0.5 rounded-full',
									status.color
								)}
							>
								{status.label}
							</span>
						)}
					</div>
					<Link href={`/poll/${pollId}`}>
						<h3 className="text-xl font-semibold text-foreground hover:underline">
							{title}
						</h3>
					</Link>
					{description && (
						<p className="text-lg text-foreground">{description}</p>
					)}
				</div>

				{/* Poll Options */}
				<div className="space-y-3">
					{voteOptions.map((option) => {
						const percentage = getPercentage(option.votes);
						const isSelected = selectedOption === option.id;

						return (
							<button
								key={option.id}
								onClick={() => handleVote(option.id)}
								disabled={hasVoted || isEnded}
								className={cn(
									'w-full text-left p-4 rounded-lg border-2 transition-all duration-300',
									'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
									hasVoted && !isSelected && 'opacity-70',
									hasVoted && isSelected && 'border-primary bg-primary/5',
									!hasVoted && !isEnded && 'cursor-pointer border-border hover:bg-muted/50',
									(hasVoted || isEnded) && 'cursor-default border-border'
								)}
							>
								<div className="flex items-center justify-between mb-2">
									<span className="font-medium text-foreground">
										{option.text}
									</span>
									{hasVoted && (
										<span className="text-sm font-semibold text-primary">
											{percentage}%
										</span>
									)}
								</div>
								{hasVoted && <Progress value={percentage} className="h-2" />}
							</button>
						);
					})}
				</div>

				{hasVoted && (
					<div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
						<div className="flex items-center gap-1">
							<Users className="w-4 h-4" />
							<span>{totalVotes} votes</span>
						</div>
					</div>
				)}

				<div className="border-t border-border pt-4">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowComments(!showComments)}
						className="text-muted-foreground hover:text-foreground"
					>
						<MessageSquare className="w-4 h-4 mr-2" />
						{comments.length} Comments
					</Button>

					{showComments && (
						<div className="mt-4 space-y-4">
							{hasArrayValue(comments) &&
								comments.map((comment) => (
									<div key={comment.id} className="bg-muted/30 rounded-lg p-3">
										<div className="flex items-center gap-2 text-sm mb-1">
											<span className="font-medium text-foreground">
												{comment.author}
											</span>
											<span className="text-muted-foreground">•</span>
											<span className="text-muted-foreground">
												{formatDistance(
													new Date(comment.createdAt),
													new Date(),
													{ locale: enUS }
												)}{' '}
												ago
											</span>
										</div>
										<p className="text-sm text-foreground">{comment.text}</p>
									</div>
								))}

							{/* Add Comment */}
							<div className="flex gap-2">
								<input
									type="text"
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Add a comment..."
									className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
									onKeyDown={(e) => e.key === 'Enter' && handleComment()}
								/>
								<Button
									onClick={handleComment}
									size="sm"
									disabled={isPostingComment}
								>
									Post
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
