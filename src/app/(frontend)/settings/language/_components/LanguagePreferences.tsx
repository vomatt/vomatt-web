'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useRouter } from 'next/navigation';
import { useId } from 'react';

import { rowClassName, settingsCardClassName } from '@/components/SettingsCard';
import { Check } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { htmlLang, SUPPORTED_LANGUAGES } from '@/i18n-config';
import { cn } from '@/lib/utils';
import type { LanguageCode } from '@/types';

import { SettingsSubpageHeader } from '../../_components/SettingsSubpageHeader';

/** The app language as one choice in a card; the cookie keeps it for this browser. */
export function LanguagePreferences() {
	const { t, currentLanguage, setLanguage } = useLanguage();
	const router = useRouter();
	const headingId = useId();

	return (
		<div className="flex flex-col gap-8">
			<SettingsSubpageHeader title={t('settings.languageTitle')} />
			<section aria-labelledby={headingId} className="flex flex-col gap-3">
				<div>
					<h2 id={headingId} className="text-title-4">
						{t('settings.appLanguage')}
					</h2>
					<p className="mt-0.5 text-body-4 text-muted-foreground">{t('settings.appLanguageBody')}</p>
				</div>
				<RadioGroup
					aria-labelledby={headingId}
					value={currentLanguage}
					onValueChange={(value) => {
						setLanguage(value as LanguageCode);
						// The server parts re-render in the new language
						router.refresh();
					}}
					className={settingsCardClassName}
				>
					{(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => (
						<Radio.Root
							key={code}
							value={code}
							lang={htmlLang(code)}
							className={cn(
								rowClassName,
								'group w-full cursor-pointer text-left text-muted-foreground transition-colors outline-none',
								'hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
								'data-checked:font-medium data-checked:text-foreground'
							)}
						>
							<span className="flex-1">{SUPPORTED_LANGUAGES[code]}</span>
							<span
								aria-hidden
								className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-muted-foreground group-data-checked:border-foreground group-data-checked:bg-foreground"
							>
								<Check className="hidden size-3.5 text-background group-data-checked:block" />
							</span>
						</Radio.Root>
					))}
				</RadioGroup>
				<p className="text-caption-1 text-muted-foreground">{t('settings.appLanguageNote')}</p>
			</section>
		</div>
	);
}
