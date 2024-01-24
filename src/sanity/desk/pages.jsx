import {
	DocumentsIcon,
	HomeIcon,
	MasterDetailIcon,
	UnknownIcon,
} from '@sanity/icons';

// Extract home page
const currentHomePage = (S) => {
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

// Extract error page
const current404Page = (S) => {
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

export const pagesMenu = (S) => {
	return S.listItem()
		.title('Pages')
		.id('pages')
		.icon(MasterDetailIcon)
		.child(
			S.list()
				.title('Pages')
				.items([
					currentHomePage(S),
					current404Page(S),
					S.listItem()
						.title('Other Pages')
						.schemaType('pGeneral')
						.child(
							S.documentTypeList('pGeneral')
								.title('Other Pages')
								.filter(`_type == "pGeneral")`)
								.apiVersion('v2023-08-01')
								.child((documentId) =>
									S.document().documentId(documentId).schemaType('pGeneral')
								)
								.canHandleIntent(
									(intent, { type }) =>
										['create', 'edit'].includes(intent) && type === 'pGeneral'
								)
						)
						.icon(DocumentsIcon),
				])
		);
};
