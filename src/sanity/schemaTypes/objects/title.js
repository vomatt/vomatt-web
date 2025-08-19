export default function title({ initialValue, readOnly, group } = {}) {
	return {
		name: 'title',
		type: 'string',
		validation: (Rule) => [Rule.required()],
		initialValue: initialValue,
		readOnly: readOnly,
		group: group,
	};
}
