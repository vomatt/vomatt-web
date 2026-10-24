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

import AccountSettings from './_components/AccountSettings';

export async function generateMetadata(): Promise<Metadata> {
	const { language } = await getServerLocale();
	return { title: (language === 'zh' ? zh : en).navigation.settings };
}

export default async function SettingsPage() {
	const profile = await getMyProfile();
	if (!profile) redirect('/login?redirect=/settings');

	return (
		<div className="px-contain mx-auto max-w-2xl py-6">
			{/* Phones reach Settings from the profile and have no sidebar to leave by */}
			<Link
				href={profileHref(profile.username)}
				className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 mb-2 md:hidden' })}
			>
				<ArrowLeft className="size-4" />
				<T k="navigation.profile" />
			</Link>
			<h1 className="mb-6 display-heading text-[30px] text-foreground md:text-[40px]">
				<T k="navigation.settings" />
			</h1>
			<AccountSettings profile={profile} />
		</div>
	);
}
