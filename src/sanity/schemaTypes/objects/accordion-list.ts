import { DoubleChevronDownIcon } from '@sanity/icons';
import { defineArrayMember } from 'sanity';

export default function accordionList() {
	return defineArrayMember({
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
}
