import callToAction from '@/sanity/schemaTypes/objects/call-to-action';
import customIframe from '@/sanity/schemaTypes/objects/custom-iframe';
import customImage from '@/sanity/schemaTypes/objects/custom-image';
import { defineType } from 'sanity';

export default defineType({
	name: 'portableText',
	type: 'array',
	of: [
		{
			title: 'Block',
			type: 'block',
			styles: [
				{ title: 'Paragraph', value: 'normal' },
				{
					title: 'Heading 1',
					value: 'h1',
				},
				{
					title: 'Heading 2',
					value: 'h2',
				},
				{
					title: 'Heading 3',
					value: 'h3',
				},
				{
					title: 'Heading 4',
					value: 'h4',
				},
				{
					title: 'Heading 5',
					value: 'h5',
				},
				{
					title: 'Heading 6',
					value: 'h6',
				},
				{ title: 'Quote', value: 'blockquote' },
			],
			lists: [
				{ title: 'Bullet', value: 'bullet' },
				{ title: 'Numbered', value: 'number' },
			],
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
					callToAction({ title: 'Button', showLabel: false }),
				],
			},
		},
		customImage({ hasLinkOptions: true }),
		customIframe(),
	],
});
