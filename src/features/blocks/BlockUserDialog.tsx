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
import { blockUser } from '@/features/blocks/service';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';

/** Confirms, then blocks another user. */
export function BlockUserDialog({
	userId,
	username,
	open,
	onOpenChange,
	onBlocked,
}: {
	userId: string;
	username: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onBlocked?: () => void;
}) {
	const { t } = useLanguage();
	const [isBlocking, setIsBlocking] = useState(false);

	const block = async () => {
		setIsBlocking(true);
		const result = await settle(blockUser(userId)).finally(() => setIsBlocking(false));
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.blockFailed'), { duration: Infinity });
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
