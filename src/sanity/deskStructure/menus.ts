import { MenuIcon } from '@sanity/icons/Menu';
import type { StructureBuilder } from 'sanity/structure';

export const menusMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('Menus')
		.child(S.documentTypeList('settingsMenu').title('Menus'))
		.icon(MenuIcon);
};
