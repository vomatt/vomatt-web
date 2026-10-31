import '@/styles/global.css';

import type { SanityImageSource } from '@sanity/image-url';
import { Geist } from 'next/font/google';
import { headers } from 'next/headers';
import { cache, ReactNode } from 'react';
import { Toaster } from 'sonner';

import BrandLogo from '@/components/BrandLogo';
import CustomPortableText from '@/components/CustomPortableText';
import { Layout } from '@/components/layout';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { SessionRetry } from '@/components/SessionRetry';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SESSION_UNCONFIRMED_HEADER } from '@/data/constants';
import { htmlLang } from '@/i18n-config';
import { isComingSoon } from '@/lib/comingSoon';
import { getServerLocale, getServerMessages } from '@/lib/getServerLocale';
import { buildShareImageUrl, imageBuilder } from '@/sanity/lib/image';
import { sanityFetch } from '@/sanity/lib/live';
import { siteSharingQuery } from '@/sanity/lib/queries';

// Server Actions run under the page's limit, and vomatt-api can take over 10s
// (Vercel's old default) on a cold start. A limit below that kills the action
// after the API has already used the sign-in code or sent a new one.
export const maxDuration = 60;

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

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
	const [{ language, messages: translations }, settings, requestHeaders] = await Promise.all([
		getServerMessages(),
		getSiteSettings(),
		headers(),
	]);
	const comingSoon = settings?.comingSoon;

	return (
		// next-themes sets the theme class on <html> before React hydrates
		<html lang={htmlLang(language)} className={geistSans.variable} suppressHydrationWarning>
			<body className="text-foreground font-sans antialiased">
				{/* The .dark tokens follow the system setting */}
				<ThemeProvider>
					{isComingSoon(settings) ? (
						<main className="flex min-h-svh items-center justify-center px-4 py-12">
							<div className="flex w-full max-w-[480px] flex-col items-start gap-3">
								<div className="w-28 text-foreground">
									<BrandLogo />
								</div>
								<h1 className="mt-4 text-[48px] font-medium leading-[1.1] tracking-[-0.03em]">
									{comingSoon?.heading || 'Coming soon'}
								</h1>
								{comingSoon?.message && (
									<div className="text-lg text-muted-foreground">
										<CustomPortableText blocks={comingSoon.message} />
									</div>
								)}
							</div>
						</main>
					) : (
						<LanguageProvider
							initialLanguage={language}
							defaultTranslations={translations}
						>
							{/* Nothing of the signed-out page renders, so none of it shows through */}
							{requestHeaders.has(SESSION_UNCONFIRMED_HEADER) ? (
								<SessionRetry />
							) : (
								<>
									<TooltipProvider>
										<Layout>{children}</Layout>
									</TooltipProvider>
									<Toaster
										theme="system"
										richColors
										closeButton
										position="bottom-center"
										// Above the TabBar on phones
										offset={{ bottom: 'calc(var(--tabbar-space) + 24px)' }}
										mobileOffset={{ bottom: 'calc(var(--tabbar-space) + 16px)' }}
									/>
									<CookieConsent integrations={settings?.integrations} />
								</>
							)}
						</LanguageProvider>
					)}
				</ThemeProvider>
			</body>
		</html>
	);
}
