'use client';

import { ChevronDown, Globe, Lock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export const pillClassName =
	'inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-caption-2 font-medium';
// The pill stays small beside its label, but its hit area reaches 44px
const pillHitArea = "relative before:absolute before:-inset-y-2 before:inset-x-0 before:content-['']";

const PILL_LABELS = {
	everyone: 'profile.visibilityPillEveryone',
	onlyYou: 'profile.visibilityPillOnlyYou',
} as const;

/** Who sees a detail, as a pill that switches between Everyone and Only you. */
export function VisibilityPill({
	label,
	isPublic,
	onToggle,
}: {
	label: string;
	isPublic: boolean;
	onToggle: () => void;
}) {
	const { t } = useLanguage();
	const state = t(isPublic ? 'profile.everyone' : 'profile.onlyYouShort');
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={t(PILL_LABELS[isPublic ? 'everyone' : 'onlyYou'], { field: label })}
			className={cn(
				pillClassName,
				pillHitArea,
				'cursor-pointer transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
				isPublic
					? 'border-border-strong bg-card hover:bg-surface-soft'
					: 'border-border bg-secondary text-muted-foreground hover:text-foreground'
			)}
		>
			{isPublic ? <Globe aria-hidden className="size-3" /> : <Lock aria-hidden className="size-3" />}
			{state}
			<ChevronDown aria-hidden className="size-2.5" />
		</button>
	);
}
