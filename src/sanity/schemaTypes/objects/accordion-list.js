import { DoubleChevronDownIcon } from '@sanity/icons';

export default function accordionList() {
	return {
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
	};
}
