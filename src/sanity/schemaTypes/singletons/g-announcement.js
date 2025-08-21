import { EditIcon } from '@sanity/icons';
import { defineType } from 'sanity';

import { getPortableTextPreview } from '@/sanity/lib/utils';

export const gAnnouncement = defineType({
	title: 'Announcement Settings',
	name: 'gAnnouncement',
	type: 'document',
	fields: [
		{
			name: 'display',
			type: 'string',
			options: {
				list: [
					{ title: 'Hidden', value: 'hidden' },
					{ title: 'All Pages', value: 'all' },
					{ title: 'Homepage', value: 'homepage' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
		},
		{
			name: 'messages',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						{
							name: 'content',
							type: 'portableTextSimple',
						},
					],
					preview: {
						select: {
							content: 'content',
						},
						prepare({ content }) {
							return {
								title: getPortableTextPreview(content),
								media: EditIcon,
							};
						},
					},
				},
			],
		},
		{
			name: 'autoplay',
			type: 'boolean',
		},
		{
			name: 'autoplayInterval',
			description: 'Interval in seconds',
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
		{
			name: 'backgroundColor',
			type: 'color',
			options: {
				disableAlpha: true,
			},
		},
		{
			name: 'textColor',
			type: 'color',
			options: {
				disableAlpha: true,
			},
		},
		{
			name: 'emphasizeColor',
			type: 'color',
			options: {
				disableAlpha: true,
			},
		},
	],
	initialValue: {
		display: 'hidden',
	},
	preview: {
		prepare() {
			return {
				title: 'Announcement Settings',
			};
		},
	},
});
