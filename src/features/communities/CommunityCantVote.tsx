import { useLanguage } from '@/contexts/LanguageContext';

import { SwitchBackButton } from './ActingProvider';

/** Under the Ballot's options while acting: community accounts never vote (API: `vote.ballot.community_not_allowed`). */
export function CommunityCantVote() {
	const { t } = useLanguage();
	return (
		<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-soft px-4 py-3">
			<p className="min-w-0 flex-1 text-body-4 text-muted-foreground">{t('communities.acting.noVote')}</p>
			<SwitchBackButton size="sm" variant="outline" />
		</div>
	);
}
