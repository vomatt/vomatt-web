import { MenuIcon } from '@sanity/icons';

export const menusMenu = (S) => {
	return S.listItem()
		.title('Menus')
		.child(S.documentTypeList('settingsMenu').title('Menus'))
		.icon(MenuIcon);
};
