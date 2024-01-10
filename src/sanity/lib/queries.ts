import { groq } from 'next-sanity';
// Construct our "home" page GROQ
export const homeID = groq`*[_type=="settingsGeneral"][0].home->_id`;
export const staticPageSlug = groq`[]`;

// Construct our "link" GROQ
const link = groq`
	_type,
	route,
	isNewTab
`;

// Construct our "menu" GROQ
const menu = groq`
	_key,
	_type,
	title,
	items[]{
		title,
		link {
			${link}
		},
		dropdownItems[]{
			_key,
			title,
			link {
				${link}
			},
		}
	}
`;

// Construct our "image meta" GROQ
export const imageMeta = groq`
	"alt": coalesce(alt, asset->altText),
	asset,
	crop,
	customRatio,
	hotspot,
	"id": asset->assetId,
	"type": asset->mimeType,
	"width": asset->metadata.dimensions.width,
	"height": asset->metadata.dimensions.height,
	"aspectRatio": asset->metadata.dimensions.aspectRatio,
	"lqip": asset->metadata.lqip
`;

export const callToAction = groq`
	label,
	link {
		${link}
	},
	"isButton": true
`;

// Construct our "portable text content" GROQ
export const portableTextContent = groq`
	...,
	markDefs[]{
		...,
		_type == "link" => {
			${link}
		},
		_type == "callToAction" => {
			${callToAction}
		}
	},
	_type == "image" => {
		${imageMeta}
	}
`;

export const freeformObj = groq`
	...,
	_type,
	_key,
	content[]{
		${portableTextContent}
	},
	sectionAppearance
`;

// Construct our content "modules" GROQ
export const modules = groq`
	_type == 'marquee' => {
		_type,
		_key,
		items[]{
			_type == 'simple' => {
				_type,
				text
			},
			_type == 'photo' => {
				_type,
				"image": {
					${imageMeta}
				}
			}
		},
		speed,
		reverse,
		pausable
	},
	_type == 'freeform' => {
		${freeformObj}
	},
	_type == 'accordionList' => {
		_type,
		_key,
		items[]{
			"id": _key,
			title,
			content[]{
				${portableTextContent}
			}
		}
	}
`;

// Construct our "site" GROQ
export const site = groq`
	"site": {
		"title": *[_type == "settingsGeneral"][0].siteTitle,
		"cookieConsent": *[_type == "gCookie"][0]{
			enabled,
			message,
			"link": link->{"type": _type, "slug": slug.current}
		},
		"announcement": *[_type == "gAnnouncement"][0]{
			display,
			messages,
			autoplay,
			autoplay_interval,
			backgroundColor,
			textColor,
			emphasizeColor,
			"link": ${link}
		},
		"header": *[_type == "gHeader"][0]{
			menu->{
				${menu}
			}
		},
		"footer": *[_type == "gFooter"][0]{
			menu->{
				${menu}
			},
			menuLegal->{
				${menu}
			},
			"siteCopyright": *[_type == "gFooter"][0].siteCopyright
		},
		"sharing": *[_type == "settingsSharing"][0]{
			metaTitle,
			metaDesc,
			shareGraphic,
			favicon
		},
		"integrations": *[_type == "settingsIntegration"][0]{
			gtmID,
			gaID,
			KlaviyoApiKey,
		},
	}
`;

export interface Site {
	site: {
		title: string;
		cookieConsent: any;
		announcement: any;
		header: any;
		footer: any;
		sharing: any;
		integrations: any;
	};
}

export const pagePaths = groq`
  *[_type == "pGeneral" && slug.current != null && !(_id in [${homeID}]) ].slug.current
`;

export const pagesBySlugQuery = groq`
		{
			"page": *[_type == "pGeneral" && slug.current == $slug][0]{
				title,
				"slug": slug.current,
				sharing,
				modules[]{
					${modules}
				},
			},
			${site}
		}
	`;
