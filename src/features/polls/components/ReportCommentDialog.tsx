'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';

import { COMMENT_REPORT_NOTE_MAX, COMMENT_REPORT_REASONS, type ReportCommentRequest } from '../schema';
import { reportComment } from '../service';

/** Asks why a Comment or Reply is reported, then sends it to the moderators. */
export function ReportCommentDialog({
	pollId,
	commentId,
	open,
	onOpenChange,
}: {
	pollId: string;
	commentId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useLanguage();
	const [reason, setReason] = useState<ReportCommentRequest['reason'] | null>(null);
	const [note, setNote] = useState('');
	const [isSending, setIsSending] = useState(false);

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!reason) return;
		setIsSending(true);
		const result = await settle(reportComment(pollId, commentId, { reason, note: note.trim() || undefined })).finally(
			() => setIsSending(false)
		);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'comments.reportFailed'), { duration: Infinity });
			return;
		}
		setReason(null);
		setNote('');
		onOpenChange(false);
		toast.success(t('comments.reported'));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-md"
				overlayClassName="bg-overlay-strong backdrop-blur-md"
				closeLabel={t('common.close')}
			>
				<DialogTitle className="text-center">{t('comments.reportTitle')}</DialogTitle>
				<DialogDescription className="text-center">{t('comments.reportBody')}</DialogDescription>
				<form onSubmit={submit} className="grid gap-3">
					<fieldset className="grid gap-1">
						<legend className="sr-only">{t('comments.reportReason')}</legend>
						{COMMENT_REPORT_REASONS.map((value) => (
							<label
								key={value}
								className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-sm hover:bg-muted has-focus-visible:outline-2 has-focus-visible:outline-solid has-focus-visible:outline-ring"
							>
								<input
									type="radio"
									name="report-reason"
									value={value}
									checked={reason === value}
									onChange={() => setReason(value)}
									className="size-4 accent-foreground"
								/>
								{t(`comments.reportReasons.${value}`)}
							</label>
						))}
					</fieldset>
					<Textarea
						value={note}
						onChange={(event) => setNote(event.target.value)}
						placeholder={t('comments.reportNote')}
						aria-label={t('comments.reportNote')}
						maxLength={COMMENT_REPORT_NOTE_MAX}
						rows={3}
						className="resize-none"
					/>
					<Button type="submit" className="justify-self-end" disabled={!reason} loading={isSending}>
						{t('comments.reportSubmit')}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
