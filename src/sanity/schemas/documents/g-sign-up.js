import { defineType } from 'sanity';

import { getPortableTextPreview } from '../../lib/helpers';

export default defineType({
	title: 'Sign Up Settings',
	name: 'gSignUp',
	type: 'document',
	fields: [
		{
			name: 'policyMessage',
			title: 'Policy Messages',
			type: 'portableTextSimple',
		},
	],
	preview: {
		prepare() {
			return {
				title: 'Announcement Settings',
			};
		},
	},
});
