'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

import { EMPTY_INVITEES, isSelectionEmpty, personKey, selectionToInput, userIdsOf } from '../invitees';
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
	const [removing, setRemoving] = useState<string | null>(null);

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

	const remove = async (invitee: Invitee) => {
		setRemoving(personKey(invitee));
		const result = await settle(removeInvitee(pollId, invitee));
		setRemoving(null);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'invitees.removeFailed'));
			return;
		}
		setInvitees(result.data);
		onChanged(result.data);
	};

	const voted = invitees?.filter((invitee) => invitee.hasBallot).length ?? 0;

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
							onRemove={remove}
							removingKey={removing}
							disabled={removing !== null}
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
		</Dialog>
	);
}
