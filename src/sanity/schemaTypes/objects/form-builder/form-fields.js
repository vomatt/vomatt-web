import { defineField, defineType } from 'sanity';

export const formFields = defineType({
	name: 'formFields',
	title: 'Form Fields',
	type: 'object',
	fields: [
		defineField({
			name: 'required',
			type: 'boolean',
			initialValue: false,
		}),
		defineField({
			name: 'fieldLabel',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'inputType',
			type: 'string',
			initialValue: 'text',
			options: {
				layout: 'dropdown',
				list: [
					{ value: 'text', title: 'Text' },
					{ value: 'email', title: 'Email' },
					{ value: 'tel', title: 'Phone number' },
					{ value: 'textarea', title: 'Text area' },
					{ value: 'select', title: 'Dropdown selection' },
					{ value: 'checkbox', title: 'Checkbox' },
					{ value: 'file', title: 'File upload' },
				],
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'placeholder',
			type: 'string',
			hidden: ({ parent }) =>
				parent.inputType === 'checkbox' || parent.inputType === 'file',
		}),
		defineField({
			name: 'selectOptions',
			title: 'Options',
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [{ name: 'option', type: 'string' }],
				},
			],
			hidden: ({ parent }) => parent.inputType !== 'select',
		}),
	],
	preview: {
		select: {
			required: 'required',
			fieldLabel: 'fieldLabel',
			inputType: 'inputType',
		},
		prepare({ required, fieldLabel, inputType }) {
			return {
				title: `${fieldLabel} ${required ? '(required)' : '(optional)'}`,
				subtitle: `Type: ${inputType}`,
			};
		},
	},
});
