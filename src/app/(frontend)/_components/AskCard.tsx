'use client';

import { useId } from 'react';

import { Button } from '@/components/ui/Button';
import { Plus } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';

/** The rail's invitation to ask: "Write one" opens the poll creator. Signed-in viewers only. */
export function AskCard() {
	const { t } = useLanguage();
	const headingId = useId();

	return (
		<section
			aria-labelledby={headingId}
			className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-[18px]"
		>
			<h2 id={headingId} className="text-[17px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
				{t('homePage.askTitle')}
			</h2>
			<p className="text-[13px] text-muted-foreground">{t('homePage.askBody')}</p>
			<CreatePollTrigger>
				<Button variant="outline" className="mt-1 w-full">
					<Plus aria-hidden data-icon="inline-start" />
					{t('homePage.askCta')}
				</Button>
			</CreatePollTrigger>
		</section>
	);
}
