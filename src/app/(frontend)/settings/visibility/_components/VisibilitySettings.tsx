'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { rowClassName, RowText, SettingsCard } from '@/components/SettingsCard';
import { Switch } from '@/components/ui/Switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { isSettingPublic, VISIBILITY_SETTINGS, type VisibilitySetting } from '@/features/account/visibility';
import { realName } from '@/features/profiles/name';
import { PublicPreview } from '@/features/profiles/PublicPreview';
import { useSavingKeys } from '@/hooks/useSavingKeys';
import { updateVisibility } from '@/lib/api/services/users';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { MyProfile } from '@/types/user';

/**
 * Settings › What others see: a switch per visibility setting, each saved at once and put back if the
 * save fails, over the profile as visitors get it.
 */
export function VisibilitySettings({ profile }: { profile: MyProfile }) {
	const { t } = useLanguage();
	const router = useRouter();
	const [visibility, setVisibility] = useState(profile.visibilitySettings ?? {});
	// The last settings the server confirmed; a failed save goes back to them
	const saved = useRef(visibility);
	const [saving, setSavingKey] = useSavingKeys<VisibilitySetting['key']>();
	// Read out by screen readers after each save; the switch itself shows the change
	const [announcement, setAnnouncement] = useState('');

	const toggle = async (setting: VisibilitySetting, value: boolean) => {
		const changes = Object.fromEntries(setting.fields.map((field) => [field, value]));
		setVisibility((current) => ({ ...current, ...changes }));
		setSavingKey(setting.key, true);
		try {
			await updateVisibility(changes);
			saved.current = { ...saved.current, ...changes };
			// Back would otherwise restore this page and Settings' count from before the save
			router.refresh();
			const field = t(`profile.${setting.key}`);
			setAnnouncement(t(value ? 'settings.visibilityOn' : 'settings.visibilityOff', { field }));
		} catch {
			// Only this setting's fields: another switch may still be saving
			const previous = Object.fromEntries(setting.fields.map((field) => [field, saved.current[field]]));
			setVisibility((current) => ({ ...current, ...previous }));
			toast.error(t('account.saveFailed'), { duration: Infinity });
		} finally {
			setSavingKey(setting.key, false);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<p role="status" className="sr-only">
				{announcement}
			</p>
			<p className="text-body-4 text-muted-foreground">{t('settings.visibilityIntro')}</p>
			<div className="flex flex-col gap-3">
				<SettingsCard>
					{VISIBILITY_SETTINGS.map((setting) => {
						const id = `visibility-${setting.key}`;
						const value = setting.key === 'realName' ? realName(profile) : profile[setting.fields[0]];
						return (
							<label key={setting.key} htmlFor={id} className={cn(rowClassName, 'cursor-pointer')}>
								<RowText
									id={id}
									title={t(`profile.${setting.key}`)}
									body={<span className="block truncate">{value || t('settings.visibilityNotSet')}</span>}
								/>
								<Switch
									id={id}
									aria-labelledby={`${id}-label`}
									aria-describedby={`${id}-body`}
									checked={isSettingPublic(visibility, setting)}
									disabled={saving.has(setting.key)}
									onCheckedChange={(checked) => toggle(setting, checked)}
								/>
							</label>
						);
					})}
				</SettingsCard>
				<Link
					href={`${profileHref(profile.username)}?edit=1`}
					className="self-start rounded-sm text-caption-1 text-muted-foreground underline underline-offset-3 transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
				>
					{t('settings.visibilityEditDetails')}
				</Link>
			</div>
			<PublicPreview profile={{ ...profile, visibilitySettings: visibility }} />
		</div>
	);
}
