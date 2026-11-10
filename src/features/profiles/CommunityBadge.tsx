'use client';

import { Check } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/** Marks a community account (a group's page), right after its name: an ink check, not Volt, which marks what is yours. */
export function CommunityBadge({ className }: { className?: string }) {
	const { t } = useLanguage();
	const label = t('profile.community');
	return (
		<span
			role="img"
			aria-label={label}
			title={label}
			className={cn(
				'inline-grid size-3.5 shrink-0 place-items-center rounded-full bg-primary align-[-0.125em] text-primary-foreground',
				className
			)}
		>
			<Check aria-hidden size={9} strokeWidth={3.5} />
		</span>
	);
}
