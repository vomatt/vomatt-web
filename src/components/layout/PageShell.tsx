import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The one page frame: a main column and, from xl, a rail at the frame's right edge.
 * The rail column is kept even when empty or still loading, so the main column sits in the
 * same place on every page and its skeleton. Below xl the rail follows the main column.
 */
export function PageShell({
	children,
	rail,
	wide,
	className,
}: {
	children: ReactNode;
	className?: string;
} & (
	| { rail?: ReactNode; wide?: never }
	/** No rail column: from xl the main column runs on toward the rail's room, up to max-w-page. Its left edge stays put. */
	| { wide: true; rail?: never }
)) {
	return (
		// Clipped sideways so `bleed-x` and `bleed-r` rows end at the page's edges; `clip` keeps sticky bars working
		<div className={cn('overflow-x-clip px-contain pt-8 pb-16', className)}>
			<div className="mx-auto flex w-full max-w-main flex-col gap-8 xl:grid xl:max-w-frame xl:gap-0 xl:page-grid">
				<div className={cn('flex min-w-0 flex-col xl:col-start-2', wide && 'xl:col-end-[-1] xl:max-w-page')}>
					{children}
				</div>
				{!wide && (
					// Stretched to the page's height so a sticky rail inside it can stick. Below xl it
					// hides while empty or holding only a pending Suspense's <template>
					<div className="flex flex-col xl:ml-auto xl:w-rail max-xl:[&:not(:has(>:not(template)))]:hidden">
						{rail}
					</div>
				)}
			</div>
		</div>
	);
}
