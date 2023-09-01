import { LinkIcon, MasterDetailIcon, WarningOutlineIcon } from '@sanity/icons';
import { defineType } from 'sanity';
import { getRoute } from '@/lib/routes';

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
			route: 'link.route',
		},
		prepare({ title, route }) {
			const path = JSON.parse(route);
			const isExternal = path.url.includes('http');
			const subtitle = `${getRoute({ type: path._type, slug: path.slug })} ${
				path.url === '/' ? ' (home page)' : ''
			}`;

			return {
				title: title,
				subtitle: subtitle,
				media: path.url
					? isExternal
						? LinkIcon
						: MasterDetailIcon
					: WarningOutlineIcon,
			};
		},
	},
});
