import { ChevronDownIcon } from '@sanity/icons';
import { defineType } from 'sanity';
export default defineType({
	title: 'Dropdown',
	name: 'navDropdown',
	type: 'object',
	icon: ChevronDownIcon,
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			description: 'Text to Display',
		},
		{
			title: 'Dropdown Items',
			name: 'dropdownItems',
			type: 'array',
			of: [{ type: 'navItem' }],
		},
	],
	preview: {
		select: {
			title: 'title',
		},
		prepare({ title }) {
			return {
				title: title,
				subtitle: 'Dropdown',
				media: ChevronDownIcon,
			};
		},
	},
});
