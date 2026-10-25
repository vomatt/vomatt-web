'use client';

import { Menu } from '@base-ui/react/menu';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Ellipsis, Trash2 } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { countText } from '@/lib/count';
import { cn } from '@/lib/utils';

import { deleteDraft, listDrafts, type PollDraft } from '../drafts';
import { formatPollDate } from '../format';

const PollCreator = dynamic(() => import('./PollCreator').then((m) => m.PollCreator));

/**
 * Drafts saved from the creator. They live in local storage only, so only their
 * author ever sees them: a quieter, dashed row with one action.
 */
export function DraftList({
	header,
	empty,
}: {
	/** Above the rows, given how many there are; left out with none. */
	header?: (count: number) => React.ReactNode;
	/** Shown with no drafts. */
	empty?: React.ReactNode;
}) {
	const { t, currentLanguage } = useLanguage();
	const [drafts, setDrafts] = useState<PollDraft[] | null>(null);
	const [resuming, setResuming] = useState<PollDraft | null>(null);

	// Local storage is only readable after hydration
	// eslint-disable-next-line react-hooks/set-state-in-effect -- reading it during render would mismatch the server HTML
	useEffect(() => setDrafts(listDrafts()), []);

	const stopResuming = () => {
		setResuming(null);
		setDrafts(listDrafts());
	};

	if (drafts === null) return null;
	if (drafts.length === 0) return empty ?? null;

	return (
		<>
			{header?.(drafts.length)}
			<ul className="space-y-2">
				{drafts.map((draft) => {
					const title = draft.values.title.trim();
					return (
						<li
							key={draft.id}
							className="flex items-center gap-3.5 rounded-xl border border-dashed border-border-strong bg-surface-soft px-4 py-3.5"
						>
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								<p className={cn('item-title truncate leading-snug', !title && 'text-muted-foreground')}>
									{title || t('myPolls.untitledDraft')}
								</p>
								<p className="text-[12px] text-muted-foreground">
									{t('myPolls.draftSavedAt', { date: formatPollDate(draft.savedAt, currentLanguage) })}
									{' · '}
									{countText(t, 'myPolls.draftOptions', draft.values.options.length, currentLanguage)}
								</p>
							</div>
							<Button size="sm" variant="outline" onClick={() => setResuming(draft)}>
								{t('myPolls.draftContinue')}
							</Button>
							<Menu.Root>
								<Menu.Trigger
									render={<Button variant="ghost" size="icon-sm" />}
									aria-label={t('myPolls.draftMore', { title: title || t('myPolls.untitledDraft') })}
									className="data-popup-open:bg-muted"
								>
									<Ellipsis aria-hidden />
								</Menu.Trigger>
								<Menu.Portal>
									<Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
										<Menu.Popup className="min-w-40 rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none">
											<Menu.Item
												onClick={() => setDrafts(deleteDraft(draft.id))}
												className="flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-destructive outline-none data-highlighted:bg-foreground/5"
											>
												<Trash2 aria-hidden className="size-4" />
												{t('myPolls.actionDelete')}
											</Menu.Item>
										</Menu.Popup>
									</Menu.Positioner>
								</Menu.Portal>
							</Menu.Root>
						</li>
					);
				})}
			</ul>
			{resuming && (
				<PollCreator
					key={resuming.id}
					draft={resuming}
					open
					onOpenChange={(open) => !open && stopResuming()}
					onSaved={stopResuming}
				/>
			)}
		</>
	);
}
