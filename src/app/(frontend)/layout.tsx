import '@/styles/global.css';

import type { SanityImageSource } from '@sanity/image-url';
import clsx from 'clsx';
import { Geist, Geist_Mono } from 'next/font/google';
import { cache, ReactNode } from 'react';
import { Toaster } from 'sonner';

import BrandLogo from '@/components/BrandLogo';
import CustomPortableText from '@/components/CustomPortableText';
import { Layout } from '@/components/layout';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { isComingSoon } from '@/lib/comingSoon';
import { getServerLocale } from '@/lib/getServerLocale';
import enTranslations from '@/locales/en.json';
import zhTranslations from '@/locales/zh.json';
import { buildShareImageUrl, imageBuilder } from '@/sanity/lib/image';
import { sanityFetch } from '@/sanity/lib/live';
import { siteSharingQuery } from '@/sanity/lib/queries';

// Server Actions run under the page's limit, and vomatt-api can take over 10s
// (Vercel's old default) on a cold start. A limit below that kills the action
// after the API has already used the sign-in code or sent a new one.
export const maxDuration = 60;

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

// Shared by generateMetadata and the layout within one request
const getSiteSettings = cache(() =>
	sanityFetch({ query: siteSharingQuery })
		.then(({ data }) => data)
		.catch((error) => {
			console.error('Failed to load site settings from Sanity', error);
			return null;
		})
);

export async function generateMetadata() {
	const [{ language }, data] = await Promise.all([getServerLocale(), getSiteSettings()]);
	const { siteTitle = '', favicon, faviconLight, shareGraphic, shareVideo } =
		data || {};

	const faviconUrl = (icon: SanityImageSource) =>
		imageBuilder.image(icon).width(256).height(256).url();
	// A favicon set in Sanity wins; without one, the icon files in app/ apply
	const siteFaviconUrl = favicon ? faviconUrl(favicon) : null;
	const siteFaviconLightUrl = faviconLight ? faviconUrl(faviconLight) : siteFaviconUrl;
	const shareGraphicUrl = shareGraphic?.asset
		? buildShareImageUrl(shareGraphic.asset)
		: null;
	const shareVideoUrl = shareVideo || null;

	return {
		metadataBase: new URL(process.env.SITE_URL || ''),
		title: {
			template: `%s | ${siteTitle}`,
			default: siteTitle,
		},
		creator: siteTitle,
		publisher: siteTitle,
		applicationName: siteTitle,
		openGraph: {
			title: siteTitle,
			images: shareGraphicUrl
				? [{ url: shareGraphicUrl, width: 1200, height: 630 }]
				: [],
			videos: shareVideoUrl
				? [{ url: shareVideoUrl, width: 1200, height: 630, type: 'video/mp4' }]
				: [],
			url: process.env.SITE_URL,
			siteName: siteTitle,
			locale: language === 'zh' ? 'zh_TW' : 'en_US',
			type: 'website',
		},
		// Keep search engines from indexing the placeholder
		robots: isComingSoon(data) ? { index: false, follow: false } : undefined,
		icons: siteFaviconUrl
			? {
					icon: [
						{ url: siteFaviconUrl, media: '(prefers-color-scheme: light)' },
						{ url: siteFaviconLightUrl ?? siteFaviconUrl, media: '(prefers-color-scheme: dark)' },
					],
				}
			: undefined,
	};
}

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const [{ language }, settings] = await Promise.all([getServerLocale(), getSiteSettings()]);
	const translations = language === 'zh' ? zhTranslations : enTranslations;
	const comingSoon = settings?.comingSoon;

	return (
		<html lang={language === 'zh' ? 'zh-TW' : 'en'} className={clsx(geistSans.variable, geistMono.variable)}>
			<body className="text-foreground font-sans">
				{isComingSoon(settings) ? (
					<main className="h-screen flex flex-col justify-center items-center gap-5 px-contain text-center">
						<div className="md:w-40 text-secondary-foreground w-28">
							<BrandLogo />
						</div>
						<h1 className="text-2xl">{comingSoon?.heading || 'Coming soon'}</h1>
						{comingSoon?.message && (
							<div className="max-w-md text-sm text-muted-foreground">
								<CustomPortableText blocks={comingSoon.message} />
							</div>
						)}
					</main>
				) : (
					<LanguageProvider
						initialLanguage={language}
						defaultTranslations={translations}
					>
						<TooltipProvider>
							<Layout>{children}</Layout>
						</TooltipProvider>
						<Toaster richColors closeButton position="bottom-center" />
						<CookieConsent integrations={settings?.integrations} />
					</LanguageProvider>
				)}
			</body>
		</html>
	);
}
