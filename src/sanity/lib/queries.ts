import { defineQuery } from 'groq';

export const homeID = defineQuery(`*[_type == "pHome"][0]._id`);
// Base queries for common fields
const baseFields = defineQuery(`
	_id,
	_type,
	title,
	"slug": slug.current,
	"sharing":{
		...sharing,
		"siteTitle": *[_type == "settingsGeneral"][0].siteTitle,
	}
`);
export const resolvedHrefQuery = defineQuery(`
	"resolvedHref": select(
			linkType == "external" => externalUrl,
			linkType == "internal" => internalLink-> {
				"url": select(
					_type == "pHome" => "/",
					defined(slug.current) => "/" + slug.current,
					null
				)
			}.url,
			null)`);
const linkFields = defineQuery(`
	_type,
	"linkType": linkInput.linkType,
	"href": linkInput {
		${resolvedHrefQuery}
	}.resolvedHref,
	isNewTab
`);

const menuFields = defineQuery(`
	_key,
	_type,
	title,
	items[]{
		title,
		link {
			${linkFields}
		},
		dropdownItems[]{
			_key,
			title,
			link {
				${linkFields}
			}
		}
	}
`);

export const imageMetaFields = defineQuery(`
	asset,
	crop,
	customRatio,
	hotspot,
	"meta": asset-> {
		"id": assetId,
		"alt": coalesce(^.alt, altText),
		"type": mimeType,
		"width": metadata.dimensions.width,
		"height": metadata.dimensions.height,
		"aspectRatio": metadata.dimensions.aspectRatio,
		"lqip": metadata.lqip
	}
`);

const callToActionFields = defineQuery(`
	label,
	link {
		${linkFields}
	},
	"isButton": true
`);

const portableTextContentFields = defineQuery(`
	...,
	markDefs[]{
		...,
		_type == "link" => {
			${linkFields}
		},
		_type == "callToAction" => {
			${callToActionFields}
		}
	},
	_type == "image" => {
		${imageMetaFields},
		link {
			${linkFields}
		}
	}
`);

const freeformFields = defineQuery(`
	_type,
	_key,
	content[]{
		${portableTextContentFields}
	},
	sectionAppearance {
		...,
		"backgroundColor": backgroundColor->color,
		"textColor": textColor->color
	}
`);

const sectionHeadingFields = defineQuery(`
	eyebrow,
	heading,
	intro
`);

const pageModuleFields = defineQuery(`
	_type in ['hero', 'callout'] => {
		_type,
		_key,
		${sectionHeadingFields},
		actions[]{
			_key,
			${callToActionFields}
		}
	},
	_type == 'editorial' => {
		_type,
		_key,
		${sectionHeadingFields},
		body[]{
			${portableTextContentFields}
		},
		media {
			${imageMetaFields}
		},
		mediaPosition
	},
	_type == 'featureList' => {
		_type,
		_key,
		${sectionHeadingFields},
		layout,
		items[]{
			_key,
			icon,
			title,
			body
		}
	},
	_type == 'accordionList' => {
		_type,
		_key,
		${sectionHeadingFields},
		items[]{
			_key,
			title,
			content[]{
				${portableTextContentFields}
			}
		}
	},
	_type == 'freeform' => {
		${freeformFields}
	},
	_type == 'carousel' => {
		_type,
		_key,
		items[0...10], // Limit items for performance
		autoplay,
		autoplayInterval
	},
	_type == 'marquee' => {
		_type,
		_key,
		items[]{
			_type == 'simple' => {
				_type,
				text
			},
			_type == 'image' => {
				_type,
				"image": {
					${imageMetaFields}
				}
			}
		}[0...20], // Limit items for performance
		speed,
		reverse,
		pausable,
		showGradient,
		"gradientColor": gradientColor->color.hex,
		isMerged
	}
`);

// Site configuration with caching recommendation
export const siteDataQuery = defineQuery(`{
		"announcement": *[_type == "gAnnouncement"][0]{
			display,
			messages,
			autoplay,
			autoplayInterval,
			backgroundColor,
			textColor,
			emphasizeColor,
			"link": ${linkFields}
		},
		"header": *[_type == "gHeader"][0]{
			"menu": menu->{
				${menuFields}
			}
		},
		"footer": *[_type == "gFooter"][0]{
			"menu": menu->{
				${menuFields}
			},
			"menuLegal": menuLegal->{
				${menuFields}
			}
		},
		"sharing": *[_type == "settingsGeneral"][0]{
			siteTitle,
			shareGraphic,
			'shareVideo': shareVideo.asset->url,
			favicon,
			faviconLight
		},
		"integrations": *[_type == "settingsIntegration"][0]{
			gaIDs,
			gtmIDs
		},
	}
`);

// Page queries
export const pageHomeQuery = defineQuery(`
	*[_type == "pHome"][0]{
		${baseFields},
		"isHomepage": true,
		pageModules[]{
			${pageModuleFields}
		}
	}
`);

export const page404Query = defineQuery(`
	*[_type == "p404" && _id == "p404"][0]{
		${baseFields},
		heading,
		paragraph[]{
			${portableTextContentFields}
		},
		callToAction{
			${callToActionFields}
		}
	}
`);

export const siteSharingQuery = defineQuery(`
	*[_type == "settingsGeneral"][0]{
		comingSoon{
			enabled,
			heading,
			message[]{
				${portableTextContentFields}
			}
		},
		siteTitle,
		shareGraphic,
		'shareVideo': shareVideo.asset->url,
		favicon,
		faviconLight,
		"integrations": *[_type == "settingsIntegration"][0]{
			gaIDs,
			gtmIDs
		}
	}
`);

export const pageGeneralQuery = defineQuery(`
	*[_type == "pGeneral" && slug.current == $slug][0]{
		${baseFields},
		layout,
		content[]{
			${portableTextContentFields}
		},
		pageModules[]{
			${pageModuleFields}
		}
	}
`);
export const pageGeneralSlugsQuery = defineQuery(`
  *[_type == "pGeneral" && defined(slug.current)]
  {"slug": slug.current}
`);

export const pSignUpDataQuery = defineQuery(`
	*[_type == "pSignUp"][0]{
		policyMessage[]{
			${portableTextContentFields}
		},
	}
`);
