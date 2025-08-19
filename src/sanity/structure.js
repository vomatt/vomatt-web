import { colorsMenu } from './deskStructure/colors';
import { globalMenu } from './deskStructure/global';
import { menusMenu } from './deskStructure/menus';
import { pageBlog } from './deskStructure/p-blog';
import { otherPagesMenu, pagesMenu } from './deskStructure/pages';
import { settingsMenu } from './deskStructure/settings';

export const structure = (S) =>
	S.list()
		.title('Website')
		.items([
			globalMenu(S),
			pagesMenu(S),
			otherPagesMenu(S),
			S.divider(),
			pageBlog(S),
			S.divider(),
			menusMenu(S),
			colorsMenu(S),
			S.divider(),
			settingsMenu(S),
		]);
