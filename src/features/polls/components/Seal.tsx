'use client';

import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/** A Tide ring (vomatt's promise) around a Volt check (the voter's own vote). Decorative. */
export function SealMark({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
	const isLarge = size === 'lg';
	return (
		<span
			aria-hidden
			className={cn(
				'relative grid shrink-0 place-items-center rounded-full border-2 border-tide',
				isLarge ? 'size-[72px]' : 'size-9'
			)}
		>
			<span
				className={cn(
					'absolute rounded-full border border-dashed border-tide',
					isLarge ? 'inset-1.5' : 'inset-[3px]'
				)}
			/>
			<span
				className={cn(
					'grid place-items-center rounded-full bg-highlight text-highlight-foreground',
					isLarge ? 'size-[30px]' : 'size-[15px]'
				)}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={3.5}
					strokeLinecap="round"
					strokeLinejoin="round"
					className={isLarge ? 'size-4' : 'size-2.5'}
				>
					<path d="M5 13l4 4L19 7" />
				</svg>
			</span>
		</span>
	);
}

type SealProps = {
	/** In full right after a cast; a compact row on later visits. */
	full: boolean;
	/** When the results open, or that they open at the end. */
	sealedLine: React.ReactNode;
	visibilityHint?: string | null | false;
	turnout?: number;
};

/** What a cast Ballot becomes: the Seal, with the reveal date and who will see the choice. */
export function Seal({ full, sealedLine, visibilityHint, turnout }: SealProps) {
	const { t } = useLanguage();

	if (full) {
		return (
			<TidePanel className="flex flex-col items-center gap-1.5 px-4 py-5 text-center text-[14px] leading-relaxed">
				<SealMark size="lg" />
				<p className="mt-2 text-[18px] font-medium tracking-[-0.01em] text-foreground">
					{t('poll.sealedTitle')}
				</p>
				{sealedLine}
				{visibilityHint && <p>{visibilityHint}</p>}
				{turnout !== undefined && (
					<p className="mt-1 font-mono text-[13px] text-foreground tabular-nums">
						{t('poll.sealedTurnout', { count: turnout.toLocaleString() })}
					</p>
				)}
			</TidePanel>
		);
	}

	return (
		<TidePanel className="flex items-start gap-3 px-3.5 py-3 text-[12px] leading-relaxed">
			<SealMark />
			<div className="flex min-w-0 flex-col gap-1 pt-0.5">
				{sealedLine}
				{visibilityHint && <p>{visibilityHint}</p>}
			</div>
		</TidePanel>
	);
}
