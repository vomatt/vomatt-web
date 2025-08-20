// Documents
import gAnnouncement from './documents/g-announcement';
import gFooter from './documents/g-footer';
import gHeader from './documents/g-header';
import p404 from './documents/p-404';
import pBlog from './documents/p-blog';
import pBlogAuthor from './documents/p-blog-author';
import pBlogCategory from './documents/p-blog-category';
import pBlogIndex from './documents/p-blog-index';
import pContact from './documents/p-contact';
import pGeneral from './documents/p-general';
import pHome from './documents/p-home';
import pSignUp from './documents/p-sign-up';

// Objects
import formFields from './objects/form-builder/form-fields';
import link from './objects/link';
import linkInput from './objects/link-input';
import navDropdown from './objects/nav-dropdown';
import navItem from './objects/nav-item';
import portableText from './objects/portable-text';
import portableTextSimple from './objects/portable-text-simple';
import sectionAppearance from './objects/section-appearance';
import socialLink from './objects/social-link';
// Singletons
import settingsBrandColors from './singletons/settings-color';
import settingsGeneral from './singletons/settings-general';
import settingsIntegration from './singletons/settings-integrations';
import settingsMenu from './singletons/settings-menu';
import settingsRedirect from './singletons/settings-redirect';

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
	p404,
	pHome,
	pSignUp,
	pBlogIndex,
	pBlog,
	pBlogAuthor,
	pBlogCategory,
	pContact,

	formFields,
	link,
	linkInput,
	navDropdown,
	navItem,
	portableText,
	portableTextSimple,
	sectionAppearance,
	socialLink,
];
