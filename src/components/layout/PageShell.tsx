import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The one page frame: a main column and, from xl, a rail beside it. The rail column is
 * kept even when empty or still loading, so the main column sits in the same place on
 * every page and its skeleton. Below xl the rail follows the main column.
 */
export function PageShell({
	children,
	rail,
	className,
}: {
	children: ReactNode;
	rail?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('px-contain pt-8 pb-16', className)}>
			<div className="mx-auto flex w-full max-w-main flex-col gap-8 xl:max-w-page xl:flex-row xl:gap-10">
				<div className="flex min-w-0 flex-col xl:flex-1">{children}</div>
				{/* Stretched to the page's height so a sticky rail inside it can stick. Below xl it
				    hides while empty or holding only a pending Suspense's <template> */}
				<div className="flex flex-col max-xl:[&:not(:has(>:not(template)))]:hidden xl:w-rail xl:shrink-0">
					{rail}
				</div>
			</div>
		</div>
	);
}
