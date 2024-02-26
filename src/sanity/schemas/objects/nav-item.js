import { LinkIcon, MasterDetailIcon, WarningOutlineIcon } from '@sanity/icons';
import { defineType } from 'sanity';

export default defineType({
	title: 'Nav Item',
	name: 'navItem',
	type: 'object',
	icon: LinkIcon,
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		},
		{
			title: 'Link',
			name: 'link',
			type: 'link',
			validation: (Rule) => Rule.required(),
		},
	],
	preview: {
		select: {
			title: 'title',
			link: 'link',
		},
		prepare({ title, link }) {
			const isExternal = link.route.includes('http');
			const subtitle = link.route;

			return {
				title: title,
				subtitle: subtitle,
				media: link.route
					? isExternal
						? LinkIcon
						: MasterDetailIcon
					: WarningOutlineIcon,
			};
		},
	},
});
