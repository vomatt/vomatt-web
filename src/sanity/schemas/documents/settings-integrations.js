import { defineType } from 'sanity';
export default defineType({
	title: 'Integrations',
	name: 'settingsIntegration',
	type: 'document',
	// __experimental_actions: ['update', 'publish'], // disable for initial publish
	fields: [
		{
			title: 'Google Analytics (GA)',
			description: 'G-XXXXXXXXXX',
			name: 'gaID',
			type: 'string',
		},
		{
			title: 'Google Tag Manager (GTM)',
			description: 'GTM-XXXXXXX',
			name: 'gtmID',
			type: 'string',
		},
		{
			title: 'Klaviyo API Key',
			description: 'XXXX##',
			name: 'KlaviyoApiKey',
			type: 'string',
		},
	],
	preview: {
		prepare() {
			return {
				title: 'Integrations',
			};
		},
	},
});
