import {
	HomeIcon,
	EnvelopeIcon,
	UnknownIcon,
	DocumentsIcon,
} from '@sanity/icons';
import { apiVersion } from '@/sanity/env';

const pageHome = (S) => {
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

const pageError = (S) => {
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

const pageContact = (S) => {
	return S.listItem()
		.title('Contact Page')
		.child(
			S.editor()
				.id('pContact')
				.title('Contact Page')
				.schemaType('pContact')
				.documentId('pContact')
		)
		.icon(EnvelopeIcon);
};

export const pagesMenu = (S) => {
	return S.listItem()
		.title('Primary Pages')
		.id('pages')
		.icon(DocumentsIcon)
		.child(
			S.list()
				.title('Primary Pages')
				.items([pageHome(S), pageError(S), pageContact(S)])
		);
};

export const otherPagesMenu = (S) => {
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
