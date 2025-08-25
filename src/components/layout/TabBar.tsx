'use client';
import {
	CirclePlus,
	CircleUserIcon,
	HomeIcon,
	Search,
	Star,
} from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

type TabBarProps = {
	className?: string;
};

export function TabBar({ className }: TabBarProps) {
	const pathname = usePathname();
	const linkList = [
		{
			title: 'Home',
			href: '/',
			icon: <HomeIcon />,
		},
		{
			title: 'Search',
			href: '/search',
			icon: <Search />,
		},
		{
			title: 'Create Vote',
			href: '/search',
			icon: <CirclePlus />,
		},
		{
			title: 'Activity',
			href: '/activity',
			icon: <Star />,
		},
		{
			title: 'Account',
			href: '/account',
			icon: <CircleUserIcon />,
		},
	];

	const routeToHide = ['/signup', '/login'];
	if (routeToHide.includes(pathname)) return null;

	return (
		<nav className="[--tabbar-height:50px] fixed bottom-0 bg-background/85 backdrop-blur-lg w-full flex justify-between h-(--tabbar-height) items-center md:hidden">
			{linkList.map(({ href, title, icon }, index) => (
				<NextLink
					key={index}
					href={href}
					className="flex-1 h-full flex justify-center items-center"
					title={title}
				>
					{icon}
				</NextLink>
			))}
		</nav>
	);
}
