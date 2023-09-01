import { colorInput } from '@sanity/color-input';
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { media } from 'sanity-plugin-media';

import Logo from './src/sanity/branding/Logo';
import deskStructure from './src/sanity/deskStructure';
import {
	apiVersion,
	dataset,
	previewSecretId,
	projectId,
} from './src/sanity/env';
import schemas from './src/sanity/schemas/schema';

export default defineConfig({
	basePath: '/sanity',
	title: 'Vomatt',
	projectId,
	dataset,
	plugins: [
		deskTool({
			structure: deskStructure,
		}),
		media(),
		visionTool(),
		colorInput(),
	],
	schema: {
		types: schemas,
	},
	studio: {
		components: {
			logo: Logo,
		},
	},
});
