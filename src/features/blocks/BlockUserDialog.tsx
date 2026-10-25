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
import { useLanguage } from '@/contexts/LanguageContext';
import { blockUserByUsername } from '@/features/blocks/service';
import { apiErrorText } from '@/lib/api/error-text';

/** Confirms, then blocks another user; unblocking lives in Settings. */
export function BlockUserDialog({
	username,
	open,
	onOpenChange,
	onBlocked,
}: {
	username: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onBlocked?: () => void;
}) {
	const { t } = useLanguage();
	const [isBlocking, setIsBlocking] = useState(false);

	const block = async () => {
		setIsBlocking(true);
		const result = await blockUserByUsername(username);
		setIsBlocking(false);
		if (!result.ok || !result.data.found) {
			toast.error(result.ok ? t('blocks.blockFailed') : apiErrorText(t, result, 'blocks.blockFailed'), {
				duration: Infinity,
			});
			return;
		}
		onOpenChange(false);
		onBlocked?.();
		toast.success(t('blocks.blocked', { username }), {
			description: (
				<Link href="/settings" className="underline underline-offset-3">
					{t('blocks.manage')}
				</Link>
			),
		});
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t('blocks.confirmTitle', { username })}</AlertDialogTitle>
					<AlertDialogDescription>{t('blocks.confirmBody')}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
					<AlertDialogAction variant="destructive" loading={isBlocking} onClick={block}>
						{t('blocks.block')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
