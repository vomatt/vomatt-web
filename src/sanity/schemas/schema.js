// Document types
import gAnnouncement from './documents/g-announcement';
import gCookie from './documents/g-cookie';
import gFooter from './documents/g-footer';
import gHeader from './documents/g-header';
import p404 from './documents/p-404';
import pGeneral from './documents/p-general';
import settingsBrandColors from './documents/settings-color';
import settingsGeneral from './documents/settings-general';
import settingsIntegration from './documents/settings-integrations';
import settingsMenu from './documents/settings-menu';
import settingsSharing from './documents/settings-sharing';
// Module types
import freeform from './modules/freeform';
import marquee from './modules/marquee';
import newsletter from './modules/newsletter';
import accordion from './objects/accordion';
import accordionList from './objects/accordion-list';
import button from './objects/button';
// Object types
import link from './objects/link';
import navDropdown from './objects/nav-dropdown';
import navItem from './objects/nav-item';
import portableText from './objects/portable-text';
import portableTextSimple from './objects/portable-text-simple';
import sectionAppearance from './objects/sectionAppearance';
import sharing from './objects/sharing';
import socialLink from './objects/social-link';

const schemas = [
	settingsMenu,
	settingsBrandColors,
	settingsGeneral,
	settingsIntegration,
	settingsSharing,

	gAnnouncement,
	gHeader,
	gFooter,
	gCookie,
	pGeneral,
	p404,

	/*  MODULE TYPES  */
	freeform,
	marquee,
	newsletter,

	/*  OBJECT TYPES  */

	link,
	navItem,
	navDropdown,
	sharing,
	sectionAppearance,
	socialLink,
	accordion,
	accordionList,
	button,
	portableText,
	portableTextSimple,
];

export default schemas;
