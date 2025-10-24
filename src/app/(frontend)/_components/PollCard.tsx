'use client';
import { formatDistance, subDays } from 'date-fns';
import { eoLocale } from 'date-fns/locale/eo';
import { MessageSquare, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn, hasArrayValue } from '@/lib/utils';
import { Poll } from '@/types/poll';

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
		totalVotes,
		creatorUsername,
		comments,
	} = pollData;
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [hasVoted, setHasVoted] = useState(false);
	const [showComments, setShowComments] = useState(false);
	const [commentText, setCommentText] = useState('');

	const handleVote = (optionId: string) => {
		if (!hasVoted) {
			setSelectedOption(optionId);
			setHasVoted(true);
			// onVote(pollId, optionId);
		}
	};

	const handleComment = () => {
		if (commentText.trim()) {
			// onComment(pollId, commentText);
			setCommentText('');
		}
	};

	const getPercentage = (votes: number) => {
		return totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
	};

	return (
		<div className="p-6 hover:shadow-lg transition-all duration-300 rounded-xl border-border bg-card">
			<div className="space-y-4">
				<div className="space-y-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
						<p className="font-medium text-foreground">{creatorUsername}</p>
						<span>•</span>
						<time>
							{formatDistance(new Date(createdAt), new Date(), {
								includeSeconds: true,
								locale: eoLocale,
							})}
						</time>
					</div>
					<h3 className="text-xl font-semibold text-foreground">{title}</h3>
					{description && (
						<p className="text-lg text-foreground">{description}</p>
					)}
				</div>

				{/* Poll Options */}
				<div className="space-y-3">
					{options.map((option) => {
						const percentage = getPercentage(option.votes);
						const isSelected = selectedOption === option.id;

						return (
							<button
								key={option.id}
								onClick={() => handleVote(option.id)}
								disabled={hasVoted}
								className={cn(
									'w-full text-left p-4 rounded-lg border-2 transition-all duration-300',
									'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
									hasVoted && !isSelected && 'opacity-70',
									hasVoted && isSelected && 'border-primary bg-primary/5',
									!hasVoted && 'cursor-pointer border-border hover:bg-muted/50'
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
						{comments?.length} Comments
					</Button>

					{showComments && hasArrayValue(comments) && (
						<div className="mt-4 space-y-4">
							{comments?.map((comment) => (
								<div key={comment.id} className="bg-muted/30 rounded-lg p-3">
									<div className="flex items-center gap-2 text-sm mb-1">
										<span className="font-medium text-foreground">
											{comment.author}
										</span>
										<span className="text-muted-foreground">•</span>
										<span className="text-muted-foreground">
											{comment.createdAt}
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
									onKeyPress={(e) => e.key === 'Enter' && handleComment()}
								/>
								<Button onClick={handleComment} size="sm">
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
