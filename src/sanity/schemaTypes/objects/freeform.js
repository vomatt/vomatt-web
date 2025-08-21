import { EditIcon } from '@sanity/icons';

import { getPortableTextPreview } from '@/sanity/lib/utils';

export default function freeform() {
	return {
		name: 'freeform',
		type: 'object',
		icon: EditIcon,
		fields: [
			{
				name: 'content',
				type: 'portableText',
			},
			{
				name: 'sectionAppearance',
				type: 'sectionAppearance',
			},
		],
		preview: {
			select: {
				content: 'content',
			},
			prepare({ content }) {
				const firstImage = content
					? content.find((item) => item._type === 'image')
					: null;

				return {
					title: getPortableTextPreview(content),
					subtitle: 'Freeform',
					media: firstImage || EditIcon,
				};
			},
		},
	};
}
