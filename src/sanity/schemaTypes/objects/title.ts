import { defineField } from 'sanity';

type TitleOptions = {
	initialValue?: string;
	readOnly?: boolean;
	group?: string;
};

export default function title({
	initialValue,
	readOnly,
	group,
}: TitleOptions = {}) {
	return defineField({
		name: 'title',
		type: 'string',
		validation: (Rule) => [Rule.required()],
		initialValue: initialValue,
		readOnly: readOnly,
		group: group,
	});
}
