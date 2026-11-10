'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { EmptyCard } from '@/components/EmptyCard';
import { buttonVariants } from '@/components/ui/Button';
import { Users } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

import { SwitchBackButton, useActing } from './ActingProvider';
import { accountName, communityMembersHref } from './schema';

/**
 * Settings while acting: they're the person's own (passkeys, sessions, phone, deletion are refused for an account),
 * so the page points back to the person and to the account's members instead.
 */
export function ActingSettingsNotice() {
	const { t } = useLanguage();
	const { acting } = useActing();
	if (!acting) return null;
	return (
		<EmptyCard
			icon={<Users />}
			title={t('communities.acting.settingsTitle')}
			body={t('communities.acting.settingsBody', { name: accountName(acting) })}
			action={
				<div className="flex flex-wrap justify-center gap-2">
					<SwitchBackButton />
					<Link href={communityMembersHref(acting.communityId)} className={buttonVariants({ variant: 'outline' })}>
						{t('communities.acting.manageMembers')}
					</Link>
				</div>
			}
		/>
	);
}

/** A page reached from Settings: while acting, the notice takes its place, as on Settings itself. */
export function PersonalSettings({ children }: { children: ReactNode }) {
	const { acting } = useActing();
	return acting ? <ActingSettingsNotice /> : children;
}
