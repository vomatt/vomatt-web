'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { rowClassName, RowText, SettingsCard } from '@/components/SettingsCard';
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
import { settle } from '@/lib/api/settle';
import { META_GAP } from '@/lib/rich';
import { loginHref } from '@/lib/routes';
import type { SignedInSession } from '@/types/user';

import { deviceName } from './deviceName';
import { getSessions, revokeOtherSessions, revokeSession } from './service';

/** `others` signs out every other device; otherwise the one session. */
type Confirming = SignedInSession | 'others';

/**
 * Settings › Signed-in devices: this device, then the others, each removable
 * after a confirmation, with Sign out other devices.
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
		settle(getSessions()).then((result) => {
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

	const signOut = async () => {
		if (!confirming || isSigningOut) return;
		setIsSigningOut(true);
		const target = confirming;
		const result = await settle(target === 'others' ? revokeOtherSessions() : revokeSession(target.sessionId));
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

	const current = sessions?.find((session) => session.current);
	const others = sessions?.filter((session) => !session.current) ?? [];

	const row = (session: SignedInSession) => (
		<li key={session.sessionId} className={rowClassName}>
			<RowText
				title={nameOf(session)}
				body={
					<>
						{session.lastSeenAt
							? t('sessions.lastActive', { time: formatFromNow(session.lastSeenAt, currentLanguage) })
							: t('sessions.activityUnknown')}
						{session.createdAt &&
							`${META_GAP}${t('sessions.signedInOn', { date: formatPollDate(session.createdAt, currentLanguage) })}`}
					</>
				}
			/>
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
	);

	return (
		<div className="flex flex-col gap-8">
			<p className="text-body-4 text-muted-foreground">{t('sessions.body')}</p>
			{sessions === null && !loadFailed && (
				<div className="flex justify-center py-2">
					<Spinner />
				</div>
			)}
			{loadFailed && (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<p className="flex-1 text-body-4 text-muted-foreground">{t('sessions.loadFailed')}</p>
					<Button
						variant="outline"
						size="md"
						onClick={() => {
							setLoadFailed(false);
							setLoadCount((n) => n + 1);
						}}
					>
						{t('common.tryAgain')}
					</Button>
				</div>
			)}
			{current && (
				<section aria-labelledby="this-device-title" className="flex flex-col gap-3">
					<h2 id="this-device-title" className="text-title-4">
						{t('sessions.thisDevice')}
					</h2>
					<SettingsCard as="ul">{row(current)}</SettingsCard>
				</section>
			)}
			{sessions && (
				<section aria-labelledby="other-devices-title" className="flex flex-col gap-3">
					<div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2">
						<h2 id="other-devices-title" className="flex-1 text-title-4">
							{t('sessions.otherDevices')}
						</h2>
						{others.length > 0 && (
							<Button variant="outline" size="md" onClick={() => setConfirming('others')}>
								{t('sessions.signOutOthers')}
							</Button>
						)}
					</div>
					{others.length > 0 ? (
						<SettingsCard as="ul">{others.map(row)}</SettingsCard>
					) : (
						<p className="empty-state">{t('sessions.empty')}</p>
					)}
				</section>
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
		</div>
	);
}
