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
import { blockUserByUsername } from '@/features/blocks/service';
import { apiErrorText } from '@/lib/api/error-text';

/** Blocks another user after a confirmation; unblocking lives in Settings. */
export default function BlockButton({ username }: { username: string }) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
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
		setOpen(false);
		toast.success(t('blocks.blocked', { username }), {
			description: (
				<Link href="/settings" className="underline underline-offset-3">
					{t('blocks.manage')}
				</Link>
			),
		});
	};

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
						<AlertDialogAction variant="destructive" loading={isBlocking} onClick={block}>
							{t('blocks.block')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
