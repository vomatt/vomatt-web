'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

import type { Poll } from '../schema';
import { closePoll } from '../service';

const PollCreator = dynamic(() => import('./PollCreator').then((m) => m.PollCreator));

type OwnerActionsProps = {
	poll: Poll;
	/** Refetch the Poll after an edit or a cancel. */
	onChanged: () => void;
};

/** Edit and Cancel poll, for the owner of a Scheduled Poll. */
export function OwnerActions({ poll, onChanged }: OwnerActionsProps) {
	const { t } = useLanguage();
	const [isEditing, setIsEditing] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);

	const cancelPoll = async () => {
		const result = await closePoll(poll.id);
		if (result.ok) onChanged();
		else toast.error(t('poll.cancelFailed'));
	};

	return (
		<div className="flex gap-1.5">
			<Button
				size="sm"
				variant="ghost"
				className="text-destructive"
				onClick={() => setIsCancelling(true)}
			>
				{t('poll.cancelPoll')}
			</Button>
			<Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
				{t('poll.edit')}
			</Button>

			{isEditing && (
				<PollCreator poll={poll} open onOpenChange={setIsEditing} onSaved={onChanged} />
			)}

			<AlertDialog open={isCancelling} onOpenChange={setIsCancelling}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('poll.cancelPollTitle')}</AlertDialogTitle>
						<AlertDialogDescription>{t('poll.cancelPollBody')}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('poll.keepPoll')}</AlertDialogCancel>
						<AlertDialogAction onClick={cancelPoll}>{t('poll.cancelPoll')}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
