import { defineQuery } from 'next-sanity';

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
					_type == "pBlogIndex" => "/blog",
					_type == "pBlog" => "/blog/" + slug.current,
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

const pageModuleFields = defineQuery(`
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

const customFormFields = defineQuery(`
	formFields[] {
		placeholder,
		_key,
		required,
		fieldLabel,
		inputType,
		size,
		selectOptions[] {
			_key,
			"title": option,
			"value": option
		}
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

export const pageContactQuery = defineQuery(`
	*[_type == "pContact"][0]{
		${baseFields},
		contactForm {
			formTitle,
			${customFormFields},
			successMessage,
			errorMessage,
			sendToEmail,
			emailSubject,
			formFailureNotificationEmail
		}
	}
`);

// Blog queries with pagination
export const getBlogPostData = (type) => {
	const basePostFields = defineQuery(`
		${baseFields},
		author->{name},
		categories[]-> {
			_id,
			title,
			"slug": slug.current,
			categoryColor->{...color}
		}
	`);

	return type === 'card'
		? defineQuery(`${basePostFields}, excerpt`)
		: defineQuery(`
			${basePostFields},
			content[]{
				${portableTextContentFields}
			},
			"relatedBlogs": relatedBlogs[]->{
				${getBlogPostData('card')}
			}
		`);
};

export const articleListAllQuery = defineQuery(`
	"articleList": *[_type == "pBlog"] | order(_updatedAt desc) [0...12] {
		${getBlogPostData('card')}
	}
`);

const blogIndexBaseQuery = defineQuery(`
	${baseFields},
	"slug": "blog",
	itemsPerPage,
	paginationMethod,
	loadMoreButtonLabel,
	infiniteScrollCompleteLabel,
	"itemsTotalCount": count(*[_type == "pBlog"])
`);

export const pageBlogIndexQuery = defineQuery(`
	*[_type == "pBlogIndex"][0]{
		${blogIndexBaseQuery}
	}
`);

export const pageBlogIndexWithArticleDataSSGQuery = defineQuery(`
	*[_type == "pBlogIndex"][0]{
		${blogIndexBaseQuery},
		${articleListAllQuery}
	}
`);

export const pageBlogPaginationMethodQuery = defineQuery(`
	{
		"articleTotalNumber": count(*[_type == "pBlog"])
		"itemsPerPage": *[_type == "pBlogIndex"][0].itemsPerPage
	}`);

export const pageBlogSlugsQuery = defineQuery(`
  *[_type == "pBlog" && defined(slug.current)]
  {"slug": slug.current}
`);

export const pageBlogSingleQuery = defineQuery(`
	*[_type == "pBlog" && slug.current == $slug][0]{
		${getBlogPostData()},
		"defaultRelatedBlogs": *[_type == "pBlog"
			&& count(categories[@._ref in ^.^.categories[]._ref ]) > 0
			&& _id != ^._id
		] | order(publishedAt desc, _createdAt desc) [0...2] {
			${getBlogPostData('card')}
		}
	}
`);

export const gSignUpDataQuery = defineQuery(`
	*[_type == "gSignUp"][0]{
		policyMessage[]{
			${portableTextContentFields}
		},
	}
`);
