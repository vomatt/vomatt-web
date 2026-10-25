'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlockUserDialog } from '@/features/blocks/BlockUserDialog';
import { unblockUser } from '@/features/blocks/service';
import { useFocusAfterRender } from '@/hooks/useFocusAfterRender';
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
	// Blocking swaps the Block button for Unblock, so focus moves there instead of falling to the page
	const [unblockButton, focusUnblock] = useFocusAfterRender<HTMLButtonElement>();

	const unblock = async () => {
		setIsPending(true);
		const result = await unblockUser(userId).finally(() => setIsPending(false));
		if (!result.ok) {
			toast.error(apiErrorText(t, result, 'blocks.unblockFailed'), { duration: Infinity });
			return;
		}
		onChange(false);
		toast.success(t('blocks.unblocked', { username }));
	};

	if (isBlocked) {
		return (
			<Button ref={unblockButton} variant="outline" size="sm" loading={isPending} onClick={unblock}>
				{t('blocks.unblock')}
			</Button>
		);
	}

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
				{t('blocks.block')}
			</Button>
			<BlockUserDialog
				userId={userId}
				username={username}
				open={open}
				onOpenChange={setOpen}
				onBlocked={() => {
					onChange(true);
					focusUnblock();
				}}
			/>
		</>
	);
}
