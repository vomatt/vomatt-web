import {
	CogIcon,
	EarthGlobeIcon,
	PackageIcon,
	EnterRightIcon,
} from '@sanity/icons';

export const settingsMenu = (S) => {
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
