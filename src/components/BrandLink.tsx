import Link from 'next/link';

import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';

/** The logo linking home. The svg is unlabeled, so the link carries the brand name. */
export function BrandLink({ className }: { className?: string }) {
	return (
		<Link
			href="/"
			aria-label="vomatt"
			className={cn(
				'block text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
				className
			)}
		>
			<BrandLogo />
		</Link>
	);
}
