import {EyeOpenIcon, EditIcon} from '@sanity/icons'
import SeoPreview from './seo/seo-preview'

const remoteURL = 'https://insane.codes'
const localURL = 'http://localhost:3000'
const previewURL = window.location.hostname === 'localhost' ? localURL : remoteURL

export const standardViews = (S) => [
  S.view.form().icon(EditIcon),
  S.view.component(SeoPreview).options({previewURL}).icon(EyeOpenIcon).title('SEO Preview'),
]
