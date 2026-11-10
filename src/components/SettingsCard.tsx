import { cn } from '@/lib/utils';

/** A settings row: at least 60px, its text then its control. */
export const rowClassName = 'flex min-h-15 items-center gap-4 px-4.5 py-3';

/** A row that is a link or button: the row, with a hover and focus outline. */
export const rowLinkClassName = cn(
	rowClassName,
	'transition-colors hover:bg-surface-soft outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring'
);

/** A settings card's surface, for an element `SettingsCard` can't render (a radio group). */
export const settingsCardClassName = 'divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card *:first:rounded-t-2xl *:last:rounded-b-2xl';

/** A settings card of rows divided by lines; a `ul` when its rows are a list. */
export function SettingsCard({
	as: Component = 'div',
	children,
	className,
}: {
	as?: 'div' | 'ul';
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Component className={cn(settingsCardClassName, className)}>
			{children}
		</Component>
	);
}

/** A row's title over its helper text; `id` names both for a control's aria-labelledby and aria-describedby. */
export function RowText({ title, body, id }: { title: React.ReactNode; body?: React.ReactNode; id?: string }) {
	return (
		<span className="min-w-0 flex-1">
			<span id={id && `${id}-label`} className="block font-medium">
				{title}
			</span>
			{body && (
				<span id={id && `${id}-body`} className="block text-caption-1 leading-normal text-muted-foreground">
					{body}
				</span>
			)}
		</span>
	);
}
