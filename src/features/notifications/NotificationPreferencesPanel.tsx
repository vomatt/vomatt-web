'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';

import type { NotificationPreferences } from './schema';
import { getNotificationPreferences, updateNotificationPreferences } from './service';

const SWITCHES = ['resultsIn', 'invitations', 'comments', 'closingSoon'] as const;

/** Which kinds appear in the feed and the unread count. New followers have no switch. */
export function NotificationPreferencesPanel() {
	const { t } = useLanguage();
	const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
	const [failed, setFailed] = useState(false);
	// The last values the server confirmed; quick toggles can answer out of order
	const saved = useRef<NotificationPreferences | null>(null);
	const [announcement, setAnnouncement] = useState('');

	// Bumped to try loading again
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		let ignore = false;
		settle(getNotificationPreferences()).then((result) => {
			if (ignore) return;
			if (!result.ok) return setFailed(true);
			saved.current = result.data;
			setPrefs(result.data);
		});
		return () => {
			ignore = true;
		};
	}, [attempt]);

	const retry = () => {
		setFailed(false);
		setAttempt((count) => count + 1);
	};

	const toggle = async (key: (typeof SWITCHES)[number], value: boolean) => {
		setPrefs((current) => current && { ...current, [key]: value });
		const result = await settle(updateNotificationPreferences({ [key]: value }));
		if (!result.ok) {
			setPrefs((current) => current && { ...current, [key]: saved.current?.[key] ?? !value });
			toast.error(apiErrorText(t, result, 'notifications.prefs.saveFailed'), { duration: Infinity });
			return;
		}
		// Only this key: the response's other keys may predate a concurrent toggle's save
		if (saved.current) saved.current = { ...saved.current, [key]: result.data[key] };
		setAnnouncement(t(`notifications.prefs.${value ? 'on' : 'off'}`, { name: t(`notifications.prefs.${key}`) }));
	};

	if (failed) {
		return (
			<div className="empty-state space-y-3 rounded-2xl border border-border bg-card">
				<p>{t('notifications.prefs.loadFailed')}</p>
				<Button variant="outline" size="sm" onClick={retry}>
					{t('common.tryAgain')}
				</Button>
			</div>
		);
	}
	if (!prefs) {
		return (
			<div aria-hidden className="divide-y divide-border rounded-2xl border border-border bg-card">
				{SWITCHES.map((key) => (
					<div key={key} className="flex min-h-15 items-center gap-4 px-4.5 py-3">
						<Skeleton className="h-4 w-2/3" />
					</div>
				))}
			</div>
		);
	}

	return (
		<>
			<p aria-live="polite" className="sr-only">
				{announcement}
			</p>
			<div className="divide-y divide-border rounded-2xl border border-border bg-card">
				{SWITCHES.map((key) => (
					<label key={key} htmlFor={`notify-${key}`} className="flex min-h-15 cursor-pointer items-center gap-4 px-4.5 py-3">
						<span className="min-w-0 flex-1">
							<span id={`notify-${key}-label`} className="block font-medium">
								{t(`notifications.prefs.${key}`)}
							</span>
							<span id={`notify-${key}-body`} className="block text-[13px] leading-snug text-muted-foreground">
								{t(`notifications.prefs.${key}Body`)}
							</span>
						</span>
						<Switch
							id={`notify-${key}`}
							aria-labelledby={`notify-${key}-label`}
							aria-describedby={`notify-${key}-body`}
							checked={prefs[key]}
							onCheckedChange={(value) => toggle(key, value)}
						/>
					</label>
				))}
			</div>
			<p className="px-1 text-[13px] text-muted-foreground">{t('notifications.prefs.note')}</p>
		</>
	);
}
