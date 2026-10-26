'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlockUserDialog } from '@/features/blocks/BlockUserDialog';
import { unblockUser } from '@/features/blocks/service';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';

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
		const result = await settle(unblockUser(userId)).finally(() => setIsPending(false));
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.unblockFailed'), { duration: Infinity });
			return;
		}
		onChange(false);
		toast.success(t('blocks.unblocked', { username }));
	};

	// One button for both states, so after a block the dialog returns focus to the same element, now Unblock
	return (
		<>
			<Button variant="outline" size="sm" loading={isPending} onClick={isBlocked ? unblock : () => setOpen(true)}>
				{isBlocked ? t('blocks.unblock') : t('blocks.block')}
			</Button>
			<BlockUserDialog
				userId={userId}
				username={username}
				open={open}
				onOpenChange={setOpen}
				onBlocked={() => onChange(true)}
			/>
		</>
	);
}
