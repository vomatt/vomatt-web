import '@/styles/global.css';

import type { SanityImageSource } from '@sanity/image-url';
import type { Viewport } from 'next';
import { Geist } from 'next/font/google';
import { headers } from 'next/headers';
import { ReactNode, Suspense } from 'react';
import { Toaster } from 'sonner';

import { BrandPulse } from '@/components/BrandPulse';
import { Layout } from '@/components/layout';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { SessionRetry } from '@/components/SessionRetry';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { DEFAULT_SITE_NAME, SESSION_UNCONFIRMED_HEADER } from '@/data/constants';
import { htmlLang } from '@/i18n-config';
import { getServerMessages } from '@/lib/getServerLocale';
import { getSiteSettings } from '@/lib/siteSettings';
import { buildShareImageUrl, imageBuilder } from '@/sanity/lib/image';

// Server Actions run under the page's limit, and vomatt-api can take over 10s
// (Vercel's old default) on a cold start. A limit below that kills the action
// after the API has already used the sign-in code or sent a new one.
export const maxDuration = 60;

// Without cover, iOS reports env(safe-area-inset-*) as 0 and the TabBar sits on the home indicator
export const viewport: Viewport = { viewportFit: 'cover' };

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export async function generateMetadata() {
	const [{ language, messages }, data] = await Promise.all([getServerMessages(), getSiteSettings()]);
	const { favicon, faviconLight, shareGraphic, shareVideo } = data || {};
	const siteTitle = data?.siteTitle || DEFAULT_SITE_NAME;

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
		description: messages.meta.siteDescription,
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
		twitter: { card: shareGraphicUrl ? 'summary_large_image' : 'summary' },
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

	return (
		// next-themes sets the theme class on <html> before React hydrates
		<html lang={htmlLang(language)} className={geistSans.variable} suppressHydrationWarning>
			<body className="text-foreground font-sans antialiased">
				{/* The .dark tokens follow the system setting */}
				<ThemeProvider>
					<LanguageProvider
						initialLanguage={language}
						defaultTranslations={translations}
					>
						{/* Nothing of the signed-out page renders, so none of it shows through */}
						{requestHeaders.has(SESSION_UNCONFIRMED_HEADER) ? (
							<SessionRetry />
						) : (
							// A Suspense in a layout falls back on the first load only; navigations keep the
							// current page. The cookie banner waits with the app, so it can't cover the splash.
							<Suspense fallback={<BrandPulse />}>
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
									// The 20px close button keeps its look; its hit area grows to 44px (13px past its 1px border)
									toastOptions={{ classNames: { closeButton: "before:absolute before:-inset-[13px] before:content-['']" } }}
								/>
								<CookieConsent integrations={settings?.integrations} />
							</Suspense>
						)}
					</LanguageProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
