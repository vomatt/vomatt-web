'use client';

import Link from 'next/link';

import BrandLogo from '@/components/BrandLogo';
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
			<section className="hidden md:flex flex-col justify-between gap-12 border-r border-border bg-card px-12 py-10 lg:px-16">
				<Link href="/" className="block w-28 text-foreground">
					<BrandLogo />
				</Link>
				<div className="max-w-md space-y-4">
					<p className="text-5xl font-normal leading-[1.05] tracking-[-0.035em] lg:text-6xl">
						{t('login.brandHeadline')}
					</p>
					<p className="text-lg leading-relaxed text-muted-foreground">{t('login.brandBody')}</p>
				</div>
				<ul className="max-w-md divide-y divide-border border-t border-border text-[15px] text-muted-foreground">
					{(['brandRuleSealed', 'brandRuleOneVote', 'brandRuleResults'] as const).map((key) => (
						<li key={key} className="py-3">
							{t(`login.${key}`)}
						</li>
					))}
				</ul>
			</section>

			<div className="mx-auto flex w-full max-w-sm flex-col px-4 md:justify-center md:px-0">
				<Link href="/" className="block w-24 py-5 text-foreground md:hidden">
					<BrandLogo />
				</Link>
				{/* No mount fade: the form must be visible in the server HTML, not after hydration */}
				<div className={cn('pt-6 pb-10 md:py-16', className)}>{children}</div>
			</div>
		</div>
	);
}
