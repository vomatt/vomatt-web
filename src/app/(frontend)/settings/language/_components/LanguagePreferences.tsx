'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Check, ChevronLeft } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { htmlLang, SUPPORTED_LANGUAGES } from '@/i18n-config';
import { cn } from '@/lib/utils';
import type { LanguageCode } from '@/types';

/** The app language as one choice in a card; the cookie keeps it for this browser. */
export function LanguagePreferences() {
	const { t, currentLanguage, setLanguage } = useLanguage();
	const router = useRouter();

	return (
		<div className="flex flex-col gap-8">
			<div className="flex items-center gap-2">
				<Link
					href="/settings"
					aria-label={t('settings.backToSettings')}
					className="-ml-3 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
				>
					<ChevronLeft aria-hidden className="size-5.5" />
				</Link>
				<h1 className="page-title text-foreground">{t('settings.languageTitle')}</h1>
			</div>
			<section aria-labelledby="app-language" className="flex flex-col gap-3">
				<div>
					<h2 id="app-language" className="text-[16px] font-medium tracking-[-0.01em]">
						{t('settings.appLanguage')}
					</h2>
					<p className="mt-0.5 text-[14px] text-muted-foreground">{t('settings.appLanguageBody')}</p>
				</div>
				<RadioGroup
					aria-labelledby="app-language"
					value={currentLanguage}
					onValueChange={(value) => {
						setLanguage(value as LanguageCode);
						// The server parts re-render in the new language
						router.refresh();
					}}
					className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card"
				>
					{(Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[]).map((code) => (
						<Radio.Root
							key={code}
							value={code}
							lang={htmlLang(code)}
							className={cn(
								'group flex min-h-15 w-full cursor-pointer items-center gap-4 px-4.5 py-3 text-left text-muted-foreground transition-colors outline-none',
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
				<p className="text-[13px] text-muted-foreground">{t('settings.appLanguageNote')}</p>
			</section>
		</div>
	);
}
