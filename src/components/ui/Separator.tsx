'use client';

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';

import { cn } from '@/lib/utils';

// Decorative by default, like Radix: hidden from assistive tech unless
// `decorative={false}` makes it a semantic separator.
function Separator({
	className,
	orientation = 'horizontal',
	decorative = true,
	...props
}: SeparatorPrimitive.Props & { decorative?: boolean }) {
	return (
		<SeparatorPrimitive
			data-slot="separator"
			orientation={orientation}
			className={cn(
				'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
				className
			)}
			{...(decorative && { role: 'none', 'aria-orientation': undefined })}
			{...props}
		/>
	);
}

export { Separator };
