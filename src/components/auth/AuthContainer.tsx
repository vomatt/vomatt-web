'use client';

import { m } from 'motion/react';
import Link from 'next/link';

import BrandLogo from '@/components/BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { fadeAnim } from '@/lib/animate';
import { cn } from '@/lib/utils';

export type AuthContainerType = {
	type: string;
	className?: string;
	children: React.ReactNode;
};

export default function AuthContainer({
	type,
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
				<span aria-hidden />
			</section>

			<div className="mx-auto flex w-full max-w-sm flex-col px-4 md:justify-center md:px-0">
				<Link href="/" className="block w-24 py-5 text-foreground md:hidden">
					<BrandLogo />
				</Link>
				<m.div
					key={type}
					initial="hide"
					animate="show"
					exit="hide"
					variants={fadeAnim}
					className={cn('pt-6 pb-10 md:py-16', className)}
				>
					{children}
				</m.div>
			</div>
		</div>
	);
}
