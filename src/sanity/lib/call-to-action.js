import { FiExternalLink } from 'react-icons/fi';

const callToAction = ({ showLabel = true, ...props } = {}) => {
	return {
		title: 'Button',
		name: 'callToAction',
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
			},
		],
		...props,
	};
};

export default callToAction;
