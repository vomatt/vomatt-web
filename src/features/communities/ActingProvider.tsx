'use client';

import { useRouter } from 'next/navigation';
import { type ComponentProps, createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ActingState } from '@/data/auth';
import { apiErrorText } from '@/lib/api/error-text';

import { actAsCommunity, loadMyCommunities } from './acting';
import { accountName, type MyCommunity } from './schema';

type ActingContextValue = ActingState & {
	/** A switch is under way, from any of the buttons that start one. */
	busy: boolean;
	setBusy: (busy: boolean) => void;
};

const ActingContext = createContext<ActingContextValue>({
	acting: null,
	me: null,
	communities: [],
	stale: false,
	busy: false,
	setBusy: () => {},
});

/** Who the signed-in user is acting as, for the switcher, the banner and what a community can't do. */
export function ActingProvider({ state, children }: { state: ActingState; children: ReactNode }) {
	const { t } = useLanguage();
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [loaded, setLoaded] = useState<{ for: string; communities: MyCommunity[] } | null>(null);
	// Fetched in the background when the layout didn't need them (the user acts as nobody)
	// Keyed by the user: `state` is a new object on every server render of the layout
	const username = state.me?.username;
	const needsList = state.communities === null && !!username;
	useEffect(() => {
		if (!needsList) return;
		let current = true;
		void loadMyCommunities().then((result) => current && result.ok && setLoaded({ for: username, communities: result.data }));
		return () => {
			current = false;
		};
	}, [needsList, username]);
	// The cookie names an account they can no longer act as (removed, or the role changed): go back to the user, once
	useEffect(() => {
		if (!state.stale) return;
		toast.info(t('communities.acting.ended'), { id: 'acting-ended' });
		void actAsCommunity(null).then(() => router.refresh());
		// t is a new function each render; this runs once per stale state
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.stale, router]);

	const communities = state.communities ?? (loaded && loaded.for === username ? loaded.communities : null);
	const value = useMemo(() => ({ ...state, communities, busy, setBusy }), [state, communities, busy]);
	return <ActingContext.Provider value={value}>{children}</ActingContext.Provider>;
}

export function useActing() {
	return useContext(ActingContext);
}

/** Switches to a community account, or with null back to the user; every page then reloads as that account. */
export function useSwitchAccount() {
	const { t } = useLanguage();
	const router = useRouter();
	const { busy, setBusy } = useActing();

	const switchTo = async (community: MyCommunity | null) => {
		if (busy) return;
		setBusy(true);
		const result = await actAsCommunity(community?.communityId ?? null);
		if (!result.ok) toast.error(apiErrorText(t, result, 'communities.acting.switchFailed'));
		else if (community) toast.success(t('communities.acting.switched', { name: accountName(community) }));
		else toast.success(t('communities.acting.switchedBack'));
		router.refresh();
		// A switch remounts the tree on the new account; a failed one stays here and can be tried again
		setBusy(false);
	};
	return { switchTo, busy };
}

/** Switch back to you: ends acting from wherever the user notices they're the community. */
export function SwitchBackButton(props: Omit<ComponentProps<typeof Button>, 'onClick' | 'children'>) {
	const { t } = useLanguage();
	const { switchTo, busy } = useSwitchAccount();
	return (
		<Button {...props} aria-disabled={busy} onClick={() => switchTo(null)}>
			{t('communities.acting.switchBack')}
		</Button>
	);
}
