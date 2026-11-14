'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { X } from '@/components/ui/SvgIcons';
import { keyboardInsetClasses, useKeyboardInset } from '@/hooks/useVisualViewport';
import { cn } from '@/lib/utils';

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-overlay"
			className={cn(
				'fixed inset-0 isolate z-50 bg-overlay duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
				className
			)}
			{...props}
		/>
	);
}

/** Mounted only while open, so closed dialogs don't watch the viewport. */
function DialogPopup({ style, ...props }: DialogPrimitive.Popup.Props) {
	return <DialogPrimitive.Popup {...props} {...useKeyboardInset(style)} />;
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	closeLabel,
	overlay = 'default',
	...props
}: DialogPrimitive.Popup.Props & {
	overlay?: 'default' | 'strong';
} & (
		// The close button's name is required whenever the button is shown
		| { showCloseButton?: true; closeLabel: string }
		| { showCloseButton: false; closeLabel?: undefined }
	)) {
	return (
		<DialogPortal>
			<DialogOverlay className={cn(overlay === 'strong' && 'bg-overlay-strong backdrop-blur-md')} />
			<DialogPopup
				data-slot="dialog-content"
				className={cn(
					'fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 grid-cols-[minmax(0,1fr)] rounded-xl border border-transparent bg-popover text-caption-1 text-popover-foreground ring-1 ring-foreground/10 duration-100 overflow-y-auto outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 motion-safe:data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 motion-safe:data-closed:zoom-out-95',
					keyboardInsetClasses,
					className
				)}
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						render={
							<Button
								variant="ghost"
								className="absolute top-1 right-1"
								size="icon-sm"
							/>
						}
					>
						<X />
						<span className="sr-only">{closeLabel}</span>
					</DialogPrimitive.Close>
				)}
			</DialogPopup>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="dialog-header"
			// The 12px under it and a DialogBody's 4px top make the 16px between them
			className={cn('flex flex-col gap-2 px-4 pt-4 pb-3', className)}
			{...props}
		/>
	);
}

/** A content section of a `DialogContent`. `scroll` for the one whose row the popup's `grid-rows-*` make `minmax(0,1fr)`. */
function DialogBody({ className, scroll = false, ...props }: React.ComponentProps<'div'> & { scroll?: boolean }) {
	return (
		<div
			data-slot="dialog-body"
			className={cn(
				// The 4px top keeps fields' focus outline (2px, offset 2px) clear of a scrolling edge
				'px-4 pt-1 pb-4',
				scroll && 'overflow-y-auto overscroll-contain',
				className
			)}
			{...props}
		/>
	);
}

function DialogFooter({
	className,
	showCloseButton = false,
	closeLabel = 'Close',
	children,
	...props
}: React.ComponentProps<'div'> & {
	showCloseButton?: boolean;
	closeLabel?: string;
}) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn(
				'flex flex-col-reverse gap-2 rounded-b-[calc(var(--radius-xl)-1px)] border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
				className
			)}
			{...props}
		>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close render={<Button variant="outline" />}>
					{closeLabel}
				</DialogPrimitive.Close>
			)}
		</div>
	);
}

// Shared with AlertDialogTitle so both dialog titles stay the same role
const dialogTitleClasses = 'text-title-3 leading-snug';

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn(dialogTitleClasses, className)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn(
				'text-caption-1 text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
				className
			)}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	dialogTitleClasses,
	DialogTrigger,
};
