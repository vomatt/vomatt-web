import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { LoadingLabel } from '@/components/ui/LoadingLabel';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const buttonVariantClasses = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-(--radius) border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,opacity,translate] outline-none select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 data-loading:pointer-events-none data-loading:relative data-loading:[-webkit-text-fill-color:transparent] data-loading:[&>:not([data-slot=button-loading])]:opacity-0 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100',
				// The create action only; its colours per theme are the --create tokens
				create:
					'bg-create text-create-foreground hover:bg-create-hover [&_svg]:text-create-icon disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 disabled:[&_svg]:text-muted-foreground',
				outline:
					'border-border-strong bg-card hover:bg-surface-soft hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
				ghost:
					'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
				// A ghost that stays red on hover, for a delete that still needs confirming
				'ghost-destructive':
					'text-destructive hover:bg-muted hover:text-destructive dark:hover:bg-muted/50',
				destructive:
					'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
				// Underlined at rest so it never reads as a link by colour alone
				link: 'text-primary underline underline-offset-4',
			},
			size: {
				default:
					'h-11 gap-2 px-4 text-[15px] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5',
				// Phones keep the 44px target; from md each size takes its own height
				md: 'h-11 gap-2 px-4 text-[14px] md:h-10 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5',
				sm: "h-11 gap-1.5 px-3 text-[14px] md:h-9 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
				xs: "h-11 gap-1.5 px-3 text-[13px] md:h-8 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: 'h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
				icon: 'size-11',
				'icon-xs': 'size-11 rounded-full md:size-8',
				'icon-sm':
					'size-11 in-data-[slot=button-group]:rounded-lg md:size-9',
				'icon-lg': 'size-12',
			},
		},
		// After the size classes, so a link lines up with the text beside it
		compoundVariants: [{ variant: 'link', className: 'px-0' }],
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

/**
 * The variant classes merged, so a variant's border or background wins over the base's
 * (`border-border` over `border-transparent`) on a `Link` styled as a button too.
 */
const buttonVariants = (props?: Parameters<typeof buttonVariantClasses>[0]) => cn(buttonVariantClasses(props));

/**
 * `loading` keeps the button's own colours (it is busy, not unavailable), keeps focus on it,
 * ignores clicks and submits, and lays the spinner (or `loadingIcon`) over the label so the width holds.
 * The label is hidden in place, not wrapped, so its children are not remounted.
 */
function Button({
	className,
	variant = 'default',
	size = 'default',
	loading = false,
	loadingIcon,
	disabled,
	focusableWhenDisabled,
	children,
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean; loadingIcon?: React.ReactNode }) {
	return (
		<ButtonPrimitive
			data-slot="button"
			data-loading={loading || undefined}
			aria-busy={loading || undefined}
			disabled={disabled || loading}
			focusableWhenDisabled={focusableWhenDisabled || loading}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{children}
			{loading && (
				<span data-slot="button-loading" role="status" className="absolute inset-0 grid place-items-center">
					{loadingIcon ?? <Spinner role="presentation" aria-hidden />}
					<LoadingLabel />
				</span>
			)}
		</ButtonPrimitive>
	);
}

export { Button, buttonVariants };
