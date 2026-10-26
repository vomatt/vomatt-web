'use client';

import { BrandLink } from '@/components/BrandLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type AuthContainerType = {
	className?: string;
	children: React.ReactNode;
};

export default function AuthContainer({
	className,
	children,
}: AuthContainerType) {
	const { t } = useLanguage();
	return (
		<div className="min-h-svh md:grid md:grid-cols-2">
			{/* Brand panel: desktop only, phones go straight to the form */}
			<section className="hidden md:flex flex-col justify-between gap-12 border-r border-border bg-card px-14 py-12">
				<BrandLink className="w-28" />
				<div className="max-w-md space-y-6">
					<p className="text-[48px] font-medium leading-[1.1] tracking-[-0.03em]">
						{t('login.brandHeadline')}
					</p>
					<p className="text-lg leading-normal text-muted-foreground">{t('login.brandBody')}</p>
				</div>
				<ul className="max-w-md divide-y divide-border border-t border-border text-[14px] text-muted-foreground">
					{(['brandRuleSealed', 'brandRuleOneVote', 'brandRuleResults'] as const).map((key) => (
						<li key={key} className="py-3">
							{t(`login.${key}`)}
						</li>
					))}
				</ul>
			</section>

			<div className="flex flex-col px-4 md:justify-center md:px-6">
				<div className="mx-auto w-full max-w-[400px]">
					<BrandLink className="w-24 py-5 md:hidden" />
					{/* No mount fade: the form must be visible in the server HTML, not after hydration */}
					<div className={cn('pt-6 pb-10 md:py-12', className)}>{children}</div>
				</div>
			</div>
		</div>
	);
}
