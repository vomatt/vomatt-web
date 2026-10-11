import { DropIcon } from '@sanity/icons';
import type { StructureBuilder } from 'sanity/structure';

export const colorsMenu = (S: StructureBuilder) => {
	return S.listItem()
		.title('Brand Colors')
		.child(S.documentTypeList('settingsBrandColors').title('Colors'))
		.icon(DropIcon);
};
