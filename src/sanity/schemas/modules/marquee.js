import { EllipsisHorizontalIcon } from '@sanity/icons';
import { defineType } from 'sanity';

import customImage from '../../lib/custom-image';

export default defineType({
	title: 'Marquee',
	name: 'marquee',
	type: 'object',
	icon: EllipsisHorizontalIcon,
	fieldsets: [
		{
			title: '',
			name: 'options',
			options: { columns: 2 },
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
			description: 'Set seconds of duration',
			initialValue: 5,
			validation: (Rule) => Rule.min(0).max(100).precision(100),
		},
		{
			title: 'Reverse direction?',
			name: 'reverse',
			type: 'boolean',
			initialValue: false,
			fieldset: 'options',
		},
		{
			title: 'Pause on hover?',
			name: 'pausable',
			type: 'boolean',
			initialValue: false,
			fieldset: 'options',
		},
	],
	preview: {
		select: {
			text: 'items.0.text',
		},
		prepare({ text }) {
			return {
				title: 'Marquee',
				subtitle: text,
				media: EllipsisHorizontalIcon,
			};
		},
	},
});
