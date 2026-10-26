'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { EmptyCard } from '@/components/EmptyCard';
import { buttonVariants } from '@/components/ui/Button';
import { User } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { isValidUsername, usernameFromSlug } from '@/features/account/username';

/** A root URL that is neither a Sanity page nor a profile, e.g. an old username. */
export default function ProfileNotFound() {
	const { t } = useLanguage();
	const slug = usernameFromSlug(usePathname().split('/')[1] ?? '');
	// Only a slug that could be a username gets the profile wording
	const isHandle = !!slug && isValidUsername(slug);

	return (
		<div className="px-contain mx-auto max-w-[1024px] pt-8 pb-16">
			<EmptyCard
				className="max-w-[640px]"
				headingLevel={1}
				icon={<User />}
				title={t(isHandle ? 'profile.notFoundTitle' : 'profile.pageNotFoundTitle')}
				body={t(isHandle ? 'profile.notFoundBody' : 'profile.pageNotFoundBody')}
				action={
					<div className="flex flex-wrap justify-center gap-2">
						<Link href="/explore" className={buttonVariants({ variant: 'outline' })}>
							{t('profile.notFoundExplore')}
						</Link>
						<Link href="/" className={buttonVariants()}>
							{t('profile.notFoundHome')}
						</Link>
					</div>
				}
			/>
		</div>
	);
}
