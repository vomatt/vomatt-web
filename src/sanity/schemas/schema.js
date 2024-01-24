// Setting types
// Global types
import gAnnouncement from './documents/g-announcement';
import gCookie from './documents/g-cookie';
import gFooter from './documents/g-footer';
import gHeader from './documents/g-header';
import p404 from './documents/p-404';
// Page types
import pGeneral from './documents/p-general';
import pHome from './documents/p-home';
import settingsBrandColors from './documents/settings-color';
import settingsGeneral from './documents/settings-general';
import settingsIntegration from './documents/settings-integrations';
import settingsMenu from './documents/settings-menu';
import settingsSharing from './documents/settings-sharing';
import carousel from './modules/carousel';
// Module types
import freeform from './modules/freeform';
import marquee from './modules/marquee';
import newsletter from './modules/newsletter';
// Object types
import button from './objects/button';
import link from './objects/link';
import navDropdown from './objects/nav-dropdown';
import navItem from './objects/nav-item';
import portableText from './objects/portable-text';
import portableTextSimple from './objects/portable-text-simple';
import sectionAppearance from './objects/section-appearance';
import sharing from './objects/sharing';
import socialLink from './objects/social-link';

const schemas = [
	settingsMenu,
	settingsBrandColors,
	settingsGeneral,
	settingsIntegration,
	settingsSharing,

	button,
	link,
	navDropdown,
	navItem,
	portableText,
	portableTextSimple,
	sectionAppearance,
	sharing,
	socialLink,

	freeform,
	carousel,
	marquee,
	newsletter,

	gAnnouncement,
	gCookie,
	gHeader,
	gFooter,

	pGeneral,
	p404,
	pHome,
];

export default schemas;
