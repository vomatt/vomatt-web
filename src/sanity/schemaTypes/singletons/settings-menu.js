import { MenuIcon } from '@sanity/icons';
import { defineType } from 'sanity';

export const settingsMenu = defineType({
	title: 'Menu',
	name: 'settingsMenu',
	type: 'document',
	fields: [
		{
			name: 'title',
			type: 'string',
		},
		{
			name: 'items',
			type: 'array',
			of: [{ type: 'navItem' }, { type: 'navDropdown' }],
		},
	],
	preview: {
		select: {
			title: 'title',
			items: 'items',
		},
		prepare({ title = 'Untitled', items = [] }) {
			return {
				title,
				subtitle: `${items.length} link(s)`,
				media: MenuIcon,
			};
		},
	},
});
