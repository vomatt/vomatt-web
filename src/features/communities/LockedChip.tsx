'use client';

import { Lock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { chipClassName } from '@/features/polls/chip';
import { cn } from '@/lib/utils';

export function LockedChip() {
	const { t } = useLanguage();
	return (
		<span className={cn(chipClassName, 'bg-muted text-muted-foreground')}>
			<Lock aria-hidden className="size-3" />
			{t('communities.locked')}
		</span>
	);
}
