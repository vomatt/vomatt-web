'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';

import { FEEDBACK_MESSAGE_MAX } from './schema';
import { reportProblem } from './service';

/** Opened from the More menu; the menu's popup unmounts on close, so the dialog lives outside it. */
export function ReportProblemDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useLanguage();
	const [message, setMessage] = useState('');
	const [isSending, setIsSending] = useState(false);
	const trimmed = message.trim();

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSending(true);
		try {
			const result = await reportProblem(trimmed);
			if (!result.ok) {
				toast.error(apiErrorText(t, result, 'feedback.failed'), {
					duration: Infinity,
				});
				return;
			}
			setMessage('');
			onOpenChange(false);
			toast.success(t('feedback.sent'));
		} catch {
			// The action itself returns failures; this is the request to it failing (e.g. offline)
			toast.error(t('feedback.failed'), { duration: Infinity });
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md" closeLabel={t('common.close')}>
				<DialogTitle className="text-center">{t('feedback.title')}</DialogTitle>
				<form onSubmit={submit} className="grid gap-3">
					<Textarea
						value={message}
						onChange={(event) => setMessage(event.target.value)}
						placeholder={t('feedback.placeholder')}
						aria-label={t('feedback.label')}
						className="min-h-32"
						maxLength={FEEDBACK_MESSAGE_MAX}
					/>
					<Button
						type="submit"
						variant="outline"
						className="justify-self-end"
						disabled={!trimmed}
						loading={isSending}
					>
						{t('feedback.submit')}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
