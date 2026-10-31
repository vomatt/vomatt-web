'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';

import { COMMENT_REPORT_NOTE_MAX, COMMENT_REPORT_REASONS, type ReportCommentRequest } from '../schema';
import { reportComment, reportPoll } from '../service';

type Reason = ReportCommentRequest['reason'];

/**
 * Reports another person's comment, or with no `commentId` the Poll itself, to the moderators:
 * a reason, and a note if they want to add one.
 */
export function ReportCommentDialog({
	pollId,
	commentId,
	open,
	onOpenChange,
}: {
	pollId: string;
	commentId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useLanguage();
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent closeLabel={t('common.close')} className="sm:max-w-[440px]">
				{/* The form unmounts with the popup, so it opens empty each time */}
				<ReportForm pollId={pollId} commentId={commentId} onDone={() => onOpenChange(false)} />
			</DialogContent>
		</Dialog>
	);
}

function ReportForm({ pollId, commentId, onDone }: { pollId: string; commentId?: string; onDone: () => void }) {
	const { t } = useLanguage();
	// Comment reports and Poll reports share their reasons, with their own words around them
	const copy = commentId ? 'comments' : 'poll';
	const reasonsId = useId();
	const noteId = useId();
	const [reason, setReason] = useState<Reason | null>(null);
	const [note, setNote] = useState('');
	const [isSending, setIsSending] = useState(false);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!reason) return;
		setIsSending(true);
		const report = { reason, note: note.trim() || undefined };
		const result = await settle(commentId ? reportComment(pollId, commentId, report) : reportPoll(pollId, report));
		setIsSending(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, `${copy}.reportFailed`));
			return;
		}
		onDone();
		toast.success(t(`${copy}.reportDone`));
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>{t(`${copy}.reportTitle`)}</DialogTitle>
				<DialogDescription className="text-[14px]">{t(`${copy}.reportBody`)}</DialogDescription>
			</DialogHeader>
			<form onSubmit={submit} className="grid gap-4">
				<div className="grid gap-1">
					<p id={reasonsId} className="text-[14px] font-medium">
						{t('comments.reportReasonLabel')}
					</p>
					<RadioGroup
						aria-labelledby={reasonsId}
						value={reason}
						onValueChange={(value) => setReason(value as Reason)}
						className="-mx-2 flex flex-col"
					>
						{COMMENT_REPORT_REASONS.map((value) => (
							<Radio.Root
								key={value}
								value={value}
								className="group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-2 text-left text-[14px] outline-none hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring md:min-h-10"
							>
								<span
									aria-hidden
									className="grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-input group-data-checked:border-foreground"
								>
									<span className="hidden size-2 rounded-full bg-foreground group-data-checked:block" />
								</span>
								{t(`comments.reportReason.${value.toLowerCase()}`)}
							</Radio.Root>
						))}
					</RadioGroup>
				</div>
				<div className="grid gap-2">
					<div className="flex items-baseline justify-between gap-2">
						<label htmlFor={noteId} className="text-[14px] font-medium">
							{t('comments.reportNote')}
						</label>
						<span className="text-xs text-muted-foreground tabular-nums">
							{note.length} / {COMMENT_REPORT_NOTE_MAX}
						</span>
					</div>
					<Textarea
						id={noteId}
						value={note}
						onChange={(event) => setNote(event.target.value)}
						maxLength={COMMENT_REPORT_NOTE_MAX}
						rows={3}
						className="resize-none"
					/>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" size="md" onClick={onDone}>
						{t('common.cancel')}
					</Button>
					<Button type="submit" size="md" disabled={!reason} loading={isSending}>
						{t(`${copy}.report`)}
					</Button>
				</DialogFooter>
			</form>
		</>
	);
}
