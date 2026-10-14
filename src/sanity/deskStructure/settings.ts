import { CogIcon } from '@sanity/icons/Cog';
import { EarthGlobeIcon } from '@sanity/icons/EarthGlobe';
import { EnterRightIcon } from '@sanity/icons/EnterRight';
import { PackageIcon } from '@sanity/icons/Package';
import type { StructureBuilder } from 'sanity/structure';

export const settingsMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('Settings')
		.child(
			S.list()
				.title('Settings')
				.items([
					S.listItem()
						.title('General')
						.child(
							S.editor()
								.id('settingsGeneral')
								.schemaType('settingsGeneral')
								.documentId('settingsGeneral')
						)
						.icon(EarthGlobeIcon),
					S.listItem()
						.title('Integrations')
						.child(
							S.editor()
								.id('settingsIntegration')
								.schemaType('settingsIntegration')
								.documentId('settingsIntegration')
						)
						.icon(PackageIcon),
					S.listItem()
						.title('Redirects')
						.child(S.documentTypeList('settingsRedirect').title('Redirects'))
						.icon(EnterRightIcon),
				])
		)
		.icon(CogIcon);
};
