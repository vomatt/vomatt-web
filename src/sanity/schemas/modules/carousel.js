import { InlineElementIcon } from '@sanity/icons';
import { defineType } from 'sanity';

import customImage from '../../lib/custom-image';

export default defineType({
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
			description: 'Automatically switch between slides',
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
				Rule.custom((autoplayInterval, context) => {
					if (context.parent.autoplay == true) {
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
			const itemsWithImage = items.filter((el) => el._type == 'image');
			const media = (itemsWithImage && itemsWithImage[0].asset) || false;

			return {
				title: 'Carousel',
				subtitle: `${items.length} item${items.length > 1 ? 's' : ''}`,
				media: media,
			};
		},
	},
});
