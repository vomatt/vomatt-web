import DocumentsPane from 'sanity-plugin-documents-pane';

export const defaultDocumentNode = (S, { schemaType }) => {
	switch (schemaType) {
		case `pBlog`:
			return S.document().views([
				S.view.form(),
				S.view
					.component(DocumentsPane)
					.options({
						query: `*[_type == "pBlog" && references($id)]`,
						params: { id: `_id` },
					})
					.title('Incoming References'),
			]);
		default:
			return S.document().views([S.view.form()]);
	}
};
