import { LinkInput } from '@/sanity/schemaTypes/components/LinkInput';
import { toPlainText } from '@portabletext/toolkit';
import { ThLargeIcon } from '@sanity/icons';
import { TablePreview, createTableInput } from './components';
import { defineField, definePlugin } from 'sanity';

const defaultPortableTextSchema = {
	name: 'portableTable',
	title: 'Portable Table',
	cellSchema: {
		name: 'portableTableBlock',
		type: 'block',
		marks: {
			decorators: [{ title: 'Strong', value: 'strong' }],
			annotations: [
				{
					name: 'link',
					type: 'object',
					fields: [
						defineField({
							title: ' ',
							name: 'linkInput',
							type: 'linkInput',
							options: {
								collapsible: false,
							},
						}),
						defineField({
							title: 'Open in new tab',
							name: 'isNewTab',
							type: 'boolean',
							initialValue: false,
						}),
					],
				},
			],
		},
	},
};

export const portableTable = definePlugin((schema) => {
	const tableSchema = schema || defaultPortableTextSchema;
	const portableTextSchema = tableSchema.cellSchema;
	const WrappedTableInput = createTableInput(portableTextSchema);

	return {
		name: 'portableTablePlugin',
		schema: {
			types: [
				{
					title: 'Table Cell Body',
					name: 'tableCellBody',
					type: 'array',
					of: [portableTextSchema],
					options: {
						sortable: false,
					},
				},
				{
					title: 'Table Cell',
					name: 'tableCell',
					type: 'object',
					preview: {
						select: {
							text: 'text',
						},
						prepare({ text }) {
							return { title: toPlainText(text ?? []) };
						},
					},
					fields: [
						{
							name: 'text',
							type: 'tableCellBody',
						},
					],
				},
				{
					title: 'Table Row',
					name: 'tableRow',
					type: 'object',
					preview: {
						select: {
							cells: 'cells',
						},
						prepare({ cells = [] }) {
							return {
								title: cells
									.map((cell) => toPlainText(cell.text ?? []))
									.join(', '),
							};
						},
					},
					fields: [
						{
							name: 'cells',
							type: 'array',
							of: [
								{
									type: 'tableCell',
								},
							],
							options: {
								sortable: false,
							},
						},
					],
				},
				{
					name: tableSchema.name ?? 'table',
					title: tableSchema.title ?? 'Table',
					type: 'object',
					icon: ThLargeIcon,
					components: {
						preview: TablePreview,
						input: WrappedTableInput,
					},
					preview: {
						select: {
							rows: 'rows',
						},
						prepare({ rows = [] }) {
							return { rows };
						},
					},
					fields: [
						{
							name: 'columnNumber',
							type: 'number',
							validation: (Rule) => Rule.required().min(1),
							initialValue: 3,
						},
						{
							name: 'rows',
							type: 'array',
							// TODO add a validation for column count
							of: [{ type: 'tableRow' }],
							initialValue: [],
							options: {
								sortable: false,
							},
						},
					],
				},
			],
		},
	};
});
