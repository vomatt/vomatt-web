'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlockUserDialog } from '@/features/blocks/BlockUserDialog';

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
			<BlockUserDialog username={username} open={open} onOpenChange={setOpen} />
		</>
	);
}
