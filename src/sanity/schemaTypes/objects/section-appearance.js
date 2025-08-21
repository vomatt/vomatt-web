import { defineType } from 'sanity';

const SPACING_OPTIONS = [
	{ title: '0px', value: 0 },
	{ title: '4px', value: 1 },
	{ title: '8px', value: 2 },
	{ title: '12px', value: 3 },
	{ title: '16px', value: 4 },
	{ title: '20px', value: 5 },
	{ title: '24px', value: 6 },
	{ title: '28px', value: 7 },
	{ title: '32px', value: 8 },
	{ title: '36px', value: 9 },
	{ title: '40px', value: 10 },
	{ title: '44px', value: 11 },
	{ title: '48px', value: 12 },
	{ title: '56px', value: 14 },
	{ title: '64px', value: 16 },
	{ title: '80px', value: 20 },
	{ title: '96px', value: 24 },
	{ title: '112px', value: 28 },
	{ title: '128px', value: 32 },
	{ title: '144px', value: 36 },
	{ title: '160px', value: 40 },
	{ title: '176px', value: 44 },
	{ title: '192px', value: 48 },
	{ title: '208px', value: 52 },
	{ title: '224px', value: 56 },
	{ title: '240px', value: 60 },
	{ title: '256px', value: 64 },
	{ title: '288px', value: 72 },
	{ title: '320px', value: 80 },
	{ title: '384px', value: 96 },
];

export const sectionAppearance = defineType({
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
					{ title: 'Left', value: 'text-left' },
					{ title: 'Center', value: 'text-center' },
					{ title: 'Right', value: 'text-right' },
					{ title: 'Justify', value: 'text-justify' },
				],
			},
		},
		{
			title: 'Max Width',
			name: 'maxWidth',
			type: 'string',
			options: {
				list: [
					{ title: 'Full', value: 'none' },
					{ title: 'XL (1280px)', value: 'xl' },
					{ title: 'L (1024px)', value: 'l' },
					{ title: 'M (768px)', value: 'm' },
					{ title: 'S (576px)', value: 's' },
					{ title: 'XS (320px)', value: 'xs' },
				],
			},
		},
		{
			title: 'Spacing Top',
			name: 'spacingTop',
			type: 'number',
			options: {
				list: SPACING_OPTIONS,
			},
		},
		{
			title: 'Spacing Top (Desktop)',
			name: 'spacingTopDesktop',
			type: 'number',
			options: {
				list: SPACING_OPTIONS,
			},
		},
		{
			title: 'Spacing Bottom',
			name: 'spacingBottom',
			type: 'number',
			options: {
				list: SPACING_OPTIONS,
			},
		},
		{
			title: 'Spacing Bottom (Desktop)',
			name: 'spacingBottomDesktop',
			type: 'number',
			options: {
				list: SPACING_OPTIONS,
			},
		},
		{
			title: 'Background Color',
			name: 'backgroundColor',
			type: 'reference',
			to: [{ type: 'settingsBrandColors' }],
		},
		{
			title: 'Text Color',
			name: 'textColor',
			type: 'reference',
			to: [{ type: 'settingsBrandColors' }],
		},
	],
	initialValue: {
		maxWidth: 'none',
		textAlign: 'text-left',
	},
});
