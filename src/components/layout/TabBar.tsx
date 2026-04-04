'use client';
import {
	CirclePlus,
	CircleUser,
	Home,
	Search,
	Star,
} from '@/components/ui/SvgIcons';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

const PollCreator = dynamic(
	() => import('@/components/PollCreator').then((m) => ({ default: m.PollCreator })),
	{ ssr: false }
);
type TabBarProps = {
	className?: string;
	userSession?: any;
};

export function TabBar({ className, userSession }: TabBarProps) {
	const pathname = usePathname();
	const linkList = [
		{
			title: 'Home',
			href: '/',
			icon: <Home />,
		},
		{
			title: 'Explore',
			href: '/explore',
			icon: <Search />,
		},
		{
			title: 'Create Vote',
			href: userSession ? null : '/login',
			icon: userSession ? <PollCreator /> : <CirclePlus />,
		},
		{
			title: 'My Polls',
			href: '/my-polls',
			icon: <Star />,
		},
		{
			title: 'Account',
			href: '/account',
			icon: <CircleUser />,
		},
	];

	const routeToHide = ['/signup', '/login'];
	if (routeToHide.includes(pathname)) return null;

	return (
		<nav className="[--tabbar-height:50px] fixed bottom-0 bg-background/85 backdrop-blur-lg w-full flex justify-between h-(--tabbar-height) items-center md:hidden">
			{linkList.map(({ href, title, icon }, index) =>
				href ? (
					<NextLink
						key={index}
						href={href}
						className="flex-1 h-full flex justify-center items-center"
						title={title}
					>
						{icon}
					</NextLink>
				) : (
					<div
						key={index}
						className="flex-1 h-full flex justify-center items-center"
						title={title}
					>
						{icon}
					</div>
				)
			)}
		</nav>
	);
}
