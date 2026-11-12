'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Fragment, useMemo } from 'react';

import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';

const fieldVariants = cva(
	'relative group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
	{
		variants: {
			orientation: {
				vertical: ['flex-col [&>*]:w-full [&>.sr-only]:w-auto'],
				horizontal: [
					'flex-row items-center',
					'[&>[data-slot=field-label]]:flex-auto',
					'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
				],
				responsive: [
					'flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto',
					'@md/field-group:[&>[data-slot=field-label]]:flex-auto',
					'@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
				],
			},
		},
		defaultVariants: {
			orientation: 'vertical',
		},
	}
);

function Field({
	className,
	orientation = 'vertical',
	...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
	return (
		<div
			role="group"
			data-slot="field"
			data-orientation={orientation}
			className={cn(fieldVariants({ orientation }), className)}
			{...props}
		/>
	);
}

function FieldLabel({
	className,
	...props
}: React.ComponentProps<typeof Label>) {
	return (
		<Label
			data-slot="field-label"
			className={cn(
				'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
				'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
				'has-data-checked:bg-primary/5 has-data-checked:border-primary dark:has-data-checked:bg-primary/10',
				className
			)}
			{...props}
		/>
	);
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
	return (
		<p
			data-slot="field-description"
			className={cn(
				'text-muted-foreground text-caption-1 leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance',
				'last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5',
				'[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
				className
			)}
			{...props}
		/>
	);
}

function FieldError({
	className,
	children,
	errors,
	...props
}: React.ComponentProps<'div'> & {
	errors?: Array<{ message?: string } | undefined>;
}) {
	const content = useMemo(() => {
		if (children) {
			return children;
		}

		if (!errors) {
			return null;
		}

		if (errors?.length === 1 && errors[0]?.message) {
			return errors[0].message;
		}

		return (
			<ul className="ml-4 flex list-disc flex-col gap-1">
				{errors.map(
					(error, index) =>
						error?.message && <li key={index}>{error.message}</li>
				)}
			</ul>
		);
	}, [children, errors]);

	if (!content) {
		return null;
	}

	return (
		<div
			role="alert"
			data-slot="field-error"
			className={cn('text-destructive text-caption-1 font-normal', className)}
			{...props}
		>
			{content}
		</div>
	);
}

/**
 * A field's hint and its errors share one space, so an error never moves the layout:
 * the hint fades out and the error rises into its place. Point the control's
 * aria-describedby at the shown error's id, or at `hintId` while there is none.
 */
function FieldMessage({
	hint,
	hintId,
	errors = [],
	className,
}: {
	hint?: React.ReactNode;
	hintId?: string;
	/** Already translated; each distinct text once. */
	errors?: { id: string; text: string }[];
	className?: string;
}) {
	const invalid = errors.length > 0;
	return (
		<span
			data-slot="field-message"
			className={cn('grid min-h-lh *:col-start-1 *:row-start-1', className)}
		>
			<span
				id={hintId}
				aria-hidden={invalid || undefined}
				className={cn('transition-opacity duration-150 ease-out', invalid && 'opacity-0')}
			>
				{hint}
			</span>
			{/* Rendered empty first, so a screen reader hears each error as it appears */}
			<span aria-live="polite" className="text-destructive">
				{errors.map(({ id, text }, index) => (
					<Fragment key={text}>
						{index > 0 && ' '}
						<span
							id={id}
							className="inline-block transition-[opacity,translate,filter] duration-200 ease-out starting:opacity-0 motion-safe:starting:translate-y-1 motion-safe:starting:blur-xs"
						>
							{text}
						</span>
					</Fragment>
				))}
			</span>
		</span>
	);
}

export {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldMessage,
};
