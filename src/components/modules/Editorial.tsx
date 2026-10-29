import type { PortableTextBlock } from '@portabletext/react';

import CustomPortableText from '@/components/CustomPortableText';
import Img, { type ImgSource } from '@/components/Image';
import { cn } from '@/lib/utils';

import { ModuleSection, type SectionHeadingData } from './shared';

export type EditorialData = SectionHeadingData & {
	body?: PortableTextBlock[];
	media?: ImgSource & { asset?: unknown };
	mediaPosition?: 'left' | 'right';
};

/** A heading and long-form text, with an optional image beside it from md. */
export default function Editorial({ data }: { data: EditorialData }) {
	const { body, media, mediaPosition, ...heading } = data;
	const hasMedia = !!media?.asset;

	return (
		<div className={cn('grid gap-6', hasMedia && 'md:grid-cols-2 md:items-center md:gap-8')}>
			<ModuleSection {...heading} className="gap-4">
				{body && (
					<div className="cms-prose text-[17px]">
						<CustomPortableText blocks={body} />
					</div>
				)}
			</ModuleSection>
			{hasMedia && (
				<div className={cn('overflow-hidden rounded-2xl border border-border', mediaPosition === 'left' && 'md:-order-1')}>
					<Img image={media} />
				</div>
			)}
		</div>
	);
}
