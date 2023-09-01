import type { PortableTextBlock } from '@portabletext/types';
import type { Image } from 'sanity';
export interface LinkPayload {
	type: string;
	route: string;
	isNewTab: boolean;
}
export interface MenuDropdownItems {
	_key: string;
	title: string;
	link?: LinkPayload;
}
export interface MenuItem {
	link?: LinkPayload;
	title: string;
	dropdownItems?: MenuDropdownItems[];
}

export interface Menu {
	_key: string;
	_type: string;
	title: string;
	items: MenuItem;
}

export interface MainDataPayload {
	data?: any;
}

export interface HeaderPayload {
	menu: Menu;
}

export interface SiteDataPayload {
	title?: string;
	cookieConsent?: {
		enabled: boolean;
		message: string;
		link?: LinkPayload;
	};
	announcement?: {
		display: boolean;
		messages: string;
		autoplay: boolean;
		autoplay_interval: number;
		backgroundColor: string;
		textColor: string;
		emphasizeColor: string;
		link?: LinkPayload;
	};
	header: HeaderPayload;
	footer: { menu: Menu; menuLegal: Menu; siteCopyright: string };
	sharing: {
		metaTitle: string;
		metaDesc: string;
		shareGraphic: string;
		favicon: string;
	};
	integrations?: {
		gtmID: string;
		gaID: string;
		KlaviyoApiKey: string;
	};
}
