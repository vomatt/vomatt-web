import type { DefaultDocumentNodeResolver } from 'sanity/structure';

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S) =>
	S.document().views([S.view.form()]);
