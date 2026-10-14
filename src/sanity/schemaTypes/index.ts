// Documents
import { pGeneral } from './documents/p-general';
// Objects
import { link } from './objects/link';
import { linkInput } from './objects/link-input';
import { navDropdown } from './objects/nav-dropdown';
import { navItem } from './objects/nav-item';
import { portableText } from './objects/portable-text';
import { portableTextSimple } from './objects/portable-text-simple';
import { sectionAppearance } from './objects/section-appearance';
import { socialLink } from './objects/social-link';
import { gAnnouncement } from './singletons/g-announcement';
import { gFooter } from './singletons/g-footer';
import { gHeader } from './singletons/g-header';
import { p404 } from './singletons/p-404';
import { pHome } from './singletons/p-home';
import { pSignUp } from './singletons/p-sign-up';
// Singletons
import { settingsBrandColors } from './singletons/settings-color';
import { settingsGeneral } from './singletons/settings-general';
import { settingsIntegration } from './singletons/settings-integrations';
import { settingsMenu } from './singletons/settings-menu';
import { settingsRedirect } from './singletons/settings-redirect';

export const schemaTypes = [
	settingsGeneral,
	settingsBrandColors,
	settingsMenu,
	settingsRedirect,
	settingsIntegration,

	gAnnouncement,
	gHeader,
	gFooter,
	pGeneral,
	pSignUp,
	p404,
	pHome,

	link,
	linkInput,
	navDropdown,
	navItem,
	portableText,
	portableTextSimple,
	sectionAppearance,
	socialLink,
];
