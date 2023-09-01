import { DropIcon } from '@sanity/icons';

export const colorsMenu = (S) => {
	return S.listItem()
		.title('Brand Colors')
		.child(S.documentTypeList('settingsBrandColors').title('Colors'))
		.icon(DropIcon);
};
