'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

import { deleteDraft, listDrafts, type PollDraft } from '../drafts';
import { fill, formatPollDate } from '../format';

const PollCreator = dynamic(() => import('./PollCreator').then((m) => m.PollCreator));

/** Drafts saved from the creator. They live in local storage only. */
export function DraftList() {
	const { t, currentLanguage } = useLanguage();
	const [drafts, setDrafts] = useState<PollDraft[]>([]);
	const [resuming, setResuming] = useState<PollDraft | null>(null);

	// Local storage is only readable after hydration
	useEffect(() => setDrafts(listDrafts()), []);

	const remove = (id: string) => {
		deleteDraft(id);
		setDrafts(listDrafts());
	};

	const stopResuming = () => {
		setResuming(null);
		setDrafts(listDrafts());
	};

	if (drafts.length === 0) {
		return <p className="text-muted-foreground text-center py-8">{t('myPolls.empty')}</p>;
	}

	return (
		<>
			<ul className="space-y-3">
				{drafts.map((draft) => (
					<li
						key={draft.id}
						className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card"
					>
						<div className="min-w-0">
							<p className="truncate text-foreground">
								{draft.values.title.trim() || t('myPolls.untitledDraft')}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								{fill(t('myPolls.draftSavedAt'), {
									date: formatPollDate(draft.savedAt, currentLanguage),
								})}
							</p>
						</div>
						<div className="flex shrink-0 gap-1.5">
							<Button size="sm" variant="ghost" onClick={() => remove(draft.id)}>
								{t('myPolls.actionDelete')}
							</Button>
							<Button size="sm" variant="outline" onClick={() => setResuming(draft)}>
								{t('myPolls.draftContinue')}
							</Button>
						</div>
					</li>
				))}
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
