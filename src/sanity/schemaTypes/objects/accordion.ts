import { DoubleChevronDownIcon } from '@sanity/icons';

export default function accordion() {
	return {
		name: 'accordion',
		type: 'object',
		icon: DoubleChevronDownIcon,
		fields: [
			{
				title: 'Title',
				name: 'title',
				type: 'string',
			},
			{
				title: 'Content',
				name: 'content',
				type: 'portableTextSimple',
			},
		],
		preview: {
			select: {
				title: 'title',
			},
		},
	};
}
