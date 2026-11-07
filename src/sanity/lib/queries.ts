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

const portableTextContentFields = defineQuery(`
	...,
	markDefs[]{
		...,
		_type == "link" => {
			${linkFields}
		}
	}
`);

export const siteSharingQuery = defineQuery(`
	*[_type == "settingsGeneral"][0]{
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
