import { at, defineMigration, setIfMissing, unset } from 'sanity/migrate';

/*
	Run the npx sanity@latest documents validate -y to check if the dataset validate
*/

// should be unique for the migration but never change
const idempotenceKey = 'completed_migrations';

const from = 'excerpt';
const to = 'description';

export default defineMigration({
	title: 'Replace excerpt field name with description',
	// documentTypes: ['pBlog'],
	filter: '_type == "pBlog" && defined(excerpt) && !defined(description)',
	migrate: {
		document(doc, context) {
			if ((doc?._migrations || []).includes(idempotenceKey)) {
				// Document already migrated, so we can skip
				return;
			}
			return [
				at(to, setIfMissing(doc[from])),
				at(from, unset()),

				//… add idempotence key
				at('_migrations', setIfMissing([])),
				at('_migrations', insert(idempotenceKey, 'after', 0)),
			];
		},
	},
});
