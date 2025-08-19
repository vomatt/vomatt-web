'use client';

import { defaultDocumentNode } from '@/sanity/defaultDocumentNode';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import { schemaTypes } from '@/sanity/schemaTypes';
import p404 from '@/sanity/schemaTypes/documents/p-404';
import pGeneral from '@/sanity/schemaTypes/documents/p-general';
import { structure } from '@/sanity/structure';
import { colorInput } from '@sanity/color-input';
import { visionTool } from '@sanity/vision';
import { getRoute } from '@/lib/routes';
import { defineConfig, isDev } from 'sanity';
import { media } from 'sanity-plugin-media';
import { noteField } from 'sanity-plugin-note-field';
import {
	defineDocuments,
	defineLocations,
	presentationTool,
} from 'sanity/presentation';
import { structureTool } from 'sanity/structure';

export const previewBaseURL = '/api/draft-mode/enable';
export const previewDocumentTypes = [pGeneral.name, p404.name];
const allowDuplicateDocumentTypes = ['pGeneral', 'pBlog', 'settingsRedirect'];

const homeLocation = {
	title: 'Home',
	href: '/',
};

const commonPlugins = [
	structureTool({
		structure,
		defaultDocumentNode,
	}),
	media(),
	colorInput(),

	noteField(),
	presentationTool({
		previewUrl: {
			origin: process.env.SANITY_STUDIO_PREVIEW_ORIGIN,
			previewMode: {
				enable: '/api/draft-mode/enable',
			},
		},
		resolve: {
			/* The Main Document Resolver API provides a method of resolving a main document from a given route or route pattern. https://www.sanity.io/docs/presentation-resolver-api#57720a5678d9 */
			mainDocuments: defineDocuments([
				{
					route: '/',
					filter: `_type == "pHome"`,
				},
				{
					route: '/:slug',
					filter: `_type == "pGeneral" && slug.current == $slug`,
				},
				{
					route: '/blog',
					filter: `_type == "pBlogIndex"`,
				},
				{
					route: '/blog/:slug',
					filter: `_type == "pBlog" && slug.current == $slug`,
				},
				{
					route: '/contact',
					filter: `_type == "pContact"`,
				},
			]),
			/* Locations Resolver API allows you to define where data is being used in your application. https://www.sanity.io/docs/presentation-resolver-api#8d8bca7bfcd7 */
			locations: {
				settingsGeneral: defineLocations({
					locations: [homeLocation],
					message: 'This document is used on all pages',
					tone: 'positive',
				}),
				pGeneral: defineLocations({
					select: {
						name: 'name',
						slug: 'slug.current',
					},
					resolve: (doc) => ({
						locations: [
							{
								title: doc?.name || 'Untitled',
								href:
									getRoute({ documentType: 'pGeneral', slug: doc?.slug }) || '',
							},
						],
					}),
				}),
			},
		},
	}),
];

const devPlugins = [
	...commonPlugins,
	visionTool({ defaultApiVersion: apiVersion }),
];

export default defineConfig({
	basePath: '/sanity',
	title: '[STARTER]',
	projectId: projectId || '',
	dataset: dataset || '',
	plugins: isDev ? devPlugins : commonPlugins,
	schema: {
		types: schemaTypes,
	},
	document: {
		actions: (prev, context) => {
			const { schemaType } = context;
			return prev.map((originalAction) => {
				if (
					originalAction.action === 'duplicate' &&
					!allowDuplicateDocumentTypes.includes(schemaType)
				) {
					return () => null;
				}

				return originalAction;
			});
		},
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
