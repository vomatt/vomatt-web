import { defineType } from 'sanity';

export const portableTextSimple = defineType({
	name: 'portableTextSimple',
	type: 'array',
	of: [
		{
			title: 'Block',
			type: 'block',
			styles: [{ title: 'Paragraph', value: 'normal' }],
			lists: [],
			marks: {
				decorators: [
					{ title: 'Bold', value: 'strong' },
					{ title: 'Italic', value: 'em' },
					{ title: 'Underline', value: 'underline' },
					{ title: 'Strike', value: 'strike-through' },
				],
				annotations: [
					{
						name: 'link',
						type: 'link',
					},
				],
			},
		},
	],
});
