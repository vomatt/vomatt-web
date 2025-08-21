import { LinkIcon, MasterDetailIcon, WarningOutlineIcon } from '@sanity/icons';
import { resolveHref } from '@/lib/utils';
import { defineType } from 'sanity';

export const navItem = defineType({
	title: 'Item',
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
			internalLinkSlug: 'link.linkInput.internalLink.slug.current',
			internalLinkType: 'link.linkInput.internalLink._type',
			externalUrl: 'link.linkInput.externalUrl',
			linkType: 'link.linkInput.linkType',
		},
		prepare({
			title,
			internalLinkSlug,
			internalLinkType,
			externalUrl,
			linkType,
		}) {
			if ((!linkType || !internalLinkType) && !externalUrl) {
				return {
					title: 'Empty Item',
					media: WarningOutlineIcon,
				};
			}
			const isExternal = linkType === 'external';

			return {
				title: title,
				subtitle: isExternal
					? externalUrl
					: resolveHref({
							documentType: internalLinkType,
							slug: internalLinkSlug,
						}),
				media: isExternal ? LinkIcon : MasterDetailIcon,
			};
		},
	},
});
