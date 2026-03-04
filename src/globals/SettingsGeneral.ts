import type { GlobalConfig } from 'payload';

export const SettingsGeneral: GlobalConfig = {
	slug: 'settings-general',
	admin: {
		group: 'Settings',
	},
	fields: [
		{
			name: 'siteTitle',
			type: 'text',
		},
		{
			name: 'shareGraphic',
			type: 'upload',
			relationTo: 'media',
		},
		{
			name: 'shareVideo',
			type: 'upload',
			relationTo: 'media',
		},
		{
			name: 'favicon',
			type: 'upload',
			relationTo: 'media',
		},
		{
			name: 'faviconLight',
			type: 'upload',
			relationTo: 'media',
		},
	],
};
