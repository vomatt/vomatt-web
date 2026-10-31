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
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPollDate } from '@/features/polls/format';
import { apiErrorText } from '@/lib/api/error-text';
import type { Passkey } from '@/types/user';

import { AddPasskeyButton } from './AddPasskeyButton';
import { deletePasskey, getPasskeys } from './service';
import { useSupportsPasskeys } from './support';

/**
 * Settings: the user's passkeys, each removable after a confirmation, and Add
 * passkey when this browser can make one. A row inside the Account card.
 */
export function PasskeysPanel() {
	const { t, currentLanguage } = useLanguage();
	const supportsPasskeys = useSupportsPasskeys();
	const [passkeys, setPasskeys] = useState<Passkey[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [confirming, setConfirming] = useState<Passkey | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Bumped by Try again and after an add to load the list once more
	const [loadCount, setLoadCount] = useState(0);
	const reload = () => setLoadCount((n) => n + 1);

	useEffect(() => {
		let ignore = false;
		getPasskeys().then((result) => {
			if (ignore) return;
			setLoadFailed(!result.ok);
			if (result.ok) setPasskeys(result.data);
		});
		return () => {
			ignore = true;
		};
	}, [loadCount]);

	const remove = async () => {
		if (!confirming) return;
		setIsDeleting(true);
		const result = await deletePasskey(confirming.id);
		setIsDeleting(false);
		setConfirming(null);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'passkey.deleteFailed'), { duration: Infinity });
			return;
		}
		setPasskeys((list) => list?.filter((passkey) => passkey.id !== confirming.id) ?? null);
		toast.success(t('passkey.deleted'));
	};

	const nameOf = (passkey: Passkey) => passkey.name ?? t('passkey.unnamed');

	return (
		<section aria-labelledby="passkeys-title" className="space-y-2.5">
			<div className="flex flex-wrap items-center gap-4">
				<span className="min-w-0 flex-1">
					<h3 id="passkeys-title" className="font-medium">
						{t('passkey.title')}
					</h3>
					<span className="block text-[13px] leading-[1.45] text-muted-foreground">{t('passkey.body')}</span>
				</span>
				{supportsPasskeys && <AddPasskeyButton onAdded={reload} />}
			</div>
			{passkeys === null && !loadFailed && (
				<div className="flex justify-center py-2">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<p className="flex-1 text-[13px] text-muted-foreground">{t('passkey.loadFailed')}</p>
					<Button
						variant="outline"
						size="xs"
						onClick={() => {
							setLoadFailed(false);
							reload();
						}}
					>
						{t('common.tryAgain')}
					</Button>
				</div>
			)}
			{passkeys?.length === 0 && <p className="text-[13px] text-muted-foreground">{t('passkey.empty')}</p>}
			{!!passkeys?.length && (
				<ul className="flex flex-col gap-2.5">
					{passkeys.map((passkey) => (
						<li
							key={passkey.id}
							className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-soft px-2.5 py-2"
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-[14px] font-medium">{nameOf(passkey)}</span>
								<span className="block text-[12px] text-muted-foreground">
									{t('passkey.created', { date: formatPollDate(passkey.createdAt, currentLanguage) })}
									{' · '}
									{passkey.lastUsedAt
										? t('passkey.lastUsed', { date: formatPollDate(passkey.lastUsedAt, currentLanguage) })
										: t('passkey.neverUsed')}
								</span>
							</span>
							<Button
								variant="outline"
								size="xs"
								aria-label={t('passkey.deleteLabel', { name: nameOf(passkey) })}
								onClick={() => setConfirming(passkey)}
							>
								{t('passkey.delete')}
							</Button>
						</li>
					))}
				</ul>
			)}
			<AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('passkey.deleteConfirmTitle')}</AlertDialogTitle>
						<AlertDialogDescription className="wrap-anywhere">
							{confirming && t('passkey.deleteConfirmBody', { name: nameOf(confirming) })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction loading={isDeleting} onClick={remove} variant="destructive">
							{t('passkey.delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
