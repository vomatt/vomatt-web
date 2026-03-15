import '@/styles/global.css';

import clsx from 'clsx';
import { cookies, headers } from 'next/headers';
import { getPayload } from 'payload';
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';

import config from '@payload-config';
import BrandLogo from '@/components/BrandLogo';
import { Layout } from '@/components/layout';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { buildMediaUrl } from '@/lib/defineMetadata';

async function getServerLanguage(): Promise<string> {
	try {
		const cookieStore = await cookies();
		const headersList = await headers();

		// Try cookie first
		const cookieLanguage = cookieStore.get('preferred-language')?.value;
		if (cookieLanguage) return cookieLanguage;

		// Fallback to middleware-detected language
		const detectedLanguage = headersList.get('x-detected-language');
		return detectedLanguage || 'en';
	} catch {
		return 'en';
	}
}

export async function generateMetadata() {
	const payload = await getPayload({ config });
	const settings = await payload.findGlobal({ slug: 'settings-general' });

	const siteTitle = settings.siteTitle ?? '';
	const favicon = settings.favicon as
		| { url?: string | null; filename?: string | null }
		| null
		| undefined;
	const faviconLight = settings.faviconLight as
		| { url?: string | null; filename?: string | null }
		| null
		| undefined;
	const shareGraphic = settings.shareGraphic as
		| { url?: string | null; filename?: string | null }
		| null
		| undefined;
	const shareVideo = settings.shareVideo as
		| { url?: string | null; filename?: string | null }
		| null
		| undefined;

	const siteFaviconUrl = buildMediaUrl(favicon) ?? '/favicon.ico';
	const siteFaviconLightUrl = buildMediaUrl(faviconLight) ?? siteFaviconUrl;
	const shareGraphicUrl = buildMediaUrl(shareGraphic);
	const shareVideoUrl = buildMediaUrl(shareVideo);

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
			locale: 'en_US',
			type: 'website',
		},
		icons: {
			icon: [
				{ url: siteFaviconUrl, media: '(prefers-color-scheme: light)' },
				{ url: siteFaviconLightUrl, media: '(prefers-color-scheme: dark)' },
			],
		},
	};
}

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const serverLanguage = await getServerLanguage();

	return (
		<html lang={serverLanguage} className={clsx('dark')}>
			<body className="text-foreground font-family-system">
				{process.env.NODE_ENV === 'production' ? (
					<div className="h-screen flex flex-col justify-center items-center gap-5">
						<div className="md:w-40 text-secondary-foreground w-28">
							<BrandLogo />
						</div>
						<h2>Coming soon</h2>
					</div>
				) : (
					<LanguageProvider>
						<Layout>{children}</Layout>
						<Toaster />
					</LanguageProvider>
				)}
			</body>
		</html>
	);
}
