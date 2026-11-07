'use client';
import NextLink, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';

import { buttonVariants } from '@/components/ui/Button';
import { Home, Plus, Search } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { isActivePath, isChromeless } from '@/lib/routes';
import { cn } from '@/lib/utils';

type TabBarProps = {
	className?: string;
	userSession?: any;
	/** Where the signed-out create button goes; carries `session_expired` when the API refused the session. */
	loginLink?: string;
};

// The center tab is the primary action: the create button as a square, the "Create a poll" action
const createClassName = cn(buttonVariants({ variant: 'create' }), 'w-13 px-0');
const cellClassName =
	'flex-1 h-full flex justify-center items-center outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

export function TabBar({ className, userSession, loginLink = '/login' }: TabBarProps) {
	const pathname = usePathname();
	const { t } = useLanguage();
	const home = { title: t('navigation.home'), href: '/', icon: <Home className="size-6" /> };
	const explore = { title: t('common.explore'), href: '/explore', icon: <Search className="size-6" /> };

	if (isChromeless(pathname)) return null;

	const renderLink = ({ href, title, icon }: typeof home) => {
		const isActive = isActivePath(pathname, href);
		return (
			<NextLink
				href={href}
				aria-current={isActive ? 'page' : undefined}
				className={cellClassName}
			>
				<TabIcon icon={icon} isActive={isActive} />
				<span className="sr-only">{title}</span>
			</NextLink>
		);
	};

	return (
		<nav
			data-tabbar
			className={cn(
				'[--tabbar-height:64px] fixed bottom-0 z-tabbar w-full flex justify-between items-center h-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-card border-t border-border md:hidden',
				className
			)}
		>
			{renderLink(home)}
			{userSession ? (
				<div className={cellClassName}>
					<CreatePollTrigger>
						<button type="button" aria-label={t('common.createPoll')} className={createClassName}>
							<Plus className="size-5.5" />
						</button>
					</CreatePollTrigger>
				</div>
			) : (
				<NextLink href={loginLink} aria-label={t('common.createPoll')} className={cellClassName}>
					<span className={createClassName}>
						<Plus className="size-5.5" />
					</span>
				</NextLink>
			)}
			{renderLink(explore)}
		</nav>
	);
}

/** A tab's icon, marked active from the tap on, so a route still rendering on the server doesn't look ignored. */
function TabIcon({ icon, isActive }: { icon: React.ReactNode; isActive: boolean }) {
	const { pending } = useLinkStatus();
	return (
		<span
			data-pending={pending || undefined}
			className={cn(
				'flex size-12 items-center justify-center',
				isActive || pending
					? // Forced colors drop the shadow bar; the border takes its place
						'text-foreground shadow-[inset_0_-2px_0_var(--foreground)] forced-colors:border-b-2'
					: 'text-muted-foreground'
			)}
		>
			{icon}
		</span>
	);
}
