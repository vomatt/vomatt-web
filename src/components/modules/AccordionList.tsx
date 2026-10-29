import type { PortableTextBlock } from '@portabletext/react';

import CustomPortableText from '@/components/CustomPortableText';
import { ChevronDown } from '@/components/ui/SvgIcons';

import { ModuleSection, type SectionHeadingData } from './shared';

export type AccordionListData = SectionHeadingData & {
	items?: { _key: string; title?: string; content?: PortableTextBlock[] }[];
};

/** Questions or tips that open one at a time, on native <details>. */
export default function AccordionList({ data }: { data: AccordionListData }) {
	const { eyebrow, heading, intro, items = [] } = data;

	return (
		<ModuleSection eyebrow={eyebrow} heading={heading} intro={intro}>
			<div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
				{items.map((item) => (
					<details key={item._key} className="group">
						<summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-[18px] py-3.5 item-title leading-[1.4] text-foreground outline-none hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
							{item.title}
							<ChevronDown
								aria-hidden
								className="size-4 shrink-0 text-muted-foreground group-open:rotate-180 motion-safe:transition-transform"
							/>
						</summary>
						<div className="px-[18px] pb-4 text-[15px] leading-[1.6] text-muted-foreground [&_a]:underline [&_a]:underline-offset-2 [&>*+*]:mt-3">
							<CustomPortableText blocks={item.content} />
						</div>
					</details>
				))}
			</div>
		</ModuleSection>
	);
}
