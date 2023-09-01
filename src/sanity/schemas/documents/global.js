import { ControlsIcon } from '@sanity/icons';
import { defineType } from 'sanity';

import { getSwatch } from '../../lib/helpers';

export default defineType({
	title: 'global',
	name: 'gComponents',
	type: 'document',
	icon: ControlsIcon,
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		},
		{
			title: 'Color',
			name: 'color',
			type: 'color',
			options: {
				disableAlpha: true,
			},
			validation: (Rule) => Rule.required(),
		},
	],
	preview: {
		select: {
			title: 'title',
			color: 'color',
		},
		prepare({ title, color }) {
			return {
				title: title,
				subtitle: color?.hex ? color.hex.toUpperCase() : '',
				media: color?.hex ? getSwatch(color.hex.toUpperCase()) : null,
			};
		},
	},
});
