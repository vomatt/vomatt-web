import { defineType } from 'sanity';
import { DoubleChevronDownIcon } from '@sanity/icons';

export default defineType({
	title: 'Accordion List',
	name: 'accordionList',
	type: 'object',
	icon: DoubleChevronDownIcon,
	fields: [
		{
			title: 'Accordion List',
			name: 'items',
			type: 'array',
			of: [{ type: 'accordion' }],
		},
	],
	preview: {
		select: {
			items: 'items',
		},
		prepare({ items }) {
			return {
				title: 'Accordion List',
				subtitle: `${items.length} item(s)`,
			};
		},
	},
});
