import { defineType } from 'sanity';

export default defineType({
	name: 'sectionAppearance',
	type: 'object',
	options: {
		columns: 2,
	},
	fields: [
		{
			title: 'Text Alignment',
			name: 'textAlign',
			type: 'string',
			options: {
				list: [
					{ title: 'Left', value: 'left' },
					{ title: 'Center', value: 'center' },
					{ title: 'Right', value: 'right' },
					{ title: 'Justify', value: 'justify' },
				],
			},
		},
		{
			title: 'Max Width',
			name: 'maxWidth',
			type: 'string',
			options: {
				list: [
					{ title: 'None', value: 'none' },
					{ title: 'XL', value: 'w-1' },
					{ title: 'L', value: 'w-2' },
					{ title: 'M', value: 'w-3' },
					{ title: 'S', value: 'w-4' },
					{ title: 'XS', value: 'w-5' },
				],
			},
		},
		{
			title: 'Spacing Top',
			name: 'spacingTop',
			type: 'number',
		},
		{
			title: 'Spacing Top (Mobile)',
			name: 'spacingTopMobile',
			type: 'number',
		},
		{
			title: 'Spacing Bottom',
			name: 'spacingBottom',
			type: 'number',
		},
		{
			title: 'Spacing Bottom (Mobile)',
			name: 'spacingBottomMobile',
			type: 'number',
		},
		{
			title: 'Background Color',
			name: 'backgroundColor',
			type: 'color',
		},
		{
			title: 'Text Color',
			name: 'textColor',
			type: 'color',
		},
	],
	initialValue: {
		maxWidth: 'none',
		textAlign: 'left',
	},
});
