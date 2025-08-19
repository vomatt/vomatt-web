import { ImageIcon } from '@sanity/icons';

export default function customImage({
	title,
	name = 'image',
	hasCropOptions = false,
	hasLinkOptions = false,
	...props
} = {}) {
	const crops = [
		{ title: '1 : 1 (square)', value: 1 },
		{ title: '5 : 7', value: 0.7142857143 },
		{ title: '4 : 6', value: 0.6666666667 },
		{ title: '16 : 9', value: 1.7777777778 },
	];

	return {
		title: title || '',
		name: name,
		type: 'image',
		icon: ImageIcon,
		fields: [
			{
				title: 'Alt text',
				name: 'alt',
				type: 'string',
			},
			...(hasCropOptions
				? [
						{
							title: 'Crop',
							name: 'customRatio',
							type: 'number',
							options: {
								list: crops,
							},
						},
					]
				: []),
			...(hasLinkOptions
				? [
						{
							name: 'link',
							type: 'link',
						},
					]
				: []),
		],
		preview: {
			select: {
				asset: 'asset',
				originalFilename: 'asset.originalFilename',
				customAlt: 'alt',
				customRatio: 'customRatio',
			},
			prepare({ asset, originalFilename, customAlt, customRatio }) {
				const crop = crops.find((crop) => crop?.value === customRatio);

				return {
					title: !asset ? 'Missing image' : customAlt || originalFilename,
					subtitle: crop?.title && `Crop: ${crop?.title}`,
					media: asset,
				};
			},
		},
		...props,
	};
}
