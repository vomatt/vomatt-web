import { cn } from '@/lib/utils';

/**
 * A bar that sticks under the phone Header and slides with it (`follow-header`), fading into
 * what scrolls under it once stuck. A `nav` when it holds the page's navigation.
 */
export function StickyBar({
	as: Component = 'div',
	className,
	children,
	...props
}: React.ComponentProps<'div'> & { as?: 'div' | 'nav' }) {
	return (
		<Component className={cn('sticky follow-header z-20', className)} {...props}>
			{children}
			<span data-sticky-fade aria-hidden />
		</Component>
	);
}
