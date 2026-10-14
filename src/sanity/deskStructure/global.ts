import { ComponentIcon } from '@sanity/icons/Component';
import { EnvelopeIcon } from '@sanity/icons/Envelope';
import type { StructureBuilder } from 'sanity/structure';

export const globalMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('Global Modules')
		.child(
			S.list()
				.title('Global Modules')
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
				])
		)
		.icon(ComponentIcon);
};
