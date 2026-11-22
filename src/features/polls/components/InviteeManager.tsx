'use client';

import { useEffect, useState } from 'react';
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
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { foldAway } from '@/lib/motion';

import {
	EMPTY_INVITEES,
	everyInviteeVoted,
	isSelectionEmpty,
	personKey,
	personName,
	selectionToInput,
	userIdsOf,
} from '../invitees';
import type { Invitee } from '../schema';
import { addInvitees, getInvitees, removeInvitee } from '../service';
import { InviteePicker } from './InviteePicker';
import { PeopleList } from './PeopleList';

type InviteeManagerProps = {
	pollId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called with the new list after every change. */
	onChanged: (invitees: Invitee[]) => void;
};


/**
 * The owner's list of Invitees of an Invite-only Poll that hasn't Ended: add
 * people, emails or Groups, and remove anyone who hasn't voted.
 */
export function InviteeManager({ pollId, open, onOpenChange, onChanged }: InviteeManagerProps) {
	const { t } = useLanguage();
	const [invitees, setInvitees] = useState<Invitee[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [selection, setSelection] = useState(EMPTY_INVITEES);
	const [isAdding, setIsAdding] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);
	// The Invitee the confirmation names; kept while it closes so its words don't change
	const [confirming, setConfirming] = useState<Invitee | null>(null);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isChecking, setIsChecking] = useState(false);

	useEffect(() => {
		if (!open) return;
		let ignore = false;
		settle(getInvitees(pollId)).then((result) => {
			if (ignore) return;
			if (result.ok) setInvitees(result.data);
			else setLoadFailed(true);
		});
		return () => {
			ignore = true;
		};
	}, [open, pollId]);

	const add = async () => {
		setIsAdding(true);
		const result = await settle(addInvitees(pollId, selectionToInput(selection)));
		setIsAdding(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'invitees.addFailed'));
			return;
		}
		setInvitees(result.data);
		setSelection(EMPTY_INVITEES);
		onChanged(result.data);
	};

	const refresh = async () => {
		const result = await settle(getInvitees(pollId));
		if (result.ok) setInvitees(result.data);
	};

	// Who has voted may have changed since the list loaded, and it decides whether removing Ends the Poll
	const askToRemove = async (invitee: Invitee) => {
		setConfirming(invitee);
		setIsConfirmOpen(true);
		setIsChecking(true);
		await refresh();
		setIsChecking(false);
	};

	const remove = async () => {
		if (!confirming || isRemoving) return;
		setIsConfirmOpen(false);
		setIsRemoving(true);
		const result = await settle(removeInvitee(pollId, confirming));
		if (!result.ok) {
			setIsRemoving(false);
			toast.error(apiErrorText(t, result, 'invitees.removeFailed'));
			// e.g. they voted meanwhile: show the list as it is now
			refresh();
			return;
		}
		// Stays removing while the row folds, so nothing else can be removed meanwhile
		const key = personKey(confirming);
		if (!result.data.some((invitee) => personKey(invitee) === key)) {
			await foldAway(document.querySelector(`[data-person="${CSS.escape(key)}"]`), 4);
		}
		setIsRemoving(false);
		setInvitees(result.data);
		onChanged(result.data);
	};

	const voted = invitees?.filter((invitee) => invitee.hasBallot).length ?? 0;
	const confirmingKey = confirming && personKey(confirming);
	const endsPoll = everyInviteeVoted(invitees?.filter((invitee) => personKey(invitee) !== confirmingKey) ?? []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				closeLabel={t('common.close')}
				className="max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md"
			>
				<DialogHeader className="pr-12">
					<DialogTitle>{t('invitees.title')}</DialogTitle>
					<DialogDescription>
						{invitees
							? t('invitees.summary', { count: invitees.length, voted })
							: t('invitees.description')}
					</DialogDescription>
				</DialogHeader>

				<DialogBody scroll>
					{invitees === null && !loadFailed && (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					)}
					{loadFailed && (
						<p className="py-2 text-caption-2 text-muted-foreground">{t('invitees.loadFailed')}</p>
					)}
					{invitees?.length === 0 && (
						<p className="py-2 text-caption-2 text-muted-foreground">{t('invitees.empty')}</p>
					)}
					{!!invitees?.length && (
						<PeopleList
							label={t('invitees.title')}
							people={invitees}
							onRemove={askToRemove}
							removingKey={isRemoving && confirming ? personKey(confirming) : null}
							disabled={isRemoving}
							// One who holds a Ballot can't be removed
							noteFor={(invitee) => (invitee.hasBallot ? t('invitees.voted') : null)}
						/>
					)}
				</DialogBody>

				<div className="space-y-3 border-t border-border p-4">
					<Label htmlFor="add-invitees">{t('invitees.addLabel')}</Label>
					<InviteePicker
						id="add-invitees"
						withGroups
						value={selection}
						onChange={setSelection}
						excludeUserIds={userIdsOf(invitees, loadFailed)}
					/>
					<div className="flex justify-end">
						<Button
							type="button"
							disabled={isSelectionEmpty(selection)}
							loading={isAdding}
							onClick={add}
						>
							{t('invitees.add')}
						</Button>
					</div>
				</div>
			</DialogContent>

			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t('invitees.removeTitle', { name: confirming ? personName(confirming) : '' })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t(endsPoll ? 'invitees.removeEndsBody' : 'invitees.removeBody')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction variant="destructive" loading={isChecking} onClick={remove}>
							{t(endsPoll ? 'invitees.removeAndEnd' : 'invitees.removeConfirm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}
