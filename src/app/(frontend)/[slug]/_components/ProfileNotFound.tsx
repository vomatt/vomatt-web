'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { buttonVariants } from '@/components/ui/Button';
import { User } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUsername, usernameFromSlug } from '@/features/account/username';

/** A root URL that is neither a Sanity page nor a profile, e.g. an old username. */
export default function ProfileNotFound() {
	const { t } = useLanguage();
	const slug = usernameFromSlug(usePathname().split('/')[1] ?? '');
	// Only a slug that could be a username gets the profile wording
	const handle = slug && isValidUsername(slug) ? slug : null;

	return (
		<div className="px-contain mx-auto flex max-w-2xl flex-col items-center py-16 text-center md:py-24">
			<div className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
				<User size="2em" aria-hidden />
			</div>
			<h1 className="display-heading mt-6 text-[28px] text-foreground">
				{t(handle ? 'profile.notFoundTitle' : 'profile.pageNotFoundTitle')}
			</h1>
			{handle && <p className="mt-1 font-mono text-[13px] text-muted-foreground">@{handle}</p>}
			<p className="mt-4 max-w-sm text-[15px] text-muted-foreground">
				{t(handle ? 'profile.notFoundBody' : 'profile.pageNotFoundBody')}
			</p>
			<div className="mt-8 flex flex-wrap justify-center gap-2">
				<Link href="/explore" className={buttonVariants()}>
					{t('profile.notFoundExplore')}
				</Link>
				<Link href="/" className={buttonVariants({ variant: 'outline' })}>
					{t('profile.notFoundHome')}
				</Link>
			</div>
		</div>
	);
}
