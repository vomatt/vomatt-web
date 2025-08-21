'use client';

import { defaultDocumentNode } from '@/sanity/defaultDocumentNode';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import * as presentationResolver from '@/sanity/lib/presentation-resolver';
import { singletonPlugin } from '@/sanity/lib/utils';
import { schemaTypes } from '@/sanity/schemaTypes';
import { gAnnouncement } from '@/sanity/schemaTypes/singletons/g-announcement';
import { gFooter } from '@/sanity/schemaTypes/singletons/g-footer';
import { gHeader } from '@/sanity/schemaTypes/singletons/g-header';
import { p404 } from '@/sanity/schemaTypes/singletons/p-404';
import { pContact } from '@/sanity/schemaTypes/singletons/p-contact';
import { pHome } from '@/sanity/schemaTypes/singletons/p-home';
import { settingsGeneral } from '@/sanity/schemaTypes/singletons/settings-general';
import { settingsIntegration } from '@/sanity/schemaTypes/singletons/settings-integrations';
import { structure } from '@/sanity/structure';
import { colorInput } from '@sanity/color-input';
import { visionTool } from '@sanity/vision';
import { defineConfig, isDev } from 'sanity';
import { media } from 'sanity-plugin-media';
import { noteField } from 'sanity-plugin-note-field';
import { presentationTool } from 'sanity/presentation';
import { structureTool } from 'sanity/structure';

const commonPlugins = [
	structureTool({
		structure,
		defaultDocumentNode,
	}),
	media(),
	colorInput(),
	noteField(),
	presentationTool({
		resolve: presentationResolver,
		previewUrl: {
			origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN,
			previewMode: {
				enable: '/api/draft-mode/enable',
			},
		},
	}),
	singletonPlugin([
		gFooter.name,
		gHeader.name,
		pHome.name,
		settingsIntegration.name,
		settingsGeneral.name,
		p404.name,
		pContact.name,
		gAnnouncement.name,
	]),
];

const devPlugins = [
	...commonPlugins,
	visionTool({ defaultApiVersion: apiVersion }),
];

export default defineConfig({
	basePath: '/sanity',
	title: 'Vomatt',
	projectId: projectId || '',
	dataset: dataset || '',
	plugins: isDev ? devPlugins : commonPlugins,
	schema: {
		types: schemaTypes,
	},
	tools: (prev, { currentUser }) => {
		const isAdmin = currentUser?.roles.some(
			(role) => role.name === 'administrator'
		);

		const isDeveloper = currentUser?.roles.some(
			(role) => role.name === 'developer'
		);

		if (isDeveloper || isAdmin) {
			return prev;
		}

		return prev.filter((tool) => tool.name !== 'vision');
	},
});
