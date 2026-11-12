'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { hoverMarkProps, useHoverMark } from '@/hooks/useHoverMark';
import { cn } from '@/lib/utils';

// Grows by the landscape notch inset, which AppSidebar pads, so its content keeps 15.5rem
const SIDEBAR_WIDTH = 'calc(15.5rem + env(safe-area-inset-left))';

function SidebarProvider({
	className,
	style,
	children,
	...props
}: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-wrapper"
			style={
				{
					'--sidebar-width': SIDEBAR_WIDTH,
					...style,
				} as React.CSSProperties
			}
			className={cn(
				'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

/** Desktop only (hidden below `md`, where the TabBar takes over) and always shown. */
function Sidebar({
	side = 'left',
	variant = 'sidebar',
	className,
	children,
	...props
}: React.ComponentProps<'div'> & {
	side?: 'left' | 'right';
	variant?: 'sidebar' | 'floating' | 'inset';
}) {
	return (
		<div
			className="group peer hidden text-sidebar-foreground md:block"
			data-variant={variant}
			data-side={side}
			data-slot="sidebar"
		>
			{/* This is what handles the sidebar gap on desktop */}
			<div
				data-slot="sidebar-gap"
				className={cn(
					'relative w-(--sidebar-width) bg-transparent',
					'group-data-[side=right]:rotate-180'
				)}
			/>
			<div
				data-slot="sidebar-container"
				data-side={side}
				className={cn(
					'fixed inset-y-0 z-30 hidden h-svh w-(--sidebar-width) data-[side=left]:left-0 data-[side=right]:right-0 md:flex',
					// Adjust the padding for floating and inset variants.
					variant === 'floating' || variant === 'inset'
						? 'p-2'
						: 'group-data-[side=left]:border-r group-data-[side=right]:border-l',
					className
				)}
				{...props}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
				>
					{children}
				</div>
			</div>
		</div>
	);
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn('flex flex-col gap-2 p-2', className)}
			{...props}
		/>
	);
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn('flex flex-col gap-2 p-2', className)}
			{...props}
		/>
	);
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				'no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto',
				className
			)}
			{...props}
		/>
	);
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
			{...props}
		/>
	);
}

function SidebarGroupContent({
	className,
	...props
}: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn('w-full text-caption-1', className)}
			{...props}
		/>
	);
}

/** A soft highlight glides to the item under the pointer, like the tabs' hover mark. */
function SidebarMenu({ className, onPointerOver, onPointerLeave, children, ...props }: React.ComponentProps<'ul'>) {
	const hover = useHoverMark('[data-slot=sidebar-menu-item]', 'y');
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn('relative flex w-full min-w-0 flex-col gap-0', className)}
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
			{hover.mark.rect && (
				<li
					aria-hidden
					role="presentation"
					data-slot="sidebar-menu-hover-mark"
					{...hoverMarkProps(
						hover.mark,
						'pointer-events-none absolute inset-x-0 rounded-lg bg-sidebar-accent/60'
					)}
				/>
			)}
			{children}
		</ul>
	);
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn('group/menu-item relative', className)}
			{...props}
		/>
	);
}

const sidebarMenuButtonVariants = cva(
	'peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-caption-1 ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0 [&>span:last-child]:truncate',
	{
		variants: {
			variant: {
				default: 'hover:text-sidebar-accent-foreground',
				outline:
					'bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]',
			},
			size: {
				default: 'h-8 text-caption-1',
				sm: 'h-7 text-caption-3',
				lg: 'h-12 text-caption-1',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

function SidebarMenuButton({
	render,
	isActive = false,
	variant = 'default',
	size = 'default',
	className,
	...props
}: useRender.ComponentProps<'button'> &
	React.ComponentProps<'button'> & {
		isActive?: boolean;
	} & VariantProps<typeof sidebarMenuButtonVariants>) {
	return useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				className: cn(sidebarMenuButtonVariants({ variant, size }), className),
			},
			props
		),
		render,
		state: {
			slot: 'sidebar-menu-button',
			sidebar: 'menu-button',
			size,
			active: isActive,
		},
	});
}

function SidebarMenuAction({
	className,
	render,
	showOnHover = false,
	...props
}: useRender.ComponentProps<'button'> &
	React.ComponentProps<'button'> & {
		showOnHover?: boolean;
	}) {
	return useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				className: cn(
					'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
					showOnHover &&
						'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0',
					className
				),
			},
			props
		),
		render,
		state: {
			slot: 'sidebar-menu-action',
			sidebar: 'menu-action',
		},
	});
}

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
};
