'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { createContext, useContext, useLayoutEffect, useState } from 'react';

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
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

/** The trigger under the pointer, for `TabsIndicator`'s hover mark. */
const HoveredTabContext = createContext<HTMLElement | null>(null);

function TabsList({
	className,
	variant = 'default',
	onPointerOver,
	onPointerLeave,
	children,
	...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
	const [hoveredTab, setHoveredTab] = useState<HTMLElement | null>(null);
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			data-variant={variant}
			className={cn(tabsListVariants({ variant }), className)}
			onPointerOver={(event) => {
				onPointerOver?.(event);
				const tab = (event.target as Element).closest<HTMLElement>('[data-slot=tabs-trigger]');
				if (tab && !tab.hasAttribute('data-disabled')) setHoveredTab(tab);
			}}
			onPointerLeave={(event) => {
				onPointerLeave?.(event);
				setHoveredTab(null);
			}}
			{...props}
		>
			<HoveredTabContext value={hoveredTab}>{children}</HoveredTabContext>
		</TabsPrimitive.List>
	);
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
	return (
		<TabsPrimitive.Tab
			data-slot="tabs-trigger"
			className={cn(
				"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				'group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:text-[15px] group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
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
	const hoveredTab = useContext(HoveredTabContext);
	const [hoverRect, setHoverRect] = useState<{ left: number; width: number } | null>(null);

	// Measured like Base UI measures the active tab, and again whenever the tab or list resizes
	useLayoutEffect(() => {
		const list = hoveredTab?.closest<HTMLElement>('[data-slot=tabs-list]');
		if (!hoveredTab || !list) return;
		const measure = () => {
			const tabRect = hoveredTab.getBoundingClientRect();
			const listRect = list.getBoundingClientRect();
			setHoverRect({
				left: tabRect.left - listRect.left + list.scrollLeft - list.clientLeft,
				width: tabRect.width,
			});
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(hoveredTab);
		observer.observe(list);
		return () => observer.disconnect();
	}, [hoveredTab]);

	return (
		<>
			{hoverRect && (
				<span
					aria-hidden
					data-slot="tabs-hover-indicator"
					className={cn(
						'absolute bottom-[-1px] h-0.5 bg-muted-foreground/40 transition-[left,width,opacity] duration-200 ease-out group-data-vertical/tabs:hidden motion-reduce:transition-none',
						!hoveredTab && 'opacity-0'
					)}
					style={hoverRect}
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
			className={cn('flex-1 text-sm outline-none', className)}
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsIndicator, TabsList, tabsListVariants, TabsTrigger };
