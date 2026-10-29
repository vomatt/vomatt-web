'use client';

import { useEffect, useState } from 'react';
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
import { Spinner } from '@/components/ui/Spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatFromNow, formatPollDate } from '@/features/polls/format';
import { apiErrorText } from '@/lib/api/error-text';
import { loginHref } from '@/lib/routes';
import type { SignedInSession } from '@/types/user';

import { deviceName } from './deviceName';
import { getSessions, revokeOtherSessions, revokeSession } from './service';

/** `others` signs out every other device; otherwise the one session. */
type Confirming = SignedInSession | 'others';

/**
 * Settings: the devices the user is signed in on, each removable after a
 * confirmation, and Sign out other devices. A row inside the Account card.
 */
export function SessionsPanel() {
	const { t, currentLanguage } = useLanguage();
	const [sessions, setSessions] = useState<SignedInSession[] | null>(null);
	const [loadFailed, setLoadFailed] = useState(false);
	const [confirming, setConfirming] = useState<Confirming | null>(null);
	const [isSigningOut, setIsSigningOut] = useState(false);

	const goToLogin = () => {
		window.location.assign(loginHref({ sessionExpired: 'revoked' }));
	};

	// Bumped by Try again to load the list once more
	const [loadCount, setLoadCount] = useState(0);

	useEffect(() => {
		let ignore = false;
		getSessions().then((result) => {
			if (ignore) return;
			if (!result.ok && result.errorCode === 'auth.session_revoked') {
				goToLogin();
				return;
			}
			setLoadFailed(!result.ok);
			if (result.ok) setSessions(result.data);
			else setSessions(null);
		});
		return () => {
			ignore = true;
		};
	}, [loadCount]);

	const signOut = async (event: React.MouseEvent) => {
		// Keep the dialog open (and the button loading) until the request settles
		event.preventDefault();
		if (!confirming || isSigningOut) return;
		setIsSigningOut(true);
		const target = confirming;
		const result = target === 'others' ? await revokeOtherSessions() : await revokeSession(target.sessionId);
		setIsSigningOut(false);
		setConfirming(null);
		if (!result.ok && result.errorCode === 'auth.session_revoked') {
			// This device's own sign-in was ended elsewhere
			goToLogin();
			return;
		}
		// Already gone is the outcome the user wanted
		const alreadyGone = !result.ok && result.errorCode === 'auth.session_not_found';
		if (!result.ok && !alreadyGone) {
			toast.error(apiErrorText(t, result, 'sessions.signOutFailed'), { duration: Infinity });
			return;
		}
		toast.success(t(target === 'others' ? 'sessions.othersSignedOut' : 'sessions.signedOut'));
		// The list may have changed meanwhile; reload rather than patch it
		setLoadCount((n) => n + 1);
	};

	const nameOf = (session: SignedInSession) =>
		session.adminScope
			? t('sessions.adminConsole')
			: (deviceName(session.userAgent) ?? t('sessions.unknownDevice'));

	const hasOthers = sessions?.some((session) => !session.current) ?? false;

	return (
		<section aria-labelledby="sessions-title" className="space-y-2.5">
			<div className="flex flex-wrap items-center gap-4">
				<span className="min-w-0 flex-1">
					<h3 id="sessions-title" className="font-medium">
						{t('sessions.title')}
					</h3>
					<span className="block text-[13px] leading-[1.45] text-muted-foreground">{t('sessions.body')}</span>
				</span>
				{hasOthers && (
					<Button variant="outline" size="md" onClick={() => setConfirming('others')}>
						{t('sessions.signOutOthers')}
					</Button>
				)}
			</div>
			{sessions === null && !loadFailed && (
				<div className="flex justify-center py-2">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<p className="flex-1 text-[13px] text-muted-foreground">{t('sessions.loadFailed')}</p>
					<Button
						variant="outline"
						size="xs"
						onClick={() => {
							setLoadFailed(false);
							setLoadCount((n) => n + 1);
						}}
					>
						{t('common.tryAgain')}
					</Button>
				</div>
			)}
			{sessions?.length === 0 && <p className="text-[13px] text-muted-foreground">{t('sessions.empty')}</p>}
			{!!sessions?.length && (
				<ul className="flex flex-col gap-2.5">
					{sessions.map((session) => (
						<li
							key={session.sessionId}
							className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-soft px-2.5 py-2"
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-[14px] font-medium">
									{nameOf(session)}
									{session.current && (
										<span className="ml-2 text-[12px] font-normal text-muted-foreground">
											{t('sessions.thisDevice')}
										</span>
									)}
								</span>
								<span className="block font-mono text-[12px] text-muted-foreground">
									{session.lastSeenAt
										? t('sessions.lastActive', { time: formatFromNow(session.lastSeenAt, currentLanguage) })
										: t('sessions.activityUnknown')}
									{session.createdAt &&
										` · ${t('sessions.signedInOn', { date: formatPollDate(session.createdAt, currentLanguage) })}`}
								</span>
							</span>
							{!session.current && (
								<Button
									variant="outline"
									size="xs"
									aria-label={t('sessions.signOutLabel', { name: nameOf(session) })}
									onClick={() => setConfirming(session)}
								>
									{t('sessions.signOut')}
								</Button>
							)}
						</li>
					))}
				</ul>
			)}
			<AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t(confirming === 'others' ? 'sessions.signOutOthersConfirmTitle' : 'sessions.signOutConfirmTitle')}
						</AlertDialogTitle>
						<AlertDialogDescription className="wrap-anywhere">
							{confirming === 'others'
								? t('sessions.signOutOthersConfirmBody')
								: confirming && t('sessions.signOutConfirmBody', { name: nameOf(confirming) })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
						<AlertDialogAction loading={isSigningOut} onClick={signOut} variant="destructive">
							{t(confirming === 'others' ? 'sessions.signOutOthers' : 'sessions.signOut')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
