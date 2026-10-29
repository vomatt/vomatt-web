import { type ReactNode, useId } from 'react';

import CMSLink from '@/components/CMSLink';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type ModuleAction = {
	_key: string;
	label?: string;
	link?: { _type: string; href?: string; isNewTab: boolean };
};

export type SectionHeadingData = {
	eyebrow?: string;
	heading?: string;
	intro?: string;
};

/** Hero and Callout: a heading and up to two buttons. */
export type ActionsModuleData = SectionHeadingData & { actions?: ModuleAction[] };

export function Eyebrow({ children }: { children?: string }) {
	if (!children) return null;
	return <p className="text-[13px] font-medium text-muted-foreground">{children}</p>;
}

/** A module's section, named by its h2, with the eyebrow and intro above its content. */
export function ModuleSection({
	eyebrow,
	heading,
	intro,
	className,
	children,
}: SectionHeadingData & { className?: string; children: ReactNode }) {
	const headingId = useId();

	return (
		<section aria-labelledby={heading ? headingId : undefined} className={cn('flex flex-col gap-6', className)}>
			{(eyebrow || heading || intro) && (
				<div className="flex flex-col gap-2">
					<Eyebrow>{eyebrow}</Eyebrow>
					{heading && (
						<h2 id={headingId} className="section-title text-foreground">
							{heading}
						</h2>
					)}
					{intro && <p className="text-[17px] leading-[1.6] text-muted-foreground">{intro}</p>}
				</div>
			)}
			{children}
		</section>
	);
}

/** Up to two buttons: the first is the primary one, the second an outline. */
export function ModuleActions({ actions, className }: { actions?: ModuleAction[]; className?: string }) {
	const links = actions?.filter((action) => action.link?.href && action.label);
	if (!links?.length) return null;

	return (
		<div className={cn('flex flex-wrap gap-3', className)}>
			{links.map((action, i) => (
				<CMSLink
					key={action._key}
					link={action.link}
					title={action.label}
					className={buttonVariants({ variant: i === 0 ? 'default' : 'outline' })}
				/>
			))}
		</div>
	);
}
