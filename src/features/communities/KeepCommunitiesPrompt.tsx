'use client';

import { useState } from 'react';

import type { CommunityQuota } from '@/types/user';

import { useActing } from './ActingProvider';
import { KeepCommunitiesDialog } from './KeepCommunitiesDialog';

/** Asks once per visit, on any page, which community accounts to keep; Settings asks again until they choose. */
export function KeepCommunitiesPrompt({ quota }: { quota: CommunityQuota }) {
	const { communities } = useActing();
	const [open, setOpen] = useState(true);
	// The list loads after the page; there is nothing to choose from until then
	if (!communities) return null;
	return <KeepCommunitiesDialog open={open} onOpenChange={setOpen} quota={quota} communities={communities} />;
}
