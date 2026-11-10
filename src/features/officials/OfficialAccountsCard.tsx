'use client';

import Link from 'next/link';

import { rowLinkClassName, RowText, SettingsCard } from '@/components/SettingsCard';
import { ChevronRight } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';

import { type MyOfficial, officialMembersHref } from './schema';

/** Settings' official accounts: each one the user belongs to, opening its members page. */
export function OfficialAccountsCard({ officials }: { officials: MyOfficial[] }) {
	const { t } = useLanguage();
	return (
		<SettingsCard as="ul">
			{officials.map((official) => (
				<li key={official.officialId}>
					<Link
						href={officialMembersHref(official.officialId)}
						className={rowLinkClassName}
					>
						<UserAvatar username={official.username} avatarUrl={official.avatarUrl} className="size-9" />
						<RowText
							title={official.displayName || official.username}
							body={t('officials.yourRole', { role: t(`officials.roles.${official.role}`) })}
						/>
						<ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
					</Link>
				</li>
			))}
		</SettingsCard>
	);
}
