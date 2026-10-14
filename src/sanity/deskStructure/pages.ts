import { DocumentsIcon } from '@sanity/icons/Documents';
import { HomeIcon } from '@sanity/icons/Home';
import { UnknownIcon } from '@sanity/icons/Unknown';
import type { StructureBuilder } from 'sanity/structure';

import { apiVersion } from '@/sanity/env';

const pageHome = (S: StructureBuilder) => {
	return S.listItem()
		.title('Homepage')
		.child(
			S.editor()
				.id('pHome')
				.title('Homepage')
				.schemaType('pHome')
				.documentId('pHome')
		)
		.icon(HomeIcon);
};

const pageSignUp = (S: StructureBuilder) => {
	return S.listItem()
		.title('Log In')
		.child(
			S.editor()
				.id('pSignUp')
				.title('Log In')
				.schemaType('pSignUp')
				.documentId('pSignUp')
		)
		.icon(DocumentsIcon);
};

const pageError = (S: StructureBuilder) => {
	return S.listItem()
		.title('404 Page')
		.child(
			S.editor()
				.id('p404')
				.title('404 Page')
				.schemaType('p404')
				.documentId('p404')
		)
		.icon(UnknownIcon);
};

export const pagesMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('Primary Pages')
		.id('pages')
		.icon(DocumentsIcon)
		.child(
			S.list()
				.title('Primary Pages')
				.items([pageHome(S), pageSignUp(S), pageError(S)])
		);
};

export const otherPagesMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('Other Pages')
		.schemaType('pGeneral')
		.icon(DocumentsIcon)
		.child(
			S.documentTypeList('pGeneral')
				.title('Other Pages')
				.filter(`_type == "pGeneral"`)
				.apiVersion(apiVersion)
				.child((documentId) =>
					S.document().documentId(documentId).schemaType('pGeneral')
				)
				.canHandleIntent(
					(intent, { type }) =>
						['create', 'edit'].includes(intent) && type === 'pGeneral'
				)
		);
};
