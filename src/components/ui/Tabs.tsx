'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { createContext, useContext } from 'react';

import {
	type HoverMark,
	hoverMarkProps,
	useHoverMark,
} from '@/hooks/useHoverMark';
import { cn } from '@/lib/utils';

function Tabs({
	className,
	orientation = 'horizontal',
	...props
}: TabsPrimitive.Root.Props) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			data-orientation={orientation}
			className={cn(
				'group/tabs flex gap-2 data-horizontal:flex-col',
				className
			)}
			{...props}
		/>
	);
}

const tabsListVariants = cva(
	'group/tabs-list relative inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none',
	{
		variants: {
			variant: {
				default: 'bg-muted',
				line: 'w-full gap-0 border-b border-border bg-transparent p-0 group-data-horizontal/tabs:h-11',
			},
			// A page's own tabs: they stay under the phone Header as the list scrolls
			sticky: {
				true: 'sticky follow-header z-10 bg-background',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

/** Where the trigger under the pointer is, for `TabsIndicator`'s hover mark. */
const HoverMarkContext = createContext<HoverMark | null>(null);

function TabsList({
	className,
	variant = 'default',
	sticky,
	onPointerOver,
	onPointerLeave,
	children,
	...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
	const hover = useHoverMark('[data-slot=tabs-trigger]', 'x');
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			data-variant={variant}
			data-sticky={sticky || undefined}
			className={cn(tabsListVariants({ variant, sticky }), className)}
			onPointerOver={(event) => {
				onPointerOver?.(event);
				hover.onPointerOver(event);
			}}
			onPointerLeave={(event) => {
				onPointerLeave?.(event);
				hover.onPointerLeave();
			}}
			{...props}
		>
			<HoverMarkContext value={hover.mark}>{children}</HoverMarkContext>
		</TabsPrimitive.List>
	);
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
	return (
		<TabsPrimitive.Tab
			data-slot="tabs-trigger"
			className={cn(
				"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				'group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:text-[14px] group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
				'data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground',
				'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100 group-data-horizontal/tabs:group-has-data-[slot=tabs-indicator]/tabs-list:after:hidden',
				className
			)}
			{...props}
		/>
	);
}

/**
 * Line-variant underline for horizontal tabs: slides between active tabs, with a
 * lighter mark that follows the pointer. Place it inside `TabsList`; it replaces
 * the triggers' static underline. Hidden in vertical tabs, which keep theirs.
 */
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
	const hover = useContext(HoverMarkContext);

	return (
		<>
			{hover?.rect && (
				<span
					aria-hidden
					data-slot="tabs-hover-indicator"
					{...hoverMarkProps(
						hover,
						'absolute bottom-[-1px] h-0.5 bg-muted-foreground/40 group-data-vertical/tabs:hidden'
					)}
				/>
			)}
			<TabsPrimitive.Indicator
				data-slot="tabs-indicator"
				renderBeforeHydration
				className={cn(
					'absolute bottom-[-1px] left-(--active-tab-left) h-0.5 w-(--active-tab-width) bg-foreground transition-[left,width] duration-200 ease-out group-data-vertical/tabs:hidden motion-reduce:transition-none',
					className
				)}
				{...props}
			/>
		</>
	);
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
	return (
		<TabsPrimitive.Panel
			data-slot="tabs-content"
			// The open panel is a tab stop (Base UI sets tabIndex 0), so it needs the shared focus ring
			className={cn(
				'flex-1 rounded-lg text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring',
				className
			)}
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsIndicator, TabsList, tabsListVariants, TabsTrigger };
