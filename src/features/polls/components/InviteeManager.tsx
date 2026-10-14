'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ButtonLoading } from '@/components/ButtonLoading';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/Dialog';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { Label } from '@/components/ui/Label';
import { Spinner } from '@/components/ui/Spinner';
import { X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

import { EMPTY_INVITEES, isSelectionEmpty, selectionToInput } from '../invitees';
import type { Invitee } from '../schema';
import { addInvitees, getInvitees, removeInvitee } from '../service';
import { InviteePicker } from './InviteePicker';

type InviteeManagerProps = {
	pollId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The Invitee count changed, or removing someone ended the Poll. */
	onChanged: () => void;
};

const inviteeKey = (invitee: Invitee) => invitee.email ?? invitee.userId ?? '';

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
		getInvitees(pollId).then((result) => {
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
		const result = await addInvitees(pollId, selectionToInput(selection));
		setIsAdding(false);
		if (!result.ok) {
			toast.error(result.message || t('invitees.addFailed'));
			return;
		}
		setInvitees(result.data);
		setSelection(EMPTY_INVITEES);
		onChanged();
	};

	const remove = async (invitee: Invitee) => {
		setRemoving(inviteeKey(invitee));
		const result = await removeInvitee(pollId, invitee);
		setRemoving(null);
		if (!result.ok) {
			toast.error(result.message || t('invitees.removeFailed'));
			return;
		}
		setInvitees(result.data);
		onChanged();
	};

	const voted = invitees?.filter((invitee) => invitee.hasBallot).length ?? 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
				<DialogHeader className="pr-8">
					<DialogTitle>{t('invitees.title')}</DialogTitle>
					<DialogDescription>
						{invitees
							? t('invitees.summary', { count: invitees.length, voted })
							: t('invitees.description')}
					</DialogDescription>
				</DialogHeader>

				<div className="-mx-4 overflow-y-auto px-4">
					{invitees === null && !loadFailed && (
						<div className="flex justify-center py-4">
							<Spinner />
						</div>
					)}
					{loadFailed && (
						<p className="py-2 text-[13px] text-muted-foreground">{t('invitees.loadFailed')}</p>
					)}
					{invitees?.length === 0 && (
						<p className="py-2 text-[13px] text-muted-foreground">{t('invitees.empty')}</p>
					)}
					{!!invitees?.length && (
						<ul aria-label={t('invitees.title')} className="space-y-1">
							{invitees.map((invitee) => {
								const name = invitee.username ?? invitee.email ?? '';
								return (
									<li key={inviteeKey(invitee)} className="flex min-h-11 items-center gap-3 text-[15px]">
										<InitialAvatar name={name} />
										<span className="min-w-0 flex-1 truncate">{name}</span>
										{invitee.hasBallot ? (
											// One who holds a Ballot can't be removed
											<span className="text-[13px] text-muted-foreground">{t('invitees.voted')}</span>
										) : (
											<button
												type="button"
												aria-label={t('invitees.remove', { name })}
												disabled={removing !== null}
												onClick={() => remove(invitee)}
												className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:text-destructive disabled:opacity-50"
											>
												{removing === inviteeKey(invitee) ? <Spinner /> : <X className="size-4" />}
											</button>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="space-y-3 border-t border-border pt-4">
					<Label htmlFor="add-invitees">{t('invitees.addLabel')}</Label>
					<InviteePicker id="add-invitees" withGroups value={selection} onChange={setSelection} />
					<div className="flex justify-end">
						<ButtonLoading
							type="button"
							disabled={isSelectionEmpty(selection) || isAdding}
							isLoading={isAdding}
							onClick={add}
						>
							{t('invitees.add')}
						</ButtonLoading>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
