import { ComponentIcon } from '@sanity/icons';

export const globalMenu = (S) =>
	S.listItem()
		.title('Global')
		.child(
			S.list()
				.title('Global')
				.items([
					S.listItem()
						.title('Announcement')
						.child(
							S.editor()
								.id('gAnnouncement')
								.schemaType('gAnnouncement')
								.documentId('gAnnouncement')
						)
						.icon(ComponentIcon),
					S.listItem()
						.title('Header')
						.child(
							S.editor()
								.id('gHeader')
								.schemaType('gHeader')
								.documentId('gHeader')
						)
						.icon(ComponentIcon),
					S.listItem()
						.title('Footer')
						.child(
							S.editor()
								.id('gFooter')
								.schemaType('gFooter')
								.documentId('gFooter')
						)
						.icon(ComponentIcon),
					S.divider(),
					S.listItem()
						.title('Cookie Consent')
						.child(
							S.editor()
								.title('Cookie Consent')
								.id('gCookie')
								.schemaType('gCookie')
								.documentId('gCookie')
						)
						.icon(ComponentIcon),
					S.divider(),
					S.listItem()
						.title('Sign Up Settings')
						.child(
							S.editor()
								.title('Sign Up Settings')
								.id('gSignUp')
								.schemaType('gSignUp')
								.documentId('gSignUp')
						)
						.icon(ComponentIcon),
				])
		)
		.icon(ComponentIcon);
