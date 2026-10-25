'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlockUserDialog } from '@/features/blocks/BlockUserDialog';

/** Blocks another user after a confirmation; unblocking lives in Settings. */
export default function BlockButton({ username }: { username: string }) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button variant="outline" size="sm" onClick={() => setOpen(true)}>
				{t('blocks.block')}
			</Button>
			<BlockUserDialog username={username} open={open} onOpenChange={setOpen} />
		</>
	);
}
