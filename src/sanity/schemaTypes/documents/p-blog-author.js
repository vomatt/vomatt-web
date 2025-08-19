import { defineType } from 'sanity';
import { BsPeopleFill } from 'react-icons/bs';

export default defineType({
	title: 'Author',
	name: 'pBlogAuthor',
	type: 'document',
	icon: BsPeopleFill,
	fields: [
		{
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		},
	],
	preview: {
		select: {
			title: 'name',
		},
		prepare({ title }) {
			return {
				title: title,
				media: BsPeopleFill,
			};
		},
	},
});
