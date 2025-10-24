import Link from 'next/link';

import { cn } from '@/lib/utils';

export function Header() {
	return (
		<header
			className={cn(
				'g-header w-full z-header bg-background/85 backdrop-blur-md fixed top-0 right-0 left-0 h-header'
			)}
		>
			<nav className={cn('flex  h-full py-4 px-5 items-center justify-center')}>
				<Link href="/">Home</Link>
			</nav>
		</header>
	);
}
