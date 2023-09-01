const customImage = ({ hasDisplayOptions = true, ...props } = {}) => {
	const crops = [
		{ title: '1 : 1 (square)', value: 1 },
		{ title: '5 : 7', value: 0.7142857143 },
		{ title: '4 : 6', value: 0.6666666667 },
		{ title: '16 : 9', value: 1.7777777778 },
	];

	return {
		title: 'Image',
		name: 'image',
		type: 'image',
		fields: [
			{
				title: 'Alt text',
				name: 'alt',
				type: 'string',
			},
			...(hasDisplayOptions
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
		],
		preview: {
			select: {
				asset: 'asset',
				customAlt: 'alt',
				customRatio: 'customRatio',
			},
			prepare({ asset, customAlt, customRatio }) {
				const crop = crops.find((crop) => crop?.value === customRatio);

				return {
					title: customAlt,
					subtitle: crop?.title && `Crop: ${crop?.title}`,
					media: asset,
				};
			},
		},
		...props,
	};
};

export default customImage;
