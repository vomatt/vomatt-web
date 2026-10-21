'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { BOT_TINTS, type BotKind } from './catalog';

// Literal class names so Tailwind generates them
const TINT_CLASSES = {
	sand: 'bg-avatar-sand',
	stone: 'bg-avatar-stone',
	green: 'bg-avatar-green',
	sky: 'bg-avatar-sky',
	peach: 'bg-avatar-peach',
	lavender: 'bg-avatar-lavender',
} as const;

export type BotVariant = 'flat' | 'round2';

/**
 * One character of the cast. Size comes from `className` (default 32px).
 * `variant` picks the drawing: `flat` (default, Round 4.1: flat line art on a muted circle, the Skeleton's colour) or
 * `round2` (the earlier set on its tinted circle).
 * With `tooltip`, hovering shows the character's name and trait (the profile page and the picker).
 * The drawings are static files in public/avatars (flat) and public/avatars/round2, so pages don't ship them as JS.
 */
export function BotAvatar({
	kind,
	className,
	tooltip = false,
	variant = 'flat',
}: {
	kind: BotKind;
	className?: string;
	tooltip?: boolean;
	variant?: BotVariant;
}) {
	const { t } = useLanguage();
	const image =
		variant === 'round2' ? (
			// eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs gain nothing from next/image
			<img
				src={`/avatars/round2/${kind}.svg`}
				alt=""
				className={cn('size-8 shrink-0 rounded-full', TINT_CLASSES[BOT_TINTS[kind]], className)}
			/>
		) : (
			// eslint-disable-next-line @next/next/no-img-element -- as above
			<img
				src={`/avatars/${kind}.svg`}
				alt=""
				className={cn('size-8 shrink-0 rounded-full bg-muted', className)}
			/>
		);
	if (!tooltip) return image;

	// Hover only: the image isn't focusable, and the person's name always sits beside it
	return (
		<Tooltip>
			<TooltipTrigger render={image} />
			<TooltipContent className="flex-col items-start gap-0">
				<span className="font-medium">{t(`avatar.bots.${kind}.name`)}</span>
				<span className="opacity-70">{t(`avatar.bots.${kind}.trait`)}</span>
			</TooltipContent>
		</Tooltip>
	);
}
