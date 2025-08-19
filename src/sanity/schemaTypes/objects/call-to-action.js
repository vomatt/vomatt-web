import { FiExternalLink } from 'react-icons/fi';

export default function callToAction({
	title,
	name = 'callToAction',
	showLabel = true,
	...props
} = {}) {
	return {
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
	};
}
