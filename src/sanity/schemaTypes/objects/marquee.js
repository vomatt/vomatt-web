import { EllipsisHorizontalIcon, StringIcon } from '@sanity/icons';

import customImage from '@/sanity/schemaTypes/objects/custom-image';

export default function marquee({ title, name = 'marquee', ...props } = {}) {
	return {
		title: title || '',
		name: name,
		type: 'object',
		icon: EllipsisHorizontalIcon,
		fieldsets: [
			{
				name: 'options',
				options: { columns: 2 },
			},
			{
				name: 'gradient',
			},
		],
		fields: [
			{
				title: 'Items',
				name: 'items',
				type: 'array',
				of: [
					{
						title: 'Text',
						name: 'simple',
						type: 'object',
						fields: [
							{
								title: 'Text',
								name: 'text',
								type: 'string',
								validation: (Rule) => Rule.required(),
							},
						],
						preview: {
							select: {
								text: 'text',
							},
							prepare({ text }) {
								return {
									title: text,
									media: StringIcon,
								};
							},
						},
					},
					customImage(),
				],
				validation: (Rule) => Rule.min(1).required(),
			},
			{
				title: 'Speed',
				name: 'speed',
				type: 'number',
				description: 'Speed in pixels per second',
				initialValue: 50,
				validation: (Rule) => Rule.min(0).max(500).integer(),
				fieldset: 'options',
			},
			{
				title: 'Reverse Direction',
				name: 'reverse',
				type: 'boolean',
				initialValue: false,
				fieldset: 'options',
			},
			{
				title: 'Pause on Hover',
				name: 'pausable',
				type: 'boolean',
				initialValue: false,
				fieldset: 'options',
			},
			{
				name: 'showGradient',
				type: 'boolean',
				description: 'Displays a gradient overlay at start and end',
				initialValue: false,
				fieldset: 'gradient',
			},
			{
				name: 'gradientColor',
				type: 'reference',
				to: [{ type: 'settingsBrandColors' }],
				description: 'Color of the gradient overlay',
				fieldset: 'gradient',
				hidden: ({ parent }) => !parent?.showGradient,
			},
			{
				title: 'Merge into Section',
				name: 'isMerged',
				type: 'string',
				description: 'Merge marquee into top/bottom section',
				options: {
					list: [
						{ title: 'None', value: '' },
						{ title: 'Top', value: 'top' },
						{ title: 'Bottom', value: 'bottom' },
					],
					layout: 'radio',
					direction: 'horizontal',
				},
				initialValue: '',
			},
		],
		preview: {
			select: {
				items: 'items',
				isMerged: 'isMerged',
			},
			prepare({ items, isMerged }) {
				const isMergedNote =
					isMerged !== '' ? ` | Merge into ${isMerged} section` : '';
				return {
					title: `Marquee`,
					subtitle: `${items?.length || 0} item${items?.length > 1 ? 's' : ''}${isMergedNote}`,
					media: EllipsisHorizontalIcon,
				};
			},
		},
		...props,
	};
}
