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
import { apiErrorText } from '@/lib/api/error-text';

import type { Poll } from '../schema';
import { closePoll, deletePoll } from '../service';
import type { PollStatus } from '../status';

const PollCreator = dynamic(() => import('./PollCreator').then((m) => m.PollCreator));
const InviteeManager = dynamic(() => import('./InviteeManager').then((m) => m.InviteeManager));

type OwnerActionsProps = {
	poll: Poll;
	status: PollStatus;
	/** Refetch the Poll after an edit or End now. */
	onChanged: () => void;
	/** The Invitee count changed without the Poll Ending. */
	onInviteeCount: (count: number) => void;
	onDeleted: () => void;
};

type Confirm = 'delete' | 'end';

/**
 * Edit while Scheduled; Delete while Scheduled or within the delete window
 * (`deletable`); End now for an Open Unlisted or Invite-only Poll (a Public
 * one runs to its Deadline); Invitees until an Invite-only Poll Ends.
 */
export function getOwnerActions(poll: Poll, status: PollStatus) {
	const canEdit = status === 'scheduled';
	const canDelete = status === 'scheduled' || !!poll.deletable;
	const canEnd =
		(status === 'open' || status === 'closing') &&
		(poll.audience === 'unlisted' || poll.audience === 'invite-only');
	const canInvite = poll.audience === 'invite-only' && status !== 'ended';
	return { canEdit, canDelete, canEnd, canInvite, any: canEdit || canDelete || canEnd || canInvite };
}

/** The owner's controls (see getOwnerActions); render it only when `any` of them apply. */
export function OwnerActions({
	poll,
	status,
	onChanged,
	onInviteeCount,
	onDeleted,
}: OwnerActionsProps) {
	const { t } = useLanguage();
	const [isEditing, setIsEditing] = useState(false);
	const [isInviting, setIsInviting] = useState(false);
	const [confirming, setConfirming] = useState<Confirm>('delete');
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const { canEdit, canDelete, canEnd, canInvite } = getOwnerActions(poll, status);

	const remove = async () => {
		const result = await deletePoll(poll.id);
		if (!result.ok) {
			// The API explains a passed delete window
			toast.error(apiErrorText(t, result, 'poll.deleteFailed'));
			return;
		}
		toast(t('poll.deleted'));
		onDeleted();
	};

	const end = async () => {
		const result = await closePoll(poll.id);
		if (result.ok) onChanged();
		else toast.error(apiErrorText(t, result, 'poll.endFailed'));
	};

	// The dialog keeps its text while it animates out
	const ask = (action: Confirm) => {
		setConfirming(action);
		setIsConfirmOpen(true);
	};

	const confirm = () => {
		setIsConfirmOpen(false);
		if (confirming === 'delete') remove();
		else end();
	};

	return (
		<div className="flex flex-wrap justify-end gap-1.5">
			{canDelete && (
				<Button
					size="sm"
					variant="ghost-destructive"
					onClick={() => ask('delete')}
				>
					{t('poll.deletePoll')}
				</Button>
			)}
			{canEnd && (
				<Button size="sm" variant="outline" onClick={() => ask('end')}>
					{t('poll.endNow')}
				</Button>
			)}
			{canInvite && (
				<Button size="sm" variant="outline" onClick={() => setIsInviting(true)}>
					{t('invitees.title')}
				</Button>
			)}
			{canEdit && (
				<Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
					{t('poll.edit')}
				</Button>
			)}

			{isEditing && (
				<PollCreator poll={poll} open onOpenChange={setIsEditing} onSaved={onChanged} />
			)}
			{isInviting && (
				<InviteeManager
					pollId={poll.id}
					open
					onOpenChange={setIsInviting}
					// The Poll Ends once every Invitee holds a Ballot; only then refetch it
					onChanged={(invitees) =>
						invitees.length > 0 && invitees.every((invitee) => invitee.hasBallot)
							? onChanged()
							: onInviteeCount(invitees.length)
					}
				/>
			)}

			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t(confirming === 'end' ? 'poll.endNowTitle' : 'poll.deletePollTitle')}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t(confirming === 'end' ? 'poll.endNowBody' : 'poll.deletePollBody')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('poll.keepPoll')}</AlertDialogCancel>
						<AlertDialogAction
							variant={confirming === 'delete' ? 'destructive' : 'default'}
							onClick={confirm}
						>
							{t(confirming === 'end' ? 'poll.endNow' : 'poll.deletePoll')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
