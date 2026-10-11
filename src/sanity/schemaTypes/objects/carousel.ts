import { InlineElementIcon } from '@sanity/icons';
import { defineArrayMember } from 'sanity';

import customImage from '@/sanity/schemaTypes/objects/custom-image';

export default function carousel() {
	return defineArrayMember({
		name: 'carousel',
		type: 'object',
		icon: InlineElementIcon,
		fields: [
			{
				title: 'Items',
				name: 'items',
				type: 'array',
				of: [customImage()],
				validation: (Rule) => Rule.min(1).required(),
			},
			{
				title: 'Autoplay',
				name: 'autoplay',
				type: 'boolean',
			},
			{
				title: 'Autoplay Interval',
				description: 'Interval in seconds',
				name: 'autoplayInterval',
				type: 'number',
				hidden: ({ parent }) => !parent.autoplay,
				validation: (Rule) =>
					Rule.custom<number>((autoplayInterval, context) => {
						if ((context.parent as { autoplay?: boolean }).autoplay == true) {
							if (autoplayInterval < 2) {
								return 'Interval must be 2 seconds or more';
							} else if (autoplayInterval > 20) {
								return 'Interval must be 20 seconds or less';
							}
						}

						return true;
					}),
			},
		],
		preview: {
			select: {
				items: 'items',
			},
			prepare({ items }) {
				const itemsWithImage = items.filter(
					(el: { _type: string }) => el._type == 'image'
				);
				const media = (itemsWithImage && itemsWithImage[0].asset) || false;

				return {
					title: 'Carousel',
					subtitle: `${items.length} item${items.length > 1 ? 's' : ''}`,
					media: media,
				};
			},
		},
	});
}
