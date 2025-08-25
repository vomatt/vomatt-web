import { CircleUserIcon, HomeIcon, Search, Star } from 'lucide-react';
import NextLink from 'next/link';

type TabBarProps = {
	className?: string;
};
export function TabBar({ className }: TabBarProps) {
	const linkList = [
		{
			title: 'home',
			href: '/',
			icon: <HomeIcon />,
		},
		{
			title: 'search',
			href: '/search',
			icon: <Search />,
		},
		{
			title: 'activity',
			href: '/activity',
			icon: <Star />,
		},
		{
			title: 'account',
			href: '/account',
			icon: <CircleUserIcon />,
		},
	];

	return (
		<nav className="fixed bottom-0 bg-background/85 backdrop-blur-lg w-full">
			{linkList.map(({ href, title, icon }, index) => (
				<NextLink key={index} href={href}>
					{icon}
				</NextLink>
			))}
		</nav>
	);
}
