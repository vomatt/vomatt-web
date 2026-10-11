import { FiExternalLink } from 'react-icons/fi';
import { defineField } from 'sanity';

type CallToActionOptions = {
	title?: string;
	name?: string;
	showLabel?: boolean;
};

export default function callToAction({
	title,
	name = 'callToAction',
	showLabel = true,
	...props
}: CallToActionOptions = {}) {
	return defineField({
		title: title || '',
		name: name,
		type: 'object',
		icon: FiExternalLink,
		fields: [
			...(showLabel
				? [
						{
							name: 'label',
							title: 'Label',
							type: 'string',
						},
					]
				: []),
			{
				name: 'link',
				title: 'Link',
				type: 'link',
				validation: (Rule) => Rule.required(),
			},
		],
		...props,
	});
}
