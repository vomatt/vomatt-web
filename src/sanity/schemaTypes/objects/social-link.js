import { getIcon } from '@/lib/utils';
import { defineType } from 'sanity';

export const socialLink = defineType({
	title: 'Social Link',
	name: 'socialLink',
	type: 'object',
	options: {
		columns: 2,
		collapsible: false,
	},
	fields: [
		{
			title: 'Icon',
			name: 'icon',
			type: 'string',
			options: {
				list: [
					{ title: 'Facebook', value: 'facebook' },
					{ title: 'Instagram', value: 'instagram' },
					{ title: 'Linkedin', value: 'linkedin' },
					{ title: 'X (Twitter)', value: 'x' },
					{ title: 'YouTube', value: 'youTube' },
					{ title: 'Github', value: 'github' },
					{ title: 'Spotify', value: 'spotify' },
				],
			},
		},
		{
			title: 'URL',
			name: 'url',
			type: 'url',
		},
	],
	preview: {
		select: {
			icon: 'icon',
			url: 'url',
		},
		prepare({ icon, url }) {
			return {
				title: icon,
				subtitle: url ? url : '(url not set)',
				media: getIcon(icon),
			};
		},
	},
});
