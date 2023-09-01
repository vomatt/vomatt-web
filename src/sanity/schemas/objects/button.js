import { defineType } from 'sanity';

export default defineType({
	name: 'button',
	type: 'object',
	title: 'Button',
	fields: [
		{
			name: 'label',
			title: 'Label',
			type: 'string',
		},
		{
			name: 'link',
			title: 'Link',
			type: 'link',
		},
	],
});
