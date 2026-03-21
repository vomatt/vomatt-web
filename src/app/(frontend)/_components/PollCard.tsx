'use client';
import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Check, MessageSquare, Users } from '@/components/ui/SvgIcons';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn, hasArrayValue } from '@/lib/utils';
import { vote as castVote, postComment } from '@/lib/api/services/polls';
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

function getPollStatus(poll: Poll): { label: string; variant: 'ended' | 'closing' } | null {
	if (!poll.active || !poll.votingActive) {
		return { label: 'Ended', variant: 'ended' };
	}
	if (poll.endTime) {
		const end = new Date(poll.endTime);
		if (end < new Date()) {
			return { label: 'Ended', variant: 'ended' };
		}
		const hoursLeft = (end.getTime() - Date.now()) / 36e5;
		if (hoursLeft < 24) {
			return { label: `${Math.ceil(hoursLeft)}h left`, variant: 'closing' };
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

		setSelectedOption(optionId);
		setHasVoted(true);
		setTotalVotes((prev) => prev + 1);
		setVoteOptions((prev) =>
			prev.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o))
		);
		saveVote(pollId, optionId);

		try {
			await castVote(pollId, [optionId]);
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
			await postComment(pollId, text);
		} catch {
			// Comment shown optimistically; API sync is best-effort
		} finally {
			setIsPostingComment(false);
		}
	};

	const getPercentage = (votes: number) =>
		totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

	const status = getPollStatus(pollData);
	const isEnded = status?.variant === 'ended';

	return (
		<article className="group bg-card border border-border rounded-xl transition-shadow duration-200 hover:shadow-sm">
			<div className="p-5 space-y-4">
				{/* Meta row */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Link
							href={`/profile/${creatorUsername}`}
							className="font-medium text-foreground/60 hover:text-foreground transition-colors"
						>
							{creatorUsername}
						</Link>
						<span>·</span>
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
								'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full',
								status.variant === 'ended'
									? 'bg-muted text-muted-foreground'
									: 'bg-primary/8 text-primary'
							)}
						>
							{status.label}
						</span>
					)}
				</div>

				{/* Question */}
				<div>
					<Link href={`/poll/${pollId}`}>
						<h3 className="text-[17px] font-semibold leading-snug text-foreground hover:text-foreground/75 transition-colors">
							{title}
						</h3>
					</Link>
					{description && (
						<p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
							{description}
						</p>
					)}
				</div>

				{/* Vote options */}
				<div className="space-y-1.5">
					{voteOptions.map((option) => {
						const percentage = getPercentage(option.votes);
						const isSelected = selectedOption === option.id;

						if (!hasVoted && !isEnded) {
							return (
								<button
									key={option.id}
									onClick={() => handleVote(option.id)}
									className="group/opt w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<div className="w-3.5 h-3.5 rounded-full border-2 border-border group-hover/opt:border-primary/50 transition-colors flex-shrink-0" />
									<span className="text-sm text-foreground/80 group-hover/opt:text-foreground transition-colors">
										{option.text}
									</span>
								</button>
							);
						}

						return (
							<div
								key={option.id}
								className={cn(
									'relative overflow-hidden rounded-lg border transition-colors duration-200',
									isSelected ? 'border-primary/25' : 'border-border/60'
								)}
							>
								{/* Progress fill */}
								<div
									className={cn(
										'absolute inset-0 origin-left transition-transform duration-500 ease-out',
										isSelected ? 'bg-primary/8' : 'bg-muted/60'
									)}
									style={{ transform: `scaleX(${percentage / 100})` }}
								/>

								<div className="relative flex items-center justify-between px-3.5 py-2.5">
									<div className="flex items-center gap-2.5">
										<div
											className={cn(
												'w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center',
												isSelected
													? 'bg-primary'
													: 'border-2 border-muted-foreground/20'
											)}
										>
											{isSelected && (
												<Check className="w-2 h-2 text-white" strokeWidth={3} />
											)}
										</div>
										<span
											className={cn(
												'text-sm',
												isSelected
													? 'font-medium text-foreground'
													: 'text-foreground/50'
											)}
										>
											{option.text}
										</span>
									</div>
									<span
										className={cn(
											'text-xs tabular-nums font-medium ml-3 flex-shrink-0',
											isSelected ? 'text-primary' : 'text-muted-foreground/60'
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
						<Users className="w-3 h-3" />
						<span className="tabular-nums">{totalVotes.toLocaleString()} votes</span>
					</div>
				)}
			</div>

			{/* Comments section */}
			<div className="border-t border-border/60 px-5 py-3">
				<button
					onClick={() => setShowComments(!showComments)}
					className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<MessageSquare className="w-3.5 h-3.5" />
					<span>
						{comments.length} {comments.length === 1 ? 'comment' : 'comments'}
					</span>
				</button>

				{showComments && (
					<div className="mt-3 space-y-3">
						{hasArrayValue(comments) &&
							comments.map((comment) => (
								<div key={comment.id} className="pl-3 border-l-2 border-border">
									<div className="flex items-center gap-2 text-xs mb-0.5">
										<span className="font-medium text-foreground/70">
											{comment.author}
										</span>
										<span className="text-muted-foreground/40">
											{formatDistance(new Date(comment.createdAt), new Date(), {
												locale: enUS,
											})}{' '}
											ago
										</span>
									</div>
									<p className="text-sm text-foreground/65">{comment.text}</p>
								</div>
							))}

						<div className="flex gap-2 pt-1">
							<input
								type="text"
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder="Add a comment…"
								className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/30 transition-all"
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
		</article>
	);
};
