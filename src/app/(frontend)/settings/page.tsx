import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { T } from '@/components/T';
import { buttonVariants } from '@/components/ui/Button';
import { ArrowLeft } from '@/components/ui/SvgIcons';
import { getMyProfile } from '@/data/auth';
import { getServerLocale } from '@/lib/getServerLocale';
import { profileHref } from '@/lib/routes';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

import AccountSettings, { SettingsNav } from './_components/AccountSettings';

export async function generateMetadata(): Promise<Metadata> {
	const { language } = await getServerLocale();
	return { title: (language === 'zh' ? zh : en).navigation.settings };
}

export default async function SettingsPage() {
	const profile = await getMyProfile();
	if (!profile) redirect('/login?redirect=/settings');

	return (
		<div className="px-contain mx-auto flex max-w-[960px] items-start gap-10 py-6 md:py-10">
			<div className="min-w-0 max-w-[680px] flex-1">
				<Link
					href={profileHref(profile.username)}
					className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 text-muted-foreground' })}
				>
					<ArrowLeft className="size-4" />
					<T k="navigation.profile" />
				</Link>
				<h1 className="mt-1 mb-8 display-heading text-[30px] text-foreground md:text-[40px]">
					<T k="navigation.settings" />
				</h1>
				<AccountSettings profile={profile} />
			</div>
			<aside className="hidden w-[200px] shrink-0 lg:block">
				<SettingsNav />
			</aside>
		</div>
	);
}
