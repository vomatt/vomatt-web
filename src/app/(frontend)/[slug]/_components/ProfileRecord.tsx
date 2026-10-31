'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { toPayloadLocale } from '@/lib/locale';

import { OnlyYouMarker } from './ProfileHeader';

export type RecordCell = {
	label: string;
	/** Null when there is nothing to count yet (no decided ballot). */
	value: number | null;
	/** Shown after the number, e.g. "%". */
	suffix?: string;
	/** Only the owner sees it: marked with the lock. */
	private?: boolean;
};

/** The record: a person's counts in one card, a mono number over a short label. */
export function ProfileRecord({ cells }: { cells: RecordCell[] }) {
	const { currentLanguage } = useLanguage();
	return (
		<dl className="grid grid-cols-2 gap-y-4 rounded-2xl border border-border bg-card px-2 py-4 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none sm:divide-x sm:divide-border">
			{cells.map((cell) => (
				<div key={cell.label} className="flex flex-col-reverse px-4">
					<dt className="inline-flex items-center gap-1 text-caption-2 text-muted-foreground">
						{cell.label}
						{cell.private && <OnlyYouMarker className="size-3" />}
					</dt>
					<dd className="text-title-2 leading-tight tabular-nums">
						{cell.value === null ? '–' : `${cell.value.toLocaleString(toPayloadLocale(currentLanguage))}${cell.suffix ?? ''}`}
					</dd>
				</div>
			))}
		</dl>
	);
}
