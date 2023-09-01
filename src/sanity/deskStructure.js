import { colorsMenu } from './desk/colors';
import { globalMenu } from './desk/global';
import { menusMenu } from './desk/menus';
import { pagesMenu } from './desk/pages';
import { settingsMenu } from './desk/settings';

const deskStructure = (S) =>
	S.list()
		.title('Website')
		.items([
			globalMenu(S),
			pagesMenu(S),
			S.divider(),
			menusMenu(S),
			colorsMenu(S),
			S.divider(),
			settingsMenu(S),
		]);

export default deskStructure;
