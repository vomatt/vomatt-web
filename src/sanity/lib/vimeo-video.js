import { DocumentVideoIcon } from '@sanity/icons';
import customImage from '../schemas/objects/custom-image';

export default function vimeoVideo({
	title,
	name = 'video',
	thumbnail,
	...props
} = {}) {
	return {
		title: title || '',
		name: name,
		type: 'object',
		icon: DocumentVideoIcon,
		fields: [
			{
				name: 'vimeoUrl',
				type: 'string',
				validation: (Rule) => Rule.required(),
			},
			customImage({ name: 'thumbnail' }),
		],
		preview: {
			select: {
				vimeoUrl: 'vimeoUrl',
				asset: 'thumbnail',
				customAlt: 'thumbnail.alt',
			},
			prepare({ vimeoUrl, asset, customAlt }) {
				return {
					title: vimeoUrl || customAlt,
					media: asset,
				};
			},
		},
		...props,
	};
}
