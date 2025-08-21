import { BookIcon, TagsIcon, UserIcon } from '@sanity/icons';

import { apiVersion } from '@/sanity/env';

export const pageBlogCategory = (S) => {
	return S.listItem()
		.title('Categories')
		.child(S.documentTypeList('pBlogCategory').title('Categories'))
		.icon(TagsIcon);
};

export const pageBlogAuthor = (S) => {
	return S.listItem()
		.title('Authors')
		.child(S.documentTypeList('pBlogAuthor').title('Authors'))
		.icon(UserIcon);
};

export const pageBlog = (S, context) => {
	return S.listItem()
		.title('Blog')
		.child(
			S.list()
				.title('Blog')
				.items([
					S.listItem()
						.title('Blog Index Page')
						.child(
							S.editor()
								.id('pBlogIndex')
								.title('Blog Index Page')
								.schemaType('pBlogIndex')
								.documentId('pBlogIndex')
						)
						.icon(BookIcon),
					S.listItem()
						.title('Articles')
						.child(S.documentTypeList('pBlog').title('Articles'))
						.icon(BookIcon),
					S.listItem()
						.title('Filters')
						.child(
							S.list()
								.title('Filters')
								.items([
									S.listItem()
										.title('By Category')
										.child(
											S.documentTypeList('pBlogCategory')
												.title('Blogs by Category')
												.child((categoryId) => {
													return S.documentList()
														.title('Blogs')
														.apiVersion(apiVersion)
														.filter(
															'_type == "pBlog" && $categoryId in category[]._ref'
														)
														.params({ categoryId });
												})
										),
									S.listItem()
										.title('By Author')
										.child(
											S.documentTypeList('pBlogAuthor')
												.title('Blogs by Author')
												.child((authorId) =>
													S.documentList()
														.title('Blogs')
														.apiVersion(apiVersion)
														.filter(
															'_type == "pBlog" && $authorId == author._ref'
														)
														.params({ authorId })
												)
										),
								])
						),
					S.divider(),
					pageBlogAuthor(S),
					pageBlogCategory(S, context),
				])
		)
		.icon(BookIcon);
};
