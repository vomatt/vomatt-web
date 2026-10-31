import { defineQuery } from 'groq';

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

export const pSignUpDataQuery = defineQuery(`
	*[_type == "pSignUp"][0]{
		policyMessage[]{
			${portableTextContentFields}
		},
	}
`);
