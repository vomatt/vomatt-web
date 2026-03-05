'use client';
import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Check, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
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
		<article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-border hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
			{/* Decorative top line */}
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

			<div className="p-6 space-y-5">
				{/* Header: creator + timestamp + status */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Link
							href={`/profile/${creatorUsername}`}
							className="font-medium text-foreground/70 hover:text-foreground transition-colors"
						>
							{creatorUsername}
						</Link>
						<span className="text-border">·</span>
						<time>
							{formatDistance(new Date(createdAt), new Date(), {
								addSuffix: true,
								locale: enUS,
							})}
						</time>
					</div>
					{status && (
						<span
							className={cn(
								'text-xs font-medium px-2.5 py-0.5 rounded-full border shrink-0',
								isEnded
									? 'border-border/50 text-muted-foreground bg-muted/30'
									: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
							)}
						>
							{status.label}
						</span>
					)}
				</div>

				{/* Poll question */}
				<div>
					<Link href={`/poll/${pollId}`}>
						<h3 className="font-display text-2xl leading-snug text-foreground italic hover:text-foreground/80 transition-colors">
							{title}
						</h3>
					</Link>
					{description && (
						<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
							{description}
						</p>
					)}
				</div>

				{/* Vote options */}
				<div className="space-y-2">
					{voteOptions.map((option) => {
						const percentage = getPercentage(option.votes);
						const isSelected = selectedOption === option.id;

						if (!hasVoted && !isEnded) {
							return (
								<button
									key={option.id}
									onClick={() => handleVote(option.id)}
									className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200 group/opt focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
								>
									<div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover/opt:border-amber-500/60 transition-colors flex-shrink-0" />
									<span className="text-sm font-medium text-foreground">
										{option.text}
									</span>
								</button>
							);
						}

						return (
							<div
								key={option.id}
								className={cn(
									'relative overflow-hidden rounded-xl border transition-all duration-300',
									isSelected
										? 'border-amber-500/40'
										: 'border-border/40',
									!isSelected && hasVoted && 'opacity-55'
								)}
							>
								{/* Animated fill bar */}
								<div
									className={cn(
										'absolute inset-0 transition-transform duration-700 ease-out origin-left',
										isSelected ? 'bg-amber-500/10' : 'bg-muted/20'
									)}
									style={{ transform: `scaleX(${percentage / 100})` }}
								/>
								<div className="relative flex items-center justify-between px-4 py-3">
									<div className="flex items-center gap-3">
										<div
											className={cn(
												'w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-colors',
												isSelected
													? 'bg-amber-500'
													: 'border-2 border-muted-foreground/25'
											)}
										>
											{isSelected && (
												<Check
													className="w-2.5 h-2.5 text-black"
													strokeWidth={3}
												/>
											)}
										</div>
										<span
											className={cn(
												'text-sm font-medium',
												isSelected
													? 'text-foreground'
													: 'text-foreground/65'
											)}
										>
											{option.text}
										</span>
									</div>
									<span
										className={cn(
											'font-data text-sm tabular-nums font-medium',
											isSelected
												? 'text-amber-400'
												: 'text-muted-foreground'
										)}
									>
										{percentage}%
									</span>
								</div>
							</div>
						);
					})}
				</div>

				{/* Vote count */}
				{hasVoted && (
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Users className="w-3.5 h-3.5" />
						<span className="font-data tabular-nums">
							{totalVotes.toLocaleString()}
						</span>
						<span>votes cast</span>
					</div>
				)}

				{/* Comments */}
				<div className="border-t border-border/40 pt-4">
					<button
						onClick={() => setShowComments(!showComments)}
						className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						<MessageSquare className="w-3.5 h-3.5" />
						<span>
							{comments.length}{' '}
							{comments.length === 1 ? 'comment' : 'comments'}
						</span>
					</button>

					{showComments && (
						<div className="mt-4 space-y-3">
							{hasArrayValue(comments) &&
								comments.map((comment) => (
									<div
										key={comment.id}
										className="pl-3 border-l-2 border-border/40"
									>
										<div className="flex items-center gap-2 text-xs mb-0.5">
											<span className="font-medium text-foreground/80">
												{comment.author}
											</span>
											<span className="text-muted-foreground/50">
												{formatDistance(
													new Date(comment.createdAt),
													new Date(),
													{ locale: enUS }
												)}{' '}
												ago
											</span>
										</div>
										<p className="text-sm text-foreground/70">
											{comment.text}
										</p>
									</div>
								))}

							<div className="flex gap-2 pt-1">
								<input
									type="text"
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Add a comment…"
									className="flex-1 px-3 py-2 text-sm rounded-lg border border-border/60 bg-muted/20 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/40 focus:bg-amber-500/5 transition-all"
									onKeyDown={(e) => e.key === 'Enter' && handleComment()}
								/>
								<Button
									onClick={handleComment}
									size="sm"
									disabled={isPostingComment}
									className="px-4"
								>
									Post
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</article>
	);
};
