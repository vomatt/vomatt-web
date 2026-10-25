'use client';

import Link from 'next/link';
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
import { blockUser, unblockUser } from '@/features/blocks/service';
import { apiErrorText } from '@/lib/api/error-text';

/** Blocks another user after a confirmation, or unblocks them at once. The parent owns the state. */
export default function BlockButton({
	userId,
	username,
	isBlocked,
	onChange,
}: {
	userId: string;
	username: string;
	isBlocked: boolean;
	onChange: (isBlocked: boolean) => void;
}) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const unblock = async () => {
		setIsPending(true);
		const result = await unblockUser(userId);
		setIsPending(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.unblockFailed'), { duration: Infinity });
			return;
		}
		onChange(false);
		toast.success(t('blocks.unblocked', { username }));
	};

	const block = async () => {
		setIsPending(true);
		const result = await blockUser(userId);
		setIsPending(false);
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.blockFailed'), { duration: Infinity });
			return;
		}
		setOpen(false);
		onChange(true);
		toast.success(t('blocks.blocked', { username }), {
			description: (
				<Link href="/settings" className="underline underline-offset-3">
					{t('blocks.manage')}
				</Link>
			),
		});
	};

	if (isBlocked) {
		return (
			<Button variant="outline" size="sm" loading={isPending} onClick={unblock}>
				{t('blocks.unblock')}
			</Button>
		);
	}

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
				{t('blocks.block')}
			</Button>
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('blocks.confirmTitle', { username })}</AlertDialogTitle>
						<AlertDialogDescription>{t('blocks.confirmBody')}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction variant="destructive" loading={isPending} onClick={block}>
							{t('blocks.block')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
